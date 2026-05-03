import React, { useState } from 'react';
import { Plus, Play, Edit2, Trash2, Dumbbell, Save, X, Search, Layers, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoutines, createRoutine, deleteRoutine, updateRoutine } from '../api/client';
import { languages } from '../languages';
import MuscleMap from './MuscleMap';
import ExerciseIcon from './ExerciseIcon';
import { useSyncStore } from '../store/syncStore';
import { exercises as exercisesDict } from '../data/exercises';

interface RoutineManagerProps {
  userId: string;
  language: 'en' | 'es';
  onStartRoutine: (routine: any) => void;
}

const RoutineManager: React.FC<RoutineManagerProps> = ({ userId, language, onStartRoutine }) => {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingRoutine, setEditingRoutine] = useState<any>(null);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [activeSupersetIndex, setActiveSupersetIndex] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const t = languages[language].routines;
  const eqT = (languages[language] as any).equipment;
  const ui = languages[language].ui;

  const { data: routines } = useQuery({
    queryKey: ['routines', userId],
    queryFn: () => getRoutines(userId)
  });

  const backendMuscleName = selectedMuscles.length > 0 
    ? languages['en'].muscles[selectedMuscles[0] as keyof typeof languages['en']['muscles']]
    : undefined;

  const availableExercises = Object.values(exercisesDict).filter((ex: any) => {
    const muscleMatch = !backendMuscleName || ex.primary_muscles.includes(backendMuscleName);
    const equipmentMatch = selectedEquipment.length === 0 || ex.equipment.some((eq: string) => selectedEquipment.includes(eq));
    return muscleMatch && equipmentMatch;
  });

  const createMutation = useMutation({
    mutationFn: createRoutine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      setView('list');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (routine: any) => updateRoutine(routine.id || routine._id, routine),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      setView('list');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRoutine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] })
  });

  const handleCreateNew = () => {
    setEditingRoutine({
      user_id: userId,
      name: '',
      difficulty: 3,
      blocks: []
    });
    setSelectedMuscles([]);
    setSelectedEquipment([]);
    setView('editor');
    setActiveSupersetIndex(null);
  };

  const handleEdit = (routine: any) => {
    setEditingRoutine(routine);
    setSelectedMuscles([]);
    setSelectedEquipment([]);
    setView('editor');
    setActiveSupersetIndex(null);
  };

  const addSuperset = () => {
    const newBlocks = [...editingRoutine.blocks, {
      type: 'superset',
      exercises: [],
      sets: 3,
      rest_seconds: 120
    }];
    setEditingRoutine({ ...editingRoutine, blocks: newBlocks });
    setActiveSupersetIndex(newBlocks.length - 1);
  };

  const addExerciseToRoutine = (exercise: any) => {
    const isCardio = exercise.tags?.includes('cardio') || exercise.primary_muscles?.includes('Cardio');
    
    if (activeSupersetIndex !== null) {
      const newBlocks = [...editingRoutine.blocks];
      const superset = { ...newBlocks[activeSupersetIndex] };
      superset.exercises = [...superset.exercises, {
        exercise_id: exercise.name,
        reps: 10,
        weight: 0,
        isCardio
      }];
      newBlocks[activeSupersetIndex] = superset;
      setEditingRoutine({ ...editingRoutine, blocks: newBlocks });
    } else {
      setEditingRoutine({
        ...editingRoutine,
        blocks: [...editingRoutine.blocks, {
          type: 'exercise',
          exercise_id: exercise.name,
          sets: 3,
          reps: 10,
          weight: 0,
          time_minutes: isCardio ? 30 : 0,
          rest_seconds: 90,
          isCardio
        }]
      });
    }
  };

  const updateBlock = (index: number, field: string, value: any) => {
    const newBlocks = [...editingRoutine.blocks];
    newBlocks[index] = { ...newBlocks[index], [field]: value };
    setEditingRoutine({ ...editingRoutine, blocks: newBlocks });
  };

  const updateSupersetExercise = (blockIndex: number, exIndex: number, field: string, value: any) => {
    const newBlocks = [...editingRoutine.blocks];
    const superset = { ...newBlocks[blockIndex] };
    const newExs = [...superset.exercises];
    newExs[exIndex] = { ...newExs[exIndex], [field]: value };
    superset.exercises = newExs;
    newBlocks[blockIndex] = superset;
    setEditingRoutine({ ...editingRoutine, blocks: newBlocks });
  };

  const removeBlock = (index: number) => {
    const newBlocks = [...editingRoutine.blocks];
    newBlocks.splice(index, 1);
    setEditingRoutine({ ...editingRoutine, blocks: newBlocks });
    if (activeSupersetIndex === index) setActiveSupersetIndex(null);
  };

  const { isOffline, addPendingAction } = useSyncStore();

  const handleSave = () => {
    const routineId = editingRoutine.id || editingRoutine._id;
    
    if (isOffline) {
      const tempId = routineId || `temp-${Date.now()}`;
      const actionData = { ...editingRoutine, id: tempId };
      
      addPendingAction({
        id: `action-${Date.now()}`,
        type: 'CREATE_ROUTINE',
        data: actionData
      });

      // Optimistic update
      queryClient.setQueryData(['routines', userId], (old: any) => {
        if (!old) return [actionData];
        if (routineId) {
          return old.map((r: any) => (r.id === routineId || r._id === routineId) ? actionData : r);
        }
        return [...old, actionData];
      });

      setView('list');
      return;
    }

    if (routineId) {
      updateMutation.mutate(editingRoutine);
    } else {
      createMutation.mutate(editingRoutine);
    }
  };

  if (view === 'editor') {
    return (
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-32">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="text-3xl sm:text-4xl font-black heading-premium tracking-normal break-words">{t.editorTitle}</h2>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <button 
              onClick={addSuperset}
              className="px-4 sm:px-6 py-3 glass-sm rounded-2xl flex items-center gap-2 hover:bg-brand-secondary/20 transition-all font-bold text-xs sm:text-sm text-brand-secondary border border-brand-secondary/20"
            >
              <Layers size={18} /> {t.addSuperset}
            </button>
            <button onClick={() => setView('list')} className="p-3 glass-sm rounded-2xl hover:bg-white/10 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          <div className="space-y-6 lg:space-y-8 min-w-0">
            <div className="glass-card p-4 sm:p-6 lg:p-8 rounded-3xl lg:rounded-[40px] border-white/5 space-y-6 min-w-0">
              <div className="space-y-2">
                <label className="text-xs font-black text-text-secondary uppercase tracking-widest ml-1">{t.routineName}</label>
                <input 
                  type="text" 
                  value={editingRoutine.name}
                  onChange={(e) => setEditingRoutine({...editingRoutine, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 sm:px-6 focus:border-brand-primary outline-none font-bold text-lg sm:text-xl"
                  placeholder="e.g. Hypertrophy A"
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-black heading-premium">{t.blocks}</h3>
                <div className="space-y-6">
                  <AnimatePresence>
                    {editingRoutine.blocks.map((block: any, i: number) => (
                      <motion.div 
                        key={i}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => block.type === 'superset' && setActiveSupersetIndex(i)}
                        className={`glass-sm p-4 sm:p-6 rounded-3xl border transition-all relative min-w-0 ${block.type === 'superset' ? (activeSupersetIndex === i ? 'border-brand-secondary shadow-lg shadow-brand-secondary/10' : 'border-brand-secondary/30') : 'border-white/5'}`}
                      >
                        <div className="flex justify-between items-center gap-3 mb-6">
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${block.type === 'superset' ? 'bg-brand-secondary/20 text-brand-secondary' : 'bg-brand-primary/20 text-brand-primary'}`}>
                              {i + 1}
                            </div>
                            <div>
                              <span className="font-black text-base sm:text-lg block break-words">{block.type === 'superset' ? t.superset : block.exercise_id}</span>
                              {block.type === 'superset' && activeSupersetIndex === i && (
                                <span className="text-[10px] font-black text-brand-secondary uppercase tracking-widest">Active Focus</span>
                              )}
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); removeBlock(i); }} className="text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>

                        {block.type === 'exercise' ? (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{t.sets}</label>
                                <input 
                                  type="number" 
                                  value={block.sets} 
                                  onChange={(e) => updateBlock(i, 'sets', parseInt(e.target.value))}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm focus:border-brand-primary outline-none font-bold"
                                />
                              </div>
                              {!block.isCardio ? (
                                <>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{t.reps}</label>
                                    <input 
                                      type="number" 
                                      value={block.reps} 
                                      onChange={(e) => updateBlock(i, 'reps', parseInt(e.target.value))}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm focus:border-brand-primary outline-none font-bold"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{t.weight}</label>
                                    <input 
                                      type="number" 
                                      value={block.weight} 
                                      onChange={(e) => updateBlock(i, 'weight', parseFloat(e.target.value))}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm focus:border-brand-primary outline-none font-bold"
                                    />
                                  </div>
                                </>
                              ) : (
                                <div className="space-y-1 sm:col-span-2">
                                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{t.time}</label>
                                  <input 
                                    type="number" 
                                    value={block.time_minutes} 
                                    onChange={(e) => updateBlock(i, 'time_minutes', parseInt(e.target.value))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm focus:border-brand-primary outline-none font-bold"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                              <Clock size={16} className="text-brand-primary" />
                              <div className="flex-1">
                                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{t.restPeriod}</p>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number" 
                                    value={block.rest_seconds} 
                                    onChange={(e) => updateBlock(i, 'rest_seconds', parseInt(e.target.value))}
                                    className="w-20 bg-transparent border-none p-0 focus:ring-0 font-black text-xl text-brand-primary"
                                  />
                                  <span className="text-sm font-bold text-text-secondary">SEC</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="space-y-3">
                              {block.exercises.map((ex: any, exIndex: number) => (
                                <div key={exIndex} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 min-w-0">
                                  <span className="font-bold break-words">{ex.exercise_id}</span>
                                  <div className="flex flex-wrap gap-4">
                                    {!ex.isCardio ? (
                                      <>
                                        <div className="text-right">
                                          <p className="text-[8px] font-black text-text-secondary uppercase">{t.reps}</p>
                                          <input 
                                            type="number" 
                                            value={ex.reps}
                                            onChange={(e) => updateSupersetExercise(i, exIndex, 'reps', parseInt(e.target.value))}
                                            className="w-12 bg-transparent text-right font-bold focus:outline-none" 
                                          />
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[8px] font-black text-text-secondary uppercase">{t.weight}</p>
                                          <input 
                                            type="number" 
                                            value={ex.weight}
                                            onChange={(e) => updateSupersetExercise(i, exIndex, 'weight', parseFloat(e.target.value))}
                                            className="w-12 bg-transparent text-right font-bold focus:outline-none" 
                                          />
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-right">
                                        <p className="text-[8px] font-black text-text-secondary uppercase">{t.time}</p>
                                        <input 
                                          type="number" 
                                          value={ex.time_minutes}
                                          onChange={(e) => updateSupersetExercise(i, exIndex, 'time_minutes', parseInt(e.target.value))}
                                          className="w-16 bg-transparent text-right font-bold focus:outline-none" 
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {block.exercises.length === 0 && (
                                <div className="border-2 border-dashed border-brand-secondary/20 rounded-2xl py-8 text-center">
                                  <p className="text-text-secondary font-bold text-xs">Select exercises from the list to add to this superset</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">{t.sets}</p>
                                <input 
                                  type="number" 
                                  value={block.sets} 
                                  onChange={(e) => updateBlock(i, 'sets', parseInt(e.target.value))}
                                  className="w-full bg-transparent font-black text-xl focus:outline-none"
                                />
                              </div>
                              <div className="bg-white/5 p-4 rounded-2xl border border-brand-secondary/20">
                                <p className="text-[10px] font-black text-brand-secondary uppercase tracking-widest mb-1">{t.restAfterSuperset}</p>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number" 
                                    value={block.rest_seconds} 
                                    onChange={(e) => updateBlock(i, 'rest_seconds', parseInt(e.target.value))}
                                    className="w-full bg-transparent font-black text-xl text-brand-secondary focus:outline-none"
                                  />
                                  <span className="text-xs font-bold text-brand-secondary/60">SEC</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full bg-brand-primary py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-2xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Save size={24} /> {t.saveBtn}
              </button>
            </div>
          </div>

          <div className="space-y-6 lg:space-y-8 min-w-0">
            <div className="glass-card p-4 sm:p-6 lg:p-8 rounded-3xl lg:rounded-[40px] border-white/5 space-y-6 lg:space-y-8 min-w-0">
              <div className="space-y-4">
                <h4 className="text-sm font-black text-text-secondary uppercase tracking-[0.2em]">{ui.selectEquipment}</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(eqT || {}).map((eq) => (
                    <button
                      key={eq}
                      onClick={() => setSelectedEquipment(prev => 
                        prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]
                      )}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedEquipment.includes(eq) 
                          ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                          : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'
                      }`}
                    >
                      {eqT[eq]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">

                <MuscleMap 
                  selectedMuscles={selectedMuscles}
                  onSelectMuscle={(id) => setSelectedMuscles(prev => prev.includes(id) ? prev.filter(m => m !== id) : [id])}
                  language={language}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                    <input 
                      type="text"
                      placeholder={ui.search}
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 focus:border-brand-primary outline-none font-medium"
                    />
                  </div>
                  {activeSupersetIndex !== null && (
                    <button 
                      onClick={() => setActiveSupersetIndex(null)}
                    className="ml-3 sm:ml-4 p-3 sm:p-4 glass-sm rounded-2xl text-brand-primary border border-brand-primary/20"
                    >
                      <Plus size={24} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {availableExercises.filter((ex: any) => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())).map((ex: any) => (
                    <RoutineExerciseItem key={ex.id} ex={ex} language={language} onAdd={addExerciseToRoutine} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 lg:space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <h2 className="text-3xl sm:text-5xl font-black heading-premium tracking-normal mb-2 break-words">{t.managerTitle}</h2>
          <p className="text-text-secondary font-medium">{ui.routines}</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="bg-brand-primary px-6 sm:px-8 py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
        >
          <Plus size={24} /> {t.createBtn}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routines?.length === 0 && (
          <div className="col-span-full py-16 sm:py-20 text-center glass-card rounded-3xl lg:rounded-[40px] border-white/5">
            <Dumbbell size={64} className="mx-auto mb-6 text-white/10" />
            <p className="text-text-secondary font-bold text-xl">{t.emptyState}</p>
          </div>
        )}

        {routines?.map((routine: any) => {
          const rId = routine.id || routine._id;
          return (
            <motion.div 
              key={rId}
              layoutId={rId}
              className="glass-card p-5 sm:p-8 rounded-3xl lg:rounded-[48px] border-white/5 hover:border-brand-primary/30 transition-all group flex flex-col justify-between min-w-0"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-brand-primary/10 p-4 rounded-2xl">
                    <Dumbbell className="text-brand-primary" size={28} />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(routine)} className="p-2 hover:bg-white/10 rounded-lg text-text-secondary">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => deleteMutation.mutate(rId)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-400">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-black mb-2 heading-premium break-words">{routine.name}</h3>
                <p className="text-text-secondary text-sm font-bold uppercase tracking-widest mb-4">
                  {routine.blocks.length} {t.blocks} • {routine.difficulty}/5 {t.difficulty}
                </p>

                {/* Exercise details */}
                <div className="space-y-2 mb-6">
                  {routine.blocks.map((block: any, i: number) => (
                    <div key={i} className={`p-3 rounded-xl text-xs ${block.type === 'superset' ? 'bg-brand-secondary/5 border border-brand-secondary/10' : 'bg-white/[0.03] border border-white/5'}`}>
                      {block.type === 'superset' ? (
                        <div>
                          <span className="font-black text-brand-secondary uppercase tracking-widest text-[10px]">{t.superset}</span>
                          <div className="mt-1 space-y-1">
                            {block.exercises?.map((ex: any, j: number) => (
                              <p key={j} className="text-text-secondary font-medium flex justify-between">
                                <span className="truncate">{ex.exercise_id}</span>
                                <span className="text-white/30 ml-2 shrink-0">{ex.reps || 10} reps</span>
                              </p>
                            ))}
                          </div>
                          <p className="text-white/20 mt-1">{block.sets || 3} {t.sets} • {block.rest_seconds || 120}s {t.restPeriod.toLowerCase()}</p>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-bold text-text-secondary truncate">{block.exercise_id}</span>
                          <span className="text-white/30 shrink-0">
                            {block.isCardio
                              ? `${block.time_minutes || 30} min`
                              : `${block.sets || 3}×${block.reps || 10} @ ${block.weight || 0}kg`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={() => onStartRoutine(routine)}
                className="w-full glass-sm py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-brand-primary hover:text-white transition-all group/btn"
              >
                <Play size={20} fill="currentColor" /> {t.startBtn}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const RoutineExerciseItem = ({ ex, language, onAdd }: { ex: any, language: string, onAdd: (ex: any) => void }) => {
  const [expanded, setExpanded] = React.useState(false);
  const instructions = ex.translations?.[language]?.instructions;
  
  return (
    <div className="glass-sm p-4 rounded-2xl border border-white/5 flex flex-col hover:bg-white/5 transition-all text-left group min-w-0">
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <ExerciseIcon name={ex.name} mediaGif={ex.media?.gif} className="w-12 h-12 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold group-hover:text-brand-primary transition-colors truncate">{ex.name}</p>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest mb-1">
              <span className="text-brand-primary">{ex.primary_muscles.map((m: string) => (languages[language] as any).muscles[m.toLowerCase()] || m).join(', ')}</span>
              {ex.secondary_muscles && ex.secondary_muscles.length > 0 && (
                <span className="text-white/30"> • {ex.secondary_muscles.map((m: string) => (languages[language] as any).muscles[m.toLowerCase()] || m).join(', ')}</span>
              )}
            </p>

            {!expanded && instructions && instructions.length > 0 && (
              <p className="text-[10px] text-text-secondary/50 italic line-clamp-1">{instructions[0]}</p>
            )}
          </div>
        </div>
        <button 
          onClick={() => onAdd(ex)}
          className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-colors ml-4 shrink-0"
        >
          <Plus size={20} />
        </button>
      </div>
      
      <AnimatePresence>
        {expanded && instructions && instructions.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
              {instructions.map((step: string, i: number) => (
                <p key={i} className="text-[11px] text-text-secondary leading-relaxed flex items-start gap-2">
                  <span className="text-brand-primary font-bold">{i+1}.</span>
                  {step}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoutineManager;
