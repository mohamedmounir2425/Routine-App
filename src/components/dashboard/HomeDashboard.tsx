import React, { useState, useEffect } from 'react';
import { Play, Flame, Calendar, Clock, ChevronLeft, Check } from 'lucide-react';
import { Routine, Exercise } from '../../types';
import { StreakStats, getTodayPlanStatus, TodayPlanStatus } from '../../db';
import { DeskBreakModal } from '../common/DeskBreakModal';

interface Props {
  todayRoutine: Routine | null;
  isRestDay: boolean;
  streakStats: StreakStats;
  miniRescueRoutine: Routine | null;
  weeklyCompletion?: { [dayOfWeek: number]: boolean };
  exercises?: Exercise[];
  onStartRoutine: (routine: Routine) => void;
  onNavigateTab: (tab: 'exercises' | 'planner' | 'stats') => void;
}

export const HomeDashboard: React.FC<Props> = ({
  todayRoutine,
  isRestDay,
  streakStats,
  miniRescueRoutine,
  weeklyCompletion = {},
  exercises = [],
  onStartRoutine,
  onNavigateTab,
}) => {
  const [planStatus, setPlanStatus] = useState<TodayPlanStatus | null>(null);
  const [showDeskBreakModal, setShowDeskBreakModal] = useState<boolean>(false);

  useEffect(() => {
    loadPlanStatus();
  }, [todayRoutine, isRestDay]);

  const loadPlanStatus = async () => {
    try {
      const status = await getTodayPlanStatus();
      setPlanStatus(status);
    } catch (e) {
      console.error('Failed to load today plan status:', e);
    }
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'صباح الخير 👋' : currentHour < 17 ? 'مساء الخير 👋' : 'مساء الهمة 🌙';

  // Active workout routine (from plan status or fallback)
  const activeWorkoutRoutine = planStatus?.routine || todayRoutine;
  const isEffectiveRestDay = planStatus ? planStatus.isRestDay : (isRestDay && !todayRoutine);

  return (
    <div className="space-y-4 sm:space-y-5 pb-16 max-w-3xl mx-auto">
      {/* Desk Break Modal */}
      <DeskBreakModal
        isOpen={showDeskBreakModal}
        onClose={() => setShowDeskBreakModal(false)}
        onComplete={() => setShowDeskBreakModal(false)}
      />

      {/* 1. Header & Streak Row (Clean, minimal, distraction-free) */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
            {greeting}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isEffectiveRestDay 
              ? 'اليوم مخصص لاستشفاء وراحة الغضاريف' 
              : 'جلسة هادئة لحماية وتقوية عمودك الفقري'}
          </p>
        </div>

        {/* Compact Streak Pill */}
        <div 
          onClick={() => onNavigateTab('stats')}
          className="flex items-center gap-2.5 liquid-glass-pill rounded-2xl py-2 px-3.5 cursor-pointer hover:bg-white/10 transition-colors shrink-0 select-none active:scale-95"
          title="عرض سجل الالتزام والإحصائيات"
        >
          <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
          <div className="text-right">
            <span className="text-xs font-black text-amber-400 font-mono">
              {streakStats.currentStreak} {streakStats.currentStreak === 1 ? 'يوم' : streakStats.currentStreak === 2 ? 'يومان' : streakStats.currentStreak <= 10 ? 'أيام' : 'يوماً'}
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">متتالي</span>
          </div>
        </div>
      </div>

      {/* 2. Weekly Days Tracker (Sleek visual strip) */}
      <div className="liquid-glass-card rounded-3xl p-3.5 sm:p-4 shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <h3 className="text-xs font-bold text-white font-['Tajawal']">
              أيام هذا الأسبوع {planStatus ? `(الأسبوع ${planStatus.weekNumber})` : ''}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            {Object.values(weeklyCompletion).filter(Boolean).length}/7 منجز
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          {[
            { num: 6, label: 'السبت', short: 'سبت' },
            { num: 0, label: 'الأحد', short: 'أحد' },
            { num: 1, label: 'الاثنين', short: 'إثنين' },
            { num: 2, label: 'الثلاثاء', short: 'ثلاثاء' },
            { num: 3, label: 'الأربعاء', short: 'أربعاء' },
            { num: 4, label: 'الخميس', short: 'خميس' },
            { num: 5, label: 'الجمعة', short: 'جمعة' },
          ].map(day => {
            const todayDay = new Date().getDay();
            const isToday = day.num === todayDay;
            const isDone = !!weeklyCompletion[day.num];

            return (
              <div
                key={day.num}
                className={`flex flex-col items-center py-2 px-1 rounded-2xl transition-all ${
                  isToday 
                    ? 'liquid-glass-pill ring-2 ring-emerald-500/40 shadow-sm' 
                    : isDone
                    ? 'bg-emerald-500/10'
                    : 'opacity-70'
                }`}
              >
                <span className={`text-[10px] sm:text-xs mb-1 font-bold ${isToday ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {day.short}
                </span>
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-black transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                      : isToday
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px]'
                      : 'liquid-glass-pill text-slate-500'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  ) : isToday ? (
                    'اليوم'
                  ) : (
                    '○'
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Hero Card: Today's Routine (or Rest Day) - The main focus */}
      {isEffectiveRestDay ? (
        /* REST DAY CARD */
        <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-2xl shadow-md">
            🌿
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
              اليوم يوم راحة واستشفاء 😌
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              فرصة لاستعادة حيوية العضلات والمفاصل بعد التمارين.
            </p>
          </div>

          {planStatus?.nextSession && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>الجلسة القادمة:</span>
              <strong className="text-white font-bold font-['Tajawal']">
                {planStatus.nextSession.dayNameAr} ({planStatus.nextSession.title})
              </strong>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            {miniRescueRoutine && (
              <button
                type="button"
                onClick={() => onStartRoutine(miniRescueRoutine)}
                className="px-4 py-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:text-white hover:bg-teal-500/30 text-xs font-bold transition-all cursor-pointer select-none active:scale-95"
              >
                ⚡ إطالة خفيفة (5 دقائق)
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateTab('planner')}
              className="px-4 py-2.5 rounded-xl liquid-glass-pill text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer select-none active:scale-95"
            >
              📅 عرض جدول الأسابيع
            </button>
          </div>
        </div>
      ) : activeWorkoutRoutine ? (
        /* ACTIVE WORKOUT CARD */
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/15 to-teal-500/0 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Top Row Badges */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {planStatus?.weekNumber && planStatus.sessionCode ? (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black font-['Tajawal']">
                    الأسبوع {planStatus.weekNumber} • الجلسة {planStatus.sessionCode}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl liquid-glass-pill text-emerald-400 text-xs font-bold">
                    تمرين اليوم
                  </span>
                )}
                <span className="text-xs text-slate-400 font-medium">
                  {activeWorkoutRoutine.tag}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl liquid-glass-pill text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{activeWorkoutRoutine.totalEstimatedMinutes} دقيقة</span>
                </span>
                <span className="px-2.5 py-1 rounded-xl liquid-glass-pill text-xs font-semibold text-slate-300">
                  {activeWorkoutRoutine.exerciseIds.length} تمارين
                </span>
              </div>
            </div>

            {/* Title */}
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
                {activeWorkoutRoutine.name}
              </h3>
            </div>

            {/* Compact Exercise Chips Preview */}
            {planStatus?.session?.prescriptions && planStatus.session.prescriptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {planStatus.session.prescriptions.map((presc, pIdx) => {
                  const ex = exercises.find(e => e.id === presc.exerciseId);
                  return (
                    <span 
                      key={pIdx} 
                      className="px-2.5 py-1 rounded-xl liquid-glass-pill text-[11px] text-slate-300 font-medium flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{ex?.arabicName || presc.exerciseId}</span>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Giant One-Click Start Button */}
            <button
              type="button"
              onClick={() => onStartRoutine(activeWorkoutRoutine)}
              className="w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer select-none liquid-button"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-950/20 flex items-center justify-center">
                <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
              </div>
              <span className="font-['Tajawal'] tracking-tight">
                {streakStats.hasWorkedOutToday ? 'إعادة تمرين اليوم' : 'ابدأ تمرين اليوم'}
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {/* 4. Quick Shortcuts Row (Desk Break + Mini Rescue + Full Plan) - Distraction-free, single row, no repeated text */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
        {/* Shortcut 1: Desk Break */}
        <div 
          onClick={() => setShowDeskBreakModal(true)}
          className="liquid-glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500/40 transition-all select-none group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
              🧍‍♂️
            </div>
            <div>
              <div className="text-xs font-bold text-white font-['Tajawal']">وقفة المكتب</div>
              <div className="text-[10px] text-slate-400">تفريغ ضغط الظهر (دقيقة)</div>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:-translate-x-0.5 transition-all" />
        </div>

        {/* Shortcut 2: 5-min Rescue */}
        {miniRescueRoutine && (
          <div 
            onClick={() => onStartRoutine(miniRescueRoutine)}
            className="liquid-glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-teal-500/40 transition-all select-none group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                ⚡
              </div>
              <div>
                <div className="text-xs font-bold text-white font-['Tajawal']">إنقاذ سريع</div>
                <div className="text-[10px] text-slate-400">جلسة خفيفة (5 دقائق)</div>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:-translate-x-0.5 transition-all" />
          </div>
        )}

        {/* Shortcut 3: Planner */}
        <div 
          onClick={() => onNavigateTab('planner')}
          className="liquid-glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-sky-500/40 transition-all select-none group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
              📅
            </div>
            <div>
              <div className="text-xs font-bold text-white font-['Tajawal']">خطة الأسابيع</div>
              <div className="text-[10px] text-slate-400">الجدول والمستويات</div>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:-translate-x-0.5 transition-all" />
        </div>
      </div>
    </div>
  );
};
