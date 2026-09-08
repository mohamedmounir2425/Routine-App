import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Flame, 
  Clock, 
  Sunrise, 
  Sunset, 
  BookMarked, 
  Plus, 
  ChevronLeft 
} from 'lucide-react';
import { SpaceShell } from '../../components/layout/SpaceShell';
import { 
  getDailyPrayersState, 
  toggleDailyPrayerFard, 
  isAzkarCategoryCompletedToday, 
  getAzkarStreak, 
  getQuranDailyStatus, 
  recordQuranPageRead, 
  getTodayDateString 
} from '../../db/worshipQueries';
import { getTodayTasbeehCount } from './tasbeeh/tasbeehQueries';
import { 
  getSavedLocation, 
  getNextPrayerInfo, 
  NextPrayerInfo 
} from './prayers/prayerTimesEngine';
import { db } from '../../db/database';
import { LifeTask } from '../../types';

const PRAYER_KEYS = [
  { id: 'fajr', name: 'الفجر' },
  { id: 'dhuhr', name: 'الظهر' },
  { id: 'asr', name: 'العصر' },
  { id: 'maghrib', name: 'المغرب' },
  { id: 'isha', name: 'العشاء' },
];

export const WorshipOverview: React.FC = () => {
  const navigate = useNavigate();
  const todayStr = getTodayDateString();

  // State
  const [streakStats, setStreakStats] = useState({ currentStreak: 0, totalCompleted: 0 });
  const [isMorningDone, setIsMorningDone] = useState(false);
  const [isEveningDone, setIsEveningDone] = useState(false);
  const [prayerState, setPrayerState] = useState(getDailyPrayersState(todayStr));
  const [quranStatus, setQuranStatus] = useState(getQuranDailyStatus(todayStr));
  const [tasbeehCount, setTasbeehCount] = useState(getTodayTasbeehCount());
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
  const [activities, setActivities] = useState<LifeTask[]>([]);
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  // Load domain data
  const loadWorshipData = async () => {
    const streak = await getAzkarStreak();
    setStreakStats(streak);

    const mDone = await isAzkarCategoryCompletedToday('morning', todayStr);
    const eDone = await isAzkarCategoryCompletedToday('evening', todayStr);
    setIsMorningDone(mDone);
    setIsEveningDone(eDone);

    setPrayerState(getDailyPrayersState(todayStr));
    setQuranStatus(getQuranDailyStatus(todayStr));
    setTasbeehCount(getTodayTasbeehCount());

    // Prayer times engine next prayer
    const loc = getSavedLocation();
    setNextPrayer(getNextPrayerInfo(loc.coords, loc.city.method));

    // Worship tasks
    const tasks = await db.tasks.where('spaceId').equals('worship').toArray();
    const todayTasks = tasks.filter((t) => {
      if (t.isRecurring) {
        return Array.isArray(t.recurringCompletionDates) && t.recurringCompletionDates.includes(todayStr);
      }
      return t.dueDate === todayStr || !t.dueDate;
    });
    setActivities(todayTasks);
  };

  useEffect(() => {
    loadWorshipData();
    const interval = setInterval(loadWorshipData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleTogglePrayer = (prayerId: string) => {
    toggleDailyPrayerFard(prayerId, todayStr);
    setPrayerState(getDailyPrayersState(todayStr));
  };

  const handleAddQuranPage = () => {
    const updated = recordQuranPageRead(1, todayStr);
    setQuranStatus(updated);
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityTitle.trim()) return;

    const newTask: LifeTask = {
      id: `worship_task_${Date.now()}`,
      spaceId: 'worship',
      title: newActivityTitle.trim(),
      priority: 'medium',
      isCompleted: false,
      dueDate: todayStr,
      createdAt: new Date().toISOString(),
    };

    await db.tasks.put(newTask);
    setNewActivityTitle('');
    setIsAddingActivity(false);
    await loadWorshipData();
  };

  const handleToggleActivity = async (task: LifeTask) => {
    const nextCompleted = !task.isCompleted;
    await db.tasks.update(task.id, {
      isCompleted: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : undefined,
    });
    await loadWorshipData();
  };

  // Computations
  const completedPrayersCount = PRAYER_KEYS.filter((p) => prayerState[p.id]?.fard).length;
  const remainingPrayers = PRAYER_KEYS.filter((p) => !prayerState[p.id]?.fard);

  return (
    <SpaceShell
      icon="🕌"
      title="مساحة العبادات والروحانيات"
      subtitle="«ألا بذكر الله تطمئن القلوب» - واحتك اليومية للذكر والصلاة والقرآن"
      badge={
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-amber-400">
          <Flame className="w-4 h-4 fill-amber-400" />
          <span>{streakStats.currentStreak} أيام التزام</span>
        </div>
      }
    >
      {/* 1. Next Prayer & Daily Status Hero Banner */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-teal-500/25 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            <span className="text-xs text-teal-300 font-bold">
              {nextPrayer?.isTomorrow ? 'الصلاة القادمة فجراً' : 'موعد الصلاة القادمة'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] flex items-center gap-2">
            <span>{nextPrayer ? nextPrayer.name : 'الصلوات المفروضة'}</span>
            {nextPrayer && (
              <span className="text-sm font-normal text-slate-300 font-mono">
                {nextPrayer.diffMinutes > 0 ? `(بعد ${nextPrayer.diffMinutes} دقيقة)` : '(حان الآن)'}
              </span>
            )}
          </h2>

          <p className="text-xs text-slate-300">
            أنجزت اليوم {completedPrayersCount} من 5 صلوات مفروضة
            {remainingPrayers.length > 0
              ? ` · المتبقي: ${remainingPrayers.map((p) => p.name).join('، ')}`
              : ' · تم أداء جميع صلوات اليوم بحمد الله ✓'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/worship/prayers')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-xs border border-teal-500/30 transition-all cursor-pointer shadow-sm"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>سجل الصلوات</span>
          </button>
        </div>
      </div>

      {/* 2. 1-Tap Quick Actions Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
        <button
          onClick={() => navigate('/worship/prayers')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 border border-white/10 shrink-0 transition-all cursor-pointer"
        >
          <span>🕌</span>
          <span>الصلوات</span>
        </button>

        <button
          onClick={() => navigate('/worship/azkar')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 border border-white/10 shrink-0 transition-all cursor-pointer"
        >
          <Sunrise className="w-3.5 h-3.5 text-amber-400" />
          <span>أذكار الصباح</span>
        </button>

        <button
          onClick={() => navigate('/worship/azkar')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 border border-white/10 shrink-0 transition-all cursor-pointer"
        >
          <Sunset className="w-3.5 h-3.5 text-indigo-400" />
          <span>أذكار المساء</span>
        </button>

        <button
          onClick={() => navigate('/worship/quran')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 border border-white/10 shrink-0 transition-all cursor-pointer"
        >
          <span>📖</span>
          <span>ورد القرآن</span>
        </button>

        <button
          onClick={() => navigate('/worship/tasbeeh')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 border border-white/10 shrink-0 transition-all cursor-pointer"
        >
          <span>📿</span>
          <span>السبحة الذكية</span>
        </button>

        <button
          onClick={() => navigate('/worship/progress')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-xs font-bold text-emerald-300 border border-emerald-500/30 shrink-0 transition-all cursor-pointer"
        >
          <span>📊</span>
          <span>سجل التقدم</span>
        </button>
      </div>

      {/* 3. Four Core Worship Pillars (Calm Concise Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1: الصلوات الخمس */}
        <div className="liquid-glass-card rounded-3xl p-5 border border-teal-500/20 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-xl">
                🕌
              </div>
              <div>
                <h3 className="text-base font-black text-white font-['Tajawal']">الصلوات المفروضة</h3>
                <p className="text-xs text-slate-400">أُديت {completedPrayersCount} من 5 صلوات اليوم</p>
              </div>
            </div>

            <span className="text-sm font-black font-mono text-teal-300">
              {completedPrayersCount}/5
            </span>
          </div>

          {/* Quick Prayers Pills */}
          <div className="grid grid-cols-5 gap-1.5">
            {PRAYER_KEYS.map((p) => {
              const isDone = !!prayerState[p.id]?.fard;
              return (
                <button
                  key={p.id}
                  onClick={() => handleTogglePrayer(p.id)}
                  className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                    isDone
                      ? 'bg-teal-500/20 border-teal-500/40 text-teal-300 font-bold'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-[11px] block">{p.name}</span>
                  <span className="text-xs block mt-0.5">{isDone ? '✓' : '○'}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">الفروض والنوافل والسنن</span>
            <button
              onClick={() => navigate('/worship/prayers')}
              className="text-teal-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>فتح متتبع الصلاة</span>
              <ChevronLeft className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </button>
          </div>
        </div>

        {/* Pillar 2: أذكار الصباح والمساء */}
        <div className="liquid-glass-card rounded-3xl p-5 border border-amber-500/20 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl">
                ☀️
              </div>
              <div>
                <h3 className="text-base font-black text-white font-['Tajawal']">أذكار الصباح والمساء</h3>
                <p className="text-xs text-slate-400">حصن المسلم اليومي المستمر</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{streakStats.currentStreak} أيام</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div
              onClick={() => navigate('/worship/azkar')}
              className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                isMorningDone
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:border-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sunrise className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">أذكار الصباح</span>
              </div>
              <span className="text-xs font-bold">{isMorningDone ? '✓' : 'متبقية'}</span>
            </div>

            <div
              onClick={() => navigate('/worship/azkar')}
              className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                isEveningDone
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:border-indigo-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sunset className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">أذكار المساء</span>
              </div>
              <span className="text-xs font-bold">{isEveningDone ? '✓' : 'متبقية'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">تلاوة كاملة مع العداد النبضي</span>
            <button
              onClick={() => navigate('/worship/azkar')}
              className="text-amber-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>فتح مجمع الأذكار</span>
              <ChevronLeft className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </button>
          </div>
        </div>

        {/* Pillar 3: الورد القرآني */}
        <div className="liquid-glass-card rounded-3xl p-5 border border-emerald-500/20 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl">
                📖
              </div>
              <div>
                <h3 className="text-base font-black text-white font-['Tajawal']">ورد القرآن اليومي</h3>
                <p className="text-xs text-slate-400">
                  قرأت {quranStatus.pagesRead} من {quranStatus.targetPages} صفحات
                </p>
              </div>
            </div>

            <span className="text-sm font-black font-mono text-emerald-400">
              {quranStatus.progressPercent}%
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200">الفاصل: {quranStatus.bookmarkSurah} · ص {quranStatus.bookmarkPage}</span>
            </div>

            <button
              onClick={handleAddQuranPage}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
              title="تسجيل صفحة إضافية"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>صفحة</span>
            </button>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">حفظ تلقائي محلي للفاصل</span>
            <button
              onClick={() => navigate('/worship/quran')}
              className="text-emerald-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>متابعة الورد</span>
              <ChevronLeft className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </button>
          </div>
        </div>

        {/* Pillar 4: السبحة الذكية */}
        <div className="liquid-glass-card rounded-3xl p-5 border border-teal-500/20 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-xl">
                📿
              </div>
              <div>
                <h3 className="text-base font-black text-white font-['Tajawal']">السبحة الإلكترونية</h3>
                <p className="text-xs text-slate-400">تسبيح، استغفار، وحوقلة</p>
              </div>
            </div>

            <span className="text-sm font-black font-mono text-teal-300">
              {tasbeehCount} تسبيحة
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-300">عداد الذكر التفاعلي اليومي</span>
            <button
              onClick={() => navigate('/worship/tasbeeh')}
              className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-xs transition-colors cursor-pointer"
            >
              بدء التسبيح
            </button>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">نبضات اهتزازية تفاعلية</span>
            <button
              onClick={() => navigate('/worship/tasbeeh')}
              className="text-teal-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>فتح السبحة</span>
              <ChevronLeft className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Worship Activities (LifeTask layer) */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <h3 className="text-base font-black text-white font-['Tajawal']">أعمال وأنشطة عبادية</h3>
            <span className="text-xs text-slate-400">(دروس، زيارة مسجد، قراءة إسلامية)</span>
          </div>

          <button
            onClick={() => setIsAddingActivity(!isAddingActivity)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة نشاط</span>
          </button>
        </div>

        {isAddingActivity && (
          <form onSubmit={handleAddActivity} className="flex items-center gap-2 animate-in fade-in duration-150">
            <input
              type="text"
              value={newActivityTitle}
              onChange={(e) => setNewActivityTitle(e.target.value)}
              placeholder="مثال: حضور درس الفقه بعد المغرب، قراءة كتاب إسلامي..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900/80 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              إضافة
            </button>
          </form>
        )}

        {activities.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            لا توجد أعمال عبادية مخصصة اليوم. يمكنك إضافة درس أو زيارة مسجد لتظهر في روتينك اليومي.
          </p>
        ) : (
          <div className="space-y-2">
            {activities.map((act) => (
              <div
                key={act.id}
                onClick={() => handleToggleActivity(act)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                  act.isCompleted
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-slate-400 line-through'
                    : 'bg-white/5 border-white/10 text-white hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                    act.isCompleted ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black' : 'border-slate-500'
                  }`}>
                    {act.isCompleted ? '✓' : ''}
                  </span>
                  <span>{act.title}</span>
                </div>

                <span className="text-[10px] text-slate-500">
                  {act.isCompleted ? 'أُنجز' : 'مجدول لليوم'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </SpaceShell>
  );
};
