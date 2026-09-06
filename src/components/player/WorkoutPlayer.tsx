import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, X, Volume2, VolumeX, 
  Maximize2, Minimize2, Video, Activity, ChevronLeft, RefreshCw
} from 'lucide-react';
import { Routine, Exercise, WorkoutLog } from '../../types';
import { ExerciseAnimation } from './ExerciseAnimation';
import { CompletionModal } from './CompletionModal';
import { sounds } from '../../utils/audio';
import { buildWorkoutVideoUrl } from '../../utils/youtube';

interface Props {
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

type PlayerPhase = 'exercise' | 'rest' | 'completed';

export const WorkoutPlayer: React.FC<Props> = ({
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
  const [sessionExercises, setSessionExercises] = useState<Exercise[]>(exercises);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [phase, setPhase] = useState<PlayerPhase>('exercise');
  const [timeLeft, setTimeLeft] = useState<number>(exercises[0]?.durationSeconds || 60);
  const [restTimeLeft, setRestTimeLeft] = useState<number>(defaultRestSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(!soundEnabled);
  const [isTvMode, setIsTvMode] = useState<boolean>(isTvModeInitial);
  const [viewMode, setViewMode] = useState<'video' | 'animation'>(defaultViewMode);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [showSwapModal, setShowSwapModal] = useState<boolean>(false);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);

  const currentExercise: Exercise | undefined = sessionExercises[currentIndex];
  const nextExercise: Exercise | undefined = sessionExercises[currentIndex + 1];

  const timerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync YouTube player play/pause state when user pauses/resumes workout timer
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

  // Initialize exercise time when index or session exercises change
  useEffect(() => {
    if (currentExercise) {
      setTimeLeft(currentExercise.durationSeconds || 60);
      setPhase('exercise');
      setIsPaused(false);

      if (!isMuted) {
        sounds.playGoChime();
        if (voiceCoachEnabled) {
          sounds.speak(`ابدأ: ${currentExercise.arabicName || currentExercise.name}`);
        }
      }
    }
  }, [currentIndex, sessionExercises]);

  // Main countdown timer interval
  useEffect(() => {
    if (phase === 'completed' || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTotalElapsedTime(t => t + 1);

      if (phase === 'exercise') {
        setTimeLeft(prev => {
          // Audio cues during exercise
          if (!isMuted) {
            if (prev === 11 && voiceCoachEnabled) {
              sounds.speak('متبقي عشر ثوانٍ');
            } else if (prev <= 4 && prev > 1) {
              sounds.playCountdownTick();
            }
          }

          if (prev <= 1) {
            // Exercise completed -> Trigger rest or next
            handleExerciseFinish();
            return 0;
          }
          return prev - 1;
        });
      } else if (phase === 'rest') {
        setRestTimeLeft(prev => {
          if (!isMuted && prev <= 4 && prev > 1) {
            sounds.playCountdownTick();
          }

          if (prev <= 1) {
            // Rest ended -> Start next exercise
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
  }, [phase, isPaused, isMuted, voiceCoachEnabled, currentIndex]);

  const handleExerciseFinish = () => {
    if (currentIndex < sessionExercises.length - 1) {
      // Enter rest period
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
      // Completed entire routine!
      setPhase('completed');
    }
  };

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

  if (!currentExercise) return null;

  // Completion Screen
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

  const progressPercent = ((currentIndex + (phase === 'rest' ? 1 : 0)) / sessionExercises.length) * 100;

  return (
    <div className={`fixed inset-0 z-[100] top-0 left-0 right-0 bottom-0 w-full h-[100dvh] max-h-[100dvh] flex flex-col justify-between bg-[#070b14]/98 backdrop-blur-2xl text-white select-none overflow-hidden ${isTvMode ? 'p-3 sm:p-6' : 'p-2.5 sm:p-4'}`}>
      {/* Liquid Glass Ambient Orbs in Player */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="liquid-orb-1 absolute -top-16 -right-16 w-80 h-80 rounded-full blur-[100px] bg-emerald-500/20" />
        <div className="liquid-orb-2 absolute bottom-10 -left-16 w-80 h-80 rounded-full blur-[100px] bg-teal-500/15" />
      </div>

      {/* Top Header */}
      <div className="w-full max-w-3xl mx-auto shrink-0 pb-2 border-b border-white/10 relative z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowExitConfirm(true)}
              className="p-1.5 sm:p-2 rounded-xl liquid-glass-pill text-slate-400 hover:text-white transition-colors"
              title="إنهاء الجلسة والخروج"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div>
              <span className="text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full liquid-glass-pill text-emerald-400 font-['Tajawal']">
                {routine.name}
              </span>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 font-medium">
                التمرين {currentIndex + 1} من {sessionExercises.length}
              </div>
            </div>
          </div>

          {/* Action icons & Percentage Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Progress Percentage Badge */}
            <span className="px-2.5 py-1 rounded-xl liquid-glass-pill text-emerald-400 font-mono text-xs font-black shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{Math.round(progressPercent)}%</span>
            </span>

            {/* Sound Mute Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1.5 sm:p-2 rounded-xl transition-colors ${
                isMuted ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400' : 'liquid-glass-pill text-slate-300 hover:text-white'
              }`}
              title={isMuted ? 'تشغيل الصوت والتوجيه' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* TV / Big Screen Toggle */}
            <button
              onClick={() => setIsTvMode(!isTvMode)}
              className={`p-1.5 sm:p-2 rounded-xl transition-colors ${
                isTvMode ? 'bg-sky-500 text-white border-sky-400' : 'liquid-glass-pill text-slate-300 hover:text-white'
              }`}
              title={isTvMode ? 'تصغير الشاشة' : 'وضع الشاشة الكبيرة (TV)'}
            >
              {isTvMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Customized High-Visibility Segmented Progress Tracker */}
        <div 
          className="w-full flex items-center gap-1.5 sm:gap-2 mt-2.5"
          title={`إنجاز الجلسة: ${Math.round(progressPercent)}%`}
        >
          {sessionExercises.map((_, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const currentPercent = isCurrent 
              ? phase === 'exercise'
                ? ((currentExercise.durationSeconds - timeLeft) / (currentExercise.durationSeconds || 60)) * 100
                : 100
              : 0;

            return (
              <div 
                key={idx}
                className="flex-1 h-2 sm:h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative shadow-inner"
              >
                {isCompleted && (
                  <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
                )}
                {isCurrent && (
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 shadow-[0_0_14px_rgba(52,211,153,0.9)] transition-all duration-300 relative rounded-full"
                    style={{ width: `${Math.max(6, currentPercent)}%` }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-2 bg-white rounded-full animate-pulse shadow-sm" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Centered, Focused Theater Layout without scroll */}
      <div className="w-full max-w-2xl mx-auto flex-1 min-h-0 flex flex-col justify-between items-center py-2 sm:py-3 overflow-hidden gap-2 sm:gap-3">
        {phase === 'exercise' ? (
          <div className="w-full h-full flex flex-col justify-between items-center overflow-hidden gap-2 sm:gap-3">
            {/* Visual / Media Container (Prominent, comfortable sizing) */}
            <div className={`w-full rounded-3xl liquid-glass-card relative overflow-hidden shadow-2xl flex items-center justify-center shrink-0 ${
              isTvMode ? 'h-[44vh] sm:h-[50vh]' : 'h-[36vh] sm:h-[42vh] max-h-[340px]'
            }`}>
              {/* Media Toggle Pills */}
              <div className="absolute top-3 right-3 z-10 flex gap-1.5 liquid-glass-pill p-1 rounded-xl shadow-md">
                {currentExercise.videoUrl && (
                  <button
                    onClick={() => setViewMode('video')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
                      viewMode === 'video' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>فيديو</span>
                  </button>
                )}
                <button
                  onClick={() => setViewMode('animation')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
                    viewMode === 'animation' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>رسم الحركة</span>
                </button>
              </div>

              {viewMode === 'video' && currentExercise?.videoUrl ? (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <iframe
                    ref={iframeRef}
                    key={`${currentExercise.id}-${workoutVideoAutoplay}-${workoutVideoMuted}-${workoutVideoLoop}`}
                    src={buildWorkoutVideoUrl(currentExercise.videoUrl, {
                      autoplay: workoutVideoAutoplay,
                      mute: workoutVideoMuted,
                      loop: workoutVideoLoop,
                    })}
                    title={currentExercise.name}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <ExerciseAnimation
                  slug={currentExercise.animationSlug}
                  category={currentExercise.category}
                  className="w-full h-full scale-95 sm:scale-100"
                />
              )}
            </div>

            {/* Unified Exercise Details & Guidance Card (Consumes space comfortably, easy on eyes) */}
            <div className="w-full flex-1 min-h-0 liquid-glass-card rounded-3xl p-3 sm:p-4 flex flex-col justify-between shadow-2xl">
              {/* Top Row: Exercise Number + Prescription + Category + Swap Button */}
              {(() => {
                const presc = routine.prescriptions?.find(p => p.exerciseId === currentExercise.id);
                return (
                  <>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-xl liquid-glass-pill text-emerald-300 text-xs font-black font-['Tajawal'] flex items-center gap-1.5 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>التمرين {currentIndex + 1} من {sessionExercises.length}</span>
                        </span>
                        {presc ? (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                            {presc.sets} مجموعات {presc.reps ? `× ${presc.reps} عدات` : ''} {presc.holdSeconds ? `(ثبات ${presc.holdSeconds}ث)` : ''} {presc.sides === 'each' ? '• لكل جانب' : ''}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl liquid-glass-pill text-slate-300 text-xs font-semibold hidden xs:inline-block">
                            {currentExercise.category === 'back' ? 'علاج الظهر' : currentExercise.category === 'core' ? 'تقوية الجذع' : 'مرونة وإطالة'}
                          </span>
                        )}
                      </div>

                      {allAvailableExercises.length > 0 && (
                        <button
                          onClick={() => setShowSwapModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl liquid-glass-pill hover:text-emerald-400 text-slate-300 text-xs font-bold transition-all shrink-0 liquid-button"
                          title="استبدال هذا التمرين ببديل ألطف للظهر"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                          <span>استبدال ببديل 🔄</span>
                        </button>
                      )}
                    </div>

                    {/* Middle Row: Title & Giant Countdown Timer */}
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div className="text-right min-w-0 flex-1">
                        <h2 className="font-black text-white font-['Tajawal'] tracking-tight text-lg sm:text-2xl truncate">
                          {currentExercise.arabicName}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {currentExercise.name}
                        </p>
                      </div>

                      {/* Giant Countdown Timer */}
                      <div className="text-left shrink-0">
                        <div className="font-black font-mono tracking-tight text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.35)] text-5xl sm:text-6xl leading-none">
                          {formatTime(timeLeft)}
                        </div>
                        {/* Counter bar below counter with reversed direction */}
                        <div 
                          dir="ltr" 
                          className="w-28 sm:w-36 h-1.5 bg-slate-950/60 rounded-full mt-1.5 overflow-hidden border border-white/10 flex justify-start"
                        >
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                            style={{ width: `${(timeLeft / (currentExercise.durationSeconds || 60)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Guidance Box */}
                    <div className="flex items-start gap-2.5 p-2.5 rounded-2xl liquid-glass-pill text-xs text-slate-300">
                      <span className="text-base text-emerald-400 shrink-0 mt-0.5">💡</span>
                      <p className="line-clamp-2 leading-relaxed text-[11px] sm:text-xs">
                        {presc?.notes ? (
                          <>
                            <strong className="text-emerald-300 font-bold ml-1">إرشاد الجلسة:</strong>
                            {presc.notes}
                            <span className="mx-1 text-slate-500">•</span>
                          </>
                        ) : null}
                        <strong className="text-emerald-300 font-bold ml-1">إرشاد الأداء:</strong>
                        {currentExercise.precautions?.[0] || currentExercise.instructions[0]}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        ) : (
          /* REST PERIOD VIEW (Clean, comfortable and fitting without scroll) */
          <div className="w-full max-w-md liquid-glass-card border-teal-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in duration-300 my-auto">
            <span className="px-4 py-1 rounded-full liquid-glass-pill text-teal-400 text-xs font-bold uppercase tracking-wider">
              استراحة واستعداد 🌿
            </span>

            <div className="my-5">
              <div className="text-xs text-slate-400 mb-1">تنفس بعمق وفك التوتر</div>
              <div className="text-6xl sm:text-7xl font-black font-mono text-teal-400 tracking-tight drop-shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                {formatTime(restTimeLeft)}
              </div>
            </div>

            {/* Next Exercise Preview */}
            {nextExercise && (
              <div className="liquid-glass-pill rounded-2xl p-3.5 mb-5 flex items-center justify-between text-right">
                <div>
                  <div className="text-[10px] text-slate-400">التمرين القادم:</div>
                  <div className="text-sm font-bold text-white font-['Tajawal']">{nextExercise.arabicName}</div>
                  <div className="text-[11px] text-slate-400">{nextExercise.durationSeconds} ثانية</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center text-xl">
                  🧘‍♂️
                </div>
              </div>
            )}

            {/* Rest controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => handleAddRestSeconds(10)}
                className="px-3.5 py-2.5 rounded-xl liquid-glass-pill text-xs font-bold text-slate-300 hover:text-white transition-colors liquid-button"
              >
                +10 ثوانٍ
              </button>
              <button
                onClick={handleSkipRest}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-black text-xs sm:text-sm hover:brightness-110 transition-all flex items-center gap-1.5 shadow-lg shadow-teal-500/25 liquid-button"
              >
                <span>تخطي والبدء</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar: Icons replaced with proper RTL directions */}
      <div className="w-full max-w-md mx-auto shrink-0 flex items-center justify-center gap-5 sm:gap-7 py-2.5 border-t border-white/10 relative z-10">
        {/* Back / السابق button (Pointing to the right/backward in RTL) */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl liquid-glass-pill text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 flex items-center gap-2 shadow-lg liquid-button"
          title="التمرين السابق"
        >
          <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          <span className="text-xs font-bold font-['Tajawal']">السابق</span>
        </button>

        {/* Play / Pause in the center */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`w-13 h-13 sm:w-15 sm:h-15 rounded-2xl font-bold text-slate-950 shadow-xl transition-all active:scale-95 flex items-center justify-center liquid-button liquid-shimmer ${
            isPaused
              ? 'bg-gradient-to-tr from-amber-500 to-amber-300 shadow-amber-400/30'
              : 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-400 shadow-emerald-500/30'
          }`}
          title={isPaused ? 'استئناف' : 'إيقاف مؤقت'}
        >
          {isPaused ? <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-slate-950 ml-0.5" /> : <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-slate-950" />}
        </button>

        {/* Next / التالي button (Pointing to the left/forward in RTL) */}
        <button
          onClick={handleSkip}
          className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl liquid-glass-pill text-slate-300 hover:text-white transition-all active:scale-95 flex items-center gap-2 shadow-lg liquid-button"
          title="التمرين التالي"
        >
          <span className="text-xs font-bold font-['Tajawal']">التالي</span>
          <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
        </button>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-bold text-white mb-2 font-['Tajawal']">هل تريد إنهاء الجلسة؟</h3>
            <p className="text-xs text-slate-400 mb-6">
              لن يتم تسجيل التمرين الحالي في قائمة الإنجاز إذا خرجت الآن.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                متابعة التمرين
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30"
              >
                خروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Swap / Replace Exercise Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white font-['Tajawal'] flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  <span>استبدال التمرين ببديل مناسب</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  اختر تمريناً بديلاً أكثر راحة لظهرك لمتابعة الجلسة دون انقطاع
                </p>
              </div>
              <button
                onClick={() => setShowSwapModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
              {allAvailableExercises
                .filter(ex => ex.id !== currentExercise?.id)
                .map(ex => (
                  <div
                    key={ex.id}
                    onClick={() => handleSwapExercise(ex)}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 cursor-pointer flex items-center justify-between gap-3 transition-all group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white font-['Tajawal'] group-hover:text-emerald-400 transition-colors">
                        {ex.arabicName}
                      </div>
                      <div className="text-[10px] text-slate-400">{ex.name} • {ex.durationSeconds} ثانية</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-emerald-400 text-[10px] font-bold transition-all">
                      اختيار البديل
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
