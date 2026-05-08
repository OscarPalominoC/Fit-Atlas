import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSessions, deleteSession, updateSession } from '../api/client';
import { languages } from '../languages';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Activity, ChevronRight, Trash2, Dumbbell, Zap, Edit2, Check, X } from 'lucide-react';


interface WorkoutHistoryProps {
  userId: string;
  language: 'en' | 'es';
}

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ userId, language }) => {
  const t = languages[language];
  const queryClient = useQueryClient();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const formatDuration = (s: number) => {
    if (s < 60) return `${s} sec`;
    if (s < 3600) {
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} min`;
    }
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setEditingSessionId(null);
    }
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
      <p className="text-text-secondary font-black uppercase tracking-widest text-xs">{t.ui.database}</p>
    </div>
  );

  const handleStartEdit = (e: React.MouseEvent, session: any) => {
    e.stopPropagation();
    setEditingSessionId(session.id || session._id);
    setEditingName(session.routine_name || "");
  };

  const handleSaveEdit = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    updateMutation.mutate({ id: sessionId, data: { routine_name: editingName } });
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex justify-between items-end gap-4 mb-6 sm:mb-8">
        <div>
          <h3 className="text-2xl sm:text-3xl font-black heading-premium tracking-tight mb-2">{t.nav.history}</h3>
          <p className="text-text-secondary font-medium">{sessions?.length || 0} {t.ui.activeSession}</p>
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
                <div className="flex items-center gap-4 sm:gap-5 min-w-0 w-full lg:w-auto">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/10 shrink-0">
                    <Calendar className="text-brand-primary" size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingSessionId === (session.id || session._id) ? (
                      <div className="flex items-center gap-2 mb-1" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          className="bg-white/5 border border-brand-primary/30 rounded-lg px-3 py-1 text-white font-bold outline-none focus:bg-white/10 w-full"
                          autoFocus
                        />
                        <button onClick={(e) => handleSaveEdit(e, session.id || session._id)} className="p-1 text-brand-secondary hover:bg-brand-secondary/10 rounded-lg">
                          <Check size={18} />
                        </button>
                        <button onClick={handleCancelEdit} className="p-1 text-red-400 hover:bg-red-400/10 rounded-lg">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group/title min-w-0">
                        <h4 className="text-lg sm:text-2xl font-black heading-premium truncate">
                          {session.routine_name || (language === 'es' ? 'Sesión Libre' : 'Free Session')}
                        </h4>
                        <button 
                          onClick={(e) => handleStartEdit(e, session)}
                          className="p-1 text-text-secondary opacity-100 sm:opacity-0 sm:group-hover/title:opacity-100 hover:text-brand-primary transition-all shrink-0"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                    <p className="text-text-secondary text-xs sm:text-sm font-bold flex items-center gap-2 flex-wrap uppercase tracking-widest">
                      {new Date(session.started_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })} • <Clock size={14} className="text-brand-secondary" /> {Math.floor(session.duration_seconds / 60)} {t.ui.min} • <Zap size={14} className="text-brand-primary" /> +{session.earned_xp} XP
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
                      className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-all"
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
                    <div className="space-y-3">
                      {session.completed_exercises.map((ex: any, i: number) => (
                        <div key={i} className="glass-card p-6 rounded-[32px] border border-white/5 space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/10">
                                <Dumbbell size={24} className="text-brand-primary" />
                              </div>
                              <h5 className="text-lg font-black heading-premium">{ex.exercise_id}</h5>
                            </div>
                            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                              <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{ex.sets_completed} Sets</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            {ex.reps.map((reps: number, setIdx: number) => (
                              <div key={setIdx} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all group">
                                <div className="flex items-center gap-4">
                                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-text-secondary group-hover:bg-brand-primary/20 group-hover:text-brand-primary transition-colors">
                                    {setIdx + 1}
                                  </span>
                                  <div className="flex items-center gap-6">
                                    <div>
                                      <span className="text-xl font-black heading-premium">{reps}</span>
                                      <span className="text-[10px] font-bold text-text-secondary ml-1 uppercase">
                                        {ex.is_time_based ? 'SEC' : 'REPS'}
                                      </span>
                                    </div>
                                    <div className="h-4 w-[1px] bg-white/10" />
                                    <div>
                                      <span className="text-xl font-black heading-premium">{ex.weight}</span>
                                      <span className="text-[10px] font-bold text-text-secondary ml-1 uppercase text-brand-accent">KG</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-text-secondary">
                                  <Clock size={12} className="opacity-40" />
                                  <span className="text-xs font-bold font-mono">
                                    {ex.active_times?.[setIdx] ? formatDuration(ex.active_times[setIdx]) : '--'}
                                  </span>
                                </div>
                              </div>
                            ))}
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
