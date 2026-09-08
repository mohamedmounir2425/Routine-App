import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Routine, Exercise } from '../../types';
import { StreakStats, getTodayPlanStatus, TodayPlanStatus } from '../../db';
import { DeskBreakModal } from '../../components/common/DeskBreakModal';
import { SpaceShell } from '../../components/layout/SpaceShell';
import { WeeklyTracker } from './components/WeeklyTracker';
import { TodayHeroCard } from './components/TodayHeroCard';
import { RestDayCard } from './components/RestDayCard';
import { QuickShortcuts } from './components/QuickShortcuts';
import { DashboardStatsWidget } from './components/DashboardStatsWidget';
import { Flame, Dumbbell, Calendar, BarChart2, Armchair, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface Props {
  todayRoutine: Routine | null;
  isRestDay: boolean;
  streakStats: StreakStats;
  miniRescueRoutine: Routine | null;
  weeklyCompletion?: { [dayOfWeek: number]: boolean };
  exercises?: Exercise[];
  onStartRoutine: (routine: Routine) => void;
}

export const HomeDashboard: React.FC<Props> = ({
  todayRoutine,
  isRestDay,
  streakStats,
  miniRescueRoutine,
  weeklyCompletion = {},
  exercises = [],
  onStartRoutine,
}) => {
  const navigate = useNavigate();
  const { t, language, isRTL } = useTranslation();
  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;
  const [planStatus, setPlanStatus] = useState<TodayPlanStatus | null>(null);
  const [showDeskBreakModal, setShowDeskBreakModal] = useState<boolean>(false);

  useEffect(() => {
    loadPlanStatus();
  }, [todayRoutine, isRestDay]);

  const loadPlanStatus = async () => {
    try {
      const status = await getTodayPlanStatus();
      setPlanStatus(status);
    } catch (e) {
      console.error('Failed to load today plan status:', e);
    }
  };

  const activeWorkoutRoutine = planStatus?.routine || todayRoutine;
  const isEffectiveRestDay = planStatus ? planStatus.isRestDay : (isRestDay && !todayRoutine);

  const streakDaysText = streakStats.currentStreak === 1
    ? t('day')
    : streakStats.currentStreak === 2
    ? t('twoDays')
    : streakStats.currentStreak <= 10
    ? t('days')
    : language === 'ar' ? 'يوماً' : 'Days';

  return (
    <SpaceShell
      icon="🏋️"
      title={language === 'ar' ? 'مساحة الصحة والتمارين' : 'Health & Fitness Space'}
      subtitle={
        isEffectiveRestDay
          ? (language === 'ar' ? 'اليوم مخصص لراحة العضلات واستشفاء العمود الفقري والمفاصل' : 'Today is for rest, spinal recovery, and joint decompression')
          : (language === 'ar' ? 'جلسات تمارين يومية معتمدة لتأهيل الظهر وبناء القوة والوقاية من آلام الجلوس' : 'Certified daily routines for spine rehabilitation, strength, and posture health')
      }
      badge={
        <button
          type="button"
          onClick={() => navigate('/health/progress')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-amber-400 hover:bg-white/10 transition-colors shrink-0 select-none cursor-pointer"
          title={t('navStats')}
        >
          <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span>{streakStats.currentStreak} {streakDaysText}</span>
        </button>
      }
    >
      <DeskBreakModal
        isOpen={showDeskBreakModal}
        onClose={() => setShowDeskBreakModal(false)}
        onComplete={() => setShowDeskBreakModal(false)}
      />

      <div className="space-y-5 pb-16 w-full">
        {/* Space Quick Actions & Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate('/health/exercises')}
            className="liquid-glass-card rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2.5 text-right hover:border-emerald-500/40 hover:bg-white/5 transition-all group cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 text-emerald-400 group-hover:scale-105 transition-transform">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate font-['Tajawal']">{t('spaceNavExercises')}</span>
                <span className="text-[10px] text-slate-400 block truncate">{language === 'ar' ? 'مكتبة التمارين' : 'Exercise Library'}</span>
              </div>
            </div>
            <ArrowIcon className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/health/plans')}
            className="liquid-glass-card rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2.5 text-right hover:border-teal-500/40 hover:bg-white/5 transition-all group cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center shrink-0 text-teal-400 group-hover:scale-105 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate font-['Tajawal']">{t('spaceNavPlans')}</span>
                <span className="text-[10px] text-slate-400 block truncate">{language === 'ar' ? 'الجدول والخطط' : 'Weekly Schedule'}</span>
              </div>
            </div>
            <ArrowIcon className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 shrink-0 transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/health/progress')}
            className="liquid-glass-card rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2.5 text-right hover:border-cyan-500/40 hover:bg-white/5 transition-all group cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center shrink-0 text-cyan-400 group-hover:scale-105 transition-transform">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate font-['Tajawal']">{t('spaceNavProgress')}</span>
                <span className="text-[10px] text-slate-400 block truncate">{language === 'ar' ? 'سجل التحسن' : 'Recovery Trends'}</span>
              </div>
            </div>
            <ArrowIcon className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => setShowDeskBreakModal(true)}
            className="liquid-glass-card rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2.5 text-right hover:border-amber-500/40 hover:bg-white/5 transition-all group cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition-transform">
                <Armchair className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate font-['Tajawal']">{t('deskBreakTitle')}</span>
                <span className="text-[10px] text-slate-400 block truncate">{language === 'ar' ? 'استراحة 3د' : '3m Mobility'}</span>
              </div>
            </div>
            <ArrowIcon className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0 transition-colors" />
          </button>
        </div>

        {/* Responsive Grid: 2-Columns on Desktop, Single Column on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Main Focus Column: Today's Workout Hero Card */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">
            {isEffectiveRestDay ? (
              <RestDayCard
                planStatus={planStatus}
                miniRescueRoutine={miniRescueRoutine}
                onStartRoutine={onStartRoutine}
                onNavigatePlanner={() => navigate('/health/plans')}
              />
            ) : activeWorkoutRoutine ? (
              <TodayHeroCard
                routine={activeWorkoutRoutine}
                planStatus={planStatus}
                streakStats={streakStats}
                exercises={exercises}
                onStartRoutine={onStartRoutine}
              />
            ) : null}
          </div>

          {/* Secondary Column on Desktop: Weekly Tracker, Stats Widget & Quick Shortcuts */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            <WeeklyTracker
              planStatus={planStatus}
              weeklyCompletion={weeklyCompletion}
            />

            <DashboardStatsWidget streakStats={streakStats} />

            <QuickShortcuts
              miniRescueRoutine={miniRescueRoutine}
              onOpenDeskBreak={() => setShowDeskBreakModal(true)}
              onStartRescue={onStartRoutine}
              onNavigatePlanner={() => navigate('/health/plans')}
            />
          </div>
        </div>
      </div>
    </SpaceShell>
  );
};
