import React from 'react';
import { X, Dumbbell, Activity, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import ExerciseIcon from './ExerciseIcon';

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  muscle: string;
  equipment: string;
  difficulty: string;
  instructions?: string[];
  mediaGif?: string | null;
  language: 'en' | 'es';
}

const ExerciseModal: React.FC<ExerciseModalProps> = ({
  isOpen,
  onClose,
  name,
  muscle,
  equipment,
  difficulty,
  instructions,
  mediaGif,
  language
}) => {
  const t = {
    en: {
      equipment: "Equipment",
      muscles: "Target Muscles",
      instructions: "Instructions",
      difficulty: "Difficulty"
    },
    es: {
      equipment: "Equipo",
      muscles: "Músculos",
      instructions: "Instrucciones",
      difficulty: "Dificultad"
    }
  }[language];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg-dark/80 backdrop-blur-xl pointer-events-auto"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-bg-dark border border-white/10 rounded-[32px] sm:rounded-[48px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 flex justify-between items-center border-b border-white/5">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black heading-premium tracking-tight">{name}</h3>
                <p className="text-text-secondary font-bold text-sm uppercase tracking-widest mt-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  {muscle}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 rounded-2xl bg-white/5 text-text-secondary hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Media Section */}
                <div className="space-y-6">
                  <div className="aspect-square rounded-[32px] overflow-hidden border border-white/5 bg-white/5 relative group">
                    <ExerciseIcon 
                      name={name} 
                      mediaGif={mediaGif} 
                      className="w-full h-full scale-100 group-hover:scale-110 transition-transform duration-1000" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/20 to-transparent pointer-events-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Dumbbell size={14} className="text-brand-primary" />
                        {t.equipment}
                      </p>
                      <p className="text-sm font-bold text-white break-words">{equipment}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Activity size={14} className="text-brand-secondary" />
                        {t.difficulty}
                      </p>
                      <p className="text-sm font-bold text-white uppercase tracking-wider">{difficulty}</p>
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="space-y-8">
                  <div>
                    <h4 className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Info size={16} className="text-brand-accent" />
                      {t.instructions}
                    </h4>
                    <div className="space-y-4">
                      {instructions?.map((step, i) => (
                        <div key={i} className="flex gap-4 group">
                          <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform">
                            {i + 1}
                          </span>
                          <p className="text-text-secondary font-medium text-sm leading-relaxed pt-1.5">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ExerciseModal;
