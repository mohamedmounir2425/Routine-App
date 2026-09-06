import React from 'react';
import { Flame, Clock, CheckCircle2, HeartHandshake, TrendingDown, Calendar as CalendarIcon, Smile, Meh } from 'lucide-react';
import { WorkoutLog } from '../../types';
import { StreakStats } from '../../db';

interface Props {
  streakStats: StreakStats;
  workoutLogs: WorkoutLog[];
}

export const ProgressStats: React.FC<Props> = ({ streakStats, workoutLogs }) => {
  // Compute Pain trends
  const logsWithPain = workoutLogs.filter(l => l.postPainScore !== undefined);
  const avgPostPain = logsWithPain.length > 0
    ? (logsWithPain.reduce((acc, l) => acc + (l.postPainScore || 0), 0) / logsWithPain.length).toFixed(1)
    : '0';

  const avgPrePain = logsWithPain.length > 0
    ? (logsWithPain.reduce((acc, l) => acc + (l.prePainScore || 0), 0) / logsWithPain.length).toFixed(1)
    : '0';

  // Last 14 days calendar representation
  const last14Days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dStr = d.toISOString().split('T')[0];
    const hasLog = workoutLogs.some(l => l.completedAt.split('T')[0] === dStr);
    const dayLetter = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'][d.getDay()];
    return {
      date: d,
      dStr,
      hasLog,
      dayLetter,
      dayNum: d.getDate(),
    };
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight">
          سجل الإنجاز ومؤشرات التحسن 📊
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          متابعة مستمرة لالتزامك وتطور مستوى راحة ظهرك وانخفاض الألم مع التمارين.
        </p>
      </div>

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">الالتزام الحالي</span>
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">
            {streakStats.currentStreak}
          </div>
          <div className="text-xs text-slate-500 mt-1">أطول فترة: {streakStats.longestStreak} يوماً</div>
        </div>

        {/* Total Sessions */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">إجمالي الجلسات</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {streakStats.totalWorkouts}
          </div>
          <div className="text-xs text-slate-500 mt-1">جلسة تمرين مكتملة</div>
        </div>

        {/* Total Minutes */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">وقت الاستثمار</span>
            <Clock className="w-5 h-5 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-sky-400 font-mono">
            {streakStats.totalMinutes}
          </div>
          <div className="text-xs text-slate-500 mt-1">دقيقة من الحركة الصحية</div>
        </div>

        {/* Pain Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">معدل الألم بعد التمرين</span>
            <TrendingDown className="w-5 h-5 text-teal-400" />
          </div>
          <div className="text-3xl font-black text-teal-400 font-mono">
            {avgPostPain} <span className="text-sm font-normal text-slate-400">/ 10</span>
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-semibold">تحسن ملحوظ في الراحة</div>
        </div>
      </div>

      {/* Middle Section: Calendar & Pain Analysis in 2-Column Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* 14-Day Consistency Calendar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-['Tajawal'] flex items-center gap-2 mb-4">
              <CalendarIcon className="w-4 h-4 text-emerald-400" />
              التزام آخر أسبوعين (Consistency Track)
            </h3>

            <div className="grid grid-cols-7 gap-2 text-center">
              {last14Days.map((d, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center justify-between gap-1 transition-all ${
                    d.hasLog
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <span className="text-[10px]">{d.dayLetter}</span>
                  <span className="text-sm font-bold">{d.dayNum}</span>
                  <span className="text-xs mt-0.5">
                    {d.hasLog ? '✓' : '•'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-4 text-center">
            {streakStats.currentStreak > 0 ? `أنت ملتزم لـ ${streakStats.currentStreak} أيام متتالية! استمر 💪` : 'ابدأ اليوم لتبني سلسلتك'}
          </div>
        </div>

        {/* Pain & Comfort Analysis */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white font-['Tajawal'] flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-teal-400" />
                مقارنة مستوى الألم قبل وبعد التمارين
              </h3>
              <span className="text-xs text-slate-400">0 = راحة | 10 = ألم</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">متوسط الألم قبل:</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">{avgPrePain} من 10</div>
                </div>
                <Meh className="w-8 h-8 text-amber-400/80" />
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">متوسط الراحة بعد:</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">{avgPostPain} من 10</div>
                </div>
                <Smile className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
            💡 <strong>ملاحظة:</strong> انخفاض مؤشر الألم بعد التمرين يدل على نجاح تقوية واستطالة العضلات المحيطة بالفقرات.
          </p>
        </div>
      </div>

      {/* Recent Workout Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h3 className="text-sm font-bold text-white font-['Tajawal'] mb-4">
          سجل الجلسات السابقة ({workoutLogs.length}):
        </h3>

        {workoutLogs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            لم تسجل أي تمارين بعد. ابدأ أول جلسة اليوم ليظهر إنجازك هنا!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {workoutLogs.slice(0, 8).map(log => {
              const dateStr = new Date(log.completedAt).toLocaleDateString('ar-EG', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={log.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-white text-sm font-['Tajawal']">{log.routineName}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">{dateStr}</div>
                    {log.notes && (
                      <div className="text-slate-300 text-[11px] mt-1 bg-slate-900/60 px-2 py-1 rounded-lg">
                        "{log.notes}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold">
                      ⏱ {log.durationMinutes} دقيقة
                    </span>
                    {log.postPainScore !== undefined && (
                      <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold">
                        راحة: {log.postPainScore}/10
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
