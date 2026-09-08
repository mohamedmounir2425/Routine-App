import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpaceShell } from '../../../components/layout/SpaceShell';
import { fetchWorshipProgressData } from './worshipProgressService';
import { WorshipDayMetrics, WorshipWeeklyMatrix, WorshipConsistencyStats } from './worshipProgressCalc';
import { 
  Clock, 
  Flame, 
  Calendar,
  Sparkles,
  ChevronLeft
} from 'lucide-react';

export const WorshipProgress: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'consistency'>('today');
  const [isLoading, setIsLoading] = useState(true);
  const [todayMetrics, setTodayMetrics] = useState<WorshipDayMetrics | null>(null);
  const [weeklyMatrix, setWeeklyMatrix] = useState<WorshipWeeklyMatrix | null>(null);
  const [consistencyStats, setConsistencyStats] = useState<WorshipConsistencyStats | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWorshipProgressData();
        setTodayMetrics(data.todayMetrics);
        setWeeklyMatrix(data.weeklyMatrix);
        setConsistencyStats(data.consistencyStats);
      } catch (err) {
        console.error('Failed to load worship progress data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading || !todayMetrics || !weeklyMatrix || !consistencyStats) {
    return (
      <SpaceShell
        icon="📊"
        title="سجل التقدم والالتزام الإيماني"
        subtitle="متابعة يومية وأسبوعية متوازنة لصلواتك وأذكارك ووردك القرآني"
      >
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">جاري جمع مؤشرات عبادتك المباركة...</p>
        </div>
      </SpaceShell>
    );
  }

  const PRAYER_NAMES: Record<string, string> = {
    fajr: 'الفجر',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
  };

  return (
    <SpaceShell
      icon="📊"
      title="سجل التقدم والالتزام الإيماني"
      subtitle="متابعة يومية وأسبوعية متوازنة لصلواتك وأذكارك ووردك القرآني"
      badge={
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-emerald-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{todayMetrics.primaryCommitmentPercent}% إنجاز اليوم</span>
        </div>
      }
    >
      {/* Segmented View Switcher */}
      <div className="flex items-center justify-center sm:justify-start gap-1 p-1 rounded-2xl liquid-glass-dock max-w-md">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'today'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>اليوم</span>
        </button>

        <button
          onClick={() => setActiveTab('week')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'week'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>هذا الأسبوع</span>
        </button>

        <button
          onClick={() => setActiveTab('consistency')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'consistency'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>أيام الالتزام</span>
        </button>
      </div>

      {/* 1. DAILY VIEW */}
      {activeTab === 'today' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Daily Score Banner */}
          <div className="liquid-glass-card rounded-3xl p-6 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">مستوى الالتزام اليومي المحدد</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] flex items-center gap-2">
                <span>{todayMetrics.primaryCommitmentPercent}%</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/25">
                  {todayMetrics.primaryCommitmentPercent >= 80 ? 'يوم مبارك متميز 🌟' : todayMetrics.primaryCommitmentPercent >= 40 ? 'تقدم طيب، واصل 🌿' : 'ابدأ بوردك وصلاتك 🤲'}
                </span>
              </h2>
            </div>

            <div className="h-2.5 w-full sm:w-48 rounded-full bg-white/5 overflow-hidden border border-white/10 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${todayMetrics.primaryCommitmentPercent}%` }}
              />
            </div>
          </div>

          {/* Checklist of 5 Core Commitments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Prayers */}
            <div className="p-4 rounded-2xl liquid-glass-card border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-base">
                    🕌
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">الصلوات المفروضة</h3>
                    <p className="text-[11px] text-slate-400">{todayMetrics.prayersCompletedCount} من 5 صلوات أُديت</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/worship/prayers')}
                  className="text-[11px] text-teal-300 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>التفاصيل</span>
                  <ChevronLeft className="w-3 h-3 rtl:-scale-x-100" />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => {
                  const done = !!todayMetrics.prayerDetails[p]?.fard;
                  return (
                    <div
                      key={p}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        done
                          ? 'bg-teal-500/20 border-teal-500/40 text-teal-300 font-bold'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <span className="text-[10px] block">{PRAYER_NAMES[p]}</span>
                      <span className="text-xs block mt-0.5">{done ? '✓' : '—'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Morning & Evening Azkar */}
            <div className="p-4 rounded-2xl liquid-glass-card border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-base">
                    📿
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">أذكار الصباح والمساء</h3>
                    <p className="text-[11px] text-slate-400">حصن المسلم وبركة النهار والليل</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/worship/azkar')}
                  className="text-[11px] text-amber-300 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>فتح الأذكار</span>
                  <ChevronLeft className="w-3 h-3 rtl:-scale-x-100" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  todayMetrics.isMorningAzkarDone
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}>
                  <span>أذكار الصباح</span>
                  <span>{todayMetrics.isMorningAzkarDone ? 'أُنجزت ✓' : 'متبقية'}</span>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  todayMetrics.isEveningAzkarDone
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-bold'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}>
                  <span>أذكار المساء</span>
                  <span>{todayMetrics.isEveningAzkarDone ? 'أُنجزت ✓' : 'متبقية'}</span>
                </div>
              </div>
            </div>

            {/* Quran Daily Wird */}
            <div className="p-4 rounded-2xl liquid-glass-card border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-base">
                    📖
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">الورد القرآني</h3>
                    <p className="text-[11px] text-slate-400">{todayMetrics.quran.pagesRead} من {todayMetrics.quran.targetPages} صفحات</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/worship/quran')}
                  className="text-[11px] text-emerald-300 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>متابعة القراءة</span>
                  <ChevronLeft className="w-3 h-3 rtl:-scale-x-100" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-300">الفاصل الحالي: {todayMetrics.quran.bookmarkSurah} (ص {todayMetrics.quran.bookmarkPage})</span>
                <span className="font-mono font-bold text-emerald-400">{todayMetrics.quran.progressPercent}%</span>
              </div>
            </div>

            {/* Tasbeeh / Sebha */}
            <div className="p-4 rounded-2xl liquid-glass-card border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-base">
                    ⚪
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">السبحة الإلكترونية</h3>
                    <p className="text-[11px] text-slate-400">{todayMetrics.tasbeehCount} تسبيحة واستغفار اليوم</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/worship/tasbeeh')}
                  className="text-[11px] text-teal-300 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>فتح السبحة</span>
                  <ChevronLeft className="w-3 h-3 rtl:-scale-x-100" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span>ذكر الله اليوم</span>
                <span className="font-bold text-teal-300">{todayMetrics.tasbeehCount > 0 ? 'نشط اليوم ✓' : 'لم تبدأ بعد'}</span>
              </div>
            </div>
          </div>

          {/* Optional Worship Activities History */}
          {todayMetrics.worshipActivities.length > 0 && (
            <div className="p-4 rounded-2xl liquid-glass-card border border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-slate-300">أنشطة وأعمال عبادية إضافية</h3>
              <div className="space-y-2">
                {todayMetrics.worshipActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-slate-200"
                  >
                    <span>{act.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      act.isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-400'
                    }`}>
                      {act.isCompleted ? 'أُنجز ✓' : 'مجدول'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. WEEKLY MATRIX VIEW */}
      {activeTab === 'week' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-emerald-500/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
              <h3 className="text-base font-black text-white font-['Tajawal']">
                خلاصة الأسبوع (٧ أيام ماضية)
              </h3>
              <span className="text-xs font-bold text-emerald-400">
                متوسط الالتزام: {weeklyMatrix.avgCommitmentPercent}%
              </span>
            </div>

            {/* 7-Days Table / Cards */}
            <div className="space-y-2">
              {weeklyMatrix.days.map((day) => (
                <div
                  key={day.dateStr}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-16 font-bold text-slate-200">{day.dayNameAr}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{day.dateStr}</span>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Prayers Dots */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 ml-1">الصلوات:</span>
                      {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => {
                        const done = !!day.prayerDetails[p]?.fard;
                        return (
                          <span
                            key={p}
                            title={`${PRAYER_NAMES[p]}: ${done ? 'أُديت' : 'لم تُسجل'}`}
                            className={`w-2.5 h-2.5 rounded-full ${
                              done ? 'bg-teal-400 shadow-xs shadow-teal-500/50' : 'bg-white/15'
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Azkar Pills */}
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded ${
                        day.isMorningAzkarDone ? 'bg-amber-500/20 text-amber-300 font-bold' : 'bg-white/5 text-slate-500'
                      }`}>
                        صباح
                      </span>
                      <span className={`px-1.5 py-0.5 rounded ${
                        day.isEveningAzkarDone ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'bg-white/5 text-slate-500'
                      }`}>
                        مساء
                      </span>
                    </div>

                    {/* Quran Pages */}
                    <span className="text-[11px] font-mono text-emerald-400">
                      {day.quran.pagesRead} ص
                    </span>

                    {/* Day Score */}
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 font-bold text-[11px] font-mono">
                      {day.primaryCommitmentPercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. CONSISTENCY VIEW */}
      {activeTab === 'consistency' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Azkar Streak */}
            <div className="liquid-glass-card rounded-3xl p-5 border border-amber-500/20 space-y-2 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl">
                🔥
              </div>
              <span className="text-xs text-slate-400 font-medium">سلسلة الأذكار المتتالية</span>
              <h3 className="text-2xl font-black text-amber-400 font-mono">
                {consistencyStats.azkarStreak} أيام
              </h3>
              <p className="text-[11px] text-slate-400">مواظبة على أذكار الصباح والمساء</p>
            </div>

            {/* Weekly Prayer Rate */}
            <div className="liquid-glass-card rounded-3xl p-5 border border-teal-500/20 space-y-2 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-2xl">
                🕌
              </div>
              <span className="text-xs text-slate-400 font-medium">نسبة الصلوات هذا الأسبوع</span>
              <h3 className="text-2xl font-black text-teal-400 font-mono">
                {consistencyStats.weeklyPrayerRate}%
              </h3>
              <p className="text-[11px] text-slate-400">
                {weeklyMatrix.totalPrayersCompleted} من {weeklyMatrix.days.length * 5} صلوات مفروضة
              </p>
            </div>

            {/* Quran Weekly Total */}
            <div className="liquid-glass-card rounded-3xl p-5 border border-emerald-500/20 space-y-2 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl">
                📖
              </div>
              <span className="text-xs text-slate-400 font-medium">مجموع صفحات القرآن أسبوعياً</span>
              <h3 className="text-2xl font-black text-emerald-400 font-mono">
                {consistencyStats.weeklyQuranTotalPages} صفحة
              </h3>
              <p className="text-[11px] text-slate-400">ورد القراءة في آخر ٧ أيام</p>
            </div>
          </div>
        </div>
      )}
    </SpaceShell>
  );
};
