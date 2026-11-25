import React, { useState } from 'react';
import { Button, Drawer, Tag } from 'antd';
import { Play, RotateCcw, X } from 'lucide-react';
import { Routine, Exercise, WorkoutLog } from '../../../types';
import { CompletionModal } from './components/CompletionModal';
import { usePlayerLogic } from './usePlayerLogic';
import { PlayerHeader } from './components/PlayerHeader';
import { PlayerMedia } from './components/PlayerMedia';
import { PlayerExerciseInfo } from './components/PlayerExerciseInfo';
import { PlayerControls } from './components/PlayerControls';
import { RestPhaseOverlay } from './components/RestPhaseOverlay';
import { PlayerModals } from './components/PlayerModals';
import { ExerciseAnimation } from './components/ExerciseAnimation';
import { buildWorkoutVideoUrl } from '../../../utils/youtube';

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
  onFinishWorkout: (logData: Omit<WorkoutLog, 'id'>) => void | Promise<void>;
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
  defaultViewMode = 'animation',
  onClose,
  onFinishWorkout,
}) => {
  const [isTvMode, setIsTvMode] = useState<boolean>(isTvModeInitial);
  const [viewMode, setViewMode] = useState<'video' | 'animation'>(defaultViewMode);
  const [instructionsOpen, setInstructionsOpen] = useState<boolean>(false);

  const {
    sessionExercises,
    completedCount,
    finishSession,
    startFreshSession,
    resumeSavedSession,
    savedSession,
    clearSavedSession,
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
    handleCompleteCurrent,
    handleSkip,
    handleSkipRest,
    handleAddRestSeconds,
    handleAddExerciseSeconds,
    handleSwapExercise,
    formatTime,
    setTracker,
  } = usePlayerLogic({
    routine,
    exercises,
    defaultRestSeconds,
    soundEnabled,
    voiceCoachEnabled,
    workoutVideoAutoplay,
    initialPhase: 'overview',
  });

  if (!currentExercise) return null;

  if (phase === 'completed') {
    return (
      <CompletionModal
        routine={routine}
        durationSeconds={totalElapsedTime}
        exercisesCompletedCount={completedCount}
        onDiscard={() => {
          clearSavedSession();
          onClose();
        }}
        onSaveAndClose={async log => {
          await onFinishWorkout({ ...log, executionSnapshot: sessionExercises });
          clearSavedSession();
        }}
      />
    );
  }

  // Screen 1: تفاصيل الجلسة (Pre-Start Overview & Resume Choice)
  if (phase === 'overview') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col justify-between bg-[#070b14]/98 backdrop-blur-2xl text-white p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto space-y-5 my-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-xs font-bold text-emerald-300">
                تفاصيل الجلسة
              </span>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black font-['Tajawal']">{routine.name}</h1>
              {routine.description && <p className="mt-1 text-sm text-slate-300">{routine.description}</p>}
              <p className="mt-2 text-xs text-slate-400">
                {sessionExercises.length} تمارين · الوقت التقديري {routine.totalEstimatedMinutes || 10} دقيقة
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق المشغل"
              className="p-2 rounded-xl liquid-glass-pill text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {savedSession && (
            <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-amber-300 text-sm">لديك جلسة غير مكتملة محفوظة</strong>
                <Tag color="gold">
                  التمرين {Math.min(sessionExercises.length, savedSession.currentIndex + 1)} من {sessionExercises.length}
                </Tag>
              </div>
              <p className="text-xs text-slate-300">
                يمكنك استكمال الجلسة من نفس التمرين والمجموعة والوقت المتبقي، أو البدء من جديد.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <Button
                  type="primary"
                  size="large"
                  onClick={resumeSavedSession}
                  className="!bg-emerald-500 !text-slate-950 !font-black"
                >
                  استكمال الجلسة ▶
                </Button>
                <Button size="large" onClick={startFreshSession} icon={<RotateCcw className="w-4 h-4" />}>
                  بدء من جديد
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1">
            {sessionExercises.map((ex, idx) => {
              const presc = routine.prescriptions?.find(p => p.exerciseId === ex.id);
              const sets = presc?.sets ?? 1;
              const reps = presc?.reps ?? ex.reps;
              const secs = presc?.durationSeconds ?? presc?.holdSeconds ?? ex.durationSeconds ?? 45;
              const sides = presc?.sides === 'each';
              return (
                <div
                  key={ex.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-900/90 border border-white/10">
                      <ExerciseAnimation slug={ex.animationSlug} category={ex.category} thumbnail />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-white truncate">
                        {idx + 1}. {ex.arabicName || ex.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {sets} مجموعة · {reps ? `${reps} تكرار` : `${secs} ثانية`}
                        {sides ? ' (لكل جانب)' : ''} · راحة {ex.restAfterSeconds ?? defaultRestSeconds}ث
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!savedSession && (
            <button
              type="button"
              onClick={startFreshSession}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>ابدأ الجلسة الآن</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const activePrescription =
    setTracker.presc || routine.prescriptions?.find(p => p.exerciseId === currentExercise.id);

  return (
    <div
      className={`fixed inset-0 z-[100] top-0 left-0 right-0 bottom-0 w-full h-[100dvh] max-h-[100dvh] flex flex-col justify-between bg-[#070b14]/98 backdrop-blur-2xl text-white select-none overflow-hidden ${
        isTvMode ? 'p-3 sm:p-6' : 'p-2.5 sm:p-4'
      }`}
    >
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
        onOpenExitConfirm={() => {
          setIsPaused(true);
          setShowExitConfirm(true);
        }}
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
              isPaused={isPaused}
              readyCountdown={setTracker.readyCountdown}
              onSkipReady={setTracker.skipReadyCountdown}
              onAddReadySeconds={() => setTracker.addReadySeconds(3)}
              onOpenInstructions={() => {
                setIsPaused(true);
                setInstructionsOpen(true);
              }}
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
              onOpenSwapModal={() => setShowSwapModal(true)}
              onOpenInstructions={() => {
                setIsPaused(true);
                setInstructionsOpen(true);
              }}
              hasAvailableExercises={allAvailableExercises.length > 0}
              setTracker={setTracker}
              isPaused={isPaused}
              onAddExerciseSeconds={handleAddExerciseSeconds}
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
        onComplete={handleCompleteCurrent}
        onNext={handleSkip}
      />

      {/* Screen 5: شرح الحركة (Ant Design Bottom Drawer) */}
      <Drawer
        open={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
        placement="bottom"
        height="72vh"
        title={`شرح الحركة · ${currentExercise.arabicName}`}
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {currentExercise.description && <p className="text-sm opacity-85">{currentExercise.description}</p>}

          {activePrescription?.notes && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm">
              <strong>ملاحظة خاصة بالجلسة: </strong>
              {activePrescription.notes}
            </div>
          )}

          {currentExercise.instructions?.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-base">خطوات الأداء الصحيح</h4>
              <ol className="list-decimal list-inside space-y-1.5 text-sm">
                {currentExercise.instructions.map((step, i) => (
                  <li key={i} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {(currentExercise.precautions?.length ?? 0) > 0 && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 space-y-1">
              <h4 className="font-bold text-sm text-amber-500">⚠️ تنبيهات لحماية الظهر</h4>
              {currentExercise.precautions?.map((p, i) => (
                <p key={i} className="text-sm">
                  {p}
                </p>
              ))}
            </div>
          )}

          {currentExercise.targetMuscles?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {currentExercise.targetMuscles.map((m, i) => (
                <Tag key={i} color="cyan">
                  {m}
                </Tag>
              ))}
            </div>
          )}

          {currentExercise.videoUrl && (
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-sm">فيديو التمرين (يتطلب اتصالًا بالإنترنت)</h4>
              <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
                <iframe
                  src={buildWorkoutVideoUrl(currentExercise.videoUrl, {
                    autoplay: false,
                    mute: workoutVideoMuted,
                    loop: workoutVideoLoop,
                  })}
                  title={currentExercise.name}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* Exit & Swap Modals */}
      <PlayerModals
        showExitConfirm={showExitConfirm}
        onCloseExitConfirm={() => setShowExitConfirm(false)}
        onConfirmExit={finishSession}
        showSwapModal={showSwapModal}
        onCloseSwapModal={() => setShowSwapModal(false)}
        currentExerciseId={currentExercise.id}
        availableExercises={allAvailableExercises}
        onSelectSwapExercise={handleSwapExercise}
      />
    </div>
  );
};
