import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpLeft, 
  Sparkles, 
  Flame, 
  Compass, 
  Play, 
  BookOpen, 
  CheckCircle2, 
  Timer, 
  Target 
} from 'lucide-react';

interface Props {
  streakCount: number;
  todayRoutineName?: string;
  onStartRoutine?: () => void;
  isMorningAzkarCompleted?: boolean;
  isEveningAzkarCompleted?: boolean;
}

export const SpacesPage: React.FC<Props> = ({
  streakCount,
  todayRoutineName = 'روتين تنشيط الظهر',
  onStartRoutine,
  isMorningAzkarCompleted = false,
  isEveningAzkarCompleted = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🧩</span>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
              مساحات الحياة | Life Spaces
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            أركان يومك المتكاملة: أدر عبادتك وصحتك وعملك وبيتك وخططك في مكان واحد متناغم
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>5 مساحات نشطة</span>
          </div>
        </div>
      </div>

      {/* Spaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. 🕌 WORSHIP SPACE */}
        <div 
          onClick={() => navigate('/worship')}
          className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🕌
              </div>
              <div>
                <h2 className="text-lg font-black text-white font-['Tajawal'] flex items-center gap-2">
                  العبادات والروحانيات
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">أذكار، صلوات، سبحة، وورد قرآني</p>
              </div>
            </div>

            <button 
              className="p-2 rounded-xl liquid-glass-pill text-slate-300 group-hover:text-emerald-300 group-hover:border-emerald-500/40 transition-all"
              title="دخول المساحة"
            >
              <ArrowUpLeft className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          </div>

          {/* Worship Status Badges */}
          <div className="grid grid-cols-2 gap-2 my-4">
            <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              isMorningAzkarCompleted ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold' : 'bg-white/5 border-white/10 text-slate-300'
            }`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${isMorningAzkarCompleted ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>أذكار الصباح {isMorningAzkarCompleted ? '✓' : ''}</span>
            </div>
            <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              isEveningAzkarCompleted ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold' : 'bg-white/5 border-white/10 text-slate-300'
            }`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${isEveningAzkarCompleted ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>أذكار المساء {isEveningAzkarCompleted ? '✓' : ''}</span>
            </div>
          </div>

          {/* Quick Action */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">إجراء سريع:</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/worship/azkar');
              }}
              className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>فتح مجمع الأذكار</span>
            </button>
          </div>
        </div>

        {/* 2. 🏋️ HEALTH SPACE */}
        <div 
          onClick={() => navigate('/health')}
          className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-teal-500/20 hover:border-teal-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🏋️
              </div>
              <div>
                <h2 className="text-lg font-black text-white font-['Tajawal'] flex items-center gap-2">
                  الصحة والعلاج الطبيعي
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">تمارين الظهر، الجذع، والمرونة</p>
              </div>
            </div>

            <button 
              className="p-2 rounded-xl liquid-glass-pill text-slate-300 group-hover:text-teal-300 group-hover:border-teal-500/40 transition-all"
              title="دخول المساحة"
            >
              <ArrowUpLeft className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          </div>

          {/* Health Status Badges */}
          <div className="grid grid-cols-2 gap-2 my-4">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center gap-2 text-slate-200">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="font-bold">{streakCount} أيام التزام</span>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/25 text-xs flex items-center gap-2 text-teal-300 truncate">
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{todayRoutineName}</span>
            </div>
          </div>

          {/* Quick Action */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">إجراء سريع:</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (onStartRoutine) {
                  onStartRoutine();
                } else {
                  navigate('/health');
                }
              }}
              className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-teal-300" />
              <span>ابدأ تمرين اليوم</span>
            </button>
          </div>
        </div>

        {/* 3. 💼 WORK SPACE */}
        <div 
          onClick={() => navigate('/work')}
          className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-sky-500/20 hover:border-sky-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                💼
              </div>
              <div>
                <h2 className="text-lg font-black text-white font-['Tajawal'] flex items-center gap-2">
                  العمل والإنتاجية
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">جلسات بومودورو وأهم 3 مهام</p>
              </div>
            </div>

            <button 
              className="p-2 rounded-xl liquid-glass-pill text-slate-300 group-hover:text-sky-300 group-hover:border-sky-500/40 transition-all"
              title="دخول المساحة"
            >
              <ArrowUpLeft className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 my-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-sky-400" />
              <span>مؤقت استراحة المكتب والتركيز مفعّل</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold">25 دقيقة</span>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">إجراء سريع:</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/work');
              }}
              className="px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>فتح مساحة العمل</span>
            </button>
          </div>
        </div>

        {/* 4. 🏠 HOME & FAMILY */}
        <div 
          onClick={() => navigate('/home')}
          className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🏠
              </div>
              <div>
                <h2 className="text-lg font-black text-white font-['Tajawal'] flex items-center gap-2">
                  المنزل والأسرة
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">الروتين المنزلي والمشتريات الدورية</p>
              </div>
            </div>

            <button 
              className="p-2 rounded-xl liquid-glass-pill text-slate-300 group-hover:text-amber-300 group-hover:border-amber-500/40 transition-all"
              title="دخول المساحة"
            >
              <ArrowUpLeft className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 my-4 flex items-center justify-between">
            <span>الروتين المنزلي الصباحي والمسائي</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">جاهز</span>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">إجراء سريع:</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/home');
              }}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>فتح مساحة المنزل</span>
            </button>
          </div>
        </div>

        {/* 5. 🎯 PLANS & GOALS (Full width) */}
        <div 
          onClick={() => navigate('/plans')}
          className="md:col-span-2 liquid-glass-card rounded-3xl p-5 sm:p-6 border border-indigo-500/20 hover:border-indigo-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/3 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform" />

          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🎯
              </div>
              <div>
                <h2 className="text-lg font-black text-white font-['Tajawal'] flex items-center gap-2">
                  الخطط والأهداف الحياتية
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">خطط متعددة الأسابيع تربط كل المساحات بأهدافك الكبرى</p>
              </div>
            </div>

            <button 
              className="p-2 rounded-xl liquid-glass-pill text-slate-300 group-hover:text-indigo-300 group-hover:border-indigo-500/40 transition-all"
              title="دخول المساحة"
            >
              <ArrowUpLeft className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <span>خطة علاج الظهر والتأهيل الحركي (4 أسابيع متدرجة)</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/health/plans');
              }}
              className="px-3 py-1 rounded-lg bg-indigo-500/25 hover:bg-indigo-500/40 text-indigo-300 font-bold self-start sm:self-auto transition-colors"
            >
              متابعة الخطة النشطة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
