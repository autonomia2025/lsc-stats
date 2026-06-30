import { Activity, Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

const ACTIONS = [
  { id: 'pt3', label: '+3 Pts', type: 'points', value: 3 },
  { id: 'pt2', label: '+2 Pts', type: 'points', value: 2 },
  { id: 'pt1', label: '+1 Pt', type: 'points', value: 1 },
  { id: 'foul', label: 'Falta Personal', type: 'foul', value: 1 }
];

type Player = { id: number, firstName: string, lastName: string, jerseyNumber: number, teamId: number };
type EventType = { id: number, type: string, primaryPlayerId: number, timestamp: string };

export default function GameCenter() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveMatch = async () => {
      try {
        const res = await fetch('/api/public/live-match');
        const json = await res.json();
        if (json.live) {
          setData(json);
        } else {
          setData(null);
        }
      } catch (err) {
        console.error("Failed to fetch live match");
      } finally {
        setLoading(false);
      }
    };

    fetchLiveMatch();
    const intervalId = setInterval(fetchLiveMatch, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const stats = useMemo(() => {
    if (!data) return { localScore: 0, visitorScore: 0, localFouls: 0, visitorFouls: 0 };
    
    let localScore = 0;
    let visitorScore = 0;
    let localFouls = 0;
    let visitorFouls = 0;
    const playerPoints: Record<number, number> = {};

    data.events.forEach((ev: EventType) => {
      const action = ACTIONS.find(a => a.id === ev.type);
      if (!action) return;

      const isLocal = data.homeTeam.activePlayers.find((p: Player) => p.id === ev.primaryPlayerId);
      
      if (action.type === 'points') {
        if (isLocal) localScore += action.value;
        else visitorScore += action.value;
        
        playerPoints[ev.primaryPlayerId] = (playerPoints[ev.primaryPlayerId] || 0) + action.value;
      } else if (action.type === 'foul') {
        if (isLocal) localFouls += 1;
        else visitorFouls += 1;
      }
    });
    
    // Find top scorer
    let topScorerId = null;
    let maxPoints = 0;
    Object.entries(playerPoints).forEach(([id, pts]) => {
       if (pts > maxPoints) {
          maxPoints = pts;
          topScorerId = parseInt(id);
       }
    });

    return { localScore, visitorScore, localFouls, visitorFouls, topScorerId, maxPoints };
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#020617] items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#020617] font-sans text-white items-center justify-center">
        <h1 className="text-2xl font-bold tracking-tight">No hay partido en vivo</h1>
        <p className="text-white/40 mt-2 text-sm uppercase tracking-widest">El Game Center está esperando una conexión...</p>
      </div>
    );
  }

  const { homeTeam, awayTeam, events, leagueName } = data;

  const getPlayer = (id: number) => {
    const p = [...homeTeam.activePlayers, ...awayTeam.activePlayers].find(p => p.id === id);
    return p;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#020617] font-sans text-white overflow-hidden select-none">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#050B18]/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#FF6B00] rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase">{leagueName || 'Liga Principal'}</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-[0.2em]">Game Center Foundation</p>
          </div>
        </div>
        
        <nav className="flex gap-8 text-xs font-medium uppercase tracking-widest text-white/40">
          <a className="text-[#3B82F6] border-b-2 border-[#3B82F6] h-16 flex items-center cursor-pointer">En Vivo</a>
          <a className="hover:text-white transition-colors h-16 flex items-center cursor-pointer">Resultados</a>
          <a className="hover:text-white transition-colors h-16 flex items-center cursor-pointer">Posiciones</a>
          <a className="hover:text-white transition-colors h-16 flex items-center cursor-pointer">Jugadores</a>
        </nav>
        
        <div className="flex items-center gap-4 text-xs font-semibold px-4 py-2 bg-white/5 rounded-full border border-white/10">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> LIVE DASHBOARD
        </div>
      </header>


      {/* Main Content */}
      <main className="flex-1 grid grid-cols-12 gap-1 p-1 bg-white/5">
        
        {/* Left Column (Main Game Area) */}
        <section className="col-span-8 flex flex-col gap-1">
          {/* Scoreboard */}
          <div className="bg-[#050B18] p-8 flex flex-col justify-center items-center relative overflow-hidden h-[280px]">
            <div className="absolute inset-0 bg-gradient-to-b from-[#3B82F6]/5 to-transparent pointer-events-none"></div>
            
            <div className="flex justify-between items-center w-full max-w-2xl z-10">
              {/* Home Team */}
              <div className="text-center">
                <div className="w-24 h-24 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-4 backdrop-blur-sm mx-auto">
                  <div className="text-4xl font-bold">{homeTeam.name.substring(0, 2).toUpperCase()}</div>
                </div>
                <h3 className="text-xl font-bold tracking-tight">{homeTeam.name}</h3>
                <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Local</p>
              </div>
              
              {/* Score & Clock */}
              <div className="flex flex-col items-center px-12">
                <div className="text-xs font-bold text-orange-500 uppercase tracking-[0.3em] mb-4">Cuarto 1 • 10:00</div>
                <div className="flex items-center gap-6 font-bold tabular-nums">
                  <span className="text-7xl">{stats.localScore}</span>
                  <span className="text-3xl text-white/20">:</span>
                  <span className="text-7xl">{stats.visitorScore}</span>
                </div>
                <div className="mt-4 flex gap-2 items-center">
                  {[...Array(4)].map((_, i) => (
                     <span key={`lf-${i}`} className={`w-2 h-2 rounded-full ${i < stats.localFouls ? 'bg-orange-500' : 'bg-white/10'}`}></span>
                  ))}
                  <span className="text-[10px] mx-2 text-white/40 uppercase tracking-wider">Faltas</span>
                  {[...Array(4)].map((_, i) => (
                     <span key={`vf-${i}`} className={`w-2 h-2 rounded-full ${i < stats.visitorFouls ? 'bg-orange-500' : 'bg-white/10'}`}></span>
                  ))}
                </div>
              </div>
              
              {/* Away Team */}
              <div className="text-center">
                <div className="w-24 h-24 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-4 backdrop-blur-sm mx-auto">
                  <div className="text-4xl font-bold text-orange-400">{awayTeam.name.substring(0, 2).toUpperCase()}</div>
                </div>
                <h3 className="text-xl font-bold tracking-tight">{awayTeam.name}</h3>
                <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Visita</p>
              </div>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="flex-1 bg-[#050B18] p-6 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Timeline de Eventos (En Vivo)</h2>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto relative pr-2">
              {events.length === 0 && (
                 <div className="text-white/30 text-sm italic py-4">Esperando el salto inicial...</div>
              )}
              {events.map((ev: EventType) => {
                const action = ACTIONS.find(a => a.id === ev.type);
                const player = getPlayer(ev.primaryPlayerId);
                const time = new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const isLocal = homeTeam.activePlayers.find((p: Player) => p.id === ev.primaryPlayerId);
                const teamName = isLocal ? homeTeam.name.substring(0, 3).toUpperCase() : awayTeam.name.substring(0, 3).toUpperCase();
                
                return (
                  <div key={ev.id} className="flex gap-4 items-start">
                    <div className="text-[10px] font-mono text-white/30 pt-1">{time}</div>
                    <div className="w-1 bg-white/5 rounded-full relative self-stretch">
                      {action?.type === 'points' && (
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full ring-4 ring-emerald-500/20"></div>
                      )}
                      {action?.type === 'foul' && (
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full ring-4 ring-red-500/20"></div>
                      )}
                    </div>
                    <div className={`flex-1 p-3 rounded-lg border ${
                      action?.type === 'points' ? 'bg-emerald-500/10 border-emerald-500/20' : 
                      action?.type === 'foul' ? 'bg-red-500/10 border-red-500/20' : 
                      'bg-white/[0.03] border-white/5'
                    }`}>
                      <p className={`text-sm font-semibold ${
                         action?.type === 'points' ? 'text-emerald-400' : 
                         action?.type === 'foul' ? 'text-red-400' : 
                         'text-white'
                      }`}>
                         {action?.label} — {player?.firstName} {player?.lastName} ({teamName})
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        
        {/* Right Column (Sidebar) */}
        <section className="col-span-4 flex flex-col gap-1">
          {/* Stats */}
          <div className="flex-1 bg-[#050B18] p-6 overflow-y-auto">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-6">Estadísticas del Partido</h2>
            
            <div className="space-y-6">
              {/* Stat 1 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span>45.2%</span>
                  <span className="text-white/40">Tiro de Campo</span>
                  <span>41.8%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                  <div className="h-full bg-orange-500" style={{ width: '45.2%' }}></div>
                  <div className="h-full bg-blue-500/40 ml-auto" style={{ width: '41.8%' }}></div>
                </div>
              </div>
              
              {/* Stat 2 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span>12</span>
                  <span className="text-white/40">Triples Convertidos</span>
                  <span>9</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                  <div className="h-full bg-orange-500" style={{ width: '57%' }}></div>
                  <div className="h-full bg-blue-500/40 ml-auto" style={{ width: '43%' }}></div>
                </div>
              </div>
              
              {/* Stat 3 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span>34</span>
                  <span className="text-white/40">Rebotes Totales</span>
                  <span>38</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                  <div className="h-full bg-orange-500" style={{ width: '47%' }}></div>
                  <div className="h-full bg-blue-500/40 ml-auto" style={{ width: '53%' }}></div>
                </div>
              </div>
            </div>
            
            {/* MVP Projection */}
            <div className="mt-10">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#3B82F6] mb-4">MVP en Proyección</h3>
              {stats.topScorerId ? (() => {
                const mvp = getPlayer(stats.topScorerId);
                return (
                  <div className="bg-white/5 rounded-xl p-4 border border-[#3B82F6]/20 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden border border-[#3B82F6]/30 flex items-center justify-center font-bold text-white/50">
                       #{mvp?.jerseyNumber}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{mvp?.firstName} {mvp?.lastName}</p>
                      <p className="text-[10px] text-white/40 mt-1">{stats.maxPoints} PTS</p>
                    </div>
                    <div className="ml-auto text-[#3B82F6] font-mono text-xl font-black">⭐</div>
                  </div>
                );
              })() : (
                 <div className="text-white/40 text-sm italic">No hay suficientes datos aún...</div>
              )}
            </div>
          </div>
          
          {/* System Arch Info */}
          <div className="bg-[#050B18] p-6 shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Arquitectura
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded bg-white/5 border border-white/10">
                <p className="text-[10px] text-white/40 uppercase mb-1">Events Engine</p>
                <p className="text-xs font-mono text-white/80">Match.v1.stream</p>
              </div>
              <div className="p-3 rounded bg-white/5 border border-white/10">
                <p className="text-[10px] text-white/40 uppercase mb-1">State</p>
                <p className="text-xs font-mono text-white/80">Reactive.Proxy</p>
              </div>
              <div className="p-3 rounded bg-white/5 border border-white/10">
                <p className="text-[10px] text-white/40 uppercase mb-1">Backend</p>
                <p className="text-xs font-mono text-white/80">Node / PostgreSQL</p>
              </div>
              <div className="p-3 rounded bg-white/5 border border-white/10">
                <p className="text-[10px] text-white/40 uppercase mb-1">Frontend</p>
                <p className="text-xs font-mono text-white/80">React / Tailwind</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
