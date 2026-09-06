import React, { useState } from 'react';
import { Routine, Exercise, WorkoutLog } from '../../types';
import { CompletionModal } from '../../components/player/CompletionModal';
import { usePlayerLogic } from './usePlayerLogic';
import { PlayerHeader } from './components/PlayerHeader';
import { PlayerMedia } from './components/PlayerMedia';
import { PlayerExerciseInfo } from './components/PlayerExerciseInfo';
import { PlayerControls } from './components/PlayerControls';
import { RestPhaseOverlay } from './components/RestPhaseOverlay';
import { PlayerModals } from './components/PlayerModals';

interface WorkoutPlayerProps {
  routine: Routine;
  exercises: Exercise[];
  allAvailableExercises?: Exercise[];
  defaultRestSeconds?: number;
  soundEnabled?: boolean;
  voiceCoachEnabled?: boolean;
  isTvModeInitial?: boolean;
  workoutVideoAutoplay?: boolean;
  workoutVideoMuted?: boolean;
  workoutVideoLoop?: boolean;
  defaultViewMode?: 'video' | 'animation';
  onClose: () => void;
  onFinishWorkout: (logData: Omit<WorkoutLog, 'id'>) => void;
}

export const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({
  routine,
  exercises,
  allAvailableExercises = [],
  defaultRestSeconds = 15,
  soundEnabled = true,
  voiceCoachEnabled = true,
  isTvModeInitial = false,
  workoutVideoAutoplay = true,
  workoutVideoMuted = true,
  workoutVideoLoop = true,
  defaultViewMode = 'video',
  onClose,
  onFinishWorkout,
}) => {
  const [isTvMode, setIsTvMode] = useState<boolean>(isTvModeInitial);
  const [viewMode, setViewMode] = useState<'video' | 'animation'>(defaultViewMode);

  const {
    sessionExercises,
    currentIndex,
    phase,
    timeLeft,
    restTimeLeft,
    isPaused,
    setIsPaused,
    isMuted,
    setIsMuted,
    showExitConfirm,
    setShowExitConfirm,
    showSwapModal,
    setShowSwapModal,
    totalElapsedTime,
    currentExercise,
    nextExercise,
    progressPercent,
    iframeRef,
    handlePrev,
    handleSkip,
    handleSkipRest,
    handleAddRestSeconds,
    handleSwapExercise,
    formatTime,
  } = usePlayerLogic({
    routine,
    exercises,
    defaultRestSeconds,
    soundEnabled,
    voiceCoachEnabled,
    workoutVideoAutoplay,
  });

  if (!currentExercise) return null;

  if (phase === 'completed') {
    return (
      <CompletionModal
        routine={routine}
        durationSeconds={totalElapsedTime}
        exercisesCompletedCount={sessionExercises.length}
        onSaveAndClose={onFinishWorkout}
      />
    );
  }

  return (
    <div className={`fixed inset-0 z-[100] top-0 left-0 right-0 bottom-0 w-full h-[100dvh] max-h-[100dvh] flex flex-col justify-between bg-[#070b14]/98 backdrop-blur-2xl text-white select-none overflow-hidden ${
      isTvMode ? 'p-3 sm:p-6' : 'p-2.5 sm:p-4'
    }`}>
      {/* Liquid Glass Ambient Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="liquid-orb-1 absolute -top-16 -right-16 w-80 h-80 rounded-full blur-[100px] bg-emerald-500/20" />
        <div className="liquid-orb-2 absolute bottom-10 -left-16 w-80 h-80 rounded-full blur-[100px] bg-teal-500/15" />
      </div>

      {/* Header */}
      <PlayerHeader
        routineName={routine.name}
        currentIndex={currentIndex}
        totalExercises={sessionExercises.length}
        progressPercent={progressPercent}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        isTvMode={isTvMode}
        onToggleTvMode={() => setIsTvMode(!isTvMode)}
        onOpenExitConfirm={() => setShowExitConfirm(true)}
        sessionExercises={sessionExercises}
        currentExerciseDuration={currentExercise.durationSeconds}
        timeLeft={timeLeft}
        phase={phase}
      />

      {/* Main Content Area */}
      <div className="w-full max-w-2xl mx-auto flex-1 min-h-0 flex flex-col justify-between items-center py-2 sm:py-3 overflow-hidden gap-2 sm:gap-3">
        {phase === 'exercise' ? (
          <div className="w-full h-full flex flex-col justify-between items-center overflow-hidden gap-2 sm:gap-3">
            <PlayerMedia
              currentExercise={currentExercise}
              viewMode={viewMode}
              onSetViewMode={setViewMode}
              isTvMode={isTvMode}
              iframeRef={iframeRef}
              workoutVideoAutoplay={workoutVideoAutoplay}
              workoutVideoMuted={workoutVideoMuted}
              workoutVideoLoop={workoutVideoLoop}
            />

            <PlayerExerciseInfo
              currentExercise={currentExercise}
              routine={routine}
              currentIndex={currentIndex}
              totalExercises={sessionExercises.length}
              timeLeft={timeLeft}
              formatTime={formatTime}
              onOpenSwapModal={() => setShowSwapModal(true)}
              hasAvailableExercises={allAvailableExercises.length > 0}
            />
          </div>
        ) : (
          <RestPhaseOverlay
            restTimeLeft={restTimeLeft}
            formatTime={formatTime}
            nextExercise={nextExercise}
            onAddRestSeconds={handleAddRestSeconds}
            onSkipRest={handleSkipRest}
          />
        )}
      </div>

      {/* Bottom Controls */}
      <PlayerControls
        currentIndex={currentIndex}
        isPaused={isPaused}
        onPrev={handlePrev}
        onTogglePause={() => setIsPaused(!isPaused)}
        onNext={handleSkip}
      />

      {/* Modals */}
      <PlayerModals
        showExitConfirm={showExitConfirm}
        onCloseExitConfirm={() => setShowExitConfirm(false)}
        onConfirmExit={onClose}
        showSwapModal={showSwapModal}
        onCloseSwapModal={() => setShowSwapModal(false)}
        currentExerciseId={currentExercise.id}
        availableExercises={allAvailableExercises}
        onSelectSwapExercise={handleSwapExercise}
      />
    </div>
  );
};
