import React from 'react';
import { Clock, Play, Plus, Edit3, Trash2 } from 'lucide-react';
import { Routine, WeeklyScheduleItem, Exercise } from '../../types';

interface Props {
  schedule: WeeklyScheduleItem[];
  routines: Routine[];
  exercises: Exercise[];
  onUpdateScheduleDay: (dayOfWeek: number, routineId: string | null) => void;
  onApplyPreset: (presetType: '3days' | '4days' | 'daily') => void;
  onStartRoutine: (routine: Routine) => void;
  onCreateCustomRoutine?: () => void;
  onEditRoutine?: (routine: Routine) => void;
  onDeleteRoutine?: (routineId: string) => void;
}

export const WeeklyPlanner: React.FC<Props> = ({
  schedule,
  routines,
  exercises,
  onUpdateScheduleDay,
  onApplyPreset,
  onStartRoutine,
  onCreateCustomRoutine,
  onEditRoutine,
  onDeleteRoutine,
}) => {
  const todayIndex = new Date().getDay();

  // Day order starting from Saturday (common in Arab world)
  const orderedDays = [6, 0, 1, 2, 3, 4, 5];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight">
            جدول التمارين الأسبوعي 📅
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            نظم أيام التمرين وأيام الراحة الموصى بها للاستشفاء ومنع إجهاد الفقرات.
          </p>
        </div>

        {/* Actions: Custom Routine + Quick presets */}
        <div className="flex flex-wrap items-center gap-2">
          {onCreateCustomRoutine && (
            <button
              onClick={onCreateCustomRoutine}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>إنشاء روتين مخصص</span>
            </button>
          )}

          {/* Quick Schedule Presets (Highlighted when active) */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/90 p-1.5 rounded-2xl shadow-sm">
            <span className="text-xs text-slate-400 font-semibold px-2">اقتراح سريع:</span>
            <button
              type="button"
              onClick={() => onApplyPreset('3days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                schedule.filter(s => s.routineId !== null).length === 3
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
              }`}
            >
              {schedule.filter(s => s.routineId !== null).length === 3 && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950/80 animate-pulse" />
              )}
              <span>3 أيام</span>
            </button>
            <button
              type="button"
              onClick={() => onApplyPreset('4days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                schedule.filter(s => s.routineId !== null).length === 4
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
              }`}
            >
              {schedule.filter(s => s.routineId !== null).length === 4 && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950/80 animate-pulse" />
              )}
              <span>4 أيام</span>
            </button>
          </div>
        </div>
      </div>

      {/* Days Grid / List */}
      <div className="space-y-3">
        {orderedDays.map(dayNum => {
          const item = schedule.find(s => s.dayOfWeek === dayNum) || {
            dayOfWeek: dayNum,
            dayNameAr: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dayNum],
            routineId: null,
          };

          const assignedRoutine = routines.find(r => r.id === item.routineId);
          const isToday = todayIndex === dayNum;

          return (
            <div
              key={dayNum}
              className={`rounded-2xl p-3.5 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${
                isToday
                  ? 'bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Day info */}
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex flex-col items-center justify-center font-bold font-['Tajawal'] shrink-0 ${
                  isToday
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  <span className="text-xs">{item.dayNameAr}</span>
                  {isToday && <span className="text-[8px] sm:text-[9px] font-black uppercase">اليوم</span>}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-bold text-white font-['Tajawal'] truncate">
                      {assignedRoutine ? assignedRoutine.name : 'يوم راحة واستشفاء 🌿'}
                    </span>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                        اليوم الحالي
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                    {assignedRoutine
                      ? `${assignedRoutine.totalEstimatedMinutes} دقيقة • ${assignedRoutine.exerciseIds.length} تمارين • ${assignedRoutine.tag}`
                      : 'فرصة لراحة العضلات والمفاصل'}
                  </p>
                </div>
              </div>

              {/* Selector & Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t border-slate-800/60 sm:border-0">
                <select
                  value={item.routineId || ''}
                  onChange={(e) => onUpdateScheduleDay(dayNum, e.target.value || null)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer flex-1 sm:flex-none min-w-0"
                >
                  <option value="">🌿 راحة (Rest)</option>
                  {routines.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.totalEstimatedMinutes} دقيقة)
                    </option>
                  ))}
                </select>

                {assignedRoutine && (
                  <button
                    onClick={() => onStartRoutine(assignedRoutine)}
                    className="p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 transition-all shrink-0 flex items-center justify-center"
                    title="بدء هذا الروتين"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Available Routines Overview */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <h3 className="text-lg font-bold text-white font-['Tajawal'] mb-3">
          الروتينات المتاحة للاختيار:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {routines.map(r => {
            const exList = r.exerciseIds.map(id => exercises.find(e => e.id === id)).filter(Boolean);

            return (
              <div
                key={r.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.isCustom ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {r.tag} {r.isCustom && '⭐'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {r.totalEstimatedMinutes} دقيقة
                      </span>

                      {r.isCustom && (
                        <div className="flex items-center gap-1">
                          {onEditRoutine && (
                            <button
                              onClick={() => onEditRoutine(r)}
                              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                              title="تعديل الروتين"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                          {onDeleteRoutine && (
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف الروتين "${r.name}"؟`)) {
                                  onDeleteRoutine(r.id);
                                }
                              }}
                              className="p-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                              title="حذف الروتين"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white font-['Tajawal']">{r.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.description}</p>

                  <div className="mt-3 space-y-1">
                    <div className="text-[11px] font-semibold text-slate-400">التمارين المتضمنة ({r.exerciseIds.length}):</div>
                    <div className="flex flex-wrap gap-1">
                      {exList.slice(0, 4).map((e, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          {e?.arabicName.split('(')[0].trim()}
                        </span>
                      ))}
                      {exList.length > 4 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-500">
                          +{exList.length - 4} أخرى
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onStartRoutine(r)}
                  className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-500 text-slate-300 hover:text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>بدء هذا الروتين</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
