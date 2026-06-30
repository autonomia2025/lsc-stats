import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index";
import { leagues, seasons, teams } from "./src/db/schema";
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

      res.json({
        leagueName: league.name,
        activeSeason: activeSeasons.length > 0 ? activeSeasons[0].name : 'Sin temporada',
        activeSeasonId: activeSeasons.length > 0 ? activeSeasons[0].id : null,
        teamsCount: allTeams.length
      });
    } catch (error) {
      console.error("Dashboard data fetch failed:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/admin/teams", async (req, res) => {
    try {
      const { teams } = await import('./src/db/schema');
      const allTeams = await db.select().from(teams);
      res.json(allTeams);
    } catch (error) {
      console.error("Teams fetch failed:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.get("/api/admin/seasons/:id/matchdays", async (req, res) => {
    try {
      const { matchdays, matches, teams } = await import('./src/db/schema');
      const { eq, desc } = await import('drizzle-orm');
      
      const mdList = await db.select().from(matchdays)
        .where(eq(matchdays.seasonId, parseInt(req.params.id)))
        .orderBy(desc(matchdays.id));
        
      const mdWithMatches = [];
      for (const md of mdList) {
        const matchesList = await db.select().from(matches).where(eq(matches.matchdayId, md.id));
        // We also want to fetch team names
        const matchesWithTeams = [];
        for (const m of matchesList) {
           const [home] = await db.select().from(teams).where(eq(teams.id, m.homeTeamId));
           const [away] = await db.select().from(teams).where(eq(teams.id, m.awayTeamId));
           matchesWithTeams.push({
             ...m,
             homeTeam: home,
             awayTeam: away
           });
        }
        mdWithMatches.push({ ...md, matches: matchesWithTeams });
      }
      
      res.json(mdWithMatches);
    } catch (error) {
      console.error("Matchdays fetch failed:", error);
      res.status(500).json({ error: "Failed to fetch matchdays" });
    }
  });

  app.post("/api/admin/seasons/:id/matchdays", async (req, res) => {
    try {
      const { matchdays } = await import('./src/db/schema');
      const { name, startDate, endDate } = req.body;
      
      const [newMd] = await db.insert(matchdays).values({
        seasonId: parseInt(req.params.id),
        name: name,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'DRAFT'
      }).returning();
      
      res.json(newMd);
    } catch (error) {
      console.error("Matchday creation failed:", error);
      res.status(500).json({ error: "Failed to create matchday" });
    }
  });
  
  app.post("/api/admin/matchdays/:id/matches", async (req, res) => {
    try {
      const { matches } = await import('./src/db/schema');
      const { homeTeamId, awayTeamId, seasonId } = req.body;
      
      const [newMatch] = await db.insert(matches).values({
        matchdayId: parseInt(req.params.id),
        seasonId: seasonId,
        homeTeamId: homeTeamId,
        awayTeamId: awayTeamId,
        status: 'SCHEDULED'
      }).returning();
      
      res.json(newMatch);
    } catch (error) {
      console.error("Match creation failed:", error);
      res.status(500).json({ error: "Failed to create match" });
    }
  });


  app.get("/api/admin/matches/:id/data", async (req, res) => {
    try {
      const { matches, teams, players, matchEvents } = await import('./src/db/schema');
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
      
      const { matchRosters } = await import('./src/db/schema');
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

  app.get("/api/mesa/matches/ready", async (req, res) => {
    try {
      const { matches, teams } = await import('./src/db/schema');
      const { eq } = await import('drizzle-orm');
      
      const readyMatchesData = await db.select().from(matches).where(eq(matches.status, 'READY_FOR_DESK'));
      
      const matchesWithTeams = [];
      for (const match of readyMatchesData) {
        const homeTeam = await db.select().from(teams).where(eq(teams.id, match.homeTeamId)).limit(1).then(res => res[0]);
        const awayTeam = await db.select().from(teams).where(eq(teams.id, match.awayTeamId)).limit(1).then(res => res[0]);
        
        matchesWithTeams.push({
           ...match,
           homeTeamName: homeTeam?.name || 'Local',
           awayTeamName: awayTeam?.name || 'Visitante'
        });
      }
      
      res.json({ matches: matchesWithTeams });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch ready matches" });
    }
  });

  app.get("/api/public/live-match", async (req, res) => {
    try {
      const { matches, teams, players, matchEvents } = await import('./src/db/schema');
      const { eq, or, asc, desc } = await import('drizzle-orm');

      // Find the first IN_PROGRESS, READY_FOR_DESK, PREPARING, SCHEDULED or PUBLISHED match
      let matchData = await db.select().from(matches).where(or(
        eq(matches.status, 'IN_PROGRESS'),
        eq(matches.status, 'READY_FOR_DESK'),
        eq(matches.status, 'PREPARING'),
        eq(matches.status, 'SCHEDULED'),
        eq(matches.status, 'PUBLISHED')
      )).orderBy(desc(matches.createdAt)).limit(1);

      if (matchData.length === 0) {
        return res.json({ live: false });
      }

      const match = matchData[0];
      const { leagues } = await import('./src/db/schema');
      const league = await db.select().from(leagues).limit(1).then(res => res[0]);
      const homeTeam = await db.select().from(teams).where(eq(teams.id, match.homeTeamId)).limit(1).then(res => res[0]);
      const awayTeam = await db.select().from(teams).where(eq(teams.id, match.awayTeamId)).limit(1).then(res => res[0]);
      
      const homePlayers = await db.select().from(players).where(eq(players.teamId, homeTeam.id)).orderBy(asc(players.jerseyNumber));
      const awayPlayers = await db.select().from(players).where(eq(players.teamId, awayTeam.id)).orderBy(asc(players.jerseyNumber));
      
      const events = await db.select().from(matchEvents).where(eq(matchEvents.matchId, match.id)).orderBy(desc(matchEvents.timestamp));
      
      const { matchRosters } = await import('./src/db/schema');
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
      const { matchEvents, matches } = await import('./src/db/schema');
      const { eq } = await import('drizzle-orm');
      const matchId = parseInt(req.params.id);
      const { type, teamId, period, clock, primaryPlayerId, secondaryPlayerId, payload } = req.body;
      
      const [newEvent] = await db.insert(matchEvents).values({
        matchId,
        teamId,
        type,
        period,
        clock,
        primaryPlayerId,
        secondaryPlayerId,
        payload
      }).returning();
      
      // If it's the first event or the match is not IN_PROGRESS, set it to IN_PROGRESS
      await db.update(matches).set({ status: 'IN_PROGRESS' }).where(eq(matches.id, matchId));
      
      res.json(newEvent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.post("/api/admin/matches/:id/finish", async (req, res) => {
    try {
      const { matches } = await import('./src/db/schema');
      const { eq } = await import('drizzle-orm');
      const matchId = parseInt(req.params.id);
      
      await db.update(matches).set({ status: 'FINISHED' }).where(eq(matches.id, matchId));
      
      res.json({ success: true });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: "Failed to finish match" });
    }
  });

  app.post("/api/admin/matches/:id/publish", async (req, res) => {
    try {
      const { matches } = await import('./src/db/schema');
      const { eq } = await import('drizzle-orm');
      const matchId = parseInt(req.params.id);
      const { refereeReport, tableObservations } = req.body;
      
      await db.update(matches).set({ 
        status: 'PUBLISHED',
        refereeReport,
        tableObservations
      }).where(eq(matches.id, matchId));
      
      res.json({ success: true });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: "Failed to publish match" });
    }
  });

  app.post("/api/admin/matches/:id/roster", async (req, res) => {
    try {
      const { matchRosters, matches, teams } = await import('./src/db/schema');
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
      await db.update(matches).set({ status: 'READY_FOR_DESK' }).where(eq(matches.id, match.id));
      
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
