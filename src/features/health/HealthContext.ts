import { createContext, useContext } from 'react';
import type { useHealthController } from './hooks/useHealthController';

export type HealthController = ReturnType<typeof useHealthController>;
export const HealthContext = createContext<HealthController | null>(null);

export function useHealthControllerContext() {
  const value = useContext(HealthContext);
  if (!value) throw new Error('Health components require HealthProvider.');
  return value;
}

/** Small integration surface for the application shell and cross-space actions. */
export function useHealthIntegration() {
  const health = useHealthControllerContext();
  return {
    currentStreak: health.streakStats.currentStreak,
    todayRoutine: health.todayRoutine,
    startRoutinePlayback: health.startRoutinePlayback,
    isWorkoutActive: health.playbackLoading || !!health.activeRoutine,
    refreshHealthData: health.loadHealthData,
  };
}
