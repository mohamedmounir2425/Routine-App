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
    <div className="space-y-4 sm:space-y-5 pb-16 max-w-3xl mx-auto">
      <DeskBreakModal
        isOpen={showDeskBreakModal}
        onClose={() => setShowDeskBreakModal(false)}
        onComplete={() => setShowDeskBreakModal(false)}
      />

      <DashboardHeader
        isEffectiveRestDay={isEffectiveRestDay}
        streakStats={streakStats}
        onNavigateStats={() => navigate('/stats')}
      />

      <WeeklyTracker
        planStatus={planStatus}
        weeklyCompletion={weeklyCompletion}
      />

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

      <QuickShortcuts
        miniRescueRoutine={miniRescueRoutine}
        onOpenDeskBreak={() => setShowDeskBreakModal(true)}
        onStartRescue={onStartRoutine}
        onNavigatePlanner={() => navigate('/planner')}
      />
    </div>
  );
};
