import React, { useState } from 'react';
import { Exercise, Routine, WeeklyScheduleItem } from '../../types';
import { SlidingTabs } from '../../components/common/SlidingTabs';
import { SpaceShell } from '../../components/layout/SpaceShell';
import { TrainingPlanView } from './TrainingPlanView';
import { WeeklyPlanner } from './WeeklyPlanner';

interface PlannerPageProps {
  exercises: Exercise[];
  weeklySchedule: WeeklyScheduleItem[];
  routines: Routine[];
  onStartRoutine: (routine: Routine) => void;
  onUpdateScheduleDay: (dayOfWeek: number, routineId: string | null) => void;
  onApplyPreset: (presetType: '3days' | '4days' | 'daily') => void;
  onCreateCustomRoutine: () => void;
  onEditRoutine: (routine: Routine) => void;
  onDeleteRoutine: (routineId: string) => void;
}

export const PlannerPage: React.FC<PlannerPageProps> = ({
  exercises,
  weeklySchedule,
  routines,
  onStartRoutine,
  onUpdateScheduleDay,
  onApplyPreset,
  onCreateCustomRoutine,
  onEditRoutine,
  onDeleteRoutine,
}) => {
  const [plannerSubTab, setPlannerSubTab] = useState<'prescribed' | 'custom'>('prescribed');

  return (
    <SpaceShell
      icon="📅"
      title="جدول وخطط التمارين"
      subtitle="خطة الـ 4 أسابيع لإعادة تأهيل الظهر وتخصيص جدول الأسبوع"
    >
      <div className="space-y-6 pb-20">
        {/* View Switcher: Prescribed Plan vs Custom Builder */}
        <SlidingTabs
          tabs={[
            { id: 'prescribed', label: 'خطة الـ 4 أسابيع والأساس' },
            { id: 'custom', label: 'تخصيص جدول الأسبوع' },
          ]}
          activeTab={plannerSubTab}
          onChange={(tab) => setPlannerSubTab(tab as 'prescribed' | 'custom')}
          fullWidth
          className="max-w-md mx-auto"
        />

        {plannerSubTab === 'prescribed' ? (
          <TrainingPlanView
            exercises={exercises}
            onStartRoutine={onStartRoutine}
          />
        ) : (
          <WeeklyPlanner
            schedule={weeklySchedule}
            routines={routines}
            exercises={exercises}
            onUpdateScheduleDay={onUpdateScheduleDay}
            onApplyPreset={onApplyPreset}
            onStartRoutine={onStartRoutine}
            onCreateCustomRoutine={onCreateCustomRoutine}
            onEditRoutine={onEditRoutine}
            onDeleteRoutine={onDeleteRoutine}
          />
        )}
      </div>
    </SpaceShell>
  );
};
