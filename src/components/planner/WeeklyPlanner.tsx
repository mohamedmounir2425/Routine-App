import React from 'react';
import { Clock, Play } from 'lucide-react';
import { Routine, WeeklyScheduleItem, Exercise } from '../../types';

interface Props {
  schedule: WeeklyScheduleItem[];
  routines: Routine[];
  exercises: Exercise[];
  onUpdateScheduleDay: (dayOfWeek: number, routineId: string | null) => void;
  onApplyPreset: (presetType: '3days' | '4days' | 'daily') => void;
  onStartRoutine: (routine: Routine) => void;
}

export const WeeklyPlanner: React.FC<Props> = ({
  schedule,
  routines,
  exercises,
  onUpdateScheduleDay,
  onApplyPreset,
  onStartRoutine,
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

        {/* Quick presets */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <span className="text-xs text-slate-400 font-semibold px-2">اقتراح سريع:</span>
          <button
            onClick={() => onApplyPreset('3days')}
            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-emerald-500/20 hover:text-emerald-400 transition-all"
          >
            3 أيام / أسبوع
          </button>
          <button
            onClick={() => onApplyPreset('4days')}
            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-emerald-500/20 hover:text-emerald-400 transition-all"
          >
            4 أيام / أسبوع
          </button>
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
              className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isToday
                  ? 'bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Day info */}
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold font-['Tajawal'] ${
                  isToday
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  <span className="text-xs">{item.dayNameAr}</span>
                  {isToday && <span className="text-[9px] font-black uppercase">اليوم</span>}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white font-['Tajawal']">
                      {assignedRoutine ? assignedRoutine.name : 'يوم راحة واستشفاء 🌿'}
                    </span>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        اليوم الحالي
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {assignedRoutine
                      ? `${assignedRoutine.totalEstimatedMinutes} دقيقة • ${assignedRoutine.exerciseIds.length} تمارين • ${assignedRoutine.tag}`
                      : 'فرصة لراحة العضلات والمفاصل'}
                  </p>
                </div>
              </div>

              {/* Selector & Actions */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <select
                  value={item.routineId || ''}
                  onChange={(e) => onUpdateScheduleDay(dayNum, e.target.value || null)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
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
                    className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 transition-all"
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
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                      {r.tag}
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {r.totalEstimatedMinutes} دقيقة
                    </span>
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
