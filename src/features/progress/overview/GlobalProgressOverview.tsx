import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  Target,
  ArrowUpRight
} from 'lucide-react';
import { ProgressNavTabs } from '../components/ProgressNavTabs';
import { GlobalProgressSnapshot, WeeklyProgressMatrix } from '../progressTypes';
import { getGlobalProgressSnapshot, getWeeklyProgress } from '../progressAggregator';

export const GlobalProgressOverview: React.FC = () => {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<GlobalProgressSnapshot | null>(null);
  const [weeklyMatrix, setWeeklyMatrix] = useState<WeeklyProgressMatrix | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [snap, week] = await Promise.all([
          getGlobalProgressSnapshot(),
          getWeeklyProgress(),
        ]);
        setSnapshot(snap);
        setWeeklyMatrix(week);
      } catch (err) {
        console.error('Failed to load global progress overview:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !snapshot) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 w-full text-right font-['Tajawal'] pb-20">
        <div className="flex flex-col gap-1 pb-3 border-b border-white/5">
          <h1 className="text-2xl font-black text-white">التقدم</h1>
          <p className="text-xs text-slate-400">صورة شاملة عن تقدمك في مختلف جوانب حياتك</p>
        </div>
        <ProgressNavTabs />
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">جاري جمع مؤشرات الأداء الشاملة...</p>
        </div>
      </div>
    );
  }

  const { overallScore, spaces, today, plans } = snapshot;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 w-full text-right font-['Tajawal'] pb-20">
      {/* Global Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📊</span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              التقدم
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            صورة شاملة عن تقدمك في مختلف جوانب حياتك
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>لوحة المؤشرات الموحدة</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <ProgressNavTabs />

      {/* Hero Card: Overall Life OS Daily Execution Score */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-right max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>نقاط التنفيذ اليومي لنظام Life OS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {overallScore >= 80 
                ? 'أداء متميز وتوازن رائع عبر كافة المسارات' 
                : overallScore >= 50 
                ? 'تقدم مستقر ومستمر نحو أهداف اليوم' 
                : 'بداية يوم جديدة وفرصة لمواصلة البناء'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              مؤشر مركب يقيس التزامك بالمهام المجدولة اليوم في العبادات (30%)، الصحة (25%)، العمل (25%)، والمنزل (20%). الخطط الاستراتيجية لا تضاعف النقاط اليومية.
            </p>
          </div>

          {/* Radial / Circular Score Display */}
          <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-900/60 border border-white/10 shrink-0 min-w-[160px]">
            <div className="relative flex items-center justify-center">
              <span className="text-5xl sm:text-6xl font-black font-mono bg-gradient-to-tr from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                {overallScore}%
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-400 mt-1">معدل الإنجاز اليومي</span>
          </div>
        </div>
      </div>

      {/* 4 Space Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span>إنجاز المساحات الحياتية اليوم</span>
          </h3>
          <button
            onClick={() => navigate('/progress/spaces')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>مقارنة وتوزيع النشاط</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 🕌 Worship Card */}
          <div className="liquid-glass-card rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🕌</span>
                <span className="text-xl font-black font-mono text-emerald-400">{spaces.worship.score}%</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{spaces.worship.label}</h4>
              <p className="text-xs text-slate-400">
                {spaces.worship.details.prayersCompleted}/5 صلوات فرائض
                {spaces.worship.details.isMorningDone ? ' • أذكار الصباح' : ''}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${spaces.worship.score}%` }}
                />
              </div>
              <button
                onClick={() => navigate('/worship/progress')}
                className="w-full py-1.5 px-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>سجل العبادات التفصيلي</span>
                <ArrowUpRight className="w-3 h-3 rtl:-scale-x-100" />
              </button>
            </div>
          </div>

          {/* 🏋️ Health Card */}
          <div className="liquid-glass-card rounded-2xl p-5 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🏋️</span>
                <span className="text-xl font-black font-mono text-amber-400">{spaces.health.score}%</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{spaces.health.label}</h4>
              <p className="text-xs text-slate-400">
                {spaces.health.details.isRestDay 
                  ? 'يوم استراحة مجدول' 
                  : `${spaces.health.completedCount}/${spaces.health.totalCount} تمارين مجدولة`}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${spaces.health.score}%` }}
                />
              </div>
              <button
                onClick={() => navigate('/health/progress')}
                className="w-full py-1.5 px-2 rounded-xl bg-white/5 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>إحصائيات الصحة والتمارين</span>
                <ArrowUpRight className="w-3 h-3 rtl:-scale-x-100" />
              </button>
            </div>
          </div>

          {/* 💼 Work Card */}
          <div className="liquid-glass-card rounded-2xl p-5 border border-sky-500/20 hover:border-sky-500/40 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">💼</span>
                <span className="text-xl font-black font-mono text-sky-400">{spaces.work.score}%</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{spaces.work.label}</h4>
              <p className="text-xs text-slate-400">
                {spaces.work.totalCount > 0 
                  ? `${spaces.work.completedCount}/${spaces.work.totalCount} مهام مستحقة` 
                  : 'لا توجد مهام عمل مجدولة'}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div 
                  className="h-full bg-sky-400 rounded-full transition-all duration-500"
                  style={{ width: `${spaces.work.score}%` }}
                />
              </div>
              <button
                onClick={() => navigate('/work/progress')}
                className="w-full py-1.5 px-2 rounded-xl bg-white/5 hover:bg-sky-500/20 text-sky-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>سجل إنجاز العمل والتركيز</span>
                <ArrowUpRight className="w-3 h-3 rtl:-scale-x-100" />
              </button>
            </div>
          </div>

          {/* 🏠 Home Card */}
          <div className="liquid-glass-card rounded-2xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🏠</span>
                <span className="text-xl font-black font-mono text-purple-400">{spaces.home.score}%</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{spaces.home.label}</h4>
              <p className="text-xs text-slate-400">
                {spaces.home.totalCount > 0 
                  ? `${spaces.home.completedCount}/${spaces.home.totalCount} مهام وروتينات` 
                  : 'لا مهام منزلية معلقة'}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div 
                  className="h-full bg-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${spaces.home.score}%` }}
                />
              </div>
              <button
                onClick={() => navigate('/home')}
                className="w-full py-1.5 px-2 rounded-xl bg-white/5 hover:bg-purple-500/20 text-purple-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>مساحة المنزل والمشاريع</span>
                <ArrowUpRight className="w-3 h-3 rtl:-scale-x-100" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Today Execution Summary & 7-Day Consistency Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today Performance Snapshot */}
        <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>موجز تنفيذ اليوم</span>
            </h3>
            <button
              onClick={() => navigate('/progress/today')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>تفاصيل أداء اليوم</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 font-bold block mb-1">المهام المنجزة</span>
              <span className="text-xl font-black font-mono text-emerald-400">
                {today.completedItems}
              </span>
              <span className="text-[10px] text-slate-500 block">من {today.totalItems}</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 font-bold block mb-1">المتبقي اليوم</span>
              <span className="text-xl font-black font-mono text-sky-400">
                {today.remainingItems}
              </span>
              <span className="text-[10px] text-slate-500 block">بانتظار الإنجاز</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 font-bold block mb-1">المتأخرات</span>
              <span className={`text-xl font-black font-mono ${today.overdueItems > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {today.overdueItems}
              </span>
              <span className="text-[10px] text-slate-500 block">من أيام سابقة</span>
            </div>
          </div>
        </div>

        {/* 7-Day Consistency Preview */}
        <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <span>مؤشر الالتزام الأسبوعي (7 أيام)</span>
            </h3>
            <button
              onClick={() => navigate('/progress/week')}
              className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>الاتجاه الكامل</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </button>
          </div>

          {weeklyMatrix ? (
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-1.5 h-20 pt-2 px-1">
                {weeklyMatrix.days.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[9px] font-mono text-slate-400 font-bold">{d.overallScore}%</span>
                    <div className="w-full max-w-[28px] rounded-t-lg bg-white/5 overflow-hidden h-full flex items-end">
                      <div 
                        className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-teal-400 transition-all duration-300"
                        style={{ height: `${Math.max(10, d.overallScore)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 truncate max-w-full">
                      {d.dayNameAr.slice(0, 3)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                <span>متوسط الأسبوع: <strong className="text-white font-mono">{weeklyMatrix.averageScore}%</strong></span>
                <span>إجمالي التمارين: <strong className="text-amber-400 font-mono">{weeklyMatrix.totalWorkouts}</strong></span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">جاري حساب الاتجاه الأسبوعي...</p>
          )}
        </div>
      </div>

      {/* Strategic Plans Teaser Card */}
      <div className="liquid-glass-card rounded-2xl p-5 border border-indigo-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">الخطط والرؤية الاستراتيجية بعيدة المدى</h3>
          </div>
          <button
            onClick={() => navigate('/progress/plans')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>استعراض تقدم الخطط</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-400 font-mono">
                {plans.averageProgress}%
              </span>
              <span className="text-xs text-slate-300">متوسط إنجاز الخطط النشطة ({plans.activePlans} خطط)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              تم إنجاز {plans.completedMilestones} من أصل {plans.totalMilestones} مرحلة استراتيجية حتى الآن
            </p>
          </div>

          <button
            onClick={() => navigate('/plans')}
            className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold shrink-0 transition-all cursor-pointer"
          >
            إدارة الخطط والمراحل
          </button>
        </div>
      </div>
    </div>
  );
};
