import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSessions, getAnalyticsSummary, getMuscleRecovery, getBodyMetrics, addBodyMetric } from '../api/client';
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

  const { data: bodyMetrics } = useQuery({
    queryKey: ['body-metrics', userId],
    queryFn: () => getBodyMetrics(userId)
  });

  const queryClient = useQueryClient();
  const weightMutation = useMutation({
    mutationFn: addBodyMetric,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-metrics'] });
    }
  });

  const [selectedWeightIdx, setSelectedWeightIdx] = useState<number | null>(null);

  const handleLogWeight = () => {
    const weightStr = prompt(t.analytics.enterWeight);
    if (weightStr) {
      const weight = parseFloat(weightStr);
      if (!isNaN(weight)) {
        weightMutation.mutate({ user_id: userId, weight, date: new Date().toISOString() });
      }
    }
  };

  // Aggregations
  const totalVolume = sessions?.reduce((acc: number, s: any) => acc + s.total_volume, 0) || 0;
  const avgIntensity = sessions?.length ? sessions.reduce((acc: number, s: any) => acc + s.difficulty_score, 0) / sessions.length : 0;
  
  const performanceDelta = summary?.performance_delta || [];
  const maxDelta = Math.max(...performanceDelta.map((d: any) => Math.abs(d.delta_percent)), 10);

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
        {/* Performance Delta Chart */}
        <div className="lg:col-span-8 glass-card p-5 sm:p-8 lg:p-10 rounded-3xl lg:rounded-[40px] border border-white/5 relative overflow-hidden min-w-0">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-8 lg:mb-10">
            <h4 className="text-lg sm:text-xl font-bold flex items-center gap-3">
              <BarChart3 className="text-brand-primary" /> {t.analytics.performanceDelta}
            </h4>
            <div className="flex gap-4">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                <span className="w-2 h-2 rounded-full bg-brand-primary" /> % {language === 'es' ? 'Cambio Volumen' : 'Volume Change'}
              </span>
            </div>
          </div>

          <div className="h-56 sm:h-64 flex items-center justify-between gap-2 sm:gap-4 relative px-4">
             {/* Zero Line */}
             <div className="absolute left-0 right-0 h-[1px] bg-white/5 top-1/2" />
             
            {performanceDelta.map((d: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center group h-full">
                <div className="relative w-full h-full flex items-center justify-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(Math.abs(d.delta_percent) / maxDelta) * 50}%` }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 50 }}
                    className={`w-full max-w-[24px] rounded-full transition-all relative ${d.delta_percent >= 0 ? 'bg-brand-primary origin-bottom -translate-y-1/2' : 'bg-red-500 origin-top translate-y-1/2'}`}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 glass-sm px-2 py-1 rounded-lg text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                      {d.delta_percent > 0 ? '+' : ''}{d.delta_percent}%
                    </div>
                  </motion.div>
                </div>
                <span className="text-[8px] font-black text-text-secondary absolute bottom-0 opacity-40">
                  {new Date(d.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
            {performanceDelta.length === 0 && (
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

        {/* Weight Progress Chart */}
        <div className="lg:col-span-12 glass-card p-5 sm:p-8 lg:p-10 rounded-3xl lg:rounded-[40px] border border-white/5 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
            <div>
              <h4 className="text-xl sm:text-2xl font-black heading-premium mb-2">{t.analytics.weightTracking}</h4>
              <p className="text-text-secondary font-medium">{t.analytics.monitorTransformation}</p>
            </div>
            <div className="flex gap-4 items-center">
              <button 
                onClick={handleLogWeight}
                className="px-6 py-3 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all"
              >
                {t.analytics.logWeight}
              </button>
            </div>
          </div>

          <div className="h-64 w-full relative flex items-end px-4 gap-1 mb-8">
            {bodyMetrics?.slice(0, 15).reverse().map((m: any, i: number, arr: any[]) => {
              const weights = arr.map((bm: any) => bm.weight);
              const minW = Math.min(...weights) - 2;
              const maxW = Math.max(...weights) + 2;
              const range = maxW - minW || 1;
              const h = ((m.weight - minW) / range) * 100;
              const isSelected = selectedWeightIdx === i;

              return (
                <div 
                  key={i} 
                  className="flex-1 flex flex-col items-center group relative h-full justify-end cursor-pointer"
                  onClick={() => setSelectedWeightIdx(isSelected ? null : i)}
                >
                   {/* Tap target (invisible, larger for mobile) */}
                   <div 
                    className="absolute z-30 w-8 h-8 sm:w-4 sm:h-4 rounded-full" 
                    style={{ bottom: `calc(${h}% - 16px)` }}
                  />
                   {/* Line point */}
                   <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: isSelected ? 1.8 : 1 }}
                    style={{ bottom: `${h}%` }}
                    className={`absolute w-3 h-3 sm:w-3 sm:h-3 rounded-full bg-brand-accent z-10 transition-all duration-200 ${
                      isSelected 
                        ? 'shadow-[0_0_20px_rgba(var(--brand-accent-rgb),0.8)]' 
                        : 'shadow-[0_0_15px_rgba(var(--brand-accent-rgb),0.5)] group-hover:scale-150'
                    }`}
                  />
                  {/* Vertical Guide */}
                  <div className={`absolute inset-y-0 w-[1px] transition-colors ${
                    isSelected ? 'bg-white/15' : 'bg-white/5 group-hover:bg-white/10'
                  }`} />
                  
                  {/* Date label */}
                  <span className="text-[8px] font-black text-text-secondary absolute -bottom-6 opacity-40 whitespace-nowrap">
                    {new Date(m.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })}
                  </span>

                  {/* Weight tooltip - visible on hover (desktop) or tap (mobile) */}
                  <div 
                    className={`absolute glass-sm px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap z-20 transition-all duration-200 pointer-events-none ${
                      isSelected 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'
                    }`} 
                    style={{ bottom: `${Math.min(h + 12, 90)}%` }}
                  >
                    <span className="text-brand-accent">{m.weight}</span> kg
                  </div>
                </div>
              );
            })}
            {(!bodyMetrics || bodyMetrics.length === 0) && (
              <div className="absolute inset-0 flex items-center justify-center text-text-secondary/30 italic px-8 text-center">
                {t.analytics.firstWeight}
              </div>
            )}
          </div>
        </div>

        {/* Muscle Load Balance */}
        <div className="lg:col-span-12 glass-card p-5 sm:p-8 lg:p-10 rounded-3xl lg:rounded-[40px] border border-white/5 min-w-0">
          <h4 className="text-xl sm:text-2xl font-black heading-premium mb-8">{t.analytics.muscleLoadBalance}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {Object.entries(summary?.muscle_stats || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10).map(([muscle, vol]: any, i: number) => {
              const maxVol = Math.max(...Object.values(summary?.muscle_stats || {}) as number[], 1);
              return (
                <div key={muscle} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-text-secondary">{t.muscles[muscle as keyof typeof t.muscles] || muscle}</span>
                    <span className="text-white">{Math.round(vol / 1000)}k kg</span>
                  </div>
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(vol / maxVol) * 100}%` }}
                      transition={{ delay: i * 0.05 }}
                      className="h-full bg-gradient-to-r from-brand-primary to-brand-accent rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Training Consistency Heatmap */}
        <div className="lg:col-span-12 glass-card p-5 sm:p-8 lg:p-10 rounded-3xl lg:rounded-[40px] border border-white/5 min-w-0">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xl sm:text-2xl font-black heading-premium">{t.analytics.trainingConsistency}</h4>
            <span className="text-xs font-bold text-text-secondary">{summary?.consistency?.length || 0} {t.analytics.sessions90Days}</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {Array.from({ length: 90 }).map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (89 - i));
              const dateStr = date.toISOString().split('T')[0];
              const isTrained = summary?.consistency?.includes(dateStr);
              
              return (
                <div 
                  key={i}
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm transition-all duration-500 ${isTrained ? 'bg-brand-primary shadow-[0_0_8px_rgba(var(--brand-primary-rgb),0.4)]' : 'bg-white/5'}`}
                  title={dateStr}
                />
              );
            })}
          </div>
          <div className="mt-6 flex justify-center sm:justify-start gap-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-white/5" /> {t.analytics.rest}</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-brand-primary" /> {t.analytics.trained}</div>
          </div>
        </div>

        {/* Strength Progress (1RM) */}
        <div className="lg:col-span-12 glass-card p-5 sm:p-8 lg:p-10 rounded-3xl lg:rounded-[40px] border border-white/5 min-w-0">
          <h4 className="text-xl sm:text-2xl font-black heading-premium mb-10">{t.analytics.strengthEvolution}</h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {summary?.strength_progress?.map((prog: any) => (
              <div key={prog.exercise} className="glass-sm p-6 rounded-[32px] border border-white/5">
                <h5 className="text-sm font-black uppercase tracking-widest text-brand-secondary mb-6">{prog.exercise}</h5>
                <div className="h-32 w-full flex items-end gap-1 relative">
                  {prog.history.map((h: any, i: number, arr: any[]) => {
                    const minR = Math.min(...arr.map(x => x.one_rm)) * 0.9;
                    const maxR = Math.max(...arr.map(x => x.one_rm)) * 1.1;
                    const height = ((h.one_rm - minR) / (maxR - minR)) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          className="w-full bg-brand-secondary/20 rounded-t-lg group-hover:bg-brand-secondary/40 transition-all"
                        />
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity -top-8 left-1/2 -translate-x-1/2 glass-sm px-2 py-1 rounded-lg text-[10px] font-black z-20">
                          {h.one_rm}kg
                        </div>
                      </div>
                    );
                  })}
                  {prog.history.length < 2 && (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-text-secondary/40 italic">
                      {t.analytics.insufficientData}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(!summary?.strength_progress || summary.strength_progress.length === 0) && (
              <div className="col-span-full py-12 text-center text-text-secondary italic">
                {language === 'es' ? 'Entrena ejercicios de fuerza para ver tu progreso' : 'Perform strength exercises to see progress'}
              </div>
            )}
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
              sideBySide={true}
              hideLabels={true}
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
