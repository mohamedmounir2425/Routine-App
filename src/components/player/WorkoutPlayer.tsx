import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, X, Volume2, VolumeX, 
  Maximize2, Minimize2, Video, Activity, AlertTriangle, ChevronLeft
} from 'lucide-react';
import { Routine, Exercise, WorkoutLog } from '../../types';
import { ExerciseAnimation } from './ExerciseAnimation';
import { CompletionModal } from './CompletionModal';
import { sounds } from '../../utils/audio';

interface Props {
  routine: Routine;
  exercises: Exercise[];
  defaultRestSeconds?: number;
  soundEnabled?: boolean;
  voiceCoachEnabled?: boolean;
  isTvModeInitial?: boolean;
  onClose: () => void;
  onFinishWorkout: (logData: Omit<WorkoutLog, 'id'>) => void;
}

type PlayerPhase = 'exercise' | 'rest' | 'completed';

export const WorkoutPlayer: React.FC<Props> = ({
  routine,
  exercises,
  defaultRestSeconds = 15,
  soundEnabled = true,
  voiceCoachEnabled = true,
  isTvModeInitial = false,
  onClose,
  onFinishWorkout,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [phase, setPhase] = useState<PlayerPhase>('exercise');
  const [timeLeft, setTimeLeft] = useState<number>(exercises[0]?.durationSeconds || 60);
  const [restTimeLeft, setRestTimeLeft] = useState<number>(defaultRestSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(!soundEnabled);
  const [isTvMode, setIsTvMode] = useState<boolean>(isTvModeInitial);
  const [viewMode, setViewMode] = useState<'video' | 'animation'>('video');
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);

  const currentExercise: Exercise | undefined = exercises[currentIndex];
  const nextExercise: Exercise | undefined = exercises[currentIndex + 1];

  const timerRef = useRef<any>(null);

  // Initialize exercise time when index changes
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
  }, [currentIndex]);

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
    if (currentIndex < exercises.length - 1) {
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
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setPhase('completed');
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
        exercisesCompletedCount={exercises.length}
        onSaveAndClose={onFinishWorkout}
      />
    );
  }

  const progressPercent = ((currentIndex + (phase === 'rest' ? 1 : 0)) / exercises.length) * 100;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none overflow-y-auto ${isTvMode ? 'p-6 lg:p-12' : 'p-3 sm:p-6'}`}>
      {/* Top Header */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="إنهاء الجلسة والخروج"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {routine.name}
            </span>
            <div className="text-xs text-slate-400 mt-0.5">
              التمرين {currentIndex + 1} من {exercises.length}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Sound Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-xl border transition-colors ${
              isMuted ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'تشغيل الصوت والتوجيه' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* TV / Big Screen Toggle */}
          <button
            onClick={() => setIsTvMode(!isTvMode)}
            className={`p-2.5 rounded-xl border transition-colors ${
              isTvMode ? 'bg-sky-500 text-white border-sky-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title={isTvMode ? 'تصغير الشاشة' : 'وضع الشاشة الكبيرة (TV)'}
          >
            {isTvMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-5xl mx-auto h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col justify-center items-center my-4">
        {phase === 'exercise' ? (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Visual / Media Container */}
            <div className={`lg:col-span-7 flex flex-col items-center justify-center bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 relative overflow-hidden shadow-2xl ${isTvMode ? 'h-[440px]' : 'h-80 sm:h-96'}`}>
              {/* Media Toggle Pills */}
              <div className="absolute top-4 right-4 z-10 flex gap-1.5 bg-slate-950/85 p-1 rounded-xl border border-slate-800 shadow-md">
                {currentExercise.videoUrl && (
                  <button
                    onClick={() => setViewMode('video')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                      viewMode === 'video' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    فيديو يوتيوب
                  </button>
                )}
                <button
                  onClick={() => setViewMode('animation')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                    viewMode === 'animation' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  رسم الحركة
                </button>
              </div>

              {viewMode === 'video' && currentExercise.videoUrl ? (
                <div className="w-full h-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                  <iframe
                    src={currentExercise.videoUrl}
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
                  className="w-full h-full"
                />
              )}
            </div>

            {/* Exercise Details & Countdown Column */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {currentExercise.category === 'back' ? 'علاج الظهر' : currentExercise.category === 'core' ? 'تقوية الجذع' : 'إطالة ومرونة'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    ⏱ {currentExercise.durationSeconds} ثانية
                  </span>
                </div>

                <h2 className={`font-black text-white font-['Tajawal'] tracking-tight ${isTvMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}>
                  {currentExercise.arabicName}
                </h2>
                <p className="text-sm text-slate-400 font-medium">{currentExercise.name}</p>
              </div>

              {/* Big Timer */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center shadow-inner relative overflow-hidden">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  الوقت المتبقي
                </div>
                <div className={`font-black font-mono tracking-tight text-emerald-400 ${isTvMode ? 'text-7xl sm:text-8xl' : 'text-6xl sm:text-7xl'}`}>
                  {formatTime(timeLeft)}
                </div>

                {/* Micro progress ring/bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(timeLeft / (currentExercise.durationSeconds || 60)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Therapeutic instructions / precautions snippet */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-right">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                  <span className="text-emerald-400">💡</span> تعليمات الحركة السليمة:
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentExercise.instructions[0] || currentExercise.description}
                </p>

                {currentExercise.precautions && currentExercise.precautions.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-start gap-1.5 text-[11px] text-amber-400 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{currentExercise.precautions[0]}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* REST PERIOD VIEW */
          <div className="w-full max-w-2xl bg-slate-900/90 border border-teal-500/30 rounded-3xl p-8 sm:p-12 text-center shadow-2xl animate-in zoom-in duration-300">
            <span className="px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold uppercase tracking-wider">
              استراحة واستعداد 🌿
            </span>

            <div className="my-6">
              <div className="text-xs text-slate-400 mb-1">تنفس بعمق وفك التوتر</div>
              <div className="text-7xl sm:text-8xl font-black font-mono text-teal-400 tracking-tight">
                {formatTime(restTimeLeft)}
              </div>
            </div>

            {/* Next Exercise Preview */}
            {nextExercise && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-6 flex items-center justify-between text-right">
                <div>
                  <div className="text-[11px] text-slate-400">التمرين القادم:</div>
                  <div className="text-base font-bold text-white font-['Tajawal']">{nextExercise.arabicName}</div>
                  <div className="text-xs text-slate-500">{nextExercise.durationSeconds} ثانية</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
                  🧘‍♂️
                </div>
              </div>
            )}

            {/* Rest controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => handleAddRestSeconds(10)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                +10 ثوانٍ إضافية
              </button>
              <button
                onClick={handleSkipRest}
                className="px-6 py-3 rounded-xl bg-teal-500 text-slate-950 font-black text-sm hover:bg-teal-400 transition-colors flex items-center gap-2 shadow-lg shadow-teal-500/20"
              >
                <span>تخطي الاستراحة والبدء فوراً</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-center gap-4 pt-4 border-t border-slate-800/80">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
          title="التمرين السابق"
        >
          <SkipBack className="w-6 h-6" />
        </button>

        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`p-5 rounded-2xl font-bold text-slate-950 shadow-xl transition-all active:scale-95 flex items-center justify-center ${
            isPaused
              ? 'bg-amber-400 hover:bg-amber-300 shadow-amber-400/20'
              : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
          }`}
          title={isPaused ? 'استئناف' : 'إيقاف مؤقت'}
        >
          {isPaused ? <Play className="w-8 h-8 fill-slate-950 ml-0.5" /> : <Pause className="w-8 h-8 fill-slate-950" />}
        </button>

        <button
          onClick={handleSkip}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
          title="تخطي للتالي"
        >
          <SkipForward className="w-6 h-6" />
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
    </div>
  );
};
