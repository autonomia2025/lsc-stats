import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Monitor, PlayCircle, CalendarClock } from 'lucide-react';

export default function MesaDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [readyMatches, setReadyMatches] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/mesa/matches/ready')
      .then(res => res.json())
      .then(data => {
        setReadyMatches(data.matches || []);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching ready matches:', error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
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
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
            <Monitor className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight">Mesa de Control</span>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Partidos Disponibles</h1>
            <p className="text-white/50 text-lg">Selecciona un partido preparado para comenzar a operarlo.</p>
          </div>

          {readyMatches.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
              <CalendarClock className="w-12 h-12 text-white/20 mb-4" />
              <h3 className="text-xl font-bold mb-2">No hay partidos listos</h3>
              <p className="text-white/50">El administrador aún no ha preparado ningún partido.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {readyMatches.map((match) => (
                <div key={match.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full">
                      LISTO PARA MESA
                    </span>
                    <span className="text-sm text-white/50">{new Date(match.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center font-bold text-xl border border-white/10 mb-2">
                        {match.homeTeamName.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">{match.homeTeamName}</span>
                    </div>
                    
                    <span className="text-white/30 font-bold italic text-lg">VS</span>
                    
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center font-bold text-xl border border-white/10 mb-2">
                        {match.awayTeamName.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">{match.awayTeamName}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/mesa/${match.id}`)}
                    className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold transition-colors mt-auto"
                  >
                    <PlayCircle className="w-5 h-5" />
                    Abrir Mesa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
