import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSessions } from '../api/client';
import { languages } from '../languages';
import { motion } from 'framer-motion';
import { Calendar, Clock, Activity, ChevronRight } from 'lucide-react';

interface WorkoutHistoryProps {
  userId: string;
  language: 'en' | 'es';
}

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ userId, language }) => {
  const t = languages[language];
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions', userId],
    queryFn: () => getSessions(userId)
  });

  if (isLoading) return <div className="flex justify-center py-20 text-brand-primary">Loading...</div>;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex justify-between items-end gap-4 mb-6 sm:mb-8">
        <div>
          <h3 className="text-2xl sm:text-3xl font-black heading-premium tracking-tight mb-2">{t.nav.history}</h3>
          <p className="text-text-secondary font-medium">{sessions?.length || 0} {t.ui.activeSession} {t.ui.formatTime}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sessions?.map((session: any, index: number) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card p-4 sm:p-6 rounded-3xl lg:rounded-[32px] border border-white/5 hover:border-brand-primary/30 transition-all group min-w-0"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/10 shrink-0">
                  <Calendar className="text-brand-primary" size={24} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base sm:text-xl font-bold heading-premium group-hover:text-white transition-colors break-words">
                    {new Date(session.started_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </h4>
                  <p className="text-text-secondary text-xs sm:text-sm font-medium flex items-center gap-2 flex-wrap">
                    <Clock size={14} /> {Math.floor(session.duration_seconds / 60)} {t.ui.min} • {session.completed_exercises.length} {t.ui.units}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-8 w-full md:w-auto justify-between md:justify-end">
                <div className="flex gap-4 sm:gap-8">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">{t.ui.payload}</p>
                    <p className="text-lg font-black text-brand-accent">{Math.round(session.total_volume)}kg</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">{t.stats.intensity}</p>
                    <p className="text-lg font-black text-brand-primary">{session.difficulty_score.toFixed(1)}</p>
                  </div>
                </div>
                <button className="p-3 bg-white/5 rounded-xl text-text-secondary hover:bg-brand-primary hover:text-white transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {sessions?.length === 0 && (
          <div className="text-center py-16 sm:py-24 glass-card rounded-3xl lg:rounded-[40px] border-dashed border-2 border-white/5">
            <Activity className="text-text-secondary/20 mx-auto mb-6" size={64} />
            <p className="text-text-secondary font-medium">{t.routines.emptyState}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutHistory;
