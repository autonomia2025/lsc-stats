import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronLeft, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

type Step = 'local' | 'visitor' | 'ready';

type Player = { id: string, firstName: string, lastName: string, jerseyNumber: number };
type TeamInfo = { name: string, short: string, players: Player[] };

export default function PrepareMatchWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('local');
  const [isLoading, setIsLoading] = useState(true);
  
  const [localTeam, setLocalTeam] = useState<TeamInfo | null>(null);
  const [visitorTeam, setVisitorTeam] = useState<TeamInfo | null>(null);

  const [localSelected, setLocalSelected] = useState<string[]>([]);
  const [visitorSelected, setVisitorSelected] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/admin/matches/${id}/data`)
      .then(res => res.json())
      .then(data => {
        const homePlayers = data.homeTeam.activePlayers.map((p: any) => ({ ...p, id: p.id.toString() }));
        const awayPlayers = data.awayTeam.activePlayers.map((p: any) => ({ ...p, id: p.id.toString() }));
        
        setLocalTeam({
          name: data.homeTeam.name,
          short: data.homeTeam.name.substring(0, 2).toUpperCase(),
          players: homePlayers
        });
        setVisitorTeam({
          name: data.awayTeam.name,
          short: data.awayTeam.name.substring(0, 2).toUpperCase(),
          players: awayPlayers
        });

        // Pre-select all
        setLocalSelected(homePlayers.map((p: any) => p.id));
        setVisitorSelected(awayPlayers.map((p: any) => p.id));
        
        setIsLoading(false);
      });
  }, [id]);

  const togglePlayer = (team: 'local' | 'visitor', playerId: string) => {
    if (team === 'local') {
      setLocalSelected(prev => 
        prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
      );
    } else {
      setVisitorSelected(prev => 
        prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
      );
    }
  };

  const nextStep = (step: Step) => setCurrentStep(step);

  const finishPreparation = async () => {
     // Persist roster selection to backend
     try {
        await fetch(`/api/admin/matches/${id}/roster`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
              homeTeamId: localTeam?.short, // we need actual team ids, wait...
              // Actually we can just pass the player IDs and order
              localSelected,
              visitorSelected
           })
        });
        navigate(`/admin/mesa/${id}`);
     } catch(e) {
        console.error(e);
     }
  };

  const renderRosterSelection = (
    team: 'local' | 'visitor', 
    teamData: TeamInfo, 
    selectedIds: string[], 
    onNext: () => void,
    onBack: () => void,
    isFirst: boolean
  ) => {
    return (
      <motion.div 
        key={team}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="max-w-4xl w-full h-[80vh] flex flex-col"
      >
        <div className="flex items-center gap-4 mb-8 shrink-0">
          {!isFirst ? (
            <button onClick={onBack} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
              <ChevronLeft className="w-6 h-6" />
            </button>
          ) : (
            <button onClick={() => navigate('/admin')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white/50 hover:text-white">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div>
            <p className="text-blue-400 font-mono text-xs uppercase tracking-widest mb-1">
              {team === 'local' ? 'Equipo Local' : 'Equipo Visitante'}
            </p>
            <h2 className="text-3xl font-bold tracking-tight">Convocatoria: {teamData.name}</h2>
          </div>
        </div>

        {/* Player Grid */}
        <div className="flex-1 overflow-y-auto pr-2 pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {teamData.players.map(player => {
              const isSelected = selectedIds.includes(player.id);
              return (
                <div 
                  key={player.id}
                  onClick={() => togglePlayer(team, player.id)}
                  className={`
                    cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center h-32 select-none
                    ${isSelected 
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                      : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:border-white/20'
                    }
                  `}
                >
                  <span className={`text-2xl font-bold mb-2 ${isSelected ? 'text-blue-400' : 'text-white/30'}`}>
                    #{player.jerseyNumber}
                  </span>
                  <span className="font-medium text-sm leading-tight">{player.firstName} {player.lastName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-white/10 flex justify-between items-center shrink-0">
          <span className="text-white/50 text-sm font-medium">
            {selectedIds.length} jugadores seleccionados (Mínimo 5)
          </span>
          <button 
            onClick={onNext}
            disabled={selectedIds.length < 5}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm transition-colors inline-flex items-center gap-3 cursor-pointer disabled:opacity-50"
          >
            Confirmar {team === 'local' ? 'Local' : 'Visitante'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
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
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Top Progress Bar */}
      <div className="h-1 w-full bg-white/5">
        <motion.div 
          className="h-full bg-blue-500"
          initial={{ width: '0%' }}
          animate={{ 
            width: currentStep === 'local' ? '33%' : 
                   currentStep === 'visitor' ? '66%' : '100%' 
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <AnimatePresence mode="wait">
          
          {currentStep === 'local' && renderRosterSelection(
            'local', 
            localTeam, 
            localSelected, 
            () => nextStep('visitor'),
            () => navigate('/admin'),
            true
          )}

          {currentStep === 'visitor' && renderRosterSelection(
            'visitor', 
            visitorTeam, 
            visitorSelected, 
            () => nextStep('ready'),
            () => nextStep('local'),
            false
          )}

          {currentStep === 'ready' && (
            <motion.div 
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full text-center space-y-8"
            >
              <div className="flex justify-center gap-8 items-center mb-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 bg-blue-600/10 text-blue-400 rounded-3xl flex items-center justify-center border border-blue-500/20 text-3xl font-bold">
                    {localTeam.short}
                  </div>
                  <span className="text-white/60 text-sm font-medium">{localSelected.length} Jugadores</span>
                </div>
                
                <span className="text-3xl font-bold text-white/20 italic">VS</span>
                
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 bg-orange-600/10 text-orange-400 rounded-3xl flex items-center justify-center border border-orange-500/20 text-3xl font-bold">
                    {visitorTeam.short}
                  </div>
                  <span className="text-white/60 text-sm font-medium">{visitorSelected.length} Jugadores</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-4xl font-bold tracking-tight">Partido Preparado</h2>
                <p className="text-white/60 text-lg">
                  Las nóminas están confirmadas. Todo está listo para el salto inicial.
                </p>
              </div>
              
              <div className="pt-4">
                <button 
                  onClick={finishPreparation}
                  className="w-full bg-white text-black px-8 py-5 rounded-full font-bold uppercase tracking-wider text-sm hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-3 cursor-pointer mb-4"
                >
                  Abrir Mesa <ArrowRight className="w-4 h-4" />
                </button>
                
                <button 
                  onClick={() => nextStep('visitor')}
                  className="w-full text-white/40 hover:text-white py-4 font-medium transition-colors text-sm cursor-pointer"
                >
                  Revisar nóminas
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
