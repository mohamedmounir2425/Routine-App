import React, { useState, useEffect, useMemo } from 'react';
import { Dhikr, AzkarCategoryKey, AzkarLog } from '../types';
import { 
  ALL_DHIKR, 
  MORNING_DHIKR, 
  EVENING_DHIKR, 
  getAzkarByCategory, 
  getCategoryTitle, 
  searchAzkar 
} from './utils';
import { AzkarCard } from './components/AzkarCard';
import { AzkarPlayer } from './components/AzkarPlayer';
import { 
  saveAzkarLog, 
  getTodayAzkarLogs, 
  getAzkarStreak, 
  isAzkarCategoryCompletedToday 
} from '../../../db/worshipQueries';
import { 
  Search, 
  CheckCircle2, 
  Play, 
  Flame, 
  Clock, 
  RotateCcw,
  ChevronDown
} from 'lucide-react';

const CATEGORIES: { key: AzkarCategoryKey; label: string; icon: string }[] = [
  { key: 'all', label: 'الكل', icon: '📖' },
  { key: 'morning', label: 'أذكار الصباح', icon: '🌅' },
  { key: 'evening', label: 'أذكار المساء', icon: '🌙' },
  { key: 'waking', label: 'الاستيقاظ', icon: '☀️' },
  { key: 'sleeping', label: 'النوم', icon: '🛌' },
  { key: 'after_prayer', label: 'بعد الصلاة', icon: '🕌' },
  { key: 'ruqyah', label: 'الرقية الشرعية', icon: '🛡️' },
  { key: 'misc', label: 'أدعية منوعة', icon: '✨' },
];

