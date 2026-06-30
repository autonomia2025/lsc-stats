import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index.js";
import { leagues, seasons, teams } from "./src/db/schema.js";
import { eq } from "drizzle-orm";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Setup API
  app.get("/api/setup/status", async (req, res) => {
    try {
      const allLeagues = await db.select().from(leagues).limit(1);
      res.json({ isSetupComplete: allLeagues.length > 0 });
    } catch (error) {
      console.error("Database check failed:", error);
      res.json({ isSetupComplete: false, error: true });
    }
  });

  app.get("/api/admin/dashboard", async (req, res) => {
    try {
      const allLeagues = await db.select().from(leagues).limit(1);
      if (allLeagues.length === 0) {
        res.status(404).json({ error: "League not found" });
        return;
      }
      
      const league = allLeagues[0];
      const activeSeasons = await db.select().from(seasons).where(eq(seasons.leagueId, league.id)).limit(1);
      const allTeams = await db.select().from(teams);

      // Find a match to prepare
      const { matches, players, matchRosters, matchEvents } = await import('./src/db/schema.js');
      const { or, isNull } = await import('drizzle-orm');
      let activeMatch = await db.select().from(matches).where(or(eq(matches.status, 'SCHEDULED'), eq(matches.status, 'PREPARING'), eq(matches.status, 'IN_PROGRESS'))).limit(1);
      
      let matchId = null;
      if (activeMatch.length > 0) {
        matchId = activeMatch[0].id;
      } else if (allTeams.length >= 2 && activeSeasons.length > 0) {
        // Create a dummy match if none exists
        const [home, away] = allTeams;
        
        // Ensure teams have players
        const homePlayers = await db.select().from(players).where(eq(players.teamId, home.id));
        if (homePlayers.length === 0) {
          const newPlayers = [];
          for(let i=1; i<=8; i++) newPlayers.push({ teamId: home.id, firstName: 'Local', lastName: 'Jugador ' + i, jerseyNumber: i+3 });
          await db.insert(players).values(newPlayers);
        }
        const awayPlayers = await db.select().from(players).where(eq(players.teamId, away.id));
        if (awayPlayers.length === 0) {
          const newPlayers = [];
          for(let i=1; i<=8; i++) newPlayers.push({ teamId: away.id, firstName: 'Visitante', lastName: 'Jugador ' + i, jerseyNumber: i+3 });
          await db.insert(players).values(newPlayers);
        }

        const [newMatch] = await db.insert(matches).values({
          seasonId: activeSeasons[0].id,
          homeTeamId: home.id,
          awayTeamId: away.id,
          status: 'SCHEDULED',
          scheduledDate: new Date(),
          location: 'Gimnasio Municipal'
        }).returning();
        matchId = newMatch.id;
      }

      res.json({
        leagueName: league.name,
        activeSeason: activeSeasons.length > 0 ? activeSeasons[0].name : 'Sin temporada',
        teamsCount: allTeams.length,
        todayMatchId: matchId,
        homeTeamName: allTeams[0]?.name,
        awayTeamName: allTeams[1]?.name,
      });
    } catch (error) {
      console.error("Dashboard data fetch failed:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/admin/matches/:id/data", async (req, res) => {
    try {
      const { matches, teams, players, matchEvents } = await import('./src/db/schema.js');
      const { eq, asc, desc } = await import('drizzle-orm');
      
      const matchId = parseInt(req.params.id);
      
      const matchData = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
      if (matchData.length === 0) {
         res.status(404).json({ error: "Match not found" });
         return;
      }
      
      const match = matchData[0];
      const homeTeam = await db.select().from(teams).where(eq(teams.id, match.homeTeamId)).limit(1).then(res => res[0]);
      const awayTeam = await db.select().from(teams).where(eq(teams.id, match.awayTeamId)).limit(1).then(res => res[0]);
      
      const homePlayers = await db.select().from(players).where(eq(players.teamId, homeTeam.id)).orderBy(asc(players.jerseyNumber));
      const awayPlayers = await db.select().from(players).where(eq(players.teamId, awayTeam.id)).orderBy(asc(players.jerseyNumber));
      
      const events = await db.select().from(matchEvents).where(eq(matchEvents.matchId, match.id)).orderBy(desc(matchEvents.timestamp));
      
      const { matchRosters } = await import('./src/db/schema.js');
      const rosters = await db.select().from(matchRosters).where(eq(matchRosters.matchId, match.id)).orderBy(asc(matchRosters.sortOrder));
      
      res.json({
        match,
        homeTeam: { ...homeTeam, activePlayers: homePlayers },
        awayTeam: { ...awayTeam, activePlayers: awayPlayers },
        events: events,
        rosters: rosters
      });
    } catch (error) {
       console.error(error);
       res.status(500).json({ error: "Failed to fetch match data" });
    }
  });

  app.get("/api/public/live-match", async (req, res) => {
    try {
      const { matches, teams, players, matchEvents } = await import('./src/db/schema.js');
      const { eq, or, asc, desc } = await import('drizzle-orm');

      // Find the first IN_PROGRESS, PREPARING, or SCHEDULED match
      let matchData = await db.select().from(matches).where(or(
        eq(matches.status, 'IN_PROGRESS'),
        eq(matches.status, 'PREPARING'),
        eq(matches.status, 'SCHEDULED')
      )).limit(1);

      if (matchData.length === 0) {
        return res.json({ live: false });
      }

      const match = matchData[0];
      const { leagues } = await import('./src/db/schema.js');
      const league = await db.select().from(leagues).limit(1).then(res => res[0]);
      const homeTeam = await db.select().from(teams).where(eq(teams.id, match.homeTeamId)).limit(1).then(res => res[0]);
      const awayTeam = await db.select().from(teams).where(eq(teams.id, match.awayTeamId)).limit(1).then(res => res[0]);
      
      const homePlayers = await db.select().from(players).where(eq(players.teamId, homeTeam.id)).orderBy(asc(players.jerseyNumber));
      const awayPlayers = await db.select().from(players).where(eq(players.teamId, awayTeam.id)).orderBy(asc(players.jerseyNumber));
      
      const events = await db.select().from(matchEvents).where(eq(matchEvents.matchId, match.id)).orderBy(desc(matchEvents.timestamp));
      
      const { matchRosters } = await import('./src/db/schema.js');
      const rosters = await db.select().from(matchRosters).where(eq(matchRosters.matchId, match.id)).orderBy(asc(matchRosters.sortOrder));
      
      res.json({
        live: true,
        leagueName: league?.name,
        match,
        homeTeam: { ...homeTeam, activePlayers: homePlayers },
        awayTeam: { ...awayTeam, activePlayers: awayPlayers },
        events: events,
        rosters: rosters
      });
    } catch (error) {
       console.error(error);
       res.status(500).json({ error: "Failed to fetch live match" });
    }
  });

  app.post("/api/admin/matches/:id/events", async (req, res) => {
    try {
      const { matchEvents } = await import('./src/db/schema.js');
      const matchId = parseInt(req.params.id);
      const { type, primaryPlayerId, secondaryPlayerId, payload } = req.body;
      
      const [newEvent] = await db.insert(matchEvents).values({
        matchId,
        type,
        primaryPlayerId,
        secondaryPlayerId,
        payload
      }).returning();
      
      res.json(newEvent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.post("/api/admin/matches/:id/roster", async (req, res) => {
    try {
      const { matchRosters, matches, teams } = await import('./src/db/schema.js');
      const { eq } = await import('drizzle-orm');
      const matchId = parseInt(req.params.id);
      
      const { localSelected, visitorSelected } = req.body;
      
      const matchData = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
      if (matchData.length === 0) return res.status(404).json({ error: "Match not found" });
      const match = matchData[0];
      
      // Delete existing roster for this match to replace it
      await db.delete(matchRosters).where(eq(matchRosters.matchId, match.id));
      
      const rostersToInsert = [];
      localSelected.forEach((playerId: string, index: number) => {
         rostersToInsert.push({ matchId: match.id, teamId: match.homeTeamId, playerId: parseInt(playerId), sortOrder: index });
      });
      visitorSelected.forEach((playerId: string, index: number) => {
         rostersToInsert.push({ matchId: match.id, teamId: match.awayTeamId, playerId: parseInt(playerId), sortOrder: index });
      });
      
      if (rostersToInsert.length > 0) {
         await db.insert(matchRosters).values(rostersToInsert);
      }
      
      // Update match status
      await db.update(matches).set({ status: 'PREPARING' }).where(eq(matches.id, match.id));
      
      res.json({ success: true });
    } catch(error) {
       console.error(error);
       res.status(500).json({ error: "Failed to save rosters" });
    }
  });

  app.delete("/api/admin/events/:id", async (req, res) => {
    try {
      const { matchEvents } = await import('./src/db/schema.js');
      const { eq } = await import('drizzle-orm');
      const eventId = parseInt(req.params.id);
      
      await db.delete(matchEvents).where(eq(matchEvents.id, eventId));
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  app.post("/api/setup", async (req, res) => {
    try {
      const { leagueName, seasonName, teams: teamNames } = req.body;
      
      if (!leagueName || !seasonName || !Array.isArray(teamNames) || teamNames.length === 0) {
         res.status(400).json({ error: "Invalid payload" });
         return;
      }

      // Check if already setup
      const allLeagues = await db.select().from(leagues).limit(1);
      if (allLeagues.length > 0) {
         res.status(400).json({ error: "League is already setup." });
         return;
      }

      await db.transaction(async (tx: any) => {
        const [league] = await tx.insert(leagues).values({ name: leagueName }).returning();
        await tx.insert(seasons).values({ leagueId: league.id, name: seasonName });
        const teamValues = teamNames.map((name: string) => ({ name }));
        await tx.insert(teams).values(teamValues);
      });

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to setup league" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
