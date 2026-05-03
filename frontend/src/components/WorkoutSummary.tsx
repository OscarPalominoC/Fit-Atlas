import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Zap, TrendingUp, Trophy, ArrowRight, Share2 } from 'lucide-react';
import { languages } from '../languages';
import MuscleMap from './MuscleMap';


interface WorkoutSummaryProps {
  session: any;
  language: 'en' | 'es';
  onClose: () => void;
}

const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({ session, language, onClose }) => {
  const isEs = language === 'es';

  // Calculate muscle impact for the map
  const muscleStates: Record<string, any> = {};
  if (session.muscle_impact) {
    Object.entries(session.muscle_impact).forEach(([muscle, level]: [string, any]) => {
      const keys = ["recovered", "light_fatigue", "moderate_fatigue", "high_fatigue"];
      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
      muscleStates[muscle] = {
        level: level,
        key: keys[level],
        color: colors[level]
      };
    });
  }


  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-[110] bg-bg-dark flex flex-col overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full px-6 py-12 space-y-12">
        
        {/* Success Header */}
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-brand-secondary/20 rounded-full flex items-center justify-center mx-auto border border-brand-secondary/30 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
          >
            <CheckCircle size={48} className="text-brand-secondary" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-black heading-premium"
          >
            {isEs ? '¡MISIÓN CUMPLIDA!' : 'MISSION COMPLETE!'}
          </motion.h2>
          <p className="text-text-secondary font-bold uppercase tracking-[0.3em] text-sm">
            {isEs ? 'Rendimiento registrado con éxito' : 'Performance successfully recorded'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: isEs ? 'TIEMPO' : 'TIME', val: formatTime(session.duration_seconds), icon: <TrendingUp size={20} />, color: 'text-brand-primary' },
            { label: isEs ? 'VOLUMEN' : 'VOLUME', val: `${session.total_volume}kg`, icon: <Zap size={20} />, color: 'text-brand-accent' },
            { label: isEs ? 'EXPERIENCIA' : 'EXPERIENCE', val: `+${session.earned_xp} XP`, icon: <Trophy size={20} />, color: 'text-brand-secondary' },
            { label: isEs ? 'NIVEL' : 'LEVEL', val: `S-Rank`, icon: <CheckCircle size={20} />, color: 'text-white' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i }}
              className="glass-card p-6 rounded-[32px] border border-white/5 text-center space-y-2"
            >
              <div className={`mx-auto w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${stat.color} mb-4`}>
                {stat.icon}
              </div>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black heading-premium">{stat.val}</p>
            </motion.div>
          ))}
        </div>

        {/* Muscle Impact Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="glass-card p-8 sm:p-12 rounded-[56px] border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent opacity-30" />
              <h4 className="text-2xl font-black heading-premium mb-8 uppercase tracking-tight">
                {isEs ? 'Impacto Muscular Atlas' : 'Atlas Muscle Impact'}
              </h4>
              
              <div className="space-y-6">
                {[
                  { label: isEs ? 'Recuperado' : 'Recovered', color: 'bg-brand-primary' },
                  { label: isEs ? 'Fatiga Leve' : 'Light Fatigue', color: 'bg-brand-secondary' },
                  { label: isEs ? 'Moderada' : 'Moderate', color: 'bg-yellow-500' },
                  { label: isEs ? 'Fatiga Alta' : 'High Fatigue', color: 'bg-red-500' },
                ].map((level, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${level.color} shadow-[0_0_10px_rgba(255,255,255,0.1)]`} />
                    <span className="text-xs font-black uppercase tracking-widest text-text-secondary">{level.label}</span>
                    <div className="flex-1 h-[1px] bg-white/5" />
                  </div>
                ))}
              </div>

              <div className="mt-10 space-y-6">
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em]">{isEs ? 'Músculos Primarios' : 'Primary Muscles'}</h5>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(muscleStates)
                      .filter(([_, state]: [string, any]) => state.level === 3)
                      .map(([slug, _]) => (
                        <span key={slug} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-bold text-red-400 uppercase tracking-widest">
                          {languages[language].muscles[slug as keyof typeof languages['en']['muscles']] || slug}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">{isEs ? 'Músculos Secundarios' : 'Secondary Muscles'}</h5>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(muscleStates)
                      .filter(([_, state]: [string, any]) => state.level === 2)
                      .map(([slug, _]) => (
                        <span key={slug} className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-[10px] font-bold text-yellow-400 uppercase tracking-widest">
                          {languages[language].muscles[slug as keyof typeof languages['en']['muscles']] || slug}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 rounded-3xl bg-white/5 border border-white/5">
                <p className="text-sm font-bold text-text-secondary leading-relaxed italic">
                  {isEs 
                    ? "Tus fibras musculares han sido sometidas a un protocolo de estrés moderado. Se recomienda un periodo de recuperación de 24-48 horas para optimizar la hipertrofia."
                    : "Your muscle fibers have been subjected to a moderate stress protocol. A 24-48 hour recovery period is recommended to optimize hypertrophy."}
                </p>
              </div>

            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center h-[500px]">
            <MuscleMap 
              muscleStates={muscleStates}
              selectedMuscles={[]} 
              onSelectMuscle={() => {}}
              language={language}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <button 
            onClick={onClose}
            className="px-12 py-5 bg-brand-primary text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {isEs ? 'FINALIZAR PROTOCOLO' : 'FINISH PROTOCOL'} <ArrowRight size={18} />
          </button>
          <button 
            className="px-10 py-5 bg-white/5 text-text-secondary rounded-[24px] font-black uppercase tracking-[0.2em] text-xs border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-3"
          >
            <Share2 size={18} /> {isEs ? 'COMPARTIR' : 'SHARE'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutSummary;
