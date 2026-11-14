import { Routes, Route, Navigate } from 'react-router-dom';
import { HealthDashboard } from './dashboard/HealthDashboard';
import { ExerciseLibrary } from './exercises/ExerciseLibrary';
import { PlannerPage } from './planner/PlannerPage';
import { ProgressStats } from './stats/ProgressStats';
import { SpaceTasksView } from '../spaces/ui';
import { useHealthControllerContext } from './HealthContext';

export function HealthSpace() {
  const health = useHealthControllerContext();
  if (health.loadError) return <section role="alert" className="space-y-4 rounded-2xl border border-red-400/30 p-6 text-center">
    <p>{health.loadError}</p><button type="button" className="rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950" onClick={() => void health.loadHealthData()}>إعادة المحاولة</button>
  </section>;
  if (health.isLoading) return <p role="status" className="p-6 text-center">جارٍ تحميل مساحة الصحة…</p>;
  return <Routes>
    <Route index element={<HealthDashboard todayRoutine={health.todayRoutine} isRestDay={health.isRestDay}
      streakStats={health.streakStats} miniRescueRoutine={health.miniRescueRoutine} weeklyCompletion={health.weeklyCompletion}
      exercises={health.exercises} onStartRoutine={health.startRoutinePlayback} />} />
    <Route path="exercises" element={<ExerciseLibrary exercises={health.exercises}
      onToggleFavorite={health.handleToggleFavorite} onAddExercise={health.handleAddExercise}
      onPreviewExerciseInPlayer={health.handlePreviewSingleExercise} />} />
    <Route path="plans" element={<PlannerPage exercises={health.exercises} weeklySchedule={health.weeklySchedule}
      routines={health.routines} onStartRoutine={health.startRoutinePlayback} onUpdateScheduleDay={health.handleUpdateScheduleDay}
      onApplyPreset={health.handleApplyPreset} onCreateCustomRoutine={health.handleOpenCreateRoutine}
      onEditRoutine={health.handleOpenEditRoutine} onDeleteRoutine={health.handleDeleteCustomRoutine} />} />
    <Route path="progress" element={<ProgressStats streakStats={health.streakStats} workoutLogs={health.workoutLogs} />} />
    <Route path="tasks" element={<SpaceTasksView spaceId="health" />} />
    <Route path="*" element={<Navigate to="/health" replace />} />
  </Routes>;
}
