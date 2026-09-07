import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LifePlan {
  id: string;
  title: string;
  spaceTitle: string;
  spaceColor: string;
  durationWeeks: number;
  currentWeek: number;
  progressPercent: number;
  description: string;
  route: string;
}

const DEFAULT_PLANS: LifePlan[] = [
  {
    id: 'back_rehab_4w',
    title: 'خطة علاج الظهر والتأهيل الحركي',
    spaceTitle: 'الصحة والتمارين',
    spaceColor: 'teal',
    durationWeeks: 4,
    currentWeek: 2,
    progressPercent: 50,
    description: 'برنامج علاجي متدرج يبدأ بتخفيف الضغط وإطالة عضلات الفخذ وينتهي بتقوية الجذع وحماية الفقرات القطنية',
    route: '/health/plans',
  },
  {
    id: 'spiritual_habit_40d',
    title: 'خطة تثبيت الأذكار وصلاة الجماعة',
    spaceTitle: 'العبادات والروحانيات',
    spaceColor: 'emerald',
    durationWeeks: 6,
    currentWeek: 3,
    progressPercent: 45,
    description: 'بناء عادة إيمانية يومية لا تنقطع: أذكار الصباح والمساء، السنن الرواتب، وورد القرآن اليومي',
    route: '/worship',
  },
  {
    id: 'deep_work_routine',
    title: 'نظام العمل العميق وجلسات التركيز',
    spaceTitle: 'العمل والإنتاجية',
    spaceColor: 'sky',
    durationWeeks: 4,
    currentWeek: 1,
    progressPercent: 25,
    description: 'تقسيم ساعات العمل اليومية لجلسات بومودورو مع فترات تمدد منتظمة لحماية الجسم من إجهاد الشاشات',
    route: '/work',
  },
];

export const PlansSpace: React.FC = () => {
  const navigate = useNavigate();
  const [plans] = useState<LifePlan[]>(DEFAULT_PLANS);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎯</span>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
              الخطط والأهداف الحياتية
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            خطط متدرجة متعددة الأسابيع تربط كل أركان حياتك بأهدافك الكبرى
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-indigo-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>{plans.length} خطط قيد التنفيذ</span>
          </div>
        </div>
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="liquid-glass-card rounded-3xl p-6 sm:p-7 border border-indigo-500/25 relative overflow-hidden space-y-4 group hover:border-indigo-500/50 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-[11px]">
                    {plan.spaceTitle}
                  </span>
                  <span className="text-xs text-slate-400">
                    الأسبوع {plan.currentWeek} من أصل {plan.durationWeeks} أسابيع
                  </span>
                </div>
                <h2 className="text-lg font-black text-white font-['Tajawal']">{plan.title}</h2>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="text-xl font-black text-indigo-400 font-mono">
                  {plan.progressPercent}%
                </span>
                <button
                  onClick={() => navigate(plan.route)}
                  className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>عرض التفاصيل</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {plan.description}
            </p>

            {/* Progress Bar */}
            <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden border border-white/10 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 transition-all duration-300"
                style={{ width: `${plan.progressPercent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
