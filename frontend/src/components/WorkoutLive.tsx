import React, { useState, useEffect } from 'react';
import { Square, CheckCircle, Timer, Dumbbell, ChevronRight, ChevronLeft, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { languages } from '../languages';

interface WorkoutLiveProps {
  routine: any;
  onComplete: (data: any) => void;
  language?: 'en' | 'es';
}

const WorkoutLive: React.FC<WorkoutLiveProps> = ({ routine, onComplete, language = 'es' }) => {
  const [seconds, setSeconds] = useState(0);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<any[]>([]);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [currentReps, setCurrentReps] = useState(10);
  const t = languages[language].ui;

  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activeExercise = routine.blocks[activeExerciseIndex];

  const handleCompleteSet = () => {
    const newSet = {
      exercise_id: activeExercise.exerciseId,
      reps: currentReps,
      weight: currentWeight,
      time: seconds
    };
    setCompletedSets([...completedSets, newSet]);
  };

  const handleFinish = () => {
    onComplete({
      duration_seconds: seconds,
      completed_exercises: completedSets,
      routine_id: routine.id
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-10">
      <header className="glass-card p-5 sm:p-8 rounded-3xl lg:rounded-[40px] border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-6 md:gap-8 relative overflow-hidden min-w-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-brand-secondary opacity-50" />
        
        <div className="min-w-0 w-full">
          <h2 className="text-2xl sm:text-3xl font-black heading-premium tracking-tight mb-2 break-words">{routine.name}</h2>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-text-secondary">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-xl border border-white/5">
              <Timer size={16} className="text-brand-primary" />
              <span className="font-black text-xl text-white tracking-normal">{formatTime(seconds)}</span>
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] opacity-50">{t.activeSession}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
          <div className="flex glass-sm rounded-2xl p-1.5 border border-white/5">
            <button 
              disabled={activeExerciseIndex === 0}
              onClick={() => setActiveExerciseIndex(i => i - 1)}
              className="p-3 hover:bg-white/10 rounded-xl disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              disabled={activeExerciseIndex === routine.blocks.length - 1}
              onClick={() => setActiveExerciseIndex(i => i + 1)}
              className="p-3 hover:bg-white/10 rounded-xl disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          <button 
            onClick={handleFinish}
            className="group relative bg-red-500 hover:bg-red-600 text-white px-6 sm:px-8 py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-500/20 active:scale-95"
          >
            <Square size={20} fill="white" /> {t.terminate}
          </button>
        </div>
      </header>

      <div className="glass-card p-5 sm:p-8 md:p-14 rounded-3xl lg:rounded-[56px] relative overflow-hidden min-w-0">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Dumbbell size={200} />
        </div>
        
        <div className="relative z-10">
          <motion.div 
            key={activeExerciseIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-10"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-brand-primary/10 p-2 rounded-lg">
                  <Zap size={18} className="text-brand-primary" />
                </div>
                <p className="text-sm font-black text-brand-primary uppercase tracking-[0.3em]">{t.objective}</p>
              </div>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black heading-premium tracking-normal mb-4 break-words">{activeExercise.exerciseId}</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
              <div className="space-y-4">
                <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] ml-1">{t.payload} (kg)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={currentWeight} 
                    onChange={(e) => setCurrentWeight(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-3xl lg:rounded-[32px] py-5 sm:py-8 text-center text-4xl sm:text-5xl font-black focus:border-brand-primary focus:bg-white/[0.08] transition-all outline-none heading-premium tracking-normal shadow-inner"
                  />
                  <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none opacity-20 font-black text-xl">KG</div>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] ml-1">{t.repetitions}</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={currentReps} 
                    onChange={(e) => setCurrentReps(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-3xl lg:rounded-[32px] py-5 sm:py-8 text-center text-4xl sm:text-5xl font-black focus:border-brand-primary focus:bg-white/[0.08] transition-all outline-none heading-premium tracking-normal shadow-inner"
                  />
                  <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none opacity-20 font-black text-xl">REPS</div>
                </div>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCompleteSet}
              className="w-full bg-white/5 hover:bg-white/10 py-5 sm:py-6 rounded-3xl lg:rounded-[32px] font-black text-base sm:text-xl border border-white/10 transition-all flex items-center justify-center gap-3 sm:gap-4 group"
            >
              <CheckCircle size={28} className="text-brand-secondary group-hover:scale-110 transition-transform" /> 
              {t.register}
            </motion.button>
          </motion.div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 px-1 sm:px-4">
          <h4 className="font-black text-text-secondary uppercase tracking-[0.2em] text-sm flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary" /> 
            {t.sessionHistory} ({completedSets.length})
          </h4>
          <span className="text-xs font-bold text-white/20 tracking-normal">{t.telemetry}</span>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence initial={false}>
            {[...completedSets].reverse().map((set, i) => (
              <motion.div 
                key={completedSets.length - i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-sm p-4 sm:p-6 rounded-3xl border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 group hover:bg-white/[0.03] transition-colors min-w-0"
              >
                <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-brand-primary border border-white/5">
                    {completedSets.length - i}
                  </div>
                  <div>
                    <p className="font-black heading-premium text-base sm:text-lg break-words">{set.exercise_id}</p>
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">{formatTime(set.time)} {t.formatTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-2xl font-black heading-premium tracking-normal">{set.weight}</span>
                    <span className="text-xs font-bold text-text-secondary ml-1">KG</span>
                  </div>
                  <div className="h-8 w-[1px] bg-white/10 mx-2" />
                  <div className="text-right">
                    <span className="text-2xl font-black heading-premium tracking-normal">{set.reps}</span>
                    <span className="text-xs font-bold text-text-secondary ml-1">REPS</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default WorkoutLive;
