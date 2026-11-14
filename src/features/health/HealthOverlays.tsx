import type { UserSettings } from '../../types';
import { useHealthControllerContext } from './HealthContext';
import { RoutineBuilderModal } from './planner/components/RoutineBuilderModal';
import { WorkoutPlayer } from './player/WorkoutPlayer';

export default function HealthOverlays({ settings, isTvMode }: { settings: UserSettings; isTvMode: boolean }) {
  const health = useHealthControllerContext();
  return <>
    <RoutineBuilderModal isOpen={health.isRoutineBuilderOpen}
      onClose={() => { health.setIsRoutineBuilderOpen(false); health.setEditingRoutine(null); }}
      onSave={health.handleSaveCustomRoutine} availableExercises={health.exercises} initialRoutine={health.editingRoutine} />
    {health.activeRoutine && health.activeRoutineExercises.length > 0 && <WorkoutPlayer
      routine={health.activeRoutine} exercises={health.activeRoutineExercises} allAvailableExercises={health.exercises}
      defaultRestSeconds={settings.defaultRestSeconds} soundEnabled={settings.soundBeepsEnabled}
      voiceCoachEnabled={settings.voiceCoachEnabled} isTvModeInitial={isTvMode}
      workoutVideoAutoplay={settings.workoutVideoAutoplay ?? true} workoutVideoMuted={settings.workoutVideoMuted ?? true}
      workoutVideoLoop={settings.workoutVideoLoop ?? true} defaultViewMode={settings.workoutDefaultViewMode || 'video'}
      onClose={health.closePlayer} onFinishWorkout={health.handleFinishWorkout} />}
  </>;
}
