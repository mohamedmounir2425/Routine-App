import React from 'react';
import { RefreshCw, Play, Check, BookOpen, Plus } from 'lucide-react';
import { Exercise, Routine } from '../../../../types';
import { useExerciseSetTracker } from '../useExerciseSetTracker';
import { CircularTimer } from './CircularTimer';

interface PlayerExerciseInfoProps {
  currentExercise: Exercise;
  routine: Routine;
  currentIndex: number;
  totalExercises: number;
  timeLeft: number;
  onOpenSwapModal: () => void;
  onOpenInstructions?: () => void;
  hasAvailableExercises: boolean;
  setTracker: ReturnType<typeof useExerciseSetTracker>;
  isPaused?: boolean;
  onAddExerciseSeconds?: (sec: number) => void;
}

export const PlayerExerciseInfo: React.FC<PlayerExerciseInfoProps> = ({
  currentExercise,
  routine,
  currentIndex,
  totalExercises,
  timeLeft,
  onOpenSwapModal,
  onOpenInstructions,
  hasAvailableExercises,
  setTracker,
  isPaused = false,
  onAddExerciseSeconds,
}) => {
  const presc = setTracker.presc || routine.prescriptions?.find(p => p.exerciseId === currentExercise.id);

  const primaryTip =
    presc?.notes ||
    currentExercise.instructions?.[0] ||
    currentExercise.description ||
    'حافظ على التنفس الهادئ طوال الحركة';

  return (
    <div className="w-full flex-1 min-h-0 liquid-glass-card rounded-3xl p-3 sm:p-4 flex flex-col justify-between shadow-2xl gap-2">
      {/* Top Row: Exercise Number + Set/Side Prescription + Swap Button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-xl liquid-glass-pill text-emerald-300 text-xs font-black font-['Tajawal'] flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              التمرين {currentIndex + 1} من {totalExercises}
            </span>
          </span>

          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            المجموعة {setTracker.currentSet} من {setTracker.totalSets}
            {setTracker.hasSides
              ? ` • ${setTracker.currentSide === 'right' ? 'الجانب الأيمن' : 'الجانب الأيسر'}`
              : ''}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {hasAvailableExercises && (
            <button
              type="button"
              onClick={onOpenSwapModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl liquid-glass-pill hover:text-emerald-400 text-slate-300 text-xs font-bold transition-all shrink-0 liquid-button"
              title="استبدال هذا التمرين ببديل ألطف للظهر"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>استبدال</span>
            </button>
          )}
        </div>
      </div>

      {/* Middle Row: Title, Set Status & Circular Timer / Reps Badge */}
      <div className="flex items-center justify-between gap-3 py-1">
        <div className="text-right min-w-0 flex-1">
          <h2 className="font-black text-white font-['Tajawal'] tracking-tight text-lg sm:text-2xl truncate">
            {currentExercise.arabicName}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{currentExercise.name}</p>

          {setTracker.exerciseMode === 'timed_sets' && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                {setTracker.hasSides
                  ? setTracker.currentSide === 'right'
                    ? 'الجانب الأيمن'
                    : 'الجانب الأيسر'
                  : `المجموعة ${setTracker.currentSet}`}
                {` • ثبات ${setTracker.targetHoldSeconds} ثانية`}
              </span>
              {!setTracker.setTimerRunning && setTracker.readyCountdown === null && (
                <button
                  type="button"
                  onClick={setTracker.handleStartSetHold}
                  className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 liquid-button"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>
                    ابدأ{' '}
                    {setTracker.hasSides
                      ? setTracker.currentSide === 'right'
                        ? 'الجانب الأيمن'
                        : 'الجانب الأيسر'
                      : `المجموعة ${setTracker.currentSet}`}{' '}
                    ({setTracker.targetHoldSeconds}ث) ▶
                  </span>
                </button>
              )}
            </div>
          )}

          {setTracker.exerciseMode === 'pure_reps' && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-teal-300 bg-teal-500/15 border border-teal-500/30 px-2.5 py-0.5 rounded-lg">
                {presc?.reps ?? currentExercise.reps ?? 10} تكرار
                {setTracker.hasSides
                  ? ` • ${setTracker.currentSide === 'right' ? 'الجانب الأيمن أولًا' : 'الجانب الأيسر الآن'}`
                  : ' • نفّذ العدات بهدوء'}
              </span>
            </div>
          )}
        </div>

        {/* Counter Area: Circular Timer or Pure Reps Badge */}
        <div className="shrink-0 flex flex-col items-center gap-1.5">
          {setTracker.exerciseMode === 'pure_reps' ? (
            <div className="flex flex-col items-center gap-1 p-2.5 rounded-2xl liquid-glass-pill text-center min-w-[104px]">
              <span className="text-3xl sm:text-4xl font-black font-mono text-teal-300 drop-shadow-[0_0_12px_rgba(45,212,191,0.3)] leading-none">
                {presc?.reps ?? currentExercise.reps ?? 10}
              </span>
              <span className="text-[10px] text-slate-300 font-bold">
                {setTracker.hasSides
                  ? `${setTracker.currentSide === 'right' ? 'يمين' : 'يسار'} (${setTracker.currentSet}/${setTracker.totalSets})`
                  : `عدات (${setTracker.currentSet}/${setTracker.totalSets})`}
              </span>
              <button
                type="button"
                onClick={setTracker.handleCompletePureRepSet}
                className="mt-1 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-black hover:brightness-110 active:scale-95 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1 liquid-button"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>
                  {setTracker.hasSides && setTracker.currentSide === 'right'
                    ? 'تم الأيمن ✓'
                    : setTracker.currentSet === setTracker.totalSets
                      ? 'تم التمرين ✓'
                      : `تمت المجموعة ${setTracker.currentSet} ✓`}
                </span>
              </button>
            </div>
          ) : setTracker.exerciseMode === 'timed_sets' ? (
            <CircularTimer
              timeLeft={setTracker.setTimeLeft}
              totalTime={setTracker.targetHoldSeconds}
              readyCountdown={setTracker.readyCountdown}
              isPaused={isPaused || (!setTracker.setTimerRunning && setTracker.readyCountdown === null)}
              label={setTracker.hasSides ? (setTracker.currentSide === 'right' ? 'أيمن' : 'أيسر') : 'ثبات'}
            />
          ) : (
            <>
              <CircularTimer
                timeLeft={timeLeft}
                totalTime={currentExercise.durationSeconds ?? 60}
                readyCountdown={setTracker.readyCountdown}
                isPaused={isPaused}
                label="ثانية"
              />
              {onAddExerciseSeconds && setTracker.readyCountdown === null && !isPaused && (
                <button
                  type="button"
                  onClick={() => onAddExerciseSeconds(10)}
                  aria-label="إضافة 10 ثوانٍ للمؤقت"
                  className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-white/8 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300 text-[10px] font-bold transition-all active:scale-90"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>10ث</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom Summary Tip + Button to open full Movement Instructions Drawer */}
      <div className="flex items-center justify-between gap-2 rounded-2xl liquid-glass-pill px-3 py-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm text-emerald-400 shrink-0">💡</span>
          <p className=" truncate text-xs text-slate-300">{primaryTip}</p>
        </div>
        {onOpenInstructions && (
          <button
            type="button"
            onClick={onOpenInstructions}
            className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-white/10 hover:bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>التفاصيل والشرح</span>
          </button>
        )}
      </div>
    </div>
  );
};
