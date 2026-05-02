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
}

const MuscleMap: React.FC<MuscleMapProps> = ({ 
  onSelectMuscle, 
  selectedMuscles = [], 
  muscleStates = {},
  language = 'es' 
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');
  const t = languages[language];

  const currentBody = view === 'front' ? bodyFront : bodyBack;
  const viewBox = view === 'front' ? "100 100 550 1250" : "750 100 650 1250";

  const handleMuscleClick = (slug: string) => {
    onSelectMuscle?.(slug);
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-4xl mx-auto p-0 sm:p-4 min-w-0">
      {/* View Toggle */}
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

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-5 md:gap-12 items-center w-full min-w-0">
        {/* Left Side Labels */}
        <div className="hidden md:flex flex-col gap-4 text-right">
          {currentBody.slice(0, Math.ceil(currentBody.length / 2)).map((muscle) => (
            <div 
              key={muscle.slug}
              className={`transition-all duration-300 cursor-pointer p-2 rounded-lg ${selectedMuscles.includes(muscle.slug) ? 'text-brand-primary font-bold bg-brand-primary/5' : 'text-text-secondary hover:text-white'}`}
              onClick={() => handleMuscleClick(muscle.slug)}
            >
              {t.muscles[muscle.slug as keyof typeof t.muscles] || muscle.slug}
            </div>
          ))}
        </div>

        {/* Anatomical Map */}
        <div className="relative w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[400px] aspect-[2/3] glass-card rounded-3xl sm:rounded-[48px] lg:rounded-[60px] p-4 sm:p-6 lg:p-8 flex items-center justify-center overflow-hidden shadow-2xl border border-white/5 group mx-auto">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />
          
          <svg 
            viewBox={viewBox} 
            className="w-full h-full drop-shadow-[0_0_30px_rgba(59,130,246,0.1)] relative z-0 transition-all duration-500"
          >
            <defs>
              <filter id="muscleGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <AnimatePresence mode="wait">
              <motion.g
                key={view}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
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
                              ? 'rgba(59, 130, 246, 0.6)' 
                              : state 
                                ? `${state.color}40` // 40 is alpha in hex (approx 25%)
                                : 'rgba(255, 255, 255, 0.05)',
                            stroke: isSelected 
                              ? '#3b82f6' 
                              : state 
                                ? state.color 
                                : 'rgba(255, 255, 255, 0.15)',
                            strokeWidth: isSelected ? 2 : 1
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
            </AnimatePresence>
          </svg>
        </div>

        {/* Right Side Labels & Cardio */}
        <div className="flex flex-col gap-4">
          <div className="hidden md:flex flex-col gap-4 text-left">
            {currentBody.slice(Math.ceil(currentBody.length / 2)).map((muscle) => (
              <div 
                key={muscle.slug}
                className={`transition-all duration-300 cursor-pointer p-2 rounded-lg ${selectedMuscles.includes(muscle.slug) ? 'text-brand-primary font-bold bg-brand-primary/5' : 'text-text-secondary hover:text-white'}`}
                onClick={() => handleMuscleClick(muscle.slug)}
              >
                {t.muscles[muscle.slug as keyof typeof t.muscles] || muscle.slug}
              </div>
            ))}
          </div>

          {/* Cardio Section */}
          <div className="mt-4 md:mt-8 pt-4 md:pt-8 border-t border-white/5">
            <div 
              onClick={() => handleMuscleClick('cardio')}
              className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${selectedMuscles.includes('cardio') ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-text-secondary hover:text-white hover:bg-white/10'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedMuscles.includes('cardio') ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white/10'}`}>
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <div>
                <div className="font-black uppercase tracking-normal text-lg">{t.muscles.cardio}</div>
                <div className="text-[10px] opacity-60 font-medium">Endurance & Heart Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile labels */}
      <div className="flex md:hidden flex-wrap justify-center gap-2 mt-2">
        {currentBody.map(muscle => (
          <span 
            key={muscle.slug}
            onClick={() => handleMuscleClick(muscle.slug)}
            className={`px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-all ${selectedMuscles.includes(muscle.slug) ? 'bg-brand-primary text-white shadow-lg' : 'bg-white/5 text-text-secondary'}`}
          >
            {t.muscles[muscle.slug as keyof typeof t.muscles] || muscle.slug}
          </span>
        ))}
      </div>
    </div>
  );
};

export default MuscleMap;
