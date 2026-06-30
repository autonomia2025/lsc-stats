import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, ShieldCheck, ArrowRight, CheckCircle, Plus, Trash2, CalendarDays, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Step = 'welcome' | 'league' | 'teams' | 'confirmation';

export default function SetupWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  
  // State for the wizard
  const currentYear = new Date().getFullYear();
  const isFirstHalf = new Date().getMonth() < 6;
  const defaultSeasonName = `${isFirstHalf ? 'Apertura' : 'Clausura'} ${currentYear}`;

  const [leagueName, setLeagueName] = useState('Liga de Básquetbol San Clemente');
  const [seasonName, setSeasonName] = useState(defaultSeasonName);
  const [teams, setTeams] = useState([
    { id: '1', name: 'Club San Clemente' },
    { id: '2', name: 'Deportivo Maule' }
  ]);
  const [newTeamName, setNewTeamName] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/setup/status')
      .then(res => res.json())
      .then(data => {
        if (data.isSetupComplete) {
          navigate('/admin');
        }
      })
      .catch(console.error);
  }, [navigate]);

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName.trim()) {
      setTeams([...teams, { id: Date.now().toString(), name: newTeamName.trim() }]);
      setNewTeamName('');
    }
  };

  const handleRemoveTeam = (id: string) => {
    setTeams(teams.filter(t => t.id !== id));
  };

  const nextStep = (step: Step) => {
    setCurrentStep(step);
  };

  const handleFinishSetup = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueName: leagueName.trim(),
          seasonName: seasonName.trim(),
          teams: teams.map(t => t.name.trim())
        })
      });
      const data = await response.json();
      if (data.success) {
        nextStep('confirmation');
      } else {
        setError(data.error || 'Ocurrió un error al guardar');
      }
    } catch (e) {
      setError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Top Progress Bar */}
      <div className="h-1 w-full bg-white/5">
        <motion.div 
          className="h-full bg-blue-500"
          initial={{ width: '0%' }}
          animate={{ 
            width: currentStep === 'welcome' ? '10%' : 
                   currentStep === 'league' ? '40%' : 
                   currentStep === 'teams' ? '70%' : '100%' 
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <AnimatePresence mode="wait">
          
          {/* STEP 1: WELCOME */}
          {currentStep === 'welcome' && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl w-full text-center space-y-8"
            >
              <div className="w-20 h-20 bg-orange-500/10 text-orange-500 rounded-3xl flex items-center justify-center mx-auto border border-orange-500/20">
                <Trophy className="w-10 h-10" />
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Bienvenido al Game Center</h1>
                <p className="text-white/60 text-lg leading-relaxed">
                  Estás a punto de inicializar la plataforma digital oficial. 
                  Este asistente te ayudará a configurar la liga y los equipos fundadores en menos de 3 minutos.
                </p>
              </div>
              
              <button 
                onClick={() => nextStep('league')}
                className="mt-8 bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm hover:bg-gray-200 transition-colors inline-flex items-center gap-3 cursor-pointer"
              >
                Comenzar Configuración <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: LEAGUE & SEASON */}
          {currentStep === 'league' && (
            <motion.div 
              key="league"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-xl w-full"
            >
              <div className="mb-8">
                <p className="text-blue-400 font-mono text-xs uppercase tracking-widest mb-2">Paso 1 de 3</p>
                <h2 className="text-3xl font-bold tracking-tight">Identidad del Torneo</h2>
                <p className="text-white/50 mt-2">Define el nombre de la liga y la temporada actual.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-orange-500" /> Nombre de la Liga
                  </label>
                  <input 
                    type="text" 
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-lg"
                    placeholder="Ej: Liga Centro"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-orange-500" /> Temporada Inicial
                  </label>
                  <input 
                    type="text" 
                    value={seasonName}
                    onChange={(e) => setSeasonName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-lg"
                    placeholder="Ej: Apertura 2026"
                  />
                </div>
              </div>

              <div className="mt-12 flex justify-end">
                <button 
                  onClick={() => nextStep('teams')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm transition-colors inline-flex items-center gap-3 cursor-pointer disabled:opacity-50"
                  disabled={!leagueName.trim() || !seasonName.trim()}
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: TEAMS */}
          {currentStep === 'teams' && (
            <motion.div 
              key="teams"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl w-full flex flex-col h-[600px]"
            >
              <div className="mb-6 shrink-0">
                <p className="text-blue-400 font-mono text-xs uppercase tracking-widest mb-2">Paso 2 de 3</p>
                <h2 className="text-3xl font-bold tracking-tight">Equipos Participantes</h2>
                <p className="text-white/50 mt-2">Agrega los clubes que disputarán la {seasonName}.</p>
              </div>

              <form onSubmit={handleAddTeam} className="flex gap-3 mb-6 shrink-0">
                <input 
                  type="text" 
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="Nombre del equipo..."
                />
                <button 
                  type="submit"
                  disabled={!newTeamName.trim()}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 rounded-xl font-bold transition-colors inline-flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </form>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {teams.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/30 border-2 border-dashed border-white/10 rounded-2xl">
                    <Users className="w-8 h-8 mb-3" />
                    <p className="text-sm">No hay equipos registrados</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {teams.map((team, index) => (
                      <motion.div 
                        key={team.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-black/50 border border-white/5 flex items-center justify-center font-bold text-white/60">
                            {team.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-lg">{team.name}</span>
                        </div>
                        <button 
                          onClick={() => handleRemoveTeam(team.id)}
                          className="text-white/20 hover:text-red-400 p-2 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col shrink-0">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4 text-center">
                    {error}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono text-white/40">{teams.length} Equipos registrados</span>
                  <button 
                    onClick={handleFinishSetup}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm transition-colors inline-flex items-center gap-3 cursor-pointer disabled:opacity-50"
                    disabled={teams.length < 2 || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>Guardando... <Loader2 className="w-4 h-4 animate-spin" /></>
                    ) : (
                      <>Finalizar Configuración <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: CONFIRMATION */}
          {currentStep === 'confirmation' && (
            <motion.div 
              key="confirmation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full text-center space-y-8"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/20"
              >
                <CheckCircle className="w-12 h-12" />
              </motion.div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">¡Todo Listo!</h2>
                <p className="text-white/60">
                  La <strong className="text-white">{leagueName}</strong> ha sido inicializada correctamente para la temporada <strong className="text-white">{seasonName}</strong>.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Temporada</span>
                  <span className="font-bold">{seasonName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Equipos Base</span>
                  <span className="font-bold">{teams.length} clubes</span>
                </div>
              </div>
              
              <button 
                onClick={() => window.location.href = '/admin'}
                className="w-full bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-3 cursor-pointer"
              >
                Entrar al Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
