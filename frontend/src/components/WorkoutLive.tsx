import React, { useState, useEffect, useCallback } from 'react';
import { Square, CheckCircle, Timer, Dumbbell, ChevronRight, ChevronLeft, Zap, Layers, Clock, SkipForward, Pause, Play as PlayIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { languages } from '../languages';
import ExerciseIcon from './ExerciseIcon';
import { exercises as exercisesDict } from '../data/exercises';
import { stretches as stretchesDict } from '../data/stretches';

interface WorkoutLiveProps {
  routine: any;
  onComplete: (data: any) => void;
  language?: 'en' | 'es';
}

// Flatten routine blocks into a linear list of "Set-Steps"
function flattenBlocks(blocks: any[]) {
  const flat: any[] = [];
  blocks.forEach((block, blockIndex) => {
    const sets = block.sets || 3;
    
    if (block.type === 'superset' && block.exercises?.length) {
      for (let s = 1; s <= sets; s++) {
        block.exercises.forEach((ex: any, exIndex: number) => {
          const isLastInSet = exIndex === block.exercises.length - 1;
          flat.push({
            exercise_id: ex.exercise_id || ex.exerciseId,
            currentSet: s,
            totalSets: sets,
            plannedReps: ex.reps || 10,
            plannedWeight: ex.weight || 0,
            is_time_based: ex.is_time_based || ex.isCardio || !!ex.hold_duration_seconds,
            plannedTime: ex.time_seconds || 0,
            restSeconds: isLastInSet ? (block.rest_seconds || 120) : 10,
            blockIndex,
            supersetLabel: `Superset ${blockIndex + 1}`,
            supersetSize: block.exercises.length,
            supersetPosition: exIndex + 1,
            isTransitionRest: !isLastInSet
          });
        });
      }
    } else {
      for (let s = 1; s <= sets; s++) {
        flat.push({
          exercise_id: block.exercise_id || block.exerciseId,
          currentSet: s,
          totalSets: sets,
          plannedReps: block.reps || 10,
          plannedWeight: block.weight || 0,
          is_time_based: block.is_time_based || block.isCardio || !!block.hold_duration_seconds,
          plannedTime: block.time_seconds || 0,
          restSeconds: s === sets ? 30 : (block.rest_seconds || 90),
          blockIndex,
          supersetLabel: null,
          supersetSize: 0,
          supersetPosition: 0,
          isTransitionRest: false
        });
      }
    }
  });
  return flat;
}

const WorkoutLive: React.FC<WorkoutLiveProps> = ({ routine, onComplete, language = 'es' }) => {
  const [seconds, setSeconds] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [currentReps, setCurrentReps] = useState(10);
  const [completedSets, setCompletedSets] = useState<any[]>([]);
  const [isResting, setIsResting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [restCountdown, setRestCountdown] = useState(0);
  
  // Track time per step
  const [stepStartTime, setStepStartTime] = useState(0);
  // Prevent double registration of same step
  const [registeredStepIndices, setRegisteredStepIndices] = useState<Set<number>>(new Set());

  // Countdown timer for time-based exercises
  const [timerSeconds, setTimerSeconds] = useState(0);

  const t = languages[language].ui;
  const rt = languages[language].routines;

  const flatSteps = React.useMemo(() => flattenBlocks(routine.blocks || []), [routine.blocks]);
  const activeStep = flatSteps[activeStepIndex];

  const exerciseData = activeStep
    ? (Object.values(exercisesDict).find((ex: any) => ex.name === activeStep.exercise_id) || 
       Object.values(stretchesDict).find((st: any) => st.name === activeStep.exercise_id))
    : null;

  useEffect(() => {
    if (activeStep) {
      setCurrentWeight(activeStep.plannedWeight);
      setCurrentReps(activeStep.is_time_based ? activeStep.plannedTime : activeStep.plannedReps);
      setStepStartTime(seconds); // Reset step timer
      
      if (activeStep.is_time_based) {
        setTimerSeconds(activeStep.plannedTime);
        setIsPaused(true);
      }
    }
  }, [activeStepIndex, activeStep]);

  useEffect(() => {
    if (isPaused || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(s => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, timerSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (!isResting || restCountdown <= 0) return;
    const interval = setInterval(() => {
      setRestCountdown(prev => {
        if (isPaused) return prev;
        if (prev <= 1) {
          setIsResting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isResting, restCountdown, isPaused]);

  const [showFinishModal, setShowFinishModal] = useState(false);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteSet = useCallback(() => {
    if (!activeStep || registeredStepIndices.has(activeStepIndex)) return;

    const stepDuration = seconds - stepStartTime;
    const newSet = {
      exercise_id: activeStep.exercise_id,
      set_number: activeStep.currentSet,
      reps: currentReps,
      weight: currentWeight,
      time: stepDuration, // Record ACTUAL time for this set
      stepIndex: activeStepIndex
    };
    
    setCompletedSets(prev => [...prev, newSet]);
    setRegisteredStepIndices(prev => new Set(prev).add(activeStepIndex));

    if (activeStepIndex < flatSteps.length - 1) {
      setRestCountdown(activeStep.restSeconds);
      setIsResting(true);
      setActiveStepIndex(prev => prev + 1);
    } else {
      setShowFinishModal(true);
    }
  }, [activeStep, currentReps, currentWeight, seconds, stepStartTime, activeStepIndex, flatSteps.length, registeredStepIndices]);

  const handleSkipRest = () => {
    setIsResting(false);
    setRestCountdown(0);
  };

  const handleFinish = useCallback(() => {
    const exerciseMap = new Map<string, any>();
    completedSets.forEach(set => {
      if (!exerciseMap.has(set.exercise_id)) {
        exerciseMap.set(set.exercise_id, {
          exercise_id: set.exercise_id,
          sets_completed: 0,
          reps: [],
          weight: set.weight,
          active_times: [],
          rest_time: 0,
          is_time_based: Object.values(flatSteps).find(fs => fs.exercise_id === set.exercise_id)?.is_time_based || false
        });
      }
      const entry = exerciseMap.get(set.exercise_id)!;
      entry.sets_completed += 1;
      entry.reps.push(set.reps);
      entry.weight = Math.max(entry.weight, set.weight);
      entry.active_times.push(set.time); // Store time for each individual set
    });

    onComplete({
      duration_seconds: seconds,
      completed_exercises: Array.from(exerciseMap.values()),
      routine_id: routine.id || routine._id,
      routine_name: routine.name || routine.routine_name,
      total_volume: 0, 
      difficulty_score: 0, 
      started_at: new Date(Date.now() - seconds * 1000).toISOString(),
    });
  }, [completedSets, seconds, routine, onComplete, flatSteps]);

  const totalPlannedSteps = flatSteps.length;
  const totalCompletedSteps = completedSets.length;
  const progress = totalPlannedSteps > 0 ? (totalCompletedSteps / totalPlannedSteps) * 100 : 0;

  if (!activeStep) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <Dumbbell size={64} className="mx-auto mb-6 text-white/10" />
        <p className="text-text-secondary font-bold text-xl">
          {language === 'es' ? 'Esta rutina no tiene ejercicios configurados.' : 'This routine has no exercises configured.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 pb-32">
      <AnimatePresence>
        {showFinishModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
              onClick={() => setShowFinishModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative glass-card p-8 sm:p-12 rounded-[40px] border border-white/10 max-w-lg w-full text-center"
            >
              <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-brand-primary border border-brand-primary/20">
                <Square size={40} fill="currentColor" />
              </div>
              <h3 className="text-3xl font-black heading-premium mb-4">{t.terminate}</h3>
              <p className="text-text-secondary font-medium mb-10 leading-relaxed">
                {t.confirmDiscard}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleFinish}
                  className="bg-brand-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  {t.saveSession}
                </button>
                <button
                  onClick={() => onComplete(null)}
                  className="bg-white/5 text-red-400 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-red-500/10 hover:bg-red-500/10 transition-all"
                >
                  {t.discardSession}
                </button>
              </div>
              <button 
                onClick={() => setShowFinishModal(false)}
                className="mt-6 text-text-secondary text-xs font-bold hover:text-white transition-colors"
              >
                {t.cancel}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="glass-card p-5 sm:p-8 rounded-3xl lg:rounded-[40px] border-white/5 relative overflow-hidden min-w-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 md:gap-8">
          <div className="min-w-0 w-full">
            <h2 className="text-2xl sm:text-3xl font-black heading-premium tracking-tight mb-2 break-words">{routine.name || routine.routine_name}</h2>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-text-secondary">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-xl border border-white/5">
                <Timer size={16} className="text-brand-primary" />
                <span className="font-black text-xl text-white tracking-normal">{formatTime(seconds)}</span>
                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className={`ml-2 p-1 rounded-lg transition-colors ${isPaused ? 'bg-brand-primary text-white' : 'hover:bg-white/10'}`}
                >
                  {isPaused ? <PlayIcon size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                </button>
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] opacity-50">
                {totalCompletedSteps}/{totalPlannedSteps} {language === 'es' ? 'series' : 'sets'} • {activeStep.currentSet}/{activeStep.totalSets} {rt.sets}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
            <div className="flex glass-sm rounded-2xl p-1.5 border border-white/5">
              <button
                disabled={activeStepIndex === 0}
                onClick={() => setActiveStepIndex(i => i - 1)}
                className="p-3 hover:bg-white/10 rounded-xl disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                disabled={activeStepIndex === totalPlannedSteps - 1}
                onClick={() => setActiveStepIndex(i => i + 1)}
                className="p-3 hover:bg-white/10 rounded-xl disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
            <button
              onClick={() => setShowFinishModal(true)}
              className="group relative bg-red-500 hover:bg-red-600 text-white px-6 sm:px-8 py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-500/20 active:scale-95"
            >
              <Square size={20} fill="white" /> {t.terminate}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isResting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-8 sm:p-12 rounded-3xl lg:rounded-[56px] border border-brand-secondary/20 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-brand-secondary/5" />
            <div className="relative z-10">
              <Clock size={48} className="mx-auto mb-4 text-brand-secondary" />
              <p className="text-xs font-black text-brand-secondary uppercase tracking-[0.3em] mb-4">
                {activeStep.isTransitionRest ? (language === 'es' ? 'PREPARACIÓN' : 'PREPARATION') : rt.restPeriod}
              </p>
              <p className="text-7xl sm:text-8xl font-black heading-premium text-white mb-8">{formatTime(restCountdown)}</p>
              <button
                onClick={handleSkipRest}
                className="px-8 py-3 glass-sm rounded-2xl font-black text-sm flex items-center gap-2 mx-auto hover:bg-white/10 transition-all border border-white/10"
              >
                <SkipForward size={18} /> {language === 'es' ? 'Saltar descanso' : 'Skip rest'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isResting && (
        <div className="glass-card p-5 sm:p-8 md:p-14 rounded-3xl lg:rounded-[56px] relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Dumbbell size={200} />
          </div>

          <div className="relative z-10">
            <motion.div
              key={activeStepIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {activeStep.supersetLabel && (
                <div className="flex items-center gap-2 px-4 py-2 bg-brand-secondary/10 rounded-2xl border border-brand-secondary/20 w-fit">
                  <Layers size={16} className="text-brand-secondary" />
                  <span className="text-xs font-black text-brand-secondary uppercase tracking-widest">
                    {activeStep.supersetLabel} — {activeStep.supersetPosition}/{activeStep.supersetSize}
                  </span>
                </div>
              )}

              <div className="flex items-start gap-5">
                {(exerciseData as any) && (
                  <ExerciseIcon name={activeStep.exercise_id} mediaGif={(exerciseData as any)?.media?.gif} className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl" />
                )}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-brand-primary/10 p-2 rounded-lg">
                      <Zap size={18} className="text-brand-primary" />
                    </div>
                    <p className="text-sm font-black text-brand-primary uppercase tracking-[0.3em]">{t.objective}</p>
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black heading-premium tracking-normal break-words">{activeStep.exercise_id}</h3>
                  <p className="text-text-secondary font-bold text-sm mt-2">
                    {rt.sets}: {activeStep.currentSet}/{activeStep.totalSets}
                    {!activeStep.is_time_based && <> • {rt.reps}: {activeStep.plannedReps} • {rt.weight}: {activeStep.plannedWeight}kg</>}
                    {activeStep.is_time_based && <> • {rt.time}: {Math.floor((activeStep.plannedTime || 0) / 60)}m {(activeStep.plannedTime || 0) % 60}s</>}
                  </p>
                </div>
              </div>

              {!activeStep.is_time_based ? (
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
              ) : (
                <div className="space-y-8">
                  <div className="text-center space-y-4">
                    <p className="text-xs font-black text-brand-primary uppercase tracking-[0.3em]">{language === 'es' ? 'CONTEO REGRESIVO' : 'COUNTDOWN'}</p>
                    <div className="text-8xl sm:text-9xl font-black heading-premium tabular-nums">
                      {formatTime(timerSeconds)}
                    </div>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => setIsPaused(!isPaused)}
                        className={`px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition-all shadow-xl ${!isPaused ? 'bg-white/5 text-text-secondary border border-white/10' : 'bg-brand-primary text-white shadow-brand-primary/20 hover:scale-105'}`}
                      >
                        {!isPaused ? <Pause size={20} fill="currentColor" /> : <PlayIcon size={20} fill="currentColor" />}
                        {!isPaused ? (language === 'es' ? 'PAUSAR' : 'PAUSE') : (language === 'es' ? 'INICIAR' : 'START')}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] ml-1">{language === 'es' ? 'TIEMPO REAL LOGRADO' : 'ACTUAL TIME ACHIEVED'}</label>
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                      <div className="relative">
                        <input
                          type="number"
                          value={Math.floor(currentReps / 60)}
                          onChange={(e) => {
                            const mins = parseInt(e.target.value) || 0;
                            const secs = currentReps % 60;
                            setCurrentReps(mins * 60 + secs);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-3xl lg:rounded-[32px] py-5 sm:py-8 text-center text-4xl sm:text-5xl font-black focus:border-brand-primary focus:bg-white/[0.08] transition-all outline-none heading-premium tracking-normal shadow-inner"
                        />
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-20 font-black text-[10px]">MIN</div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={currentReps % 60}
                          onChange={(e) => {
                            const mins = Math.floor(currentReps / 60);
                            const secs = parseInt(e.target.value) || 0;
                            setCurrentReps(mins * 60 + secs);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-3xl lg:rounded-[32px] py-5 sm:py-8 text-center text-4xl sm:text-5xl font-black focus:border-brand-primary focus:bg-white/[0.08] transition-all outline-none heading-premium tracking-normal shadow-inner"
                        />
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-20 font-black text-[10px]">SEC</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCompleteSet}
                disabled={registeredStepIndices.has(activeStepIndex)}
                className={`w-full py-5 sm:py-6 rounded-3xl lg:rounded-[32px] font-black text-base sm:text-xl transition-all flex items-center justify-center gap-3 sm:gap-4 group ${registeredStepIndices.has(activeStepIndex) ? 'bg-white/5 text-text-secondary border border-white/10 opacity-50 cursor-not-allowed' : 'bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/30 text-brand-primary'}`}
              >
                <CheckCircle size={28} className="group-hover:scale-110 transition-transform" />
                {registeredStepIndices.has(activeStepIndex) ? (language === 'es' ? 'REGISTRADO' : 'REGISTERED') : `${t.register} — ${language === 'es' ? 'Serie' : 'Set'} ${activeStep.currentSet}/${activeStep.totalSets}`}
              </motion.button>
            </motion.div>
          </div>
        </div>
      )}

      <div className="glass-card p-5 sm:p-8 rounded-3xl lg:rounded-[40px] border-white/5">
        <h4 className="font-black text-text-secondary uppercase tracking-[0.2em] text-sm mb-6 flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary" />
          {language === 'es' ? 'Protocolo de Entrenamiento' : 'Training Protocol'}
        </h4>
        <div className="space-y-3">
          {flatSteps.map((step, i) => {
            const isDone = registeredStepIndices.has(i);
            const isCurrent = i === activeStepIndex;
            return (
              <div
                key={i}
                onClick={() => { if (!isResting) setActiveStepIndex(i); }}
                className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl transition-all cursor-pointer ${
                  isCurrent ? 'bg-brand-primary/10 border border-brand-primary/30' :
                  isDone ? 'bg-brand-secondary/5 border border-brand-secondary/10 opacity-60' :
                  'bg-white/[0.02] border border-white/5 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                    isDone ? 'bg-brand-secondary/20 text-brand-secondary' :
                    isCurrent ? 'bg-brand-primary/20 text-brand-primary' :
                    'bg-white/5 text-text-secondary'
                  }`}>
                    {isDone ? <CheckCircle size={16} /> : i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold text-sm truncate ${isCurrent ? 'text-white' : 'text-text-secondary'}`}>
                      {step.exercise_id}
                      <span className="ml-2 text-[10px] opacity-40 font-black">SET {step.currentSet}</span>
                    </p>
                    {step.supersetLabel && (
                      <span className="text-[10px] text-brand-secondary font-bold uppercase tracking-tighter">{step.supersetLabel}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isCurrent ? 'text-brand-primary' : 'text-white/20'}`}>
                    {step.is_time_based ? `${Math.floor((step.plannedTime || 0) / 60)}m ${(step.plannedTime || 0) % 60}s` : `${step.plannedWeight}kg × ${step.plannedReps}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {completedSets.length > 0 && (
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
                  key={`${set.exercise_id}-${set.set_number}-${set.stepIndex}-${i}`}
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
                      <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Set {set.set_number} • {formatTime(set.time)}</p>
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
                      <span className="text-xs font-bold text-text-secondary ml-1">
                        {(Object.values(exercisesDict).find((e: any) => e.name === set.exercise_id) as any)?.is_time_based || (Object.values(stretchesDict).find((e: any) => e.name === set.exercise_id) as any)?.hold_duration_seconds ? 'SEC' : 'REPS'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutLive;
