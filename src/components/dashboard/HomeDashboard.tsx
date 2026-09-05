import React, { useState, useEffect } from 'react';
import { Play, Flame, Calendar, Clock, Sparkles, CheckCircle2, ChevronLeft, Zap, Check } from 'lucide-react';
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
  const greeting = currentHour < 12 ? 'صباح الخير والنشاط 👋' : currentHour < 17 ? 'مساء الخير 👋' : 'مساء الهمة والاسترخاء 🌙';

  // Format last workout text
  let lastWorkoutText = 'لم تبدأ بعد';
  if (streakStats.lastWorkoutDate) {
    const todayStr = new Date().toISOString().split('T')[0];
    const logStr = new Date(streakStats.lastWorkoutDate).toISOString().split('T')[0];
    if (todayStr === logStr) {
      lastWorkoutText = 'اليوم ✓';
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (yesterday.toISOString().split('T')[0] === logStr) {
        lastWorkoutText = 'أمس ✓';
      } else {
        lastWorkoutText = new Date(streakStats.lastWorkoutDate).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
      }
    }
  }

  // Active workout routine (from plan status or fallback)
  const activeWorkoutRoutine = planStatus?.routine || todayRoutine;
  const isEffectiveRestDay = planStatus ? planStatus.isRestDay : (isRestDay && !todayRoutine);

  return (
    <div className="space-y-6 pb-16">
      {/* Desk Break Modal */}
      <DeskBreakModal
        isOpen={showDeskBreakModal}
        onClose={() => setShowDeskBreakModal(false)}
        onComplete={() => setShowDeskBreakModal(false)}
      />

      {/* Top Welcome Card */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-8 shadow-2xl">
        <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>يوم جديد لصحة أفضل</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight">
              {greeting}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isEffectiveRestDay 
                ? 'اليوم مخصص لراحة الغضاريف واستشفاء الأنسجة بمشي خفيف وتغذية سليمة.'
                : '15 إلى 20 دقيقة فقط من الحركة الهادئة كافية لحماية عمودك الفقري من الإجهاد.'}
            </p>
          </div>

          {/* Quick Streak Widget */}
          <div 
            onClick={() => onNavigateTab('stats')}
            className="flex items-center gap-3 liquid-glass-pill rounded-2xl p-2.5 sm:p-3 px-3.5 sm:px-4 cursor-pointer hover:bg-white/10 transition-colors shrink-0 w-full sm:w-auto justify-between sm:justify-start"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-500" />
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">الالتزام المتتالي</div>
                <div className="text-sm sm:text-base font-black text-amber-400">
                  {streakStats.currentStreak} {streakStats.currentStreak === 1 ? 'يوم' : streakStats.currentStreak === 2 ? 'يومان' : streakStats.currentStreak <= 10 ? 'أيام' : 'يوماً'} 🔥
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Days Tracker Widget */}
      <div className="liquid-glass-card rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white font-['Tajawal']">
              تقدم هذا الأسبوع {planStatus ? `(الأسبوع ${planStatus.weekNumber})` : ''}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">
            {Object.values(weeklyCompletion).filter(Boolean).length} من 7 أيام منجزة
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

      {/* Hero Today's Routine or Recovery Day Card */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-teal-500/0 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold liquid-glass-pill text-emerald-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{isEffectiveRestDay ? 'جدول التعافي اليوم' : 'تمرينك النهارده'}</span>
            </span>

            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <span>آخر تمرين:</span>
              <strong className="text-slate-200">{lastWorkoutText}</strong>
            </span>
          </div>

          {isEffectiveRestDay ? (
            /* ================= REST DAY CARD (As specified in Untitled-3) ================= */
            <div className="py-4 text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-3xl shadow-lg shadow-teal-500/10">
                🌿
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight">
                  اليوم يوم راحة واستشفاء 😌
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mt-2 leading-relaxed">
                  لا توجد جلسة تدريبية مجهدة اليوم. العضلات والأقراص الغضروفية تحتاج إلى الراحة لإعادة امتصاص السوائل الحامية وتثبيت المكتسبات.
                </p>
              </div>

              {/* Next Session Badge */}
              {planStatus?.nextSession && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl liquid-glass-pill text-xs text-slate-300 border-white/10">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>الجلسة القادمة:</span>
                  <strong className="text-white font-bold font-['Tajawal']">
                    {planStatus.nextSession.dayNameAr} ({planStatus.nextSession.title}) • {planStatus.nextSession.time}
                  </strong>
                </div>
              )}

              {/* Recovery Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-right pt-2">
                <div className="p-3.5 rounded-2xl liquid-glass-pill space-y-1">
                  <div className="text-xs font-bold text-emerald-400">🚶‍♂️ المشي الخفيف (15–20 دقيقة):</div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    يحرك السوائل الحامية حول الفقرات بدون أي ضغط محوري مجهد.
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl liquid-glass-pill space-y-1">
                  <div className="text-xs font-bold text-sky-400">💧 شرب الماء الكافي:</div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    يعيد ترطيب ديسك الظهر الذي يفقد جزءاً من سوائله نهاراً.
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                {miniRescueRoutine && (
                  <button
                    onClick={() => onStartRoutine(miniRescueRoutine)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:text-white hover:bg-teal-500/30 text-xs font-bold transition-all liquid-button"
                  >
                    <Zap className="w-4 h-4 text-teal-400" />
                    <span>جلسة إطالة سريعة خفيفة (5 دقائق)</span>
                  </button>
                )}

                <button
                  onClick={() => onNavigateTab('planner')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-glass-pill text-slate-300 hover:text-white text-xs font-bold transition-all"
                >
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>عرض خطة الـ 4 أسابيع الكاملة</span>
                </button>
              </div>
            </div>
          ) : activeWorkoutRoutine ? (
            /* ================= SCHEDULED WORKOUT CARD ================= */
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {planStatus?.weekNumber && planStatus.sessionCode && (
                    <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black font-['Tajawal']">
                      الأسبوع {planStatus.weekNumber} • الجلسة {planStatus.sessionCode}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {activeWorkoutRoutine.tag}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight mt-1">
                  {activeWorkoutRoutine.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 line-clamp-2">
                  {activeWorkoutRoutine.description}
                </p>
              </div>

              {/* Exercise List Preview (Shows the 4 structured exercises) */}
              {planStatus?.session?.prescriptions && planStatus.session.prescriptions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {planStatus.session.prescriptions.map((presc, pIdx) => {
                    const ex = exercises.find(e => e.id === presc.exerciseId);
                    return (
                      <div key={pIdx} className="flex items-center justify-between gap-2 p-2.5 rounded-2xl liquid-glass-pill text-xs">
                        <span className="font-bold text-slate-200 truncate">
                          • {ex?.arabicName || presc.exerciseId}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold shrink-0">
                          {presc.sets}م × {presc.reps ? `${presc.reps}ع` : `${presc.holdSeconds || presc.durationSeconds}ث`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Routine metrics */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-semibold text-slate-300">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>{activeWorkoutRoutine.totalEstimatedMinutes} دقيقة</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-semibold text-slate-300">
                  <span>🧘‍♂️ {activeWorkoutRoutine.exerciseIds.length} تمارين أساسية</span>
                </div>
                {streakStats.hasWorkedOutToday && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>أتممت تمرينك اليوم!</span>
                  </div>
                )}
              </div>

              {/* Giant One-Click Start Button */}
              <button
                onClick={() => onStartRoutine(activeWorkoutRoutine)}
                className="w-full py-5 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 font-black text-lg sm:text-xl shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-3 group/btn liquid-button"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-950/20 flex items-center justify-center">
                  <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                </div>
                <span className="font-['Tajawal'] tracking-tight">
                  {streakStats.hasWorkedOutToday ? 'إعادة تشغيل تمرين اليوم ▶' : 'ابدأ تمرين اليوم ▶'}
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Workday Desk Break Spine Reset Banner (From Untitled-1) */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0 shadow-md">
            🧍‍♂️
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold text-white font-['Tajawal']">
                وقفة العمل المكتبي وتفريغ ضغط الغضروف
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                كل 45–60 دقيقة
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              إذا كنت تجلس فترات طويلة في العمل: قف الآن لمدة دقيقة واحدة، ونفذ 3 عدات من تمرين مد الظهر لاستعادة التقوس وتفريغ الديسك.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDeskBreakModal(true)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:brightness-110 active:scale-98 transition-all shrink-0 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 liquid-button"
        >
          <Clock className="w-4 h-4" />
          <span>بدء الوقفة دقيقة واحدة (Standing Extension) ⏱️</span>
        </button>
      </div>

      {/* "I don't feel like exercising today" - The Rescue Section */}
      {miniRescueRoutine && (
        <div className="liquid-glass-card rounded-3xl border-teal-500/30 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-2xl shrink-0 shadow-md">
              😴
            </div>
            <div>
              <h4 className="text-base font-bold text-white font-['Tajawal']">
                مش قادر أتمرن النهاردة؟ ولا يهمك ❤️
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                بدل ما تلغي اليوم بالكامل وتكسر الـ Streak، نعمل جلسة إنقاذ خفيفة جداً في 5 دقائق فقط؟
              </p>
            </div>
          </div>

          <button
            onClick={() => onStartRoutine(miniRescueRoutine)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-500/25 border border-teal-500/40 text-teal-300 font-bold text-xs hover:bg-teal-500/35 hover:text-white transition-all shrink-0 flex items-center justify-center gap-1.5 liquid-button"
          >
            <span>ابدأ جلسة الإنقاذ (5 دقائق)</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Adaptive Routine Filter (كم وقت معك اليوم؟) */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-white font-['Tajawal'] flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              معاك كام دقيقة النهارده؟ (Adaptive Quick Pick)
            </h4>
            <p className="text-xs text-slate-400">اختر الوقت وسنقوم بتوجيهك للروتين المناسب فوراً</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => {
              if (miniRescueRoutine) onStartRoutine(miniRescueRoutine);
            }}
            className="p-3.5 rounded-2xl liquid-glass-pill hover:bg-emerald-500/10 text-center transition-colors"
          >
            <div className="text-lg font-black text-emerald-400">5 دقائق</div>
            <div className="text-[11px] text-slate-400 mt-0.5">إنقاذ سريع ومريح</div>
          </button>

          <button
            onClick={() => {
              if (activeWorkoutRoutine) onStartRoutine(activeWorkoutRoutine);
            }}
            className="p-3.5 rounded-2xl liquid-glass-pill hover:bg-sky-500/10 text-center transition-colors"
          >
            <div className="text-lg font-black text-sky-400">10-15 دقيقة</div>
            <div className="text-[11px] text-slate-400 mt-0.5">تمرين اليوم المجدول</div>
          </button>

          <button
            onClick={() => onNavigateTab('planner')}
            className="p-3.5 rounded-2xl liquid-glass-pill hover:bg-teal-500/10 text-center transition-colors"
          >
            <div className="text-lg font-black text-teal-400">20 دقيقة</div>
            <div className="text-[11px] text-slate-400 mt-0.5">جلسة علاجية متكاملة</div>
          </button>
        </div>
      </div>

      {/* "I don't feel like exercising today" - The Rescue Section */}
      {miniRescueRoutine && (
        <div className="liquid-glass-card rounded-3xl border-teal-500/30 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-2xl shrink-0 shadow-md">
              😴
            </div>
            <div>
              <h4 className="text-base font-bold text-white font-['Tajawal']">
                مش قادر أتمرن النهاردة؟ ولا يهمك ❤️
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                بدل ما تلغي اليوم بالكامل وتكسر الـ Streak، نعمل جلسة إنقاذ خفيفة جداً في 5 دقائق فقط؟
              </p>
            </div>
          </div>

          <button
            onClick={() => onStartRoutine(miniRescueRoutine)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-500/25 border border-teal-500/40 text-teal-300 font-bold text-xs hover:bg-teal-500/35 hover:text-white transition-all shrink-0 flex items-center justify-center gap-1.5 liquid-button"
          >
            <span>ابدأ جلسة الإنقاذ (5 دقائق)</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Adaptive Routine Filter (كم وقت معك اليوم؟) */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-white font-['Tajawal'] flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              معاك كام دقيقة النهارده؟ (Adaptive Quick Pick)
            </h4>
            <p className="text-xs text-slate-400">اختر الوقت وسنقوم بتوجيهك للروتين المناسب فوراً</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => {
              if (miniRescueRoutine) onStartRoutine(miniRescueRoutine);
            }}
            className="p-3.5 rounded-2xl liquid-glass-pill hover:bg-emerald-500/10 text-center transition-colors"
          >
            <div className="text-lg font-black text-emerald-400">5 دقائق</div>
            <div className="text-[11px] text-slate-400 mt-0.5">إنقاذ سريع ومريح</div>
          </button>

          <button
            onClick={() => {
              if (todayRoutine) onStartRoutine(todayRoutine);
            }}
            className="p-3.5 rounded-2xl liquid-glass-pill hover:bg-sky-500/10 text-center transition-colors"
          >
            <div className="text-lg font-black text-sky-400">10 دقائق</div>
            <div className="text-[11px] text-slate-400 mt-0.5">مرونة وتليين الظهر</div>
          </button>

          <button
            onClick={() => onNavigateTab('exercises')}
            className="p-3.5 rounded-2xl liquid-glass-pill hover:bg-teal-500/10 text-center transition-colors"
          >
            <div className="text-lg font-black text-teal-400">15 دقيقة</div>
            <div className="text-[11px] text-slate-400 mt-0.5">جلسة علاجية متكاملة</div>
          </button>
        </div>
      </div>
    </div>
  );
};
