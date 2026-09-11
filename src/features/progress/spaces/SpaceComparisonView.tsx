import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProgressNavTabs } from '../components/ProgressNavTabs';
import { GlobalProgressSnapshot } from '../progressTypes';
import { getGlobalProgressSnapshot } from '../progressAggregator';

export const SpaceComparisonView: React.FC = () => {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<GlobalProgressSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getGlobalProgressSnapshot();
        setSnapshot(data);
      } catch (err) {
        console.error('Failed to load spaces comparison:', err);
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
          <h1 className="text-2xl font-black text-white">توزيع النشاط</h1>
          <p className="text-xs text-slate-400">مقارنة وتوزيع الجهد عبر المسارات الحياتية</p>
        </div>
        <ProgressNavTabs />
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">جاري احتساب توزيع النشاط...</p>
        </div>
      </div>
    );
  }

  const { spaces } = snapshot;

  const SPACES_DATA = [
    {
      id: 'worship',
      label: 'العبادات والروحانيات',
      icon: '🕌',
      score: spaces.worship.score,
      completed: spaces.worship.completedCount,
      total: spaces.worship.totalCount,
      route: '/worship/progress',
      color: 'from-emerald-500 to-teal-400',
      textColor: 'text-emerald-400',
      bgPill: 'bg-emerald-500/20 text-emerald-300',
      description: 'الصلوات الخمس في أوقاتها، أذكار الصباح والمساء، ورد القرآن الكريم والذكر اليومي',
      weight: '30%',
    },
    {
      id: 'health',
      label: 'الصحة والتمارين',
      icon: '🏋️',
      score: spaces.health.score,
      completed: spaces.health.completedCount,
      total: spaces.health.totalCount,
      route: '/health/progress',
      color: 'from-teal-500 to-cyan-400',
      textColor: 'text-teal-400',
      bgPill: 'bg-teal-500/20 text-teal-300',
      description: 'برامج التمارين التأهيلية، فك تيبس الظهر، تمارين القوة والنشاط البدني',
      weight: '25%',
    },
    {
      id: 'work',
      label: 'العمل والإنتاجية',
      icon: '💼',
      score: spaces.work.score,
      completed: spaces.work.completedCount,
      total: spaces.work.totalCount,
      route: '/work/progress',
      color: 'from-sky-500 to-blue-400',
      textColor: 'text-sky-400',
      bgPill: 'bg-sky-500/20 text-sky-300',
      description: 'المهام الوظيفية والمهنية، جلسات البومودورو والتركيز العميق، وإنجاز مشاريع العمل',
      weight: '25%',
    },
    {
      id: 'home',
      label: 'المنزل والأسرة',
      icon: '🏠',
      score: spaces.home.score,
      completed: spaces.home.completedCount,
      total: spaces.home.totalCount,
      route: '/home',
      color: 'from-amber-500 to-yellow-400',
      textColor: 'text-amber-400',
      bgPill: 'bg-amber-500/20 text-amber-300',
      description: 'الروتينات المنزلية الصباحية والمسائية، المشتريات، الصيانة الوقائية والمشاريع الأسرية',
      weight: '20%',
    },
    {
      id: 'plans',
      label: 'الخطط والأهداف الاستراتيجية',
      icon: '🎯',
      score: snapshot.plans ? Math.round(snapshot.plans.averageProgress) : 0,
      completed: snapshot.plans ? snapshot.plans.completedMilestones : 0,
      total: snapshot.plans ? snapshot.plans.totalMilestones : 0,
      route: '/plans/progress',
      color: 'from-indigo-500 to-violet-400',
      textColor: 'text-indigo-400',
      bgPill: 'bg-indigo-500/20 text-indigo-300',
      description: 'الخطط الاستراتيجية والأهداف الربع سنوية والمعالم الكبرى للمشاريع',
      weight: '—',
    },
  ];

  const totalActivities = SPACES_DATA.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 w-full text-right font-['Tajawal'] pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⚖️</span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              توزيع نشاطك
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            نظرة توازنية محايدة لجهودك عبر مختلف أركان ومسارات الحياة
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-sky-400 flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            <span>{totalActivities} نشاط مستهدف اليوم</span>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <ProgressNavTabs />

      {/* Intro Note */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-300 leading-relaxed">
          الهدف من هذه الشاشة ليس المنافسة بين مساحات حياتك، وإنما ضمان التناغم والتكامل؛ فكل مساحة تغذي الأخرى وتمنحك التوازن النفسي والجسدي والإنتاجي.
        </p>
      </div>

      {/* Spaces Comparison Cards */}
      <div className="space-y-4">
        {SPACES_DATA.map((space) => (
          <div
            key={space.id}
            className="liquid-glass-card rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-white/20 transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 rounded-2xl bg-white/5 border border-white/10 shrink-0">
                  {space.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-white">{space.label}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                      الوزن النسبي: {space.weight}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl">{space.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                <div className="text-left font-mono">
                  <span className={`text-2xl font-black ${space.textColor}`}>{space.score}%</span>
                  <span className="text-[10px] text-slate-500 block">
                    {space.completed}/{space.total} منجز
                  </span>
                </div>

                <button
                  onClick={() => navigate(space.route)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>التفاصيل</span>
                  <ArrowUpRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${space.color} transition-all duration-500`}
                style={{ width: `${space.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
