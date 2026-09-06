import React from 'react';
import { Calendar, Clock, CheckCircle2, Play } from 'lucide-react';
import { PlanWeek, PlanSession } from '../../../types';

interface FourWeekScheduleProps {
  selectedWeekNum: number;
  currentWeek: PlanWeek;
  completedSessions: string[];
  onViewSession: (session: PlanSession) => void;
  onLaunchSession: (session: PlanSession) => void;
}

export const FourWeekSchedule: React.FC<FourWeekScheduleProps> = ({
  selectedWeekNum,
  currentWeek,
  completedSessions,
  onViewSession,
  onLaunchSession,
}) => {
  const weekDays = [
    { dayNum: 6, dayNameAr: 'السبت', sessionCode: 'A' as const },
    { dayNum: 0, dayNameAr: 'الأحد', isRest: true, reason: 'راحة سلبية أو مشي خفيف (15–20 دقيقة) لتروية الأنسجة' },
    { dayNum: 1, dayNameAr: 'الاثنين', sessionCode: 'B' as const },
    { dayNum: 2, dayNameAr: 'الثلاثاء', isRest: true, reason: 'راحة واستشفاء للغضاريف وإعادة امتصاص السوائل' },
    { dayNum: 3, dayNameAr: 'الأربعاء', sessionCode: 'C' as const },
    { dayNum: 4, dayNameAr: 'الخميس', sessionCode: 'D' as const },
    { dayNum: 5, dayNameAr: 'الجمعة', isRest: true, reason: 'راحة تامة واستشفاء أسبوعي كامل' },
  ];

  const todayDay = new Date().getDay();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-white font-['Tajawal'] flex items-center gap-2">
        <Calendar className="w-4 h-4 text-emerald-400" />
        <span>جدول أيام الأسبوع {selectedWeekNum} (4 جلسات + 3 أيام تعافي)</span>
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {weekDays.map(day => {
          const isToday = todayDay === day.dayNum;

          if (day.isRest) {
            return (
              <div
                key={day.dayNum}
                className={`rounded-2xl p-4 transition-all border flex items-center justify-between gap-3 ${
                  isToday
                    ? 'liquid-glass border-teal-500/40 shadow-md'
                    : 'liquid-glass-pill border-transparent opacity-85 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-lg shrink-0">
                    🌿
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white font-['Tajawal']">
                        {day.dayNameAr}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 font-bold">
                        يوم راحة وتعافي
                      </span>
                      {isToday && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                          اليوم
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {day.reason}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-slate-500 hidden sm:inline-block font-medium">
                  استشفاء الأنسجة
                </span>
              </div>
            );
          }

          const session = currentWeek.sessions.find((s: PlanSession) => s.sessionCode === day.sessionCode)!;
          if (!session) return null;
          const isCompleted = completedSessions.includes(session.routineId);

          return (
            <div
              key={day.dayNum}
              className={`rounded-2xl p-4 sm:p-5 transition-all border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isToday
                  ? 'liquid-glass-card border-emerald-500/50 shadow-xl shadow-emerald-500/10'
                  : isCompleted
                  ? 'liquid-glass-card border-emerald-500/25'
                  : 'liquid-glass-card border-white/5 hover:border-emerald-500/30'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex flex-col items-center justify-center font-bold font-mono shrink-0 shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : isToday
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-emerald-500/20'
                    : 'liquid-glass-pill text-emerald-400 border border-emerald-500/30'
                }`}>
                  <span className="text-xs">جلسة</span>
                  <span className="text-sm font-black">{session.sessionCode}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 font-['Tajawal']">
                      {day.dayNameAr}
                    </span>
                    <span className="text-sm font-black text-white font-['Tajawal']">
                      {session.title}
                    </span>
                    {isCompleted ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>تمت بنجاح</span>
                      </span>
                    ) : isToday ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black animate-pulse">
                        تمرين اليوم ▶
                      </span>
                    ) : null}
                  </div>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                    {session.description}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{session.estimatedMinutes} دقيقة</span>
                    </span>
                    <span>•</span>
                    <span>{session.prescriptions.length} تمارين أساسية</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => onViewSession(session)}
                  className="px-3.5 py-2 rounded-xl liquid-glass-pill text-xs font-bold text-slate-300 hover:text-white transition-colors"
                >
                  عرض التمارين
                </button>

                <button
                  onClick={() => onLaunchSession(session)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 liquid-button"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{isCompleted ? 'إعادة الجلسة' : 'بدء الجلسة'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
