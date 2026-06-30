import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, FileText, CheckCircle, ShieldAlert, AlertTriangle } from 'lucide-react';

type Player = { id: number, firstName: string, lastName: string, jerseyNumber: number };

export default function Acta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  const [match, setMatch] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  
  const [refereeReport, setRefereeReport] = useState('');
  const [tableObservations, setTableObservations] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/matches/${id}/data`).then(res => res.json()),
      fetch(`/api/admin/matches/${id}/events`).then(res => res.json())
    ]).then(([matchData, eventsData]) => {
      setMatch(matchData);
      setEvents(eventsData);
      setIsLoading(false);
    }).catch(console.error);
  }, [id]);

  const stats = useMemo(() => {
    if (!match) return null;
    
    let homeScore = 0;
    let awayScore = 0;
    
    const players: Record<number, { 
      player: Player, 
      team: 'home' | 'away',
      points: number, 
      fouls: number, 
      tecnicas: number, 
      antideportivas: number,
      descalificante: boolean,
      expulsion: boolean 
    }> = {};

    [...match.homeTeam.activePlayers].forEach(p => {
      players[p.id] = { player: p, team: 'home', points: 0, fouls: 0, tecnicas: 0, antideportivas: 0, descalificante: false, expulsion: false };
    });
    
    [...match.awayTeam.activePlayers].forEach(p => {
      players[p.id] = { player: p, team: 'away', points: 0, fouls: 0, tecnicas: 0, antideportivas: 0, descalificante: false, expulsion: false };
    });

    const homeActiveIds = match.homeTeam.activePlayers.map((p: Player) => p.id);

    events.forEach(ev => {
      const isHome = homeActiveIds.includes(ev.primaryPlayerId);
      
      if (['pt3', 'pt2', 'pt1'].includes(ev.type)) {
        const value = ev.type === 'pt3' ? 3 : ev.type === 'pt2' ? 2 : 1;
        if (isHome) homeScore += value;
        else awayScore += value;
        
        if (players[ev.primaryPlayerId]) {
          players[ev.primaryPlayerId].points += value;
        }
      } else if (ev.type.startsWith('foul')) {
        let value = ev.type === 'foul_expulsion' ? 0 : 1;
        
        if (players[ev.primaryPlayerId]) {
          players[ev.primaryPlayerId].fouls += value;
          if (ev.type === 'foul_tecnica') players[ev.primaryPlayerId].tecnicas++;
          if (ev.type === 'foul_antideportiva') players[ev.primaryPlayerId].antideportivas++;
          if (ev.type === 'foul_descalificante') players[ev.primaryPlayerId].descalificante = true;
          if (ev.type === 'foul_expulsion') players[ev.primaryPlayerId].expulsion = true;
        }
      }
    });

    const playerList = Object.values(players);
    const mvp = [...playerList].sort((a, b) => b.points - a.points)[0];
    
    const foulOuts = playerList.filter(p => p.fouls >= 5);
    const ejections = playerList.filter(p => p.descalificante || p.expulsion);
    const disciplines = playerList.filter(p => p.tecnicas > 0 || p.antideportivas > 0);

    return {
      homeScore,
      awayScore,
      mvp,
      foulOuts,
      ejections,
      disciplines
    };
  }, [match, events]);

  const handlePublish = async () => {
    if (!confirm('¿Estás seguro de publicar este partido? Los resultados serán definitivos.')) return;
    
    try {
      await fetch(`/api/admin/matches/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refereeReport, tableObservations })
      });
      navigate('/mesa');
    } catch(e) {
      console.error(e);
      alert('Hubo un error al publicar el partido');
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans">
      <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#050B18]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight">Acta Oficial del Partido</span>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header Result */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center font-bold text-3xl border border-white/10">
                {match.homeTeam.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white/50 uppercase tracking-widest">Local</span>
                <span className="text-4xl font-black">{match.homeTeam.name}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-8 text-6xl font-black font-mono">
              <span className={stats.homeScore >= stats.awayScore ? 'text-white' : 'text-white/40'}>{stats.homeScore}</span>
              <span className="text-white/20">-</span>
              <span className={stats.awayScore >= stats.homeScore ? 'text-white' : 'text-white/40'}>{stats.awayScore}</span>
            </div>

            <div className="flex items-center gap-6 flex-row-reverse">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center font-bold text-3xl border border-white/10">
                {match.awayTeam.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col text-right">
                <span className="text-sm font-bold text-white/50 uppercase tracking-widest">Visitante</span>
                <span className="text-4xl font-black">{match.awayTeam.name}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Automatic Stats */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-6">MVP del Partido</h3>
                {stats.mvp && stats.mvp.points > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center font-black text-xl">
                      #{stats.mvp.player.jerseyNumber}
                    </div>
                    <div>
                      <div className="font-bold">{stats.mvp.player.firstName} {stats.mvp.player.lastName}</div>
                      <div className="text-emerald-400 font-mono text-sm">{stats.mvp.points} Puntos</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-white/30 text-sm italic">Sin puntos anotados.</div>
                )}
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                <h3 className="text-sm font-bold text-red-500/50 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Reporte Disciplinario
                </h3>
                
                <div className="space-y-6">
                  {stats.ejections.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-red-400 mb-3">Expulsiones / Descalificaciones</h4>
                      <div className="space-y-2">
                        {stats.ejections.map(p => (
                          <div key={p.player.id} className="flex items-center gap-3 text-sm">
                            <span className="w-6 h-6 bg-red-950 text-red-500 rounded flex items-center justify-center font-bold text-xs">
                              {p.player.jerseyNumber}
                            </span>
                            <span className="text-red-300 font-medium">{p.player.firstName} {p.player.lastName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.foulOuts.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-yellow-500 mb-3">Eliminados (5 Faltas)</h4>
                      <div className="space-y-2">
                        {stats.foulOuts.map(p => (
                          <div key={p.player.id} className="flex items-center gap-3 text-sm">
                            <span className="w-6 h-6 bg-yellow-500/20 text-yellow-500 rounded flex items-center justify-center font-bold text-xs">
                              {p.player.jerseyNumber}
                            </span>
                            <span className="text-white/80">{p.player.firstName} {p.player.lastName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.disciplines.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-orange-400 mb-3">Técnicas / Antideportivas</h4>
                      <div className="space-y-2">
                        {stats.disciplines.map(p => (
                          <div key={p.player.id} className="flex items-center gap-3 text-sm">
                            <span className="w-6 h-6 bg-orange-500/20 text-orange-400 rounded flex items-center justify-center font-bold text-xs">
                              {p.player.jerseyNumber}
                            </span>
                            <span className="text-white/80">{p.player.firstName} {p.player.lastName}</span>
                            <div className="ml-auto flex gap-1">
                              {p.tecnicas > 0 && <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-bold">{p.tecnicas} T</span>}
                              {p.antideportivas > 0 && <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.5 rounded font-bold">{p.antideportivas} A</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.ejections.length === 0 && stats.foulOuts.length === 0 && stats.disciplines.length === 0 && (
                    <div className="text-white/30 text-sm italic">Sin incidencias disciplinarias.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Manual Forms */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-2">Informe Arbitral</h3>
                <p className="text-xs text-white/40 mb-4">Solo para uso oficial. Los árbitros pueden detallar incidentes o decisiones del encuentro.</p>
                <textarea
                  value={refereeReport}
                  onChange={(e) => setRefereeReport(e.target.value)}
                  placeholder="Sin observaciones arbitrales..."
                  className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-2">Observaciones de la Mesa</h3>
                <p className="text-xs text-white/40 mb-4">Notas administrativas del operador de mesa.</p>
                <textarea
                  value={tableObservations}
                  onChange={(e) => setTableObservations(e.target.value)}
                  placeholder="Sin observaciones de mesa..."
                  className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button 
                onClick={handlePublish}
                className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Publicar Partido
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
