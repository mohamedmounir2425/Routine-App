import { Routes, Route, Navigate } from 'react-router-dom';
import { HealthToday } from './dashboard/HealthToday';
import { TrainingPlansPage } from './planner/TrainingPlansPage';
import { NutritionPage } from './nutrition/NutritionPage';
import { ExerciseLibrary } from './exercises/ExerciseLibrary';
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
    <Route index element={<HealthToday />} />
    <Route path="exercises" element={<ExerciseLibrary exercises={health.exercises}
      onToggleFavorite={health.handleToggleFavorite} onAddExercise={health.handleAddExercise}
      onPreviewExerciseInPlayer={health.handlePreviewSingleExercise} />} />
    <Route path="plans" element={<TrainingPlansPage />} />
    <Route path="nutrition" element={<NutritionPage />} />
    <Route path="progress" element={<ProgressStats streakStats={health.streakStats} workoutLogs={health.workoutLogs} />} />
    <Route path="tasks" element={<SpaceTasksView spaceId="health" />} />
    <Route path="*" element={<Navigate to="/health" replace />} />
  </Routes>;
}
