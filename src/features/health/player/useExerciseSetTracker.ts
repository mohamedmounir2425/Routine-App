import { useState, useEffect, useRef } from 'react';
import { Routine, Exercise } from '../../../types';
import { sounds } from '../../../utils/audio';

export type ExerciseMode = 'timed_sets' | 'pure_reps' | 'continuous';

interface UseExerciseSetTrackerProps {
  currentExercise: Exercise | undefined;
  routine: Routine;
  currentIndex: number;
  isPaused: boolean;
  isMuted: boolean;
  voiceCoachEnabled: boolean;
  onExerciseComplete: () => void;
}

export function useExerciseSetTracker({
  currentExercise,
  currentIndex,
  isPaused,
  routine,
  isMuted,
  voiceCoachEnabled,
  onExerciseComplete,
}: UseExerciseSetTrackerProps) {
  const presc = routine.prescriptions?.find(p => p.exerciseId === currentExercise?.id);

  // Determine mode
  const isTimedSets = !!(
    presc &&
    (presc.sets > 1 || presc.sides === 'each') &&
    ((presc.holdSeconds && presc.holdSeconds > 0) || (presc.durationSeconds && presc.durationSeconds > 0)) &&
    !presc.reps
  );

  const isPureReps = !!(
    !isTimedSets &&
    ((presc && presc.sets >= 1 && presc.reps && !presc.holdSeconds && !presc.durationSeconds) ||
      (!presc && currentExercise?.reps && currentExercise.reps > 0))
  );

  const exerciseMode: ExerciseMode = isTimedSets
    ? 'timed_sets'
    : isPureReps
      ? 'pure_reps'
      : 'continuous';

  const totalSets = presc?.sets ?? 1;
  const hasSides = presc?.sides === 'each';
  const targetHoldSeconds = presc?.holdSeconds ?? presc?.durationSeconds ?? currentExercise?.durationSeconds ?? 15;

  const [currentSet, setCurrentSet] = useState<number>(1);
  const [currentSide, setCurrentSide] = useState<'right' | 'left' | 'none'>(hasSides ? 'right' : 'none');
  const [setTimerRunning, setSetTimerRunning] = useState<boolean>(false);
  const [setTimeLeft, setSetTimeLeft] = useState<number>(targetHoldSeconds);
  const [readyCountdown, setReadyCountdown] = useState<number | null>(null);

  const readyActionRef = useRef<'continuous' | 'timed_set' | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const skipResetRef = useRef(false);

  // Reset when exercise changes
  useEffect(() => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    if (skipResetRef.current) {
      skipResetRef.current = false;
      return;
    }

    setCurrentSet(1);
    setCurrentSide(hasSides ? 'right' : 'none');
    setSetTimerRunning(false);
    setSetTimeLeft(targetHoldSeconds);

    if (exerciseMode === 'continuous') {
      readyActionRef.current = 'continuous';
      setReadyCountdown(3);
      if (!isMuted) sounds.playReadyTick(3);
    } else {
      readyActionRef.current = null;
      setReadyCountdown(null);
    }

    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, [currentExercise?.id, currentIndex]);

  // Pause-aware Ready Countdown (3 -> 2 -> 1 -> start)
  useEffect(() => {
    if (isPaused || readyCountdown === null) return;

    const timer = setTimeout(() => {
      if (readyCountdown > 1) {
        const nextVal = readyCountdown - 1;
        setReadyCountdown(nextVal);
        if (!isMuted) sounds.playReadyTick(nextVal);
      } else if (readyCountdown === 1) {
        setReadyCountdown(0);
        if (!isMuted) sounds.playGoChime();
      } else {
        const action = readyActionRef.current;
        readyActionRef.current = null;
        setReadyCountdown(null);
        if (action === 'timed_set') {
          setSetTimerRunning(true);
          setSetTimeLeft(targetHoldSeconds);
        }
      }
    }, readyCountdown === 0 ? 500 : 1000);

    return () => clearTimeout(timer);
  }, [isPaused, readyCountdown, isMuted, targetHoldSeconds]);

  const skipReadyCountdown = () => {
    if (readyCountdown === null) return;
    const action = readyActionRef.current;
    readyActionRef.current = null;
    setReadyCountdown(null);
    if (!isMuted) sounds.playGoChime();
    if (action === 'timed_set') {
      setSetTimerRunning(true);
      setSetTimeLeft(targetHoldSeconds);
    }
  };

  const addReadySeconds = (sec = 3) => {
    setReadyCountdown(prev => (prev !== null ? prev + sec : sec));
  };

  // Start manual set timer (e.g. Side Plank 15s)
  const handleStartSetHold = () => {
    if (setTimerRunning || readyCountdown !== null) return;
    readyActionRef.current = 'timed_set';
    setReadyCountdown(3);
    if (!isMuted) sounds.playReadyTick(3);
  };

  // Set countdown timer tick
  useEffect(() => {
    if (isPaused || !setTimerRunning) {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      return;
    }

    holdIntervalRef.current = setInterval(() => {
      setSetTimeLeft(prev => {
        if (!isMuted && prev <= 4 && prev > 1) {
          sounds.playCountdownTick();
        }

        if (prev <= 1) {
          handleSetFinished();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, [isPaused, setTimerRunning, currentSide, currentSet, isMuted]);

  // When a timed set/side finishes
  const handleSetFinished = () => {
    setSetTimerRunning(false);
    if (!isMuted) sounds.playRestChime();

    if (hasSides && currentSide === 'right') {
      setCurrentSide('left');
      setSetTimeLeft(targetHoldSeconds);
      if (!isMuted && voiceCoachEnabled) {
        sounds.speak('بدّل للجانب الأيسر');
      }
    } else if (currentSet < totalSets) {
      setCurrentSet(prev => prev + 1);
      setCurrentSide(hasSides ? 'right' : 'none');
      setSetTimeLeft(targetHoldSeconds);
      if (!isMuted && voiceCoachEnabled) {
        sounds.speak(`استعد للمجموعة ${currentSet + 1}`);
      }
    } else {
      onExerciseComplete();
    }
  };

  // For pure reps: manual set/side completion
  const handleCompletePureRepSet = () => {
    if (!isMuted) sounds.playGoChime();

    if (hasSides && currentSide === 'right') {
      setCurrentSide('left');
      if (!isMuted && voiceCoachEnabled) {
        sounds.speak('الجانب الأيسر');
      }
      return;
    }

    if (currentSet < totalSets) {
      setCurrentSet(prev => prev + 1);
      setCurrentSide(hasSides ? 'right' : 'none');
      if (!isMuted && voiceCoachEnabled) {
        sounds.speak(`المجموعة ${currentSet + 1}`);
      }
    } else {
      onExerciseComplete();
    }
  };

  const restoreSetState = (saved: {
    currentSet: number;
    currentSide: 'right' | 'left' | 'none';
    setTimeLeft?: number;
  }) => {
    skipResetRef.current = true;
    setCurrentSet(Math.min(totalSets, Math.max(1, saved.currentSet)));
    setCurrentSide(hasSides ? (saved.currentSide === 'left' ? 'left' : 'right') : 'none');
    if (saved.setTimeLeft !== undefined && saved.setTimeLeft > 0) {
      setSetTimeLeft(saved.setTimeLeft);
    }
    setReadyCountdown(null);
  };

  return {
    exerciseMode,
    currentSet,
    totalSets,
    currentSide,
    hasSides,
    presc,
    targetHoldSeconds,
    setTimeLeft,
    setTimerRunning,
    readyCountdown,
    skipReadyCountdown,
    addReadySeconds,
    handleStartSetHold,
    handleSetFinished,
    handleCompletePureRepSet,
    restoreSetState,
  };
}
