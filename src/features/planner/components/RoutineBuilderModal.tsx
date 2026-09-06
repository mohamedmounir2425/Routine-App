import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { Routine, Exercise } from '../../../types';
import { RoutineDetailsForm } from './RoutineDetailsForm';
import { SelectedExercisesList } from './SelectedExercisesList';
import { ExercisePickerList } from './ExercisePickerList';

interface RoutineBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (routine: Routine) => void;
  availableExercises: Exercise[];
  initialRoutine?: Routine | null;
}

export const RoutineBuilderModal: React.FC<RoutineBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  availableExercises,
  initialRoutine,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('مخصص');
  const [level] = useState<'gentle' | 'moderate' | 'deep'>('gentle');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [customConfigs, setCustomConfigs] = useState<{
    [id: string]: { durationSeconds: number; restAfterSeconds: number };
  }>({});

  useEffect(() => {
    if (initialRoutine) {
      setName(initialRoutine.name);
      setDescription(initialRoutine.description);
      setTag(initialRoutine.tag || 'مخصص');
      setSelectedExerciseIds(initialRoutine.exerciseIds || []);

      const configs: { [id: string]: { durationSeconds: number; restAfterSeconds: number } } = {};
      if (initialRoutine.customExerciseConfigs) {
        Object.entries(initialRoutine.customExerciseConfigs).forEach(([id, cfg]) => {
          configs[id] = {
            durationSeconds: cfg.durationSeconds || 60,
            restAfterSeconds: cfg.restAfterSeconds || 15,
          };
        });
      }
      setCustomConfigs(configs);
    } else {
      setName('');
      setDescription('');
      setTag('مخصص');
      setSelectedExerciseIds([]);
      setCustomConfigs({});
    }
  }, [initialRoutine, isOpen]);

  if (!isOpen) return null;

  const toggleExercise = (exId: string) => {
    if (selectedExerciseIds.includes(exId)) {
      setSelectedExerciseIds(prev => prev.filter(id => id !== exId));
    } else {
      setSelectedExerciseIds(prev => [...prev, exId]);
      if (!customConfigs[exId]) {
        const ex = availableExercises.find(e => e.id === exId);
        setCustomConfigs(prev => ({
          ...prev,
          [exId]: {
            durationSeconds: ex?.durationSeconds || 60,
            restAfterSeconds: ex?.restAfterSeconds || 15,
          },
        }));
      }
    }
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newIds = [...selectedExerciseIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newIds.length) return;
    const temp = newIds[index];
    newIds[index] = newIds[targetIndex];
    newIds[targetIndex] = temp;
    setSelectedExerciseIds(newIds);
  };

  const updateExerciseConfig = (exId: string, field: 'durationSeconds' | 'restAfterSeconds', value: number) => {
    setCustomConfigs(prev => ({
      ...prev,
      [exId]: {
        ...(prev[exId] || { durationSeconds: 60, restAfterSeconds: 15 }),
        [field]: Math.max(5, value),
      },
    }));
  };

  const totalSeconds = selectedExerciseIds.reduce((acc, id) => {
    const cfg = customConfigs[id];
    const ex = availableExercises.find(e => e.id === id);
    const duration = cfg?.durationSeconds ?? (ex?.durationSeconds || 60);
    const rest = cfg?.restAfterSeconds ?? (ex?.restAfterSeconds || 15);
    return acc + duration + rest;
  }, 0);
  const totalEstimatedMinutes = Math.max(1, Math.round(totalSeconds / 60));

  const handleSave = () => {
    if (!name.trim() || selectedExerciseIds.length === 0) return;

    const routineId = initialRoutine?.id || `custom-${Date.now()}`;
    const cleanConfigs: { [id: string]: { durationSeconds: number; restAfterSeconds: number } } = {};

    selectedExerciseIds.forEach(id => {
      const cfg = customConfigs[id];
      const ex = availableExercises.find(e => e.id === id);
      cleanConfigs[id] = {
        durationSeconds: cfg?.durationSeconds ?? (ex?.durationSeconds || 60),
        restAfterSeconds: cfg?.restAfterSeconds ?? (ex?.restAfterSeconds || 15),
      };
    });

    const newRoutine: Routine = {
      id: routineId,
      name: name.trim(),
      description: description.trim() || 'روتين علاجي مخصص مصمم لاحتياجاتك الشخصية.',
      exerciseIds: selectedExerciseIds,
      totalEstimatedMinutes,
      level,
      tag: tag.trim() || 'مخصص',
      isCustom: true,
      customExerciseConfigs: cleanConfigs,
    };

    onSave(newRoutine);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-['Tajawal']">
                {initialRoutine ? 'تعديل الروتين المخصص' : 'صانع الروتينات المخصصة 🛠️'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                اختر تمارينك الخاصة، رتبها، وحدد زمن كل تمرين لإنشاء روتينك المثالي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          <RoutineDetailsForm
            name={name}
            setName={setName}
            tag={tag}
            setTag={setTag}
            description={description}
            setDescription={setDescription}
            selectedCount={selectedExerciseIds.length}
            totalEstimatedMinutes={totalEstimatedMinutes}
          />

          <SelectedExercisesList
            selectedExerciseIds={selectedExerciseIds}
            availableExercises={availableExercises}
            customConfigs={customConfigs}
            onToggleExercise={toggleExercise}
            onMoveExercise={moveExercise}
            onUpdateConfig={updateExerciseConfig}
          />

          <ExercisePickerList
            availableExercises={availableExercises}
            selectedExerciseIds={selectedExerciseIds}
            onToggleExercise={toggleExercise}
          />
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 font-bold text-xs transition-colors"
          >
            إلغاء
          </button>

          <button
            type="button"
            disabled={!name.trim() || selectedExerciseIds.length === 0}
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{initialRoutine ? 'حفظ التعديلات' : 'حفظ الروتين المخصص'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
