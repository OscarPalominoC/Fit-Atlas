import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSessions, deleteSession } from '../api/client';
import { languages } from '../languages';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Activity, ChevronRight, Trash2, Dumbbell } from 'lucide-react';


interface WorkoutHistoryProps {
  userId: string;
  language: 'en' | 'es';
}

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ userId, language }) => {
  const t = languages[language];
  const queryClient = useQueryClient();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions', userId],
    queryFn: () => getSessions(userId)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setSessionToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting session:", error);
      alert("Error deleting session. Please try again.");
      setSessionToDelete(null);
    }
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
      <p className="text-text-secondary font-black uppercase tracking-widest text-xs">{t.ui.database}</p>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex justify-between items-end gap-4 mb-6 sm:mb-8">
        <div>
          <h3 className="text-2xl sm:text-3xl font-black heading-premium tracking-tight mb-2">{t.nav.history}</h3>
          <p className="text-text-secondary font-medium">{sessions?.length || 0} {t.ui.activeSession} {t.ui.formatTime}</p>
        </div>
      </div>

      <AnimatePresence>
        {sessionToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
              onClick={() => setSessionToDelete(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative glass-card p-8 rounded-[32px] border border-white/10 max-w-sm w-full text-center"
            >
              <Trash2 size={48} className="text-red-500 mx-auto mb-6" />
              <h4 className="text-xl font-black heading-premium mb-4">{t.ui.deleteConfirm}</h4>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => deleteMutation.mutate(sessionToDelete)}
                  className="bg-red-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest"
                >
                  {t.ui.confirm}
                </button>
                <button 
                  onClick={() => setSessionToDelete(null)}
                  className="bg-white/5 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest"
                >
                  {t.ui.cancel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {sessions?.map((session: any, index: number) => (
          <motion.div
            key={session.id || session._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`glass-card rounded-3xl lg:rounded-[32px] border transition-all overflow-hidden ${expandedSession === (session.id || session._id) ? 'border-brand-primary/40 ring-1 ring-brand-primary/20' : 'border-white/5 hover:border-brand-primary/20'}`}
          >
            <div 
              className="p-5 sm:p-7 cursor-pointer"
              onClick={() => setExpandedSession(expandedSession === (session.id || session._id) ? null : (session.id || session._id))}
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/10 shrink-0">
                    <Calendar className="text-brand-primary" size={24} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-lg sm:text-2xl font-black heading-premium break-words mb-1">
                      {session.routine_name || (language === 'es' ? 'Sesión Libre' : 'Free Session')}
                    </h4>
                    <p className="text-text-secondary text-xs sm:text-sm font-bold flex items-center gap-2 flex-wrap uppercase tracking-widest">
                      {new Date(session.started_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })} • <Clock size={14} className="text-brand-secondary" /> {Math.floor(session.duration_seconds / 60)} {t.ui.min}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-8 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                  <div className="flex gap-6 sm:gap-10">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">{t.ui.payload}</p>
                      <p className="text-xl font-black heading-premium text-brand-accent">{Math.round(session.total_volume)}<span className="text-[10px] ml-1">KG</span></p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">{t.stats.intensity}</p>
                      <p className="text-xl font-black heading-premium text-brand-primary">{session.difficulty_score?.toFixed(1) || '0.0'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const id = session.id || session._id;
                        if (id) setSessionToDelete(id); 
                      }}
                      className="p-3 bg-red-500/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className={`p-2 rounded-xl transition-all ${expandedSession === (session.id || session._id) ? 'bg-brand-primary text-white' : 'bg-white/5 text-text-secondary'}`}>
                      <ChevronRight size={20} className={`transition-transform duration-300 ${expandedSession === (session.id || session._id) ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedSession === (session.id || session._id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5 bg-white/[0.01]"
                >
                  <div className="p-5 sm:p-8 space-y-4">
                    <h5 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                      {t.ui.sessionHistory}
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {session.completed_exercises.map((ex: any, i: number) => (
                        <div key={i} className="glass-sm p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                              <Dumbbell size={18} className="text-brand-primary/50" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{ex.exercise_id}</p>
                              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{ex.sets_completed} Sets</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-white">{ex.weight}<span className="text-[10px] ml-1 opacity-40">KG</span></p>
                            <p className="text-[10px] font-bold text-brand-primary">
                              {Math.max(...ex.reps)} <span className="opacity-40 uppercase">
                                {ex.is_time_based ? t.ui.min : 'MAX REPS'}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {sessions?.length === 0 && (
          <div className="text-center py-20 sm:py-32 glass-card rounded-[40px] border-dashed border-2 border-white/5">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Activity className="text-text-secondary/20" size={40} />
            </div>
            <p className="text-text-secondary font-black uppercase tracking-widest text-xs">{t.routines.emptyState}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutHistory;
