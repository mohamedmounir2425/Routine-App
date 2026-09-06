import React, { useState, useEffect } from 'react';
import { Calendar, ShieldCheck, Layers } from 'lucide-react';
import { Exercise, PlanSession, Routine } from '../../types';
import { FOUR_WEEK_PLAN, FOUNDATION_LEVELS_PLAN, ALL_PLAN_ROUTINES } from '../../db/seedData';
import { db, getUserSettings, updateUserSettings, setActivePlanWeek } from '../../db';
import { SlidingTabs } from '../../components/common/SlidingTabs';
import { PlanOverviewCard } from './components/PlanOverviewCard';
import { FourWeekSchedule } from './components/FourWeekSchedule';
import { FoundationLevels } from './components/FoundationLevels';
import { SessionDetailsModal } from './components/SessionDetailsModal';

interface Props {
  exercises: Exercise[];
  onStartRoutine: (routine: Routine) => void;
}

export const TrainingPlanView: React.FC<Props> = ({ exercises, onStartRoutine }) => {
  const [activeTab, setActiveTab] = useState<'4-weeks' | '3-levels'>('4-weeks');
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);
  const [selectedSession, setSelectedSession] = useState<PlanSession | null>(null);
  const [completedSessions, setCompletedSessions] = useState<string[]>([]);
  const [activeWeekNumber, setActiveWeekNumber] = useState<number>(1);
  const [activeLevelNumber, setActiveLevelNumber] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    loadSettingsAndLogs();
  }, [selectedWeekNum]);

  const loadSettingsAndLogs = async () => {
    const settings = await getUserSettings();
    setActiveWeekNumber(settings.currentWeekNumber || 1);
    setActiveLevelNumber(settings.currentLevelNumber || 1);
    if (!selectedWeekNum) {
      setSelectedWeekNum(settings.currentWeekNumber || 1);
    }

    const logs = await db.workoutLogs.toArray();
    const completedRoutineIds = logs.map(l => l.routineId).filter(Boolean);
    setCompletedSessions(completedRoutineIds);
  };

  const currentWeek = FOUR_WEEK_PLAN.find(w => w.weekNumber === selectedWeekNum) || FOUR_WEEK_PLAN[0];

  const handleSetCurrentWeek = async (weekNum: number) => {
    setSelectedWeekNum(weekNum);
    setActiveWeekNumber(weekNum);
    await setActivePlanWeek(weekNum);
  };

  const handleLaunchSession = (session: PlanSession) => {
    const routine = ALL_PLAN_ROUTINES.find(r => r.id === session.routineId);
    if (routine) {
      setSelectedSession(null);
      onStartRoutine(routine);
    }
  };

  const handleSelectLevel = async (levelNum: 1 | 2 | 3) => {
    setActiveLevelNumber(levelNum);
    await updateUserSettings({ currentLevelNumber: levelNum });
  };

  const weekCompletedCount = currentWeek.sessions.filter((s: PlanSession) => completedSessions.includes(s.routineId)).length;
  const overallCompletedCount = ALL_PLAN_ROUTINES.filter(r => completedSessions.includes(r.id)).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>البرنامج العلاجي الطبي المتكامل</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight">
            خطة التمارين وحماية الظهر 🏋️
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            مصممة وفق جدول 4 أيام تمرين + 3 أيام راحة أسبوعياً لتقوية الحزام العضلي دون إجهاد.
          </p>
        </div>

        {/* Dual Mode Switcher */}
        <SlidingTabs
          tabs={[
            { id: '4-weeks', label: 'جدول الـ 4 أسابيع', icon: Calendar },
            { id: '3-levels', label: 'المستويات الـ 3', icon: Layers },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as '4-weeks' | '3-levels')}
          className="shrink-0 self-start sm:self-auto"
        />
      </div>

      {activeTab === '4-weeks' ? (
        <div className="space-y-6">
          <PlanOverviewCard
            currentWeek={currentWeek}
            selectedWeekNum={selectedWeekNum}
            activeWeekNumber={activeWeekNumber}
            overallCompletedCount={overallCompletedCount}
            weekCompletedCount={weekCompletedCount}
            completedSessions={completedSessions}
            fourWeekPlan={FOUR_WEEK_PLAN}
            onSelectWeek={handleSetCurrentWeek}
          />

          <FourWeekSchedule
            selectedWeekNum={selectedWeekNum}
            currentWeek={currentWeek}
            completedSessions={completedSessions}
            onViewSession={setSelectedSession}
            onLaunchSession={handleLaunchSession}
          />
        </div>
      ) : (
        <FoundationLevels
          levels={FOUNDATION_LEVELS_PLAN}
          activeLevelNumber={activeLevelNumber}
          onSelectLevel={handleSelectLevel}
        />
      )}

      {/* Session Details Modal */}
      <SessionDetailsModal
        session={selectedSession}
        selectedWeekNum={selectedWeekNum}
        exercises={exercises}
        onClose={() => setSelectedSession(null)}
        onLaunch={handleLaunchSession}
      />
    </div>
  );
};
