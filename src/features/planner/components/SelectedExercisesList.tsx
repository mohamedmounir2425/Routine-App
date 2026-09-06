import React from 'react';
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { Exercise } from '../../../types';

interface SelectedExercisesListProps {
  selectedExerciseIds: string[];
  availableExercises: Exercise[];
  customConfigs: { [id: string]: { durationSeconds: number; restAfterSeconds: number } };
  onToggleExercise: (id: string) => void;
  onMoveExercise: (index: number, direction: 'up' | 'down') => void;
  onUpdateConfig: (id: string, field: 'durationSeconds' | 'restAfterSeconds', value: number) => void;
}

export const SelectedExercisesList: React.FC<SelectedExercisesListProps> = ({
  selectedExerciseIds,
  availableExercises,
  customConfigs,
  onToggleExercise,
  onMoveExercise,
  onUpdateConfig,
}) => {
  if (selectedExerciseIds.length === 0) return null;

  return (
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
                  onClick={() => onToggleExercise(exId)}
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
                      onUpdateConfig(exId, 'durationSeconds', parseInt(e.target.value) || 30)
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
                      onUpdateConfig(exId, 'restAfterSeconds', parseInt(e.target.value) || 15)
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
                    onClick={() => onMoveExercise(index, 'up')}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                    title="تحريك لأعلى"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === selectedExerciseIds.length - 1}
                    onClick={() => onMoveExercise(index, 'down')}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                    title="تحريك لأسفل"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Remove on desktop */}
                <button
                  type="button"
                  onClick={() => onToggleExercise(exId)}
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
  );
};
