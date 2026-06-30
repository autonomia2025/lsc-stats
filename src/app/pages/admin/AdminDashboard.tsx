import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LayoutDashboard, Trophy, Users, Settings, LogOut, CalendarDays, Activity, Plus, Clock, ChevronRight, UserPlus } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    leagueName: string;
    activeSeason: string;
    teamsCount: number;
    todayMatchId?: number;
    homeTeamName?: string;
    awayTeamName?: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/setup/status')
      .then(res => res.json())
      .then(data => {
        if (!data.isSetupComplete) {
          navigate('/admin/setup');
        } else {
          // Fetch dashboard data
          return fetch('/api/admin/dashboard')
            .then(res => res.json())
            .then(dashData => {
              setDashboardData(dashData);
              setIsLoading(false);
            });
        }
      })
      .catch(error => {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      });
  }, [navigate]);

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
            <LayoutDashboard className="w-5 h-5" /> Dashboard
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
                <h1 className="text-3xl font-bold tracking-tight mb-2">Hola, Organizador</h1>
                <p className="text-white/50 text-lg">Aquí tienes el estado actual de tu liga.</p>
              </div>
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-xl text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Temporada Activa: {dashboardData?.activeSeason || '---'}
              </div>
            </div>
            
            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Main Operations Card (Takes 2 cols) */}
              <div className="md:col-span-2 bg-gradient-to-br from-blue-900/40 to-slate-900/40 border border-blue-500/20 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-blue-400 font-mono text-sm uppercase tracking-widest mb-4">
                    <Activity className="w-4 h-4" /> Centro de Operaciones
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Partido de Hoy</h2>
                  
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between backdrop-blur-sm gap-6 mt-6">
                    
                    {/* Teams */}
                    <div className="flex items-center gap-4 sm:gap-8 w-full md:w-auto justify-center md:justify-start">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center font-bold text-xl border border-white/10 mb-2 shadow-inner">
                          {dashboardData?.homeTeamName?.substring(0, 2).toUpperCase() || 'L'}
                        </div>
                        <span className="font-medium text-sm text-center">{dashboardData?.homeTeamName || 'Local'}</span>
                      </div>
                      
                      <div className="text-white/30 font-bold italic text-lg">VS</div>
                      
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center font-bold text-xl border border-white/10 mb-2 shadow-inner">
                          {dashboardData?.awayTeamName?.substring(0, 2).toUpperCase() || 'V'}
                        </div>
                        <span className="font-medium text-sm text-center">{dashboardData?.awayTeamName || 'Visitante'}</span>
                      </div>
                    </div>

                    {/* Info & Action */}
                    <div className="flex flex-col items-center md:items-end w-full md:w-auto gap-4 shrink-0">
                      <div className="text-center md:text-right">
                        <p className="text-xl font-bold text-white">20:30 hrs</p>
                        <p className="text-sm text-white/50">Gimnasio Municipal</p>
                      </div>
                      <button 
                        onClick={() => dashboardData?.todayMatchId && navigate(`/admin/prepare-match/${dashboardData.todayMatchId}`)}
                        disabled={!dashboardData?.todayMatchId}
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold text-sm transition-colors cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Preparar Partido
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Metrics Stack (1 col) */}
              <div className="flex flex-col gap-6">
                {/* Metric 1 */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">{dashboardData?.teamsCount ?? '--'}</span>
                  </div>
                  <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Equipos Inscritos</h3>
                </div>

                {/* Metric 2 */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">0</span>
                  </div>
                  <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Partidos Jugados</h3>
                </div>
              </div>

              {/* Bottom Row: Quick Tools (1 col) */}
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4">Acciones Rápidas</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer text-left">
                    <div className="flex items-center gap-3">
                      <Plus className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                      <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Inscribir Equipo</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer text-left">
                    <div className="flex items-center gap-3">
                      <UserPlus className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                      <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Registrar Jugador</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50" />
                  </button>
                </div>
              </div>

              {/* Bottom Row: Recent Activity (2 cols) */}
              <div className="md:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-white/40" /> Últimos Resultados
                    </h3>
                    <button className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer">Ver todos</button>
                 </div>

                 <div className="h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl">
                    <p className="text-white/30 text-sm">Aún no hay resultados registrados en esta temporada.</p>
                 </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
