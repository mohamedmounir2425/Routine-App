import { useState, useEffect, useRef } from 'react';
import { Routine, Exercise } from '../../../types';
import { sounds } from '../../../utils/audio';
import { workspaceStorage } from '../../../db/workspaceScope';
import { useExerciseSetTracker } from './useExerciseSetTracker';

export type PlayerPhase = 'overview' | 'exercise' | 'rest' | 'completed';

export interface SavedWorkoutSessionState {
  routineId: string;
  occurrenceId?: string;
  currentIndex: number;
  currentSet: number;
  currentSide: 'right' | 'left' | 'none';
  timeLeft: number;
  setTimeLeft: number;
  completedIndices: number[];
  totalElapsedTime: number;
  updatedAt: string;
}

const SESSION_STORAGE_PREFIX = 'health_active_player_session_';

export function getSessionStorageKey(routine: Routine) {
  return `${SESSION_STORAGE_PREFIX}${routine.occurrenceId ?? routine.id}`;
}

export function readSavedWorkoutSession(routine: Routine): SavedWorkoutSessionState | null {
  try {
    const raw = workspaceStorage.getItem(getSessionStorageKey(routine));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedWorkoutSessionState;
    if (
      parsed &&
      parsed.routineId === routine.id &&
      typeof parsed.currentIndex === 'number' &&
      Array.isArray(parsed.completedIndices)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearSavedWorkoutSession(routine: Routine) {
  workspaceStorage.removeItem(getSessionStorageKey(routine));
}

interface UsePlayerLogicProps {
  routine: Routine;
  exercises: Exercise[];
  defaultRestSeconds?: number;
  soundEnabled?: boolean;
  voiceCoachEnabled?: boolean;
  workoutVideoAutoplay?: boolean;
  initialPhase?: PlayerPhase;
}

export function usePlayerLogic({
  routine,
  exercises,
  defaultRestSeconds = 15,
  soundEnabled = true,
  voiceCoachEnabled = true,
  workoutVideoAutoplay = true,
  initialPhase = 'exercise',
}: UsePlayerLogicProps) {
  const [savedSession, setSavedSession] = useState<SavedWorkoutSessionState | null>(() =>
    readSavedWorkoutSession(routine)
  );
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(new Set());
  const [sessionExercises, setSessionExercises] = useState<Exercise[]>(exercises);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [phase, setPhase] = useState<PlayerPhase>(initialPhase);
  const [timeLeft, setTimeLeft] = useState<number>(exercises[0]?.durationSeconds ?? 60);
  const [restTimeLeft, setRestTimeLeft] = useState<number>(defaultRestSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(!soundEnabled);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [showSwapModal, setShowSwapModal] = useState<boolean>(false);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);

  const currentExercise: Exercise | undefined = sessionExercises[currentIndex];
  const nextExercise: Exercise | undefined = sessionExercises[currentIndex + 1];

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const transitionRef = useRef(false);
  const advancingRef = useRef(false);
  const skipExerciseInitRef = useRef(false);

  const handleExerciseFinish = (completed = true) => {
    if (phase !== 'exercise' || transitionRef.current) return;
    transitionRef.current = true;
    if (completed) {
      setCompletedIndices(old => new Set([...old, currentIndex]));
    }
    if (currentIndex < sessionExercises.length - 1) {
      const restSec = currentExercise?.restAfterSeconds ?? defaultRestSeconds;
      if (restSec <= 0) {
        setCurrentIndex(index => index + 1);
        return;
      }
      setPhase('rest');
      setRestTimeLeft(restSec);

      if (!isMuted) {
        sounds.playRestChime();
        if (voiceCoachEnabled && nextExercise) {
          sounds.speak(`استراحة. التمرين التالي: ${nextExercise.arabicName || nextExercise.name}`);
        }
      }
    } else {
      setPhase('completed');
    }
  };

  const setTracker = useExerciseSetTracker({
    currentExercise,
    currentIndex,
    isPaused: isPaused || phase !== 'exercise',
    routine,
    isMuted,
    voiceCoachEnabled,
    onExerciseComplete: () => handleExerciseFinish(true),
  });

  // Auto-pause when tab/window goes to background
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && (phase === 'exercise' || phase === 'rest')) {
        setIsPaused(true);
      }
    };
    const onPageHide = () => {
      if (phase === 'exercise' || phase === 'rest') {
        setIsPaused(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [phase]);

  // Persist active session progress for seamless resume
  useEffect(() => {
    if (phase !== 'exercise' && phase !== 'rest') return;
    const state: SavedWorkoutSessionState = {
      routineId: routine.id,
      occurrenceId: routine.occurrenceId,
      currentIndex,
      currentSet: setTracker.currentSet,
      currentSide: setTracker.currentSide,
      timeLeft,
      setTimeLeft: setTracker.setTimeLeft,
      completedIndices: Array.from(completedIndices),
      totalElapsedTime,
      updatedAt: new Date().toISOString(),
    };
    workspaceStorage.setItem(getSessionStorageKey(routine), JSON.stringify(state));
    setSavedSession(state);
  }, [
    routine,
    phase,
    currentIndex,
    setTracker.currentSet,
    setTracker.currentSide,
    setTracker.setTimeLeft,
    timeLeft,
    completedIndices,
    totalElapsedTime,
  ]);

  // Sync YouTube player play/pause state
  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return;
    try {
      if (isPaused) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }),
          '*'
        );
      } else if (phase === 'exercise' && workoutVideoAutoplay) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
          '*'
        );
      }
    } catch {
      // Ignore cross-origin issues
    }
  }, [isPaused, phase, workoutVideoAutoplay]);

  // Exercise initialization & voice cues
  useEffect(() => {
    if (phase === 'overview') return;
    if (skipExerciseInitRef.current) {
      skipExerciseInitRef.current = false;
      return;
    }
    if (currentExercise) {
      transitionRef.current = false;
      advancingRef.current = false;
      setTimeLeft(currentExercise.durationSeconds ?? 60);
      setPhase('exercise');
      setIsPaused(false);

      if (!isMuted && setTracker.exerciseMode === 'continuous') {
        if (voiceCoachEnabled) {
          sounds.speak(`ابدأ: ${currentExercise.arabicName || currentExercise.name}`);
        }
      }
    }
  }, [currentIndex, sessionExercises]);

  // Countdown timer interval
  useEffect(() => {
    if (phase === 'completed' || phase === 'overview' || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTotalElapsedTime(t => t + 1);

      if (phase === 'exercise') {
        if (setTracker.exerciseMode === 'continuous' && setTracker.readyCountdown === null) {
          setTimeLeft(prev => {
            if (!isMuted) {
              if (prev === 11 && voiceCoachEnabled) {
                sounds.speak('متبقي عشر ثوانٍ');
              } else if (prev <= 4 && prev > 1) {
                sounds.playCountdownTick();
              }
            }

            if (prev <= 1) {
              handleExerciseFinish(true);
              return 0;
            }
            return prev - 1;
          });
        }
      } else if (phase === 'rest') {
        setRestTimeLeft(prev => {
          if (!isMuted && prev <= 4 && prev > 1) {
            sounds.playCountdownTick();
          }

          if (prev <= 1) {
            startNextExercise();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isPaused, isMuted, voiceCoachEnabled, currentIndex, setTracker.exerciseMode, setTracker.readyCountdown]);

  const startFreshSession = () => {
    clearSavedWorkoutSession(routine);
    setSavedSession(null);
    setCompletedIndices(new Set());
    setTotalElapsedTime(0);
    setCurrentIndex(0);
    transitionRef.current = false;
    advancingRef.current = false;
    setTimeLeft(sessionExercises[0]?.durationSeconds ?? 60);
    setIsPaused(false);
    setPhase('exercise');
  };

  const resumeSavedSession = () => {
    const saved = readSavedWorkoutSession(routine);
    if (!saved) {
      startFreshSession();
      return;
    }
    const safeIndex = Math.min(sessionExercises.length - 1, Math.max(0, saved.currentIndex));
    skipExerciseInitRef.current = safeIndex !== currentIndex;
    transitionRef.current = false;
    advancingRef.current = false;
    setCompletedIndices(new Set(saved.completedIndices));
    setTotalElapsedTime(saved.totalElapsedTime ?? 0);
    setCurrentIndex(safeIndex);
    setTimeLeft(saved.timeLeft > 0 ? saved.timeLeft : (sessionExercises[safeIndex]?.durationSeconds ?? 60));
    setTracker.restoreSetState({
      currentSet: saved.currentSet ?? 1,
      currentSide: saved.currentSide ?? 'none',
      setTimeLeft: saved.setTimeLeft,
    });
    setIsPaused(false);
    setPhase('exercise');
  };

  const startNextExercise = () => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    if (currentIndex < sessionExercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setPhase('completed');
    }
  };

  const handleSwapExercise = (newEx: Exercise) => {
    if (!currentExercise) return;
    const updated = [...sessionExercises];
    updated[currentIndex] = {
      ...newEx,
      sourceExerciseId: newEx.id,
      id: currentExercise.id,
      durationSeconds: currentExercise.durationSeconds,
      restAfterSeconds: currentExercise.restAfterSeconds,
      reps: currentExercise.reps,
    };
    setSessionExercises(updated);
    setTimeLeft(newEx.durationSeconds ?? 60);
    setShowSwapModal(false);
    if (!isMuted) {
      sounds.playGoChime();
      if (voiceCoachEnabled) {
        sounds.speak(`تم استبدال التمرين بـ: ${newEx.arabicName || newEx.name}`);
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  /** Explicit "تم ✓" action: marks current step/exercise completed */
  const handleCompleteCurrent = () => {
    if (phase === 'rest') {
      startNextExercise();
      return;
    }
    if (setTracker.readyCountdown !== null) {
      setTracker.skipReadyCountdown();
      return;
    }
    if (setTracker.exerciseMode === 'pure_reps') {
      setTracker.handleCompletePureRepSet();
      return;
    }
    if (setTracker.exerciseMode === 'timed_sets') {
      setTracker.handleSetFinished();
      return;
    }
    handleExerciseFinish(true);
  };

  /** Explicit "تخطي" action: skips current exercise without counting it as completed */
  const handleSkip = () => {
    if (phase === 'rest') {
      startNextExercise();
    } else {
      handleExerciseFinish(false);
    }
  };

  const handleSkipRest = () => {
    startNextExercise();
  };

  const handleAddRestSeconds = (sec: number) => {
    setRestTimeLeft(prev => prev + sec);
  };

  const handleAddExerciseSeconds = (sec: number) => {
    if (phase !== 'exercise') return;
    if (setTracker.readyCountdown !== null) {
      setTracker.addReadySeconds(sec);
      return;
    }
    if (setTracker.exerciseMode === 'continuous') {
      setTimeLeft(prev => prev + sec);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent =
    sessionExercises.length > 0
      ? ((currentIndex + (phase === 'rest' ? 1 : 0)) / sessionExercises.length) * 100
      : 0;

  return {
    finishSession: () => setPhase('completed'),
    startFreshSession,
    resumeSavedSession,
    savedSession,
    clearSavedSession: () => {
      clearSavedWorkoutSession(routine);
      setSavedSession(null);
    },
    completedCount: completedIndices.size,
    completedIndices,
    sessionExercises,
    currentIndex,
    phase,
    setPhase,
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
  };
}
