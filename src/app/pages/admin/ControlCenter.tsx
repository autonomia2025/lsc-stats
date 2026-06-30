import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Trash2, Clock, Activity, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ACTIONS = [
  { id: 'pt3', label: '+3 Pts', type: 'points', value: 3, color: 'bg-emerald-500' },
  { id: 'pt2', label: '+2 Pts', type: 'points', value: 2, color: 'bg-emerald-600' },
  { id: 'pt1', label: '+1 TL', type: 'points', value: 1, color: 'bg-emerald-700' },
  { id: 'foul', label: 'Falta', type: 'foul', value: 0, color: 'bg-red-500' },
];

type EventType = {
  id: number;
  timestamp: string;
  type: string;
  primaryPlayerId: number;
  teamId?: 'local' | 'visitor'; // We will derive this locally
  actionId?: string; // We will derive this locally
};

type SelectionState = 
  | { type: 'none' }
  | { type: 'player', playerId: number, teamId: 'local' | 'visitor' }
  | { type: 'action', actionId: string };

type Player = { id: number, firstName: string, lastName: string, jerseyNumber: number };

export default function ControlCenter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventType[]>([]);
  const [selection, setSelection] = useState<SelectionState>({ type: 'none' });
  const [isLoading, setIsLoading] = useState(true);
  
  const [localTeam, setLocalTeam] = useState<{ id: number, name: string, short: string, color: string, textColor: string, activePlayers: Player[] } | null>(null);
  const [visitorTeam, setVisitorTeam] = useState<{ id: number, name: string, short: string, color: string, textColor: string, activePlayers: Player[] } | null>(null);
  const [allPlayersMap, setAllPlayersMap] = useState<Record<number, Player>>({});

  useEffect(() => {
    fetch(`/api/admin/matches/${id}/data`)
      .then(res => res.json())
      .then(data => {
        const homePlayersAll = data.homeTeam.activePlayers;
        const awayPlayersAll = data.awayTeam.activePlayers;
        
        const rosterPlayerIds = data.rosters.map((r: any) => r.playerId);
        
        // Pick first 5 players from roster as active for prototype simplicity, unless we implement substitutions
        const localActiveIds = data.rosters.filter((r: any) => r.teamId === data.homeTeam.id).slice(0, 5).map((r: any) => r.playerId);
        const visitorActiveIds = data.rosters.filter((r: any) => r.teamId === data.awayTeam.id).slice(0, 5).map((r: any) => r.playerId);
        
        const localActive = homePlayersAll.filter((p: any) => localActiveIds.includes(p.id));
        const visitorActive = awayPlayersAll.filter((p: any) => visitorActiveIds.includes(p.id));
        
        const playersMap: Record<number, Player> = {};
        [...homePlayersAll, ...awayPlayersAll].forEach((p: any) => {
           playersMap[p.id] = p;
        });
        setAllPlayersMap(playersMap);

        setLocalTeam({
           id: data.homeTeam.id,
           name: data.homeTeam.name,
           short: data.homeTeam.name.substring(0, 2).toUpperCase(),
           color: 'bg-blue-600',
           textColor: 'text-blue-400',
           activePlayers: localActive
        });
        
        setVisitorTeam({
           id: data.awayTeam.id,
           name: data.awayTeam.name,
           short: data.awayTeam.name.substring(0, 2).toUpperCase(),
           color: 'bg-orange-600',
           textColor: 'text-orange-400',
           activePlayers: visitorActive
        });
        
        // Map backend events to frontend representation
        const mappedEvents = data.events.map((ev: any) => {
           const player = playersMap[ev.primaryPlayerId];
           const teamId = player && localActiveIds.includes(player.id) ? 'local' : 'visitor';
           return { ...ev, teamId, actionId: ev.type };
        });
        
        setEvents(mappedEvents);
        setIsLoading(false);
      })
      .catch(console.error);
  }, [id]);

  // --- DERIVED STATE ---
  const stats = useMemo(() => {
    let localScore = 0;
    let visitorScore = 0;
    let localFouls = 0;
    let visitorFouls = 0;
    const playerStats: Record<number, { points: number, fouls: number }> = {};

    if (localTeam && visitorTeam) {
       [...localTeam.activePlayers, ...visitorTeam.activePlayers].forEach(p => {
         playerStats[p.id] = { points: 0, fouls: 0 };
       });
       Object.values(allPlayersMap).forEach(p => {
          if(!playerStats[p.id]) playerStats[p.id] = { points: 0, fouls: 0 };
       });
    }

    events.forEach(ev => {
      const action = ACTIONS.find(a => a.id === ev.type);
      if (!action) return;
      
      const isLocalPlayer = localTeam?.activePlayers.find(p => p.id === ev.primaryPlayerId);
      const isLocal = isLocalPlayer ? 'local' : (ev.teamId === 'local' ? 'local' : 'visitor');
      
      if (action.type === 'points') {
        if (isLocal === 'local') localScore += action.value;
        if (isLocal === 'visitor') visitorScore += action.value;
        if (playerStats[ev.primaryPlayerId]) playerStats[ev.primaryPlayerId].points += action.value;
      } else if (action.type === 'foul') {
        if (isLocal === 'local') localFouls += 1;
        if (isLocal === 'visitor') visitorFouls += 1;
        if (playerStats[ev.primaryPlayerId]) playerStats[ev.primaryPlayerId].fouls += 1;
      }
    });

    return { localScore, visitorScore, localFouls, visitorFouls, playerStats };
  }, [events, localTeam, visitorTeam, allPlayersMap]);

  // --- HANDLERS ---
  const handlePlayerClick = (playerId: number, teamId: 'local' | 'visitor') => {
    if (selection.type === 'action') {
      // Complete event: Action -> Player
      const action = ACTIONS.find(a => a.id === selection.actionId)!;
      addEvent(action, playerId, teamId);
    } else if (selection.type === 'player' && selection.playerId === playerId) {
      // Toggle off
      setSelection({ type: 'none' });
    } else {
      // Select Player
      setSelection({ type: 'player', playerId, teamId });
    }
  };

  const handleActionClick = (actionId: string) => {
    if (selection.type === 'player') {
      // Complete event: Player -> Action
      const action = ACTIONS.find(a => a.id === actionId)!;
      addEvent(action, selection.playerId, selection.teamId);
    } else if (selection.type === 'action' && selection.actionId === actionId) {
      // Toggle off
      setSelection({ type: 'none' });
    } else {
      // Select Action
      setSelection({ type: 'action', actionId });
    }
  };

  const addEvent = async (action: typeof ACTIONS[0], playerId: number, teamId: 'local' | 'visitor') => {
    setSelection({ type: 'none' }); // Reset immediately for UX speed
    try {
       const res = await fetch(`/api/admin/matches/${id}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             type: action.id,
             primaryPlayerId: playerId,
          })
       });
       const newEvent = await res.json();
       newEvent.teamId = teamId;
       newEvent.actionId = action.id;
       
       setEvents(prev => [newEvent, ...prev]);
    } catch(e) {
       console.error("Failed to add event");
    }
  };

  const deleteEvent = async (eventId: number) => {
    // Optimistic delete
    setEvents(prev => prev.filter(e => e.id !== eventId));
    try {
       await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE' });
    } catch(e) {
       // rollback if needed
    }
  };

  // --- RENDER HELPERS ---
  const renderPlayerCard = (player: Player, team: typeof localTeam, align: 'left' | 'right') => {
    if (!team) return null;
    const pStats = stats.playerStats[player.id] || { points: 0, fouls: 0 };
    const isSelected = selection.type === 'player' && selection.playerId === player.id;
    const isFoulTrouble = pStats.fouls >= 4;
    
    return (
      <div 
        key={player.id}
        onClick={() => handlePlayerClick(player.id, align === 'left' ? 'local' : 'visitor')}
        className={`
          relative flex items-center p-3 rounded-2xl cursor-pointer transition-all select-none border-2 h-24
          ${isSelected 
            ? `${team.color.replace('bg-', 'bg-')}/20 border-${team.color.replace('bg-', '')} shadow-[0_0_20px_rgba(0,0,0,0.5)] z-10 scale-105` 
            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
          }
          ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}
        `}
      >
        <div className={`w-14 h-14 shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-2xl font-bold ${team.textColor}`}>
          {player.jerseyNumber}
        </div>
        <div className={`flex-1 flex flex-col justify-center ${align === 'right' ? 'mr-4 text-right' : 'ml-4 text-left'}`}>
          <span className="font-bold text-lg leading-tight truncate">{player.firstName} {player.lastName}</span>
          <div className={`flex gap-3 text-sm mt-1 font-mono ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
            <span className="text-white/70">{pStats.points} pts</span>
            <span className={isFoulTrouble ? 'text-red-400 font-bold' : 'text-white/40'}>{pStats.fouls} flt</span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading || !localTeam || !visitorTeam) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
         <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans overflow-hidden">
      
      {/* Top Scoreboard Bar */}
      <header className="h-24 bg-[#050B18] border-b border-white/5 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <span className={`text-3xl font-black tracking-tighter ${localTeam.textColor}`}>{localTeam.short}</span>
            <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Faltas: {stats.localFouls}</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-8">
            <span className="text-6xl font-black tracking-tighter tabular-nums w-24 text-right">{stats.localScore}</span>
            <div className="flex flex-col items-center justify-center px-6 py-2 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-red-500 font-mono text-3xl font-bold tracking-widest">10:00</span>
              <span className="text-xs text-white/40 uppercase font-bold tracking-widest">Q1</span>
            </div>
            <span className="text-6xl font-black tracking-tighter tabular-nums w-24 text-left">{stats.visitorScore}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div className="flex flex-col">
            <span className={`text-3xl font-black tracking-tighter ${visitorTeam.textColor}`}>{visitorTeam.short}</span>
            <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Faltas: {stats.visitorFouls}</span>
          </div>
          <div className="w-12 h-12" />
        </div>
      </header>

      {/* Main Interaction Area */}
      <main className="flex-1 flex p-6 gap-6 min-h-0">
        
        {/* Local Team Column */}
        <div className="w-[300px] flex flex-col gap-3">
          <div className={`text-xs font-bold ${localTeam.textColor} uppercase tracking-widest mb-1 text-center`}>En Cancha - Local</div>
          {localTeam.activePlayers.map(p => renderPlayerCard(p, localTeam, 'left'))}
          <button className="mt-auto p-4 rounded-2xl border-2 border-dashed border-white/10 text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20 transition-colors flex items-center justify-center gap-2 font-bold uppercase text-sm">
            <Users className="w-4 h-4" /> Sustitución
          </button>
        </div>

        {/* Action Pad Column */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-8 h-12">
            {selection.type === 'none' && (
              <span className="text-white/40 font-medium">Selecciona Jugador o Acción</span>
            )}
            {selection.type === 'player' && (
              <span className="text-blue-400 font-bold animate-pulse text-lg">¿Qué acción realizó?</span>
            )}
            {selection.type === 'action' && (
              <span className="text-emerald-400 font-bold animate-pulse text-lg">¿Quién realizó la acción?</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {ACTIONS.map(action => {
              const isSelected = selection.type === 'action' && selection.actionId === action.id;
              return (
                <div
                  key={action.id}
                  onClick={() => handleActionClick(action.id)}
                  className={`
                    ${action.id === 'foul' ? 'col-span-2' : ''}
                    h-24 rounded-3xl flex items-center justify-center text-2xl font-black cursor-pointer transition-all select-none
                    ${isSelected 
                      ? `${action.color} text-white shadow-[0_0_30px_rgba(0,0,0,0.5)] scale-105 z-10` 
                      : `${action.color}/20 text-${action.color.split('-')[1]}-400 hover:${action.color}/40 border border-${action.color.split('-')[1]}-500/30`
                    }
                  `}
                >
                  {action.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Visitor Team Column */}
        <div className="w-[300px] flex flex-col gap-3">
          <div className={`text-xs font-bold ${visitorTeam.textColor} uppercase tracking-widest mb-1 text-center`}>En Cancha - Visitante</div>
          {visitorTeam.activePlayers.map(p => renderPlayerCard(p, visitorTeam, 'right'))}
          <button className="mt-auto p-4 rounded-2xl border-2 border-dashed border-white/10 text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20 transition-colors flex items-center justify-center gap-2 font-bold uppercase text-sm">
            <Users className="w-4 h-4" /> Sustitución
          </button>
        </div>
      </main>

      {/* Timeline Footer */}
      <footer className="h-32 bg-[#050B18] border-t border-white/5 flex flex-col p-4 shrink-0">
        <div className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
          <Clock className="w-4 h-4" /> Timeline de Eventos
        </div>
        
        <div className="flex-1 overflow-x-auto flex items-center gap-3 no-scrollbar pr-8">
          {events.length === 0 && (
            <div className="text-white/20 text-sm italic w-full text-center">No hay eventos registrados en este cuarto.</div>
          )}
          <AnimatePresence initial={false}>
            {events.map((ev) => {
              const isLocal = ev.teamId === 'local';
              const team = isLocal ? localTeam : visitorTeam;
              const player = allPlayersMap[ev.primaryPlayerId];
              const action = ACTIONS.find(a => a.id === ev.actionId);
              
              if (!team || !player || !action) return null;

              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="shrink-0 flex items-center bg-white/5 border border-white/10 rounded-2xl pr-2 pl-4 py-2 gap-4 h-14"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white/50">{team.short} #{player.jerseyNumber}</span>
                    <span className={`font-black ${action.type === 'points' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {action.label}
                    </span>
                  </div>
                  <button 
                    onClick={() => deleteEvent(ev.id)}
                    className="w-8 h-8 rounded-full hover:bg-red-500/20 text-white/20 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </footer>

    </div>
  );
}
