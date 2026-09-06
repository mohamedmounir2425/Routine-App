import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Clock, Dumbbell, Sparkles, Check, Search } from 'lucide-react';
import { Routine, Exercise } from '../../types';
import { SlidingTabs } from '../common/SlidingTabs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (routine: Routine) => void;
  availableExercises: Exercise[];
  initialRoutine?: Routine | null;
}

export const RoutineBuilderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  availableExercises,
  initialRoutine,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('مخصص');
  const [level, setLevel] = useState<'gentle' | 'moderate' | 'deep'>('gentle');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  
  // Custom configs per exercise id: { [id]: { duration: number, rest: number } }
  const [customConfigs, setCustomConfigs] = useState<{
    [id: string]: { durationSeconds: number; restAfterSeconds: number };
  }>({});

  // Search and filter for exercise picker
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'core' | 'back' | 'mobility'>('all');

  useEffect(() => {
    if (initialRoutine) {
      setName(initialRoutine.name);
      setDescription(initialRoutine.description);
      setTag(initialRoutine.tag || 'مخصص');
      setLevel(initialRoutine.level || 'gentle');
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
      setLevel('gentle');
      setSelectedExerciseIds([]);
      setCustomConfigs({});
    }
  }, [initialRoutine, isOpen]);

  if (!isOpen) return null;

  // Toggle exercise selection
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

  // Move exercise up or down in order
  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newIds = [...selectedExerciseIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newIds.length) return;
    const temp = newIds[index];
    newIds[index] = newIds[targetIndex];
    newIds[targetIndex] = temp;
    setSelectedExerciseIds(newIds);
  };

  // Update duration or rest
  const updateExerciseConfig = (exId: string, field: 'durationSeconds' | 'restAfterSeconds', value: number) => {
    setCustomConfigs(prev => ({
      ...prev,
      [exId]: {
        ...(prev[exId] || { durationSeconds: 60, restAfterSeconds: 15 }),
        [field]: Math.max(5, value),
      },
    }));
  };

  // Calculate estimated duration
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
    const customExerciseConfigs: { [id: string]: { durationSeconds: number; restAfterSeconds: number } } = {};
    
    selectedExerciseIds.forEach(id => {
      const cfg = customConfigs[id];
      const ex = availableExercises.find(e => e.id === id);
      customExerciseConfigs[id] = {
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
      customExerciseConfigs,
    };

    onSave(newRoutine);
    onClose();
  };

  // Filtered exercises for the picker
  const filteredExercises = availableExercises.filter(ex => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.arabicName.includes(searchQuery);
    const matchesCat =
      categoryFilter === 'all' ||
      (categoryFilter === 'core' && (ex.category === 'core' || ex.category === 'back')) ||
      ex.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

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
          {/* Routine Details Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم الروتين *
              </label>
              <input
                type="text"
                placeholder="مثال: روتين الصباح الهادئ، إطالات قبل النوم..."
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                تصنيف الروتين (وسم)
              </label>
              <input
                type="text"
                placeholder="مثال: صباحي، مسائي، علاج طبيعي..."
                value={tag}
                onChange={e => setTag(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                وصف الروتين (اختياري)
              </label>
              <input
                type="text"
                placeholder="اكتب وصفاً أو ملاحظات تذكرك بالهدف من هذا الروتين..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              <span>التمارين المختارة:</span>
              <strong className="text-emerald-400 text-sm">{selectedExerciseIds.length}</strong>
            </div>

            <div className="w-px h-4 bg-slate-800" />

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>المدة التقريبية الكلية:</span>
              <strong className="text-teal-400 text-sm">~{totalEstimatedMinutes} دقيقة</strong>
            </div>
          </div>

          {/* Section 1: Selected Exercises & Customizer */}
          {selectedExerciseIds.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white font-['Tajawal'] flex items-center justify-between">
                <span>التمارين المحددة وترتيبها ({selectedExerciseIds.length})</span>
                <span className="text-xs text-slate-400 font-normal">استخدم الأسهم للترتيب، وعدل زمن التمرين والراحة</span>
              </h4>

              <div className="space-y-2.5">
                {selectedExerciseIds.map((exId, index) => {
                  const ex = availableExercises.find(e => e.id === exId);
                  if (!ex) return null;
                  const cfg = customConfigs[exId] || {
                    durationSeconds: ex.durationSeconds || 60,
                    restAfterSeconds: ex.restAfterSeconds || 15,
                  };

                  return (
                    <div
                      key={exId}
                      className="p-3 sm:p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 group hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-slate-800 text-emerald-400 text-xs font-black flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-white font-['Tajawal'] truncate">
                              {ex.arabicName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{ex.name}</div>
                          </div>
                        </div>

                        {/* Remove button on mobile header */}
                        <button
                          type="button"
                          onClick={() => toggleExercise(exId)}
                          className="sm:hidden p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                          title="حذف من الروتين"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Controls: duration, rest, reorder, delete */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pt-2 sm:pt-0 border-t border-slate-800/60 sm:border-0">
                        <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400">التمرين:</span>
                          <input
                            type="number"
                            min="10"
                            max="300"
                            step="5"
                            value={cfg.durationSeconds}
                            onChange={e =>
                              updateExerciseConfig(exId, 'durationSeconds', parseInt(e.target.value) || 30)
                            }
                            className="w-10 sm:w-12 bg-slate-950 text-emerald-400 text-xs font-bold text-center rounded border border-slate-700 py-0.5"
                          />
                          <span className="text-[10px] text-slate-400">ث</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400">الراحة:</span>
                          <input
                            type="number"
                            min="5"
                            max="120"
                            step="5"
                            value={cfg.restAfterSeconds}
                            onChange={e =>
                              updateExerciseConfig(exId, 'restAfterSeconds', parseInt(e.target.value) || 15)
                            }
                            className="w-10 sm:w-12 bg-slate-950 text-teal-400 text-xs font-bold text-center rounded border border-slate-700 py-0.5"
                          />
                          <span className="text-[10px] text-slate-400">ث</span>
                        </div>

                        {/* Order buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveExercise(index, 'up')}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                            title="تحريك لأعلى"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === selectedExerciseIds.length - 1}
                            onClick={() => moveExercise(index, 'down')}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                            title="تحريك لأسفل"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Remove on desktop */}
                        <button
                          type="button"
                          onClick={() => toggleExercise(exId)}
                          className="hidden sm:block p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                          title="حذف من الروتين"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Exercise Picker */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-white font-['Tajawal']">
              إضافة تمارين من المكتبة ({availableExercises.length} تمريناً متاحاً)
            </h4>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث عن تمرين..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <SlidingTabs
                tabs={[
                  { id: 'all', label: 'الكل' },
                  { id: 'core', label: 'البطن والجوانب' },
                  { id: 'back', label: 'عضلات الظهر' },
                ]}
                activeTab={categoryFilter}
                onChange={(tab) => setCategoryFilter(tab as 'all' | 'core' | 'back')}
                size="sm"
                className="w-full sm:w-auto justify-center"
              />
            </div>

            {/* Exercise Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1 custom-scrollbar">
              {filteredExercises.map(ex => {
                const isSelected = selectedExerciseIds.includes(ex.id);
                return (
                  <div
                    key={ex.id}
                    onClick={() => toggleExercise(ex.id)}
                    className={`p-3 rounded-2xl border text-right cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold font-['Tajawal'] truncate">
                        {ex.arabicName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{ex.name}</div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900 border-slate-700 text-slate-500'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
