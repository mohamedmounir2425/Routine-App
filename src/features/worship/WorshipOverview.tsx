import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CircleDot, 
  Clock, 
  Flame, 
  ArrowUpLeft,
  Sunrise,
  Sunset
} from 'lucide-react';
import { 
  isAzkarCategoryCompletedToday, 
  getAzkarStreak 
} from '../../db/worshipQueries';

export const WorshipOverview: React.FC = () => {
  const navigate = useNavigate();
  const [streakStats, setStreakStats] = useState({ currentStreak: 0, totalCompleted: 0 });
  const [isMorningDone, setIsMorningDone] = useState(false);
  const [isEveningDone, setIsEveningDone] = useState(false);
  const [tasbeehToday, setTasbeehToday] = useState(0);

  useEffect(() => {
    const load = async () => {
      const streak = await getAzkarStreak();
      setStreakStats(streak);

      const mDone = await isAzkarCategoryCompletedToday('morning');
      const eDone = await isAzkarCategoryCompletedToday('evening');
      setIsMorningDone(mDone);
      setIsEveningDone(eDone);

      const tCount = localStorage.getItem('routine_tasbeeh_today');
      if (tCount) setTasbeehToday(parseInt(tCount, 10));
    };
    load();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🕌</span>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
              مساحة العبادات والروحانيات
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            «ألا بذكر الله تطمئن القلوب» - واحتك اليومية للذكر والصلاة والقرآن
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-amber-400">
            <Flame className="w-4 h-4 fill-amber-400" />
            <span>{streakStats.currentStreak} أيام التزام</span>
          </div>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Morning Azkar */}
        <div 
          onClick={() => navigate('/worship/azkar')}
          className="p-4 rounded-2xl liquid-glass-card border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sunrise className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">أذكار الصباح</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              isMorningDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'
            }`}>
              {isMorningDone ? 'أُنجزت ✓' : 'متبقية'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 group-hover:text-amber-300 transition-colors">
            اضغط لبدء التلاوة السريعة
          </p>
        </div>

        {/* Evening Azkar */}
        <div 
          onClick={() => navigate('/worship/azkar')}
          className="p-4 rounded-2xl liquid-glass-card border border-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sunset className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">أذكار المساء</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              isEveningDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'
            }`}>
              {isEveningDone ? 'أُنجزت ✓' : 'متبقية'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 group-hover:text-indigo-300 transition-colors">
            اضغط لبدء التلاوة السريعة
          </p>
        </div>

        {/* Prayers */}
        <div 
          onClick={() => navigate('/worship/prayers')}
          className="p-4 rounded-2xl liquid-glass-card border border-teal-500/20 hover:border-teal-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-slate-200">الصلوات الخمس</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold">
              متابعة اليوم
            </span>
          </div>
          <p className="text-[11px] text-slate-400 group-hover:text-teal-300 transition-colors">
            تسجيل الفروض والنوافل
          </p>
        </div>

        {/* Tasbeeh */}
        <div 
          onClick={() => navigate('/worship/tasbeeh')}
          className="p-4 rounded-2xl liquid-glass-card border border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">السبحة اليوم</span>
            </div>
            <span className="text-xs font-black font-mono text-emerald-400">
              {tasbeehToday} تسبيحة
            </span>
          </div>
          <p className="text-[11px] text-slate-400 group-hover:text-emerald-300 transition-colors">
            فتح السبحة الذكية
          </p>
        </div>
      </div>

      {/* Sub-Pillars Detailed Hub Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. Azkar Hub */}
        <div 
          onClick={() => navigate('/worship/azkar')}
          className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-emerald-500/25 hover:border-emerald-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📿
              </div>
              <div>
                <h2 className="text-lg font-black text-white font-['Tajawal']">مجمع الأذكار وحصن المسلم</h2>
                <p className="text-xs text-slate-400 mt-0.5">أذكار الصباح والمساء، الرقية الشرعية، وأدعية اليوم</p>
              </div>
            </div>

            <button className="p-2 rounded-xl liquid-glass-pill text-slate-300 group-hover:text-emerald-300 transition-all">
              <ArrowUpLeft className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed my-3">
            قارئ تفاعلي كامل بالشاشه مع عدّاد نبضات haptic وعداد متبقي، ودعم كامل للخط القرآني النبوي.
          </p>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">يشمل أكثر من ٢٠٠٠ ذكر</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span>تصفح الأذكار</span>
              <span>←</span>
            </span>
          </div>
        </div>

        {/* 2. Tasbeeh */}
        <div 
          onClick={() => navigate('/worship/tasbeeh')}
          className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-teal-500/25 hover:border-teal-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                ⚪
              </div>
              <div>
                <h2 className="text-lg font-black text-white font-['Tajawal']">السبحة الإلكترونية</h2>
                <p className="text-xs text-slate-400 mt-0.5">تسبيح مخصص، استغفار، صلاة على النبي، وحلقات دائرية</p>
              </div>
            </div>

            <button className="p-2 rounded-xl liquid-glass-pill text-slate-300 group-hover:text-teal-300 transition-all">
              <ArrowUpLeft className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed my-3">
            حلقة عد تفاعلية مصممة بلغة Liquid Glass تمنحك إحساس السبحة الحقيقية مع كل ضغطة ونبضة اهتزاز.
          </p>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">عداد مفتوح وأهداف محددة</span>
            <span className="text-teal-400 font-bold flex items-center gap-1">
              <span>فتح السبحة</span>
              <span>←</span>
            </span>
          </div>
        </div>

        {/* 3. Prayers */}
        <div 
          onClick={() => navigate('/worship/prayers')}
          className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-cyan-500/25 hover:border-cyan-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🕌
              </div>
              <div>
                <h2 className="text-lg font-black text-white font-['Tajawal']">متابعة الصلوات</h2>
                <p className="text-xs text-slate-400 mt-0.5">الفروض الخمسة في وقتها، صلاة الجماعة، والسنن الرواتب</p>
              </div>
            </div>

            <button className="p-2 rounded-xl liquid-glass-pill text-slate-300 group-hover:text-cyan-300 transition-all">
              <ArrowUpLeft className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed my-3">
            سجل التزامك اليومي بالصلوات في المسجد ومع السنن والضحى والشفع والوتر لبناء عادة إيمانية راسخة.
          </p>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">سجل فوري يومي</span>
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <span>متابعة الصلوات</span>
              <span>←</span>
            </span>
          </div>
        </div>

        {/* 4. Quran */}
        <div 
          onClick={() => navigate('/worship/quran')}
          className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-indigo-500/25 hover:border-indigo-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📗
              </div>
              <div>
                <h2 className="text-lg font-black text-white font-['Tajawal']">الورد القرآني</h2>
                <p className="text-xs text-slate-400 mt-0.5">متابعة عدد الصفحات اليومية وحفظ علامة التوقف</p>
              </div>
            </div>

            <button className="p-2 rounded-xl liquid-glass-pill text-slate-300 group-hover:text-indigo-300 transition-all">
              <ArrowUpLeft className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed my-3">
            حدد هدفك اليومي من صفحات القرآن الكريم وثبّت الفاصل لتواصل قراءتك بسلاسة في أي وقت.
          </p>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">حفظ تلقائي محلي</span>
            <span className="text-indigo-400 font-bold flex items-center gap-1">
              <span>متابعة الورد</span>
              <span>←</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
