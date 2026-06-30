import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LayoutDashboard, Trophy, Users, Settings, LogOut, CalendarDays, Activity, Plus, Clock, ChevronRight, UserPlus, PlayCircle, FileText, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    leagueName: string;
    activeSeason: string;
    activeSeasonId: number | null;
    teamsCount: number;
  } | null>(null);
  
  const [matchdays, setMatchdays] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isCreatingMatchday, setIsCreatingMatchday] = useState(false);
  const [newMatchdayName, setNewMatchdayName] = useState('');

  useEffect(() => {
    fetch('/api/setup/status')
      .then(res => res.json())
      .then(data => {
        if (!data.isSetupComplete) {
          navigate('/admin/setup');
        } else {
          return fetch('/api/admin/dashboard')
            .then(res => res.json())
            .then(dashData => {
              setDashboardData(dashData);
              if (dashData.activeSeasonId) {
                Promise.all([
                  fetch(`/api/admin/seasons/${dashData.activeSeasonId}/matchdays`).then(res => res.json()),
                  fetch('/api/admin/teams').then(res => res.json())
                ]).then(([mdData, teamsData]) => {
                  setMatchdays(mdData);
                  setTeams(teamsData);
                  setIsLoading(false);
                });
              } else {
                setIsLoading(false);
              }
            });
        }
      })
      .catch(error => {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      });
  }, [navigate]);

  const handleCreateMatchday = async () => {
    if (!newMatchdayName || !dashboardData?.activeSeasonId) return;
    
    try {
      const res = await fetch(`/api/admin/seasons/${dashboardData.activeSeasonId}/matchdays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMatchdayName })
      });
      const newMd = await res.json();
      setMatchdays([{...newMd, matches: []}, ...matchdays]);
      setIsCreatingMatchday(false);
      setNewMatchdayName('');
    } catch(e) {
      console.error(e);
    }
  };

  const handleAddMatch = async (matchdayId: number, homeTeamId: number, awayTeamId: number) => {
    if(homeTeamId === awayTeamId) {
      alert('Un equipo no puede jugar contra sí mismo');
      return;
    }
    try {
      const res = await fetch(`/api/admin/matchdays/${matchdayId}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          homeTeamId, 
          awayTeamId,
          seasonId: dashboardData?.activeSeasonId
        })
      });
      const newMatch = await res.json();
      
      const homeTeam = teams.find(t => t.id === homeTeamId);
      const awayTeam = teams.find(t => t.id === awayTeamId);
      
      setMatchdays(matchdays.map(md => {
        if (md.id === matchdayId) {
          return {
            ...md,
            matches: [...md.matches, { ...newMatch, homeTeam, awayTeam }]
          };
        }
        return md;
      }));
    } catch(e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans">
      {/* Admin Header */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#050B18]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight">Admin Center</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/10">v1.0.0-beta</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 bg-[#050B18]/50 p-4 flex flex-col gap-2">
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 text-blue-400 font-medium transition-colors">
            <LayoutDashboard className="w-5 h-5" /> Jornadas
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 font-medium transition-colors cursor-not-allowed opacity-50">
            <Trophy className="w-5 h-5" /> Temporadas
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 font-medium transition-colors cursor-not-allowed opacity-50">
            <Users className="w-5 h-5" /> Equipos
          </button>
          <div className="mt-auto">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 font-medium transition-colors cursor-not-allowed opacity-50">
              <Settings className="w-5 h-5" /> Configuración
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-400/10 font-medium transition-colors">
              <LogOut className="w-5 h-5" /> Salir
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Jornadas de la Liga</h1>
                <p className="text-white/50 text-lg">Gestiona todos los partidos del fin de semana.</p>
              </div>
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-xl text-sm font-medium">
                Temporada Activa: {dashboardData?.activeSeason || '---'}
              </div>
            </div>
            
            {/* Action Bar */}
            <div className="mb-8 flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-3xl p-4">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="font-bold">Gestionar Calendario</h3>
                    <p className="text-xs text-white/50">Crea una nueva jornada para programar partidos.</p>
                 </div>
              </div>
              
              {!isCreatingMatchday ? (
                <button 
                  onClick={() => setIsCreatingMatchday(true)}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl font-bold text-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Nueva Jornada
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    placeholder="Ej. Fecha 1"
                    value={newMatchdayName}
                    onChange={e => setNewMatchdayName(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button onClick={handleCreateMatchday} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold">Guardar</button>
                  <button onClick={() => setIsCreatingMatchday(false)} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold">Cancelar</button>
                </div>
              )}
            </div>

            {/* Matchdays List */}
            <div className="space-y-8">
              {matchdays.map((md, mdIndex) => (
                <div key={md.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold">{md.name}</h2>
                      <span className={`text-xs px-2 py-1 rounded font-bold ${
                        md.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                        md.status === 'FINISHED' ? 'bg-white/10 text-white/50' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {md.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    {md.matches.length === 0 ? (
                      <div className="text-center py-8 text-white/30 text-sm border-2 border-dashed border-white/5 rounded-2xl">
                        Aún no hay partidos programados para esta jornada.
                      </div>
                    ) : (
                      md.matches.map((match: any) => (
                        <div key={match.id} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                           <div className="flex flex-col">
                             <span className="text-xs font-bold text-white/40 mb-2">Partido #{match.id} - {match.status}</span>
                             <div className="flex items-center gap-4">
                                <span className="font-bold text-lg">{match.homeTeam.name}</span>
                                <span className="text-white/30 text-sm">vs</span>
                                <span className="font-bold text-lg">{match.awayTeam.name}</span>
                             </div>
                           </div>
                           
                           <div>
                             {match.status === 'SCHEDULED' && (
                               <button 
                                 onClick={() => navigate(`/admin/prepare-match/${match.id}`)}
                                 className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center gap-2"
                               >
                                 <Plus className="w-4 h-4" /> Preparar Roster
                               </button>
                             )}
                             {(match.status === 'READY_FOR_DESK' || match.status === 'IN_PROGRESS' || match.status === 'HALFTIME' || match.status === 'INTERMISSION') && (
                               <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl text-sm font-bold">
                                 <Activity className="w-4 h-4 animate-pulse" />
                                 En Mesa
                               </div>
                             )}
                             {match.status === 'FINISHED' && (
                               <button 
                                 onClick={() => navigate(`/mesa/${match.id}/acta`)}
                                 className="bg-orange-600/20 text-orange-400 hover:bg-orange-600 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center gap-2"
                               >
                                 <FileText className="w-4 h-4" /> Revisar Acta
                               </button>
                             )}
                             {(match.status === 'OFFICIALIZED' || match.status === 'PUBLISHED') && (
                               <div className="flex items-center gap-2 text-white/50 bg-white/5 px-4 py-2 rounded-xl text-sm font-bold">
                                 <CheckCircle className="w-4 h-4" />
                                 Publicado
                               </div>
                             )}
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Add Match Form (simplified inline) */}
                  <div className="border-t border-white/5 pt-4">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        const homeId = parseInt(fd.get('homeId') as string);
                        const awayId = parseInt(fd.get('awayId') as string);
                        if(homeId && awayId) handleAddMatch(md.id, homeId, awayId);
                      }}
                      className="flex items-center gap-4"
                    >
                      <select name="homeId" className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none" required>
                        <option value="">Local...</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <span className="text-white/30 text-xs">VS</span>
                      <select name="awayId" className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none" required>
                        <option value="">Visitante...</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <button type="submit" className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Agregar Partido
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

