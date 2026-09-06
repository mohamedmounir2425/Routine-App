import { useState, useEffect, useRef } from 'react';
import { Routine, Exercise } from '../../types';
import { sounds } from '../../utils/audio';

export type ExerciseMode = 'timed_sets' | 'pure_reps' | 'continuous';

interface UseExerciseSetTrackerProps {
  currentExercise: Exercise | undefined;
  routine: Routine;
  isMuted: boolean;
  voiceCoachEnabled: boolean;
  onExerciseComplete: () => void;
}

export function useExerciseSetTracker({
  currentExercise,
  routine,
  isMuted,
  voiceCoachEnabled,
  onExerciseComplete,
}: UseExerciseSetTrackerProps) {
  const presc = routine.prescriptions?.find(p => p.exerciseId === currentExercise?.id);

  // Determine mode
  const isTimedSets = !!(
    presc &&
    presc.sets > 1 &&
    ((presc.holdSeconds && presc.holdSeconds > 0) || (presc.durationSeconds && presc.durationSeconds > 0))
  );

  const isPureReps = !!(
    !isTimedSets &&
    presc &&
    presc.sets > 1 &&
    presc.reps &&
    !presc.holdSeconds &&
    !presc.durationSeconds
  );

  const exerciseMode: ExerciseMode = isTimedSets
    ? 'timed_sets'
    : isPureReps
    ? 'pure_reps'
    : 'continuous';

  const totalSets = presc?.sets || 1;
  const hasSides = presc?.sides === 'each';
  const targetHoldSeconds = presc?.holdSeconds || presc?.durationSeconds || 15;

  const [currentSet, setCurrentSet] = useState<number>(1);
  const [currentSide, setCurrentSide] = useState<'right' | 'left' | 'none'>(hasSides ? 'right' : 'none');
  const [setTimerRunning, setSetTimerRunning] = useState<boolean>(false);
  const [setTimeLeft, setSetTimeLeft] = useState<number>(targetHoldSeconds);
  const [readyCountdown, setReadyCountdown] = useState<number | null>(null);

  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when exercise changes
  useEffect(() => {
    if (readyTimerRef.current) clearTimeout(readyTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    setCurrentSet(1);
    setCurrentSide(hasSides ? 'right' : 'none');
    setSetTimerRunning(false);
    setSetTimeLeft(targetHoldSeconds);

    // If continuous exercise, start 3-2-1 ready countdown immediately
    if (exerciseMode === 'continuous') {
      triggerReadyCountdown(() => {
        // Ready complete
      });
    } else {
      setReadyCountdown(null);
    }

    return () => {
      if (readyTimerRef.current) clearTimeout(readyTimerRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, [currentExercise?.id]);

  // Trigger 3, 2, 1 countdown with sounds
  const triggerReadyCountdown = (onDone: () => void) => {
    if (readyTimerRef.current) clearTimeout(readyTimerRef.current);

    setReadyCountdown(3);
    if (!isMuted) sounds.playReadyTick(3);

    readyTimerRef.current = setTimeout(() => {
      setReadyCountdown(2);
      if (!isMuted) sounds.playReadyTick(2);

      readyTimerRef.current = setTimeout(() => {
        setReadyCountdown(1);
        if (!isMuted) sounds.playReadyTick(1);

        readyTimerRef.current = setTimeout(() => {
          setReadyCountdown(0);
          if (!isMuted) sounds.playGoChime();

          readyTimerRef.current = setTimeout(() => {
            setReadyCountdown(null);
            onDone();
          }, 600);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  // Start manual set timer (e.g. Side Plank 15s)
  const handleStartSetHold = () => {
    if (setTimerRunning || readyCountdown !== null) return;

    triggerReadyCountdown(() => {
      setSetTimerRunning(true);
      setSetTimeLeft(targetHoldSeconds);
    });
  };

  // Set countdown timer tick
  useEffect(() => {
    if (!setTimerRunning) {
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
  }, [setTimerRunning, currentSide, currentSet, isMuted]);

  // When a timed set/side finishes
  const handleSetFinished = () => {
    setSetTimerRunning(false);
    if (!isMuted) sounds.playRestChime();

    if (hasSides && currentSide === 'right') {
      // Advance to left side
      setCurrentSide('left');
      setSetTimeLeft(targetHoldSeconds);
      if (!isMuted && voiceCoachEnabled) {
        sounds.speak('بدّل للجانب الآخر');
      }
    } else {
      // Both sides (or single side) of this set finished
      if (currentSet < totalSets) {
        setCurrentSet(prev => prev + 1);
        setCurrentSide(hasSides ? 'right' : 'none');
        setSetTimeLeft(targetHoldSeconds);
        if (!isMuted && voiceCoachEnabled) {
          sounds.speak(`استعد للمجموعة ${currentSet + 1}`);
        }
      } else {
        // All sets complete!
        onExerciseComplete();
      }
    }
  };

  // For pure reps: manual set completion
  const handleCompletePureRepSet = () => {
    if (!isMuted) sounds.playGoChime();

    if (currentSet < totalSets) {
      setCurrentSet(prev => prev + 1);
      if (!isMuted && voiceCoachEnabled) {
        sounds.speak(`المجموعة ${currentSet + 1}`);
      }
    } else {
      onExerciseComplete();
    }
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
    handleStartSetHold,
    handleCompletePureRepSet,
  };
}
