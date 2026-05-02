import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSessions, getAnalyticsSummary, getMuscleRecovery } from '../api/client';
import { languages } from '../languages';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, BarChart3, Zap, Target, Info } from 'lucide-react';
import MuscleMap from './MuscleMap';

interface AnalyticsProps {
  userId: string;
  language: 'en' | 'es';
}

const Analytics: React.FC<AnalyticsProps> = ({ userId, language }) => {
  const t = languages[language];
  
  const { data: sessions } = useQuery({
    queryKey: ['sessions', userId],
    queryFn: () => getSessions(userId)
  });

  const { data: summary } = useQuery({
    queryKey: ['analytics-summary', userId],
    queryFn: () => getAnalyticsSummary(userId)
  });

  const { data: muscleStates } = useQuery({
    queryKey: ['muscle-recovery', userId],
    queryFn: () => getMuscleRecovery(userId)
  });

  // Aggregations
  const totalVolume = sessions?.reduce((acc: number, s: any) => acc + s.total_volume, 0) || 0;
  const avgIntensity = sessions?.length ? sessions.reduce((acc: number, s: any) => acc + s.difficulty_score, 0) / sessions.length : 0;
  
  // Last 7 sessions for the chart
  const recentSessions = sessions?.slice(0, 7).reverse() || [];
  const maxVol = Math.max(...recentSessions.map((s: any) => s.total_volume), 1000);

  const focusDist = summary?.focus_distribution || { Anterior: 0, Posterior: 0, Core: 0 };
  const efficiency = summary?.efficiency || 0;

  return (
    <div className="space-y-8 lg:space-y-10">
      <div className="mb-8 lg:mb-12">
        <h3 className="text-2xl sm:text-3xl font-black heading-premium tracking-tight mb-2">{t.analytics.title}</h3>
        <p className="text-text-secondary font-medium">{t.analytics.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={<Activity size={20}/>} label={t.analytics.totalSessions} value={sessions?.length || 0} color="text-brand-primary" />
        <MetricCard icon={<TrendingUp size={20}/>} label={t.analytics.totalPayload} value={`${Math.round(totalVolume/1000)}k kg`} color="text-brand-accent" />
        <MetricCard icon={<Zap size={20}/>} label={t.analytics.avgIntensity} value={avgIntensity.toFixed(1)} color="text-brand-secondary" />
        <MetricCard icon={<Target size={20}/>} label={t.analytics.efficiency} value={`${efficiency}%`} color="text-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-8">
        {/* Performance Chart */}
        <div className="lg:col-span-8 glass-card p-5 sm:p-8 lg:p-10 rounded-3xl lg:rounded-[40px] border border-white/5 relative overflow-hidden min-w-0">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-8 lg:mb-10">
            <h4 className="text-lg sm:text-xl font-bold flex items-center gap-3">
              <BarChart3 className="text-brand-primary" /> {t.analytics.performanceDelta}
            </h4>
            <div className="flex gap-4">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                <span className="w-2 h-2 rounded-full bg-brand-primary" /> {t.analytics.volume}
              </span>
            </div>
          </div>

          <div className="h-56 sm:h-64 flex items-end justify-between gap-2 sm:gap-4">
            {recentSessions.map((session: any, i: number) => (
              <div key={session.id} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="relative w-full flex justify-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(session.total_volume / maxVol) * 100}%` }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 50 }}
                    className="w-full max-w-[40px] bg-gradient-to-t from-brand-primary/20 to-brand-primary rounded-t-xl group-hover:to-brand-accent transition-all relative"
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 glass-sm px-2 py-1 rounded-lg text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {Math.round(session.total_volume)}
                    </div>
                  </motion.div>
                </div>
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                  S{sessions.length - (recentSessions.length - 1 - i)}
                </span>
              </div>
            ))}
            {recentSessions.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-text-secondary/30 italic px-8 text-center">
                {t.analytics.insufficientData}
              </div>
            )}
          </div>
        </div>

        {/* Focus Distribution */}
        <div className="lg:col-span-4 glass-card p-5 sm:p-8 lg:p-10 rounded-3xl lg:rounded-[40px] border border-white/5 min-w-0">
          <h4 className="text-lg sm:text-xl font-bold mb-8">{t.analytics.focusDistribution}</h4>
          <div className="space-y-6">
            <FocusBar label={t.ui.anterior} percent={focusDist.Anterior} color="bg-brand-primary" />
            <FocusBar label={t.ui.posterior} percent={focusDist.Posterior} color="bg-brand-secondary" />
            <FocusBar label={t.ui.core || "Core"} percent={focusDist.Core} color="bg-brand-accent" />
          </div>
          <div className="mt-12 pt-8 border-t border-white/5">
            <p className="text-sm text-text-secondary italic">
              {focusDist.Anterior > focusDist.Posterior + 10 
                ? t.analytics.balanceWarning
                : t.analytics.balanceGood}
            </p>
          </div>
        </div>

        {/* Neural Recovery Map */}
        <div className="lg:col-span-12 glass-card p-5 sm:p-8 lg:p-10 rounded-3xl lg:rounded-[40px] border border-white/5 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-10">
            <div>
              <h4 className="text-xl sm:text-2xl font-black heading-premium mb-2">{t.analytics.recoveryMap}</h4>
              <p className="text-text-secondary font-medium">{t.analytics.recoverySubtitle}</p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <LegendItem color="#22c55e" label={t.analytics.recovered} />
              <LegendItem color="#eab308" label={t.analytics.lightFatigue} />
              <LegendItem color="#f97316" label={t.analytics.moderateFatigue} />
              <LegendItem color="#ef4444" label={t.analytics.highFatigue} />
            </div>
          </div>

          <div className="w-full">
            <MuscleMap 
              language={language}
              muscleStates={muscleStates}
            />
          </div>

          <div className="mt-12 flex items-start gap-4 p-6 rounded-2xl bg-brand-primary/5 border border-brand-primary/10">
            <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
              <Info className="shrink-0" size={20} />
            </div>
            <div className="text-sm">
              <span className="font-bold text-brand-primary block mb-1">{t.analytics.howItWorksTitle}</span>
              <p className="text-text-secondary leading-relaxed">
                {t.analytics.howItWorksDesc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: color }} />
    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{label}</span>
  </div>
);

const MetricCard = ({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) => (
  <div className="glass-card p-5 sm:p-6 rounded-3xl lg:rounded-[32px] border border-white/5 min-w-0">
    <div className="flex items-center gap-3 text-text-secondary mb-3">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest break-words">{label}</span>
    </div>
    <p className={`text-2xl font-black heading-premium ${color}`}>{value}</p>
  </div>
);

const FocusBar = ({ label, percent, color }: { label: string, percent: number, color: string }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
      <span className="text-text-secondary">{label}</span>
      <span className="text-white">{percent}%</span>
    </div>
    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        className={`h-full ${color}`}
      />
    </div>
  </div>
);

export default Analytics;
