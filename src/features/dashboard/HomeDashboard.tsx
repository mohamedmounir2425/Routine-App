import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Routine, Exercise } from '../../types';
import { StreakStats, getTodayPlanStatus, TodayPlanStatus } from '../../db';
import { DeskBreakModal } from '../../components/common/DeskBreakModal';
import { DashboardHeader } from './components/DashboardHeader';
import { WeeklyTracker } from './components/WeeklyTracker';
import { TodayHeroCard } from './components/TodayHeroCard';
import { RestDayCard } from './components/RestDayCard';
import { QuickShortcuts } from './components/QuickShortcuts';
import { DashboardStatsWidget } from './components/DashboardStatsWidget';

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

  return (
    <div className="space-y-5 pb-16 w-full">
      <DeskBreakModal
        isOpen={showDeskBreakModal}
        onClose={() => setShowDeskBreakModal(false)}
        onComplete={() => setShowDeskBreakModal(false)}
      />

      {/* Top Welcome Header */}
      <DashboardHeader
        isEffectiveRestDay={isEffectiveRestDay}
        streakStats={streakStats}
        onNavigateStats={() => navigate('/stats')}
      />

      {/* Responsive Grid: 2-Columns on Desktop, Single Column on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Main Focus Column: Today's Workout Hero Card */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {isEffectiveRestDay ? (
            <RestDayCard
              planStatus={planStatus}
              miniRescueRoutine={miniRescueRoutine}
              onStartRoutine={onStartRoutine}
              onNavigatePlanner={() => navigate('/planner')}
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
            onNavigatePlanner={() => navigate('/planner')}
          />
        </div>
      </div>
    </div>
  );
};
