import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Flame, 
  Dumbbell, 
  CheckCircle2, 
  Timer, 
  Calendar
} from 'lucide-react';
import { ProgressNavTabs } from '../components/ProgressNavTabs';
import { WeeklyProgressMatrix } from '../progressTypes';
import { getWeeklyProgress } from '../progressAggregator';

export const WeeklyTrendsView: React.FC = () => {
  const [matrix, setMatrix] = useState<WeeklyProgressMatrix | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getWeeklyProgress();
        setMatrix(data);
      } catch (err) {
        console.error('Failed to load weekly progress:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !matrix) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 w-full text-right font-['Tajawal'] pb-20">
        <div className="flex flex-col gap-1 pb-3 border-b border-white/5">
          <h1 className="text-2xl font-black text-white">الاتجاه الأسبوعي</h1>
          <p className="text-xs text-slate-400">تحليل الاستمرارية والتناسق على مدار الأسبوع</p>
        </div>
        <ProgressNavTabs />
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">جاري تجميع الاتجاهات الأسبوعية التراكمية...</p>
        </div>
      </div>
    );
  }

  const { days, averageScore, bestDay, totalWorkouts, totalTasksCompleted, totalFocusMinutes } = matrix;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 w-full text-right font-['Tajawal'] pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📈</span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              الاتجاه الأسبوعي
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            متابعة ثبات الأداء وعاداتك على مدار الأيام الـ 7 الماضية
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-teal-400 flex items-center gap-1.5">
            <Flame className="w-4 h-4" />
            <span>متوسط الأسبوع: {averageScore}%</span>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <ProgressNavTabs />

      {/* Weekly Aggregated Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold">متوسط الالتزام اليومي</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">{averageScore}%</span>
            <span className="text-[10px] text-slate-500">خلال 7 أيام</span>
          </div>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold">التمارين المنجزة</span>
            <Dumbbell className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">{totalWorkouts}</span>
            <span className="text-[10px] text-slate-500">جلسة تدريبية</span>
          </div>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold">المهام المنجزة</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-400 font-mono">{totalTasksCompleted}</span>
            <span className="text-[10px] text-slate-500">مهمة مكتملة</span>
          </div>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold">دقائق التركيز العميق</span>
            <Timer className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-400 font-mono">{totalFocusMinutes}</span>
            <span className="text-[10px] text-slate-500">دقيقة تركيز</span>
          </div>
        </div>
      </div>

      {/* 7-Day Performance Bar Chart */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span>مخطط نقاط التنفيذ اليومي عبر الأسبوع</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              مقارنة الإنجاز المركب لكل يوم من الأيام السبعة الماضية
            </p>
          </div>

          {bestDay && (
            <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold hidden sm:inline">
              اليوم الأفضل: {bestDay.dayNameAr} ({bestDay.overallScore}%)
            </span>
          )}
        </div>

        {/* Visual Columns */}
        <div className="flex items-end justify-between gap-2 sm:gap-4 h-48 pt-4 px-2">
          {days.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-xs font-mono font-bold text-slate-300 group-hover:text-emerald-400 transition-colors">
                {d.overallScore}%
              </span>

              <div className="w-full max-w-[48px] rounded-2xl bg-white/5 overflow-hidden h-full flex items-end p-1">
                <div
                  className="w-full rounded-xl bg-gradient-to-t from-emerald-500 via-teal-400 to-cyan-300 transition-all duration-500 group-hover:opacity-100 opacity-80"
                  style={{ height: `${Math.max(12, d.overallScore)}%` }}
                />
              </div>

              <div className="text-center">
                <span className="text-xs font-bold text-slate-200 block">{d.dayNameAr}</span>
                <span className="text-[10px] text-slate-400 font-mono block">{d.date.slice(5)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Day-by-Day Activity Breakdown */}
      <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-white">تفصيل أنشطة كل يوم</h3>

        <div className="divide-y divide-white/5">
          {days.map((day) => (
            <div key={day.date} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-xs text-white">
                  {day.dayNameAr.slice(0, 3)}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{day.dayNameAr}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{day.date}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    العبادات: {day.worshipScore}% • التمارين: {day.workoutsCount} • المهام: {day.completedTasksCount}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="text-base font-black font-mono text-teal-400">
                  {day.overallScore}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
