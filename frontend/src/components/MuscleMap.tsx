import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { bodyFront, bodyBack } from '../assets/musclePaths';
import { languages } from '../languages';

export type MuscleState = {
  level: 0 | 1 | 2 | 3
  key: "recovered" | "light_fatigue" | "moderate_fatigue" | "high_fatigue"
  color: string
}

interface MuscleMapProps {
  onSelectMuscle?: (muscle: string) => void;
  selectedMuscles?: string[];
  muscleStates?: Record<string, MuscleState>;
  language?: 'en' | 'es';
  sideBySide?: boolean;
  hideLabels?: boolean;
}

const MuscleMap: React.FC<MuscleMapProps> = ({ 
  onSelectMuscle, 
  selectedMuscles = [], 
  muscleStates = {},
  language = 'es',
  sideBySide = false,
  hideLabels = false
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');
  const t = languages[language];

  const handleMuscleClick = (slug: string) => {
    onSelectMuscle?.(slug);
  };

  const renderBody = (currentView: 'front' | 'back') => {
    const currentBody = currentView === 'front' ? bodyFront : bodyBack;
    const viewBox = currentView === 'front' ? "100 100 550 1250" : "750 100 650 1250";

    return (
      <div className="relative w-full max-w-[320px] sm:max-w-[400px] h-[450px] sm:h-[550px] lg:h-[650px] glass-card rounded-[40px] sm:rounded-[60px] p-4 sm:p-8 flex items-center justify-center overflow-hidden shadow-2xl border border-white/5 group">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 to-transparent pointer-events-none" />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 whitespace-nowrap z-10">
          {currentView === 'front' ? t.ui.anterior : t.ui.posterior}
        </div>
        
        <svg 
          viewBox={viewBox} 
          className="w-full h-full drop-shadow-[0_0_40px_rgba(59,130,246,0.15)] relative z-0 transition-all duration-500"
        >
          <defs>
            <filter id="muscleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <motion.g
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {currentBody.map((muscle) => {
              const state = muscleStates[muscle.slug];
              const isSelected = selectedMuscles.includes(muscle.slug);
              
              return (
                <g key={muscle.slug} onClick={() => handleMuscleClick(muscle.slug)} className="cursor-pointer group/muscle">
                  {muscle.path.map((p, i) => (
                    <motion.path
                      key={`${muscle.slug}-${i}`}
                      d={p}
                      initial={false}
                      animate={{ 
                        fill: isSelected 
                          ? 'rgba(59, 130, 246, 0.7)' 
                          : state 
                            ? `${state.color}50` 
                            : 'rgba(255, 255, 255, 0.08)',
                        stroke: isSelected 
                          ? '#3b82f6' 
                          : state 
                            ? state.color 
                            : 'rgba(255, 255, 255, 0.25)',
                        strokeWidth: isSelected ? 2.5 : 1.5
                      }}
                      whileHover={{ 
                        fill: state ? `${state.color}60` : 'rgba(59, 130, 246, 0.3)', 
                        stroke: state ? state.color : 'rgba(59, 130, 246, 0.6)',
                        strokeWidth: 2
                      }}
                      transition={{ duration: 0.3 }}
                      filter={isSelected ? 'url(#muscleGlow)' : 'none'}
                    />
                  ))}
                </g>
              );
            })}
          </motion.g>
        </svg>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-6xl mx-auto p-0 sm:p-4 min-w-0">
      {!sideBySide && (
        <div className="flex gap-2 p-1.5 glass-md rounded-2xl border border-white/5 shadow-2xl w-full max-w-xs sm:w-auto">
          <button 
            onClick={() => setView('front')}
            className={`flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all duration-300 ${view === 'front' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
          >
            {t.ui.anterior}
          </button>
          <button 
            onClick={() => setView('back')}
            className={`flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all duration-300 ${view === 'back' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
          >
            {t.ui.posterior}
          </button>
        </div>
      )}

      <div className="w-full">
        {sideBySide ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center">
            <div className="flex justify-center">{renderBody('front')}</div>
            <div className="flex justify-center">{renderBody('back')}</div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-8 lg:gap-12 w-full min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                className="w-full flex justify-center"
              >
                {renderBody(view)}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {!hideLabels && (
        <div className="w-full max-w-4xl mt-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(sideBySide ? [...bodyFront, ...bodyBack] : (view === 'front' ? bodyFront : bodyBack)).map((muscle, idx, self) => {
              if (self.findIndex(m => m.slug === muscle.slug) !== idx) return null;
              return (
                <div 
                  key={muscle.slug}
                  className={`transition-all duration-300 cursor-pointer p-3 rounded-xl border text-center text-[10px] font-black uppercase tracking-widest ${selectedMuscles.includes(muscle.slug) ? 'text-brand-primary border-brand-primary bg-brand-primary/10 shadow-lg' : 'text-text-secondary border-white/5 bg-white/5 hover:text-white hover:bg-white/10'}`}
                  onClick={() => handleMuscleClick(muscle.slug)}
                >
                  {t.muscles[muscle.slug as keyof typeof t.muscles] || muscle.slug}
                </div>
              );
            })}
            <div 
              onClick={() => handleMuscleClick('cardio')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-300 border ${selectedMuscles.includes('cardio') ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-text-secondary hover:text-white hover:bg-white/10'}`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center ${selectedMuscles.includes('cardio') ? 'bg-red-500 text-white' : 'bg-white/10'}`}>
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest truncate">{t.muscles.cardio}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MuscleMap;