export const AzkarHubView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<AzkarCategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(25);
  const [todayLogs, setTodayLogs] = useState<AzkarLog[]>([]);
  const [streakStats, setStreakStats] = useState({ currentStreak: 0, totalCompleted: 0 });
  const [isMorningDone, setIsMorningDone] = useState(false);
  const [isEveningDone, setIsEveningDone] = useState(false);

  // Active full-screen player session state
  const [activePlayerSession, setActivePlayerSession] = useState<{
    dhikrs: Dhikr[];
    title: string;
    categoryKey: AzkarCategoryKey;
  } | null>(null);

  // Load today's logs & streaks
  const refreshStats = async () => {
    try {
      const logs = await getTodayAzkarLogs();
      setTodayLogs(logs);

      const morningDone = await isAzkarCategoryCompletedToday('morning');
      const eveningDone = await isAzkarCategoryCompletedToday('evening');
      setIsMorningDone(morningDone);
      setIsEveningDone(eveningDone);

      const streak = await getAzkarStreak();
      setStreakStats(streak);
    } catch (err) {
      console.error('Failed to load azkar stats:', err);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  // Filtered Dhikrs
  const filteredDhikrs = useMemo(() => {
    let list: Dhikr[] = [];
    if (selectedCategory === 'all') {
      list = ALL_DHIKR;
    } else {
      list = getAzkarByCategory(selectedCategory);
    }

    if (searchQuery.trim()) {
      return searchAzkar(searchQuery, selectedCategory);
    }

    return list;
  }, [selectedCategory, searchQuery]);

  // Reset pagination on category or search change
  useEffect(() => {
    setVisibleCount(25);
  }, [selectedCategory, searchQuery]);

  // Handler to start full-screen player
  const handleStartSession = (categoryKey: AzkarCategoryKey, customList?: Dhikr[], customTitle?: string) => {
    const dhikrs = customList || getAzkarByCategory(categoryKey);
    const meta = getCategoryTitle(categoryKey);
    const title = customTitle || meta.title;

    if (dhikrs.length === 0) return;

    setActivePlayerSession({
      dhikrs,
      title,
      categoryKey,
    });
  };

  // Handler when player finishes
  const handlePlayerComplete = async (durationSeconds: number) => {
    if (!activePlayerSession) return;

    const newLog: AzkarLog = {
      id: `azkar_log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      categoryKey: activePlayerSession.categoryKey,
      categoryArabic: activePlayerSession.title,
      totalDhikr: activePlayerSession.dhikrs.length,
      completedDhikr: activePlayerSession.dhikrs.length,
      isFullyCompleted: true,
      durationSeconds,
      completedAt: new Date().toISOString(),
    };

    await saveAzkarLog(newLog);
    await refreshStats();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📿</span>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
              مجمع الأذكار وحصن المسلم
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            أذكار الصباح والمساء، الرقية الشرعية، وأدعية اليوم والليلة موثقة وميسرة
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-amber-400">
            <Flame className="w-4 h-4 fill-amber-400" />
            <span>{streakStats.currentStreak} أيام التزام</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{todayLogs.length} جلسات منجزة اليوم</span>
          </div>
        </div>
      </div>

      {/* Morning & Evening Hero Duo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 🌅 Morning Azkar Hero Card */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-amber-500/25 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/10">
                🌅
              </div>
              <div>
                <h2 className="text-lg font-black text-white font-['Tajawal'] flex items-center gap-2">
                  أذكار الصباح
                </h2>
                <p className="text-xs text-amber-300/80 mt-0.5">تحصين وبداية مباركة ليومك ({MORNING_DHIKR.length} ذكر)</p>
              </div>
            </div>

            {isMorningDone ? (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>أُنجزت اليوم</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                في انتظارك
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-5">
            «أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له...»
          </p>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>الوقت المتوقع: ٧ - ١٠ دقائق</span>
            </div>

            <button
              onClick={() => handleStartSession('morning')}
              className={`py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                isMorningDone
                  ? 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isMorningDone ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة القراءة</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>ابدأ أذكار الصباح</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 🌙 Evening Azkar Hero Card */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-indigo-500/25 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/10">
                🌙
              </div>
              <div>
                <h2 className="text-lg font-black text-white font-['Tajawal'] flex items-center gap-2">
                  أذكار المساء
                </h2>
                <p className="text-xs text-indigo-300/80 mt-0.5">سكينة وحفظ وأمان لمسائك ({EVENING_DHIKR.length} ذكر)</p>
              </div>
            </div>

            {isEveningDone ? (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>أُنجزت اليوم</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                في انتظارك
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-5">
            «أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له...»
          </p>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>الوقت المتوقع: ٧ - ١٠ دقائق</span>
            </div>

            <button
              onClick={() => handleStartSession('evening')}
              className={`py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                isEveningDone
                  ? 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isEveningDone ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة القراءة</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>ابدأ أذكار المساء</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Controls: Search & Category Chips */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في نصوص الأذكار أو الفضل أو المصدر..."
              className="w-full pr-11 pl-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all font-['Tajawal']"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg"
              >
                مسح
              </button>
            )}
          </div>

          {/* Start Filtered Session in Full-screen Player */}
          {filteredDhikrs.length > 0 && selectedCategory !== 'all' && (
            <button
              onClick={() => handleStartSession(selectedCategory, filteredDhikrs)}
              className="px-4 py-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer shadow-sm shadow-emerald-500/10"
            >
              <Play className="w-3.5 h-3.5 fill-emerald-300" />
              <span>تلاوة كامل هذه المجموعة ({filteredDhikrs.length})</span>
            </button>
          )}
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                    : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count & Dhikr List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            عرض {Math.min(visibleCount, filteredDhikrs.length)} من إجمالي {filteredDhikrs.length} ذكر
          </span>
          {searchQuery && (
            <span>نتائج البحث عن: «{searchQuery}»</span>
          )}
        </div>

        {filteredDhikrs.length === 0 ? (
          <div className="text-center py-16 liquid-glass-card rounded-3xl border border-white/5">
            <span className="text-4xl mb-3 block">🔍</span>
            <h3 className="text-base font-bold text-white mb-1">لم يتم العثور على أذكار تطابق بحثك</h3>
            <p className="text-xs text-slate-400">جرّب البحث بكلمة أخرى أو اختر تصنيفاً مختلفاً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredDhikrs.slice(0, visibleCount).map((dhikr) => (
              <AzkarCard
                key={dhikr.id}
                dhikr={dhikr}
                onStartSingle={(d) => handleStartSession(d.categoryKey, [d], d.categoryArabic)}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {visibleCount < filteredDhikrs.length && (
          <div className="text-center pt-4">
            <button
              onClick={() => setVisibleCount((prev) => prev + 25)}
              className="px-6 py-3 rounded-2xl liquid-glass-card hover:border-emerald-500/40 text-xs font-bold text-slate-200 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <ChevronDown className="w-4 h-4 text-emerald-400" />
              <span>عرض المزيد من الأذكار ({filteredDhikrs.length - visibleCount} متبقية)</span>
            </button>
          </div>
        )}
      </div>

      {/* Full-Screen Azkar Player Modal */}
      {activePlayerSession && (
        <AzkarPlayer
          dhikrList={activePlayerSession.dhikrs}
          title={activePlayerSession.title}
          categoryKey={activePlayerSession.categoryKey}
          onClose={() => setActivePlayerSession(null)}
          onComplete={handlePlayerComplete}
        />
      )}
    </div>
  );
};
