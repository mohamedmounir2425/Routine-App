import { useState, useEffect, useRef } from 'react';
import { Routine, Exercise } from '../../types';
import { sounds } from '../../utils/audio';

export type PlayerPhase = 'exercise' | 'rest' | 'completed';

interface UsePlayerLogicProps {
  routine: Routine;
  exercises: Exercise[];
  defaultRestSeconds?: number;
  soundEnabled?: boolean;
  voiceCoachEnabled?: boolean;
  workoutVideoAutoplay?: boolean;
}

import { useExerciseSetTracker } from './useExerciseSetTracker';

export function usePlayerLogic({
  routine,
  exercises,
  defaultRestSeconds = 15,
  soundEnabled = true,
  voiceCoachEnabled = true,
  workoutVideoAutoplay = true,
}: UsePlayerLogicProps) {
  const [sessionExercises, setSessionExercises] = useState<Exercise[]>(exercises);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [phase, setPhase] = useState<PlayerPhase>('exercise');
  const [timeLeft, setTimeLeft] = useState<number>(exercises[0]?.durationSeconds || 60);
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

  const handleExerciseFinish = () => {
    if (currentIndex < sessionExercises.length - 1) {
      setPhase('rest');
      const restSec = currentExercise?.restAfterSeconds || defaultRestSeconds;
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
    routine,
    isMuted,
    voiceCoachEnabled,
    onExerciseComplete: handleExerciseFinish,
  });

  // Sync YouTube player play/pause state
  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return;
    try {
      if (isPaused) {
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
      } else if (phase === 'exercise' && workoutVideoAutoplay) {
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
      }
    } catch {
      // Ignore cross-origin issues
    }
  }, [isPaused, phase, workoutVideoAutoplay]);

  // Exercise initialization & voice cues
  useEffect(() => {
    if (currentExercise) {
      setTimeLeft(currentExercise.durationSeconds || 60);
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
    if (phase === 'completed' || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTotalElapsedTime(t => t + 1);

      if (phase === 'exercise') {
        // Only run continuous timer if exercise is continuous and ready countdown finished
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
              handleExerciseFinish();
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



  const startNextExercise = () => {
    if (currentIndex < sessionExercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setPhase('completed');
    }
  };

  const handleSwapExercise = (newEx: Exercise) => {
    const updated = [...sessionExercises];
    updated[currentIndex] = newEx;
    setSessionExercises(updated);
    setTimeLeft(newEx.durationSeconds || 60);
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

  const handleSkip = () => {
    handleExerciseFinish();
  };

  const handleSkipRest = () => {
    startNextExercise();
  };

  const handleAddRestSeconds = (sec: number) => {
    setRestTimeLeft(prev => prev + sec);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = sessionExercises.length > 0
    ? ((currentIndex + (phase === 'rest' ? 1 : 0)) / sessionExercises.length) * 100
    : 0;

  return {
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
    setTracker,
  };
}
