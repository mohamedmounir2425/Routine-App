import React from 'react';
import { Play, Flame, Calendar, Clock, Sparkles, CheckCircle2, ChevronLeft, Zap } from 'lucide-react';
import { Routine } from '../../types';
import { StreakStats } from '../../db';

interface Props {
  todayRoutine: Routine | null;
  isRestDay: boolean;
  streakStats: StreakStats;
  miniRescueRoutine: Routine | null;
  onStartRoutine: (routine: Routine) => void;
  onNavigateTab: (tab: 'exercises' | 'planner' | 'stats') => void;
}

export const HomeDashboard: React.FC<Props> = ({
  todayRoutine,
  isRestDay,
  streakStats,
  miniRescueRoutine,
  onStartRoutine,
  onNavigateTab,
}) => {
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

  return (
    <div className="space-y-6 pb-16">
      {/* Top Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>يوم جديد لصحة أفضل</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight">
              {greeting}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              10 إلى 15 دقيقة فقط من الحركة الهادئة كافية لحماية عمودك الفقري من الإجهاد.
            </p>
          </div>

          {/* Quick Streak Widget */}
          <div 
            onClick={() => onNavigateTab('stats')}
            className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 px-4 cursor-pointer hover:border-amber-500/30 transition-all shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-6 h-6 fill-amber-500" />
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">الالتزام المتتالي</div>
              <div className="text-base font-black text-amber-400">
                {streakStats.currentStreak} {streakStats.currentStreak === 1 ? 'يوم' : streakStats.currentStreak === 2 ? 'يومان' : streakStats.currentStreak <= 10 ? 'أيام' : 'يوماً'} 🔥
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Today's Routine Card */}
      <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/15 to-teal-500/0 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              تمرينك النهارده
            </span>

            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <span>آخر تمرين:</span>
              <strong className="text-slate-200">{lastWorkoutText}</strong>
            </span>
          </div>

          {isRestDay && !todayRoutine ? (
            /* Rest Day View */
            <div className="py-6 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-3xl">
                🌿
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-['Tajawal']">
                اليوم يوم راحة واستشفاء
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                العضلات والأربطة تحتاج الراحة لإعادة البناء. إذا شعرت بالرغبة في حركة خفيفة يمكنك تجربة جلسة الإنقاذ السريعة.
              </p>
              {miniRescueRoutine && (
                <button
                  onClick={() => onStartRoutine(miniRescueRoutine)}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-bold transition-all"
                >
                  <Zap className="w-4 h-4 text-emerald-400" />
                  بدء جلسة إطالة سريعة خفيفة (5 دقائق)
                </button>
              )}
            </div>
          ) : todayRoutine ? (
            /* Scheduled Routine View */
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight">
                  {todayRoutine.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 line-clamp-2">
                  {todayRoutine.description}
                </p>
              </div>

              {/* Routine metrics */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-300">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>{todayRoutine.totalEstimatedMinutes} دقيقة</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-300">
                  <span>🧘‍♂️ {todayRoutine.exerciseIds.length} تمارين</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold">
                  <span>{todayRoutine.tag}</span>
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
                onClick={() => onStartRoutine(todayRoutine)}
                className="w-full py-5 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-black text-lg sm:text-xl shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 group/btn pulse-glow"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-950/20 flex items-center justify-center">
                  <Play className="w-6 h-6 fill-slate-950 ml-0.5 group-hover/btn:scale-110 transition-transform" />
                </div>
                <span className="font-['Tajawal'] tracking-tight">
                  {streakStats.hasWorkedOutToday ? 'إعادة تشغيل تمرين اليوم ▶' : 'ابدأ تمرين اليوم ▶'}
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* "I don't feel like exercising today" - The Rescue Section */}
      {miniRescueRoutine && (
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/30 border border-teal-500/20 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-2xl shrink-0">
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
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 font-bold text-xs hover:bg-teal-500/30 hover:text-white transition-all shrink-0 flex items-center justify-center gap-1.5"
          >
            <span>ابدأ جلسة الإنقاذ (5 دقائق)</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Adaptive Routine Filter (كم وقت معك اليوم؟) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6">
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
            className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-emerald-500/40 text-center transition-all group"
          >
            <div className="text-lg font-black text-emerald-400 group-hover:scale-105 transition-transform">5 دقائق</div>
            <div className="text-[11px] text-slate-400 mt-0.5">إنقاذ سريع ومريح</div>
          </button>

          <button
            onClick={() => {
              if (todayRoutine) onStartRoutine(todayRoutine);
            }}
            className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-emerald-500/40 text-center transition-all group"
          >
            <div className="text-lg font-black text-sky-400 group-hover:scale-105 transition-transform">10 دقائق</div>
            <div className="text-[11px] text-slate-400 mt-0.5">مرونة وتليين الظهر</div>
          </button>

          <button
            onClick={() => onNavigateTab('exercises')}
            className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-emerald-500/40 text-center transition-all group"
          >
            <div className="text-lg font-black text-teal-400 group-hover:scale-105 transition-transform">15 دقيقة</div>
            <div className="text-[11px] text-slate-400 mt-0.5">جلسة علاجية متكاملة</div>
          </button>
        </div>
      </div>
    </div>
  );
};
