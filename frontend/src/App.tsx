import React, { useState } from 'react'
import { Activity, Dumbbell, Layout, Map, Settings as SettingsIcon, Search, Loader2, Play, LogOut, TrendingUp, Calendar, Plus } from 'lucide-react'
import MuscleMap from './components/MuscleMap'
import WorkoutLive from './components/WorkoutLive'
import Landing from './pages/Landing'
import About from './pages/About'
import Auth from './pages/Auth'
import WorkoutHistory from './components/WorkoutHistory'
import Analytics from './components/Analytics'
import RoutineManager from './components/RoutineManager'
import ExerciseIcon from './components/ExerciseIcon'
import ExerciseModal from './components/ExerciseModal'
import Settings from './components/Settings'
import { getSessions, getRoutines, startSession, completeSession } from './api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { useSyncStore } from './store/syncStore'
import { motion, AnimatePresence } from 'framer-motion'
import { languages } from './languages'
import { exercises as exercisesDict } from './data/exercises'

const App: React.FC = () => {
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'dashboard' | 'atlas' | 'live' | 'routines' | 'history' | 'analytics' | 'settings'>('dashboard')
  const [page, setPage] = useState<'landing' | 'about' | 'auth' | 'app'>('landing')
  const [activeRoutine, setActiveRoutine] = useState<any>(null)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [language, setLanguage] = useState<'en' | 'es'>('es')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  
  const { user, logout } = useAuthStore()
  const { isOffline, setIsOffline, syncPendingActions, addPendingAction } = useSyncStore()
  const queryClient = useQueryClient()
  const t = languages[language]
  const eqT = (languages[language] as any).equipment;
  
  React.useEffect(() => {
    if (user && page === 'landing') setPage('app')
  }, [user])

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncPendingActions().then(() => {
        queryClient.invalidateQueries();
      });
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOffline, syncPendingActions, queryClient]);

  const toggleMuscle = (id: string) => {
    setSelectedMuscles(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const getBackendMuscleNames = (slug: string): string[] => {
    const enName = languages['en'].muscles[slug as keyof typeof languages['en']['muscles']];
    if (slug === 'upper-back') return ['Back', 'Lats', 'Upper Back'];
    if (slug === 'abs') return ['Abs', 'Abdominals'];
    return [enName];
  };

  const activeMuscleNames = selectedMuscles.flatMap(m => getBackendMuscleNames(m));

  const exercisesList = Object.values(exercisesDict)
    .filter((ex: any) => {
      const muscleMatch = selectedMuscles.length === 0 || ex.primary_muscles.some((m: string) => activeMuscleNames.includes(m));
      const equipmentMatch = selectedEquipment.length === 0 || ex.equipment.some((eq: string) => selectedEquipment.includes(eq));
      const searchMatch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
      return muscleMatch && equipmentMatch && searchMatch;
    })
    .sort((a: any, b: any) => a.difficulty - b.difficulty);

  const { data: routines } = useQuery({
    queryKey: ['routines', user?.id],
    queryFn: () => getRoutines(user?.id || ''),
    enabled: !!user?.id
  })

  const { data: sessions } = useQuery({
    queryKey: ['sessions', user?.id],
    queryFn: () => getSessions(user?.id || ''),
    enabled: !!user?.id
  })

  const hasSessions = !!(sessions && sessions.length > 0)

  const avgIntensity = hasSessions
    ? (sessions!.reduce((acc: number, s: any) => acc + (s.difficulty_score || 0), 0) / sessions!.length).toFixed(1)
    : "0.0"

  const totalLoad = hasSessions
    ? (sessions!.reduce((acc: number, s: any) => acc + (s.total_volume || 0), 0) / 1000).toFixed(1) + "k"
    : "0"

  const efficiency = hasSessions && user?.xp
    ? Math.min(99.9, (user.xp / (user.level || 1)) / 10).toFixed(1) + "%"
    : "0.0%"

  const stats = {
    recovery: hasSessions ? "82%" : "—",
    intensity: avgIntensity,
    load: totalLoad,
    hasSessions,
    trends: {
      recovery: hasSessions ? "+4%" : "—",
      intensity: (sessions?.length ?? 0) > 1 ? "+0.2" : "—",
      load: (sessions?.length ?? 0) > 1 ? "+1.2k" : "—"
    }
  }

  const startMutation = useMutation({
    mutationFn: async (routine: any) => {
      if (isOffline) {
        return { id: `temp-session-${Date.now()}` };
      }
      return startSession(user?.id || '', routine.id);
    },
    onSuccess: (session, routine) => {
      setActiveRoutine(routine)
      setActiveSessionId(session.id)
      setActiveTab('live')
    }
  })

  const completeMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isOffline) {
        addPendingAction({
          id: `session-sync-${Date.now()}`,
          type: 'COMPLETE_SESSION',
          data: { sessionId: activeSessionId, sessionData: { ...data, user_id: user?.id } }
        });
        return;
      }
      return completeSession(activeSessionId || '', data);
    },
    onSuccess: () => {
      setActiveTab('dashboard')
      setActiveSessionId(null)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    }
  })

  const handleStartWorkout = (routine: any) => {
    startMutation.mutate(routine)
  }

  if (page === 'landing') return <Landing language={language} onLanguageChange={setLanguage} onGetStarted={() => setPage('auth')} onViewAbout={() => setPage('about')} />
  if (page === 'about') return <About language={language} onBack={() => setPage('landing')} />
  if (page === 'auth') return <Auth language={language} onBack={() => setPage('landing')} onSuccess={() => setPage('app')} />
  if (!user && page === 'app') { setPage('landing'); return null; }

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary overflow-x-hidden lg:flex">
      <div className="noise-bg" />
      
      {/* Sidebar */}
      <aside className="fixed inset-x-0 bottom-0 z-50 h-20 w-full glass-md border-t border-white/5 flex items-center px-2 py-2 lg:inset-y-0 lg:right-auto lg:h-full lg:w-72 lg:flex-col lg:border-t-0 lg:border-r lg:py-10 lg:px-4">
        <div className="hidden lg:flex items-center gap-4 mb-14 px-4">
          <div className="bg-brand-primary p-3 rounded-2xl shadow-lg shadow-brand-primary/20">
            <Dumbbell className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-black hidden lg:block tracking-normal heading-premium gradient-text">FITATLAS</h1>
        </div>

        <nav className="flex flex-1 items-center justify-around gap-1 w-full lg:block lg:space-y-2">
          <NavItem 
            icon={<Layout size={22} />} 
            label={t.nav.dashboard} 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Map size={22} />} 
            label={t.nav.atlas} 
            active={activeTab === 'atlas'} 
            onClick={() => setActiveTab('atlas')} 
          />
          <NavItem 
            icon={<Activity size={22} />} 
            label={t.nav.workouts} 
            active={activeTab === 'routines' || activeTab === 'live'} 
            onClick={() => setActiveTab('routines')} 
          />
          <NavItem 
            icon={<Calendar size={22} />} 
            label={t.nav.history} 
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          />
          <NavItem 
            icon={<TrendingUp size={22} />} 
            label={t.nav.analytics} 
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          />
          <NavItem 
            icon={<SettingsIcon size={22} />} 
            label={t.nav.settings} 
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            className="lg:hidden"
          />
        </nav>

        <div className="hidden lg:block pt-8 border-t border-white/5 w-full space-y-2">
          <NavItem 
            icon={<SettingsIcon size={22} />} 
            label={t.nav.settings} 
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
          <NavItem 
            icon={<LogOut size={22} />} 
            label={t.nav.signOut} 
            onClick={logout}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full pb-28 lg:pb-0 lg:ml-72 p-4 sm:p-6 lg:p-14 relative min-h-screen lg:h-screen lg:overflow-y-auto custom-scrollbar">
        <header className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black heading-premium tracking-tight break-words">{t.ui.welcome}, {user?.name.split(' ')[0]}</h2>
              {isOffline && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full h-fit mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest whitespace-nowrap">Offline</span>
                </div>
              )}
            </div>
            <p className="text-text-secondary font-medium text-sm sm:text-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse" />
              {t.ui.efficiency}: {efficiency}
            </p>
          </motion.div>
          
          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-2">
                {language === 'es' ? 'Nivel' : 'Level'} {user?.level || 1}
              </p>
              <div className="w-48 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                {user?.xp > 0 && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(user?.xp % 1000) / 10}%` }}
                    className="bg-gradient-to-r from-brand-primary to-brand-accent h-full relative"
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </motion.div>
                )}
              </div>
            </div>
            <div 
              onClick={() => setActiveTab('settings')}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-black text-xl sm:text-2xl shadow-xl shadow-brand-primary/5 shrink-0 cursor-pointer hover:scale-105 transition-all"
            >
              {user?.name[0]}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 lg:space-y-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                <StatCard label={t.stats.recovery} value={stats.recovery} color="text-brand-secondary" trend={stats.trends.recovery} language={language} />
                <StatCard label={t.stats.intensity} value={stats.intensity} color="text-brand-primary" trend={stats.trends.intensity} language={language} />
                <StatCard label={t.stats.load} value={stats.load} color="text-brand-accent" trend={stats.trends.load} language={language} />
              </div>

              <section>
                <div className="flex justify-between items-end gap-4 mb-6 lg:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold heading-premium">{t.ui.routines}</h3>
                  <button 
                    onClick={() => setActiveTab('routines')}
                    className="text-brand-primary font-bold text-sm hover:underline"
                  >
                    {t.ui.viewAll}
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  {routines?.slice(0, 2).map((routine: any) => (
                    <motion.div 
                      key={routine.id}
                      whileHover={{ y: -8 }}
                      onClick={() => handleStartWorkout(routine)}
                      className="glass-card p-5 sm:p-8 rounded-3xl lg:rounded-[40px] group cursor-pointer transition-all border-white/5 hover:border-brand-primary/40"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
                        <div className="min-w-0">
                          <h4 className="text-xl sm:text-2xl font-bold heading-premium mb-1 break-words">{routine.name}</h4>
                          <p className="text-text-secondary font-medium">{t.misc.mixedProtocol}</p>
                        </div>
                        <span className="bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border border-brand-primary/20">
                          {routine.difficulty <= 2 ? t.difficulty.novice : routine.difficulty <= 4 ? t.difficulty.elite : t.difficulty.legend}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="flex flex-wrap gap-3 sm:gap-6 text-sm font-bold text-text-secondary">
                          <span className="flex items-center gap-2"><Activity size={18} className="text-brand-primary" /> {routine.blocks.length} {t.ui.units}</span>
                          <span className="flex items-center gap-2"><Loader2 size={18} className="text-brand-secondary" /> {routine.blocks.reduce((acc: number, b: any) => acc + (b.time_minutes || 0), 0) || 45} {t.ui.min}</span>
                        </div>
                        <div className="bg-brand-primary p-4 rounded-2xl shadow-lg shadow-brand-primary/30 group-hover:scale-110 transition-all self-start sm:self-auto">
                          {startMutation.isPending && startMutation.variables?.id === routine.id ? (
                            <Loader2 size={20} className="text-white animate-spin" />
                          ) : (
                            <Play size={20} fill="white" className="text-white" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {routines?.length === 0 && (
                    <div 
                      onClick={() => setActiveTab('routines')}
                      className="col-span-full border-2 border-dashed border-white/5 rounded-3xl lg:rounded-[40px] p-8 sm:p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/5 transition-all"
                    >
                      <Plus size={32} className="text-text-secondary" />
                      <p className="text-text-secondary font-bold">{t.routines.emptyState}</p>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          ) : activeTab === 'atlas' ? (
            <motion.div 
              key="atlas"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12"
            >
              <div className="lg:col-span-5">
                <MuscleMap 
                  selectedMuscles={selectedMuscles} 
                  onSelectMuscle={toggleMuscle} 
                  language={language}
                />
              </div>
              <div className="lg:col-span-7">
                <div className="glass-card p-4 sm:p-6 lg:p-10 rounded-3xl lg:rounded-[48px] h-full flex flex-col min-w-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                    <h3 className="text-2xl sm:text-3xl font-bold heading-premium">{t.nav.atlas}</h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                        <input 
                          type="text" 
                          placeholder={t.ui.search} 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-8 space-y-4">
                    <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">{t.ui.equipment}</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(eqT || {}).map((eq) => (
                        <button
                          key={eq}
                          onClick={() => setSelectedEquipment(prev => 
                            prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]
                          )}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                            selectedEquipment.includes(eq) 
                              ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                              : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'
                          }`}
                        >
                          {eqT[eq]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 overflow-y-auto flex-1 lg:pr-4 custom-scrollbar">
                    {exercisesList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="bg-brand-primary/10 w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 border border-brand-primary/10">
                          <Search className="text-brand-primary" size={40} />
                        </div>
                        <p className="text-xl font-bold text-white mb-2">{t.misc.noData}</p>
                        <p className="text-text-secondary max-w-xs font-medium">No exercises match your current filters.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {exercisesList.map((ex: any) => (
                          <ExerciseListItem 
                            key={ex.id} 
                            name={ex.name} 
                            muscle={ex.primary_muscles.map((m: string) => t.muscles[m.toLowerCase() as keyof typeof t.muscles] || m).join(', ')} 
                            equipment={ex.equipment.map((eq: string) => eqT[eq] || eq).join(', ') || 'Bodyweight'} 
                            difficulty={ex.difficulty <= 2 ? t.difficulty.easy : ex.difficulty <= 4 ? t.difficulty.medium : t.difficulty.hard} 
                            instructions={ex.translations?.[language]?.instructions}
                            mediaGif={ex.media?.gif}
                            language={language}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'routines' ? (
            <motion.div
              key="routines"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
            <RoutineManager 
                userId={user?.id || ''} 
                language={language}
                onStartRoutine={handleStartWorkout}
              />
            </motion.div>
          ) : activeTab === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <WorkoutHistory userId={user?.id || ''} language={language} />
            </motion.div>
          ) : activeTab === 'analytics' ? (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Analytics userId={user?.id || ''} language={language} />
            </motion.div>
          ) : activeTab === 'settings' ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Settings language={language} onLanguageChange={setLanguage} />
            </motion.div>
          ) : (
            <WorkoutLive 
              routine={activeRoutine} 
              language={language}
              onComplete={(data) => completeMutation.mutate(data)} 
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

const NavItem = ({ icon, label, active = false, onClick, className = "" }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, className?: string }) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-center lg:justify-start gap-4 p-3 sm:p-4 rounded-2xl transition-all cursor-pointer group relative min-w-0 ${active ? 'bg-brand-primary shadow-lg shadow-brand-primary/30 text-white' : 'text-text-secondary hover:bg-white/5 hover:text-white'} ${className}`}
  >
    {icon}
    <span className="font-bold hidden lg:block tracking-tight text-lg">{label}</span>
    {active && (
      <motion.div 
        layoutId="activeNav"
        className="hidden lg:block absolute right-4 w-1.5 h-1.5 rounded-full bg-white"
      />
    )}
  </div>
)

const StatCard = ({ label, value, color, trend, language }: { label: string, value: string, color: string, trend: string, language: string }) => {
  const hasData = value !== '—' && value !== '0' && value !== '0.0' && value !== '0.0%';
  const t = languages[language as keyof typeof languages];
  return (
    <div className="glass-card p-5 sm:p-8 rounded-3xl lg:rounded-[40px] border-white/5 flex flex-col justify-between group min-w-0">
      <div>
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-black text-text-secondary uppercase tracking-[0.2em]">{label}</p>
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend === '—' ? 'text-text-secondary/50 bg-white/5' : 'text-brand-secondary bg-brand-secondary/10'}`}>{trend}</span>
        </div>
        <p className={`text-4xl sm:text-5xl font-black heading-premium tracking-normal ${hasData ? color : 'text-white/20'}`}>{value}</p>
      </div>
      <div className="mt-8 pt-6 border-t border-white/5">
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          {hasData ? (
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: '60%' }}
              className={`h-full ${color.replace('text-', 'bg-')}`} 
            />
          ) : (
            <div className="w-full h-full flex items-center">
              <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest px-1">{t.misc.noData}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


const ExerciseListItem = ({ name, muscle, equipment, difficulty, instructions, mediaGif, language }: { name: string, muscle: string, equipment: string, difficulty: string, instructions?: string[], mediaGif?: string | null, language: 'en' | 'es' }) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const t = languages[language];
  
  return (
    <>
      <div className="glass-sm p-4 sm:p-6 rounded-3xl hover:border-brand-primary/50 transition-all flex flex-col group border border-white/5 min-w-0">
        <div 
          className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 cursor-pointer"
          onClick={() => setModalOpen(true)}
        >
          <div className="flex items-center gap-4 sm:gap-5 min-w-0 w-full">
            <ExerciseIcon name={name} mediaGif={mediaGif} className="w-12 h-12 sm:w-14 sm:h-14 shrink-0" />
            <div className="min-w-0">
              <h5 className="text-base sm:text-xl font-bold heading-premium group-hover:text-white transition-colors break-words">{name}</h5>
              <p className="text-xs sm:text-sm font-medium text-text-secondary break-words">{muscle} • {equipment}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 sm:px-4 py-2 rounded-xl border shrink-0 ${
              difficulty === t.difficulty.easy ? 'border-brand-secondary/30 text-brand-secondary bg-brand-secondary/5' :
              difficulty === t.difficulty.medium ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5' :
              'border-red-500/30 text-red-500 bg-red-500/5'
            }`}>
              {difficulty}
            </span>
          </div>
        </div>
      </div>

      <ExerciseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        name={name}
        muscle={muscle}
        equipment={equipment}
        difficulty={difficulty}
        instructions={instructions}
        mediaGif={mediaGif}
        language={language}
      />
    </>
  );
}

export default App
