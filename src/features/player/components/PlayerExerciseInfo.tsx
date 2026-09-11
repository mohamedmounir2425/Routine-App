import React, { useState } from "react";
import { RefreshCw, Play, Check, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Exercise, Routine } from "../../../types";
import { useExerciseSetTracker } from "../useExerciseSetTracker";
import { CircularTimer } from "./CircularTimer";

interface PlayerExerciseInfoProps {
  currentExercise: Exercise;
  routine: Routine;
  currentIndex: number;
  totalExercises: number;
  timeLeft: number;
  onOpenSwapModal: () => void;
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
  hasAvailableExercises,
  setTracker,
  isPaused = false,
  onAddExerciseSeconds,
}) => {
  const presc = setTracker.presc || routine.prescriptions?.find(p => p.exerciseId === currentExercise.id);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);

  // Collect all available tip text
  const tipText = [
    presc?.notes,
    ...( currentExercise.instructions || []),
    ...( currentExercise.precautions || []),
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="w-full flex-1 min-h-0 liquid-glass-card rounded-3xl p-3 sm:p-4 flex flex-col justify-between shadow-2xl gap-2">
      {/* Top Row: Exercise Number + Prescription + Swap Button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-xl liquid-glass-pill text-emerald-300 text-xs font-black font-['Tajawal'] flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>التمرين {currentIndex + 1} من {totalExercises}</span>
          </span>

          {presc ? (
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
              {presc.sets} مجموعات {presc.reps ? `× ${presc.reps} عدات` : ""} {presc.holdSeconds ? `(ثبات ${presc.holdSeconds}ث)` : ""} {presc.sides === "each" ? "• لكل جانب" : ""}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-xl liquid-glass-pill text-slate-300 text-xs font-semibold hidden xs:inline-block">
              {currentExercise.category === "back" ? "علاج الظهر" : currentExercise.category === "core" ? "تقوية الجذع" : "مرونة وإطالة"}
            </span>
          )}
        </div>

        {hasAvailableExercises && (
          <button
            onClick={onOpenSwapModal}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl liquid-glass-pill hover:text-emerald-400 text-slate-300 text-xs font-bold transition-all shrink-0 liquid-button"
            title="استبدال هذا التمرين ببديل ألطف للظهر"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>استبدال ببديل 🔄</span>
          </button>
        )}
      </div>

      {/* Middle Row: Title, Set Status & Circular Timer / Reps Badge */}
      <div className="flex items-center justify-between gap-3 py-1">
        <div className="text-right min-w-0 flex-1">
          <h2 className="font-black text-white font-['Tajawal'] tracking-tight text-lg sm:text-2xl truncate">
            {currentExercise.arabicName}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {currentExercise.name}
          </p>

          {/* Additional set or side context tag */}
          {setTracker.exerciseMode === "timed_sets" && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                {setTracker.hasSides
                  ? setTracker.currentSide === "right" ? "الجانب الأيمن" : "الجانب الأيسر"
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
                    ابدأ {setTracker.hasSides ? (setTracker.currentSide === "right" ? "الجانب الأيمن" : "الجانب الأيسر") : `المجموعة ${setTracker.currentSet}`} ({setTracker.targetHoldSeconds}ث) ▶
                  </span>
                </button>
              )}
            </div>
          )}

          {setTracker.exerciseMode === "pure_reps" && (
            <div className="mt-2">
              <span className="text-[11px] font-bold text-teal-400 bg-teal-500/15 border border-teal-500/30 px-2.5 py-0.5 rounded-lg">
                تكرارات بدون وقت • نفّذ العدات بهدوء
              </span>
            </div>
          )}
        </div>

        {/* Counter Area: Circular Timer or Pure Reps Badge */}
        <div className="shrink-0 flex flex-col items-center gap-1.5">
          {setTracker.exerciseMode === "pure_reps" ? (
            /* Pure Reps: No countdown timer, show Reps Badge + Complete Set Button */
            <div className="flex flex-col items-center gap-1 p-2 rounded-2xl liquid-glass-pill text-center min-w-[96px]">
              <span className="text-3xl sm:text-4xl font-black font-mono text-teal-300 drop-shadow-[0_0_12px_rgba(45,212,191,0.3)] leading-none">
                {presc?.reps || 10}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                عدات ({setTracker.currentSet}/{setTracker.totalSets})
              </span>
              <button
                type="button"
                onClick={setTracker.handleCompletePureRepSet}
                className="mt-1 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-black hover:brightness-110 active:scale-95 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1 liquid-button"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>
                  {setTracker.currentSet === setTracker.totalSets ? "إنهاء ✓" : `تمت المجموعة ${setTracker.currentSet} ✓`}
                </span>
              </button>
            </div>
          ) : setTracker.exerciseMode === "timed_sets" ? (
            /* Timed Sets: Circular Timer with Set Time & 3-2-1 Countdown */
            <CircularTimer
              timeLeft={setTracker.setTimeLeft}
              totalTime={setTracker.targetHoldSeconds}
              readyCountdown={setTracker.readyCountdown}
              isPaused={!setTracker.setTimerRunning && setTracker.readyCountdown === null}
              label={setTracker.hasSides ? (setTracker.currentSide === "right" ? "أيمن" : "أيسر") : "ثبات"}
              onClick={!setTracker.setTimerRunning ? setTracker.handleStartSetHold : undefined}
            />
          ) : (
            /* Continuous Exercise: Circular Countdown Timer + +10s button */
            <>
              <CircularTimer
                timeLeft={timeLeft}
                totalTime={currentExercise.durationSeconds || 60}
                readyCountdown={setTracker.readyCountdown}
                isPaused={isPaused}
                label="ثانية"
              />
              {onAddExerciseSeconds && setTracker.readyCountdown === null && !isPaused && (
                <button
                  type="button"
                  onClick={() => onAddExerciseSeconds(10)}
                  aria-label="إضافة 10 ثوانٍ للمؤقت"
                  className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-white/8 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-300 text-[10px] font-bold transition-all active:scale-90"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>10ث</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom Guidance Box — Expandable */}
      <div className="flex flex-col rounded-2xl liquid-glass-pill overflow-hidden">
        <button
          type="button"
          onClick={() => setInstructionsExpanded(v => !v)}
          className="flex items-center justify-between gap-2 px-2.5 py-2 text-xs text-slate-300 hover:text-white transition-colors w-full text-right"
          aria-expanded={instructionsExpanded}
          aria-label={instructionsExpanded ? "إخفاء التعليمات" : "عرض التعليمات كاملة"}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base text-emerald-400 shrink-0">💡</span>
            {!instructionsExpanded && (
              <p className="line-clamp-1 leading-relaxed text-[11px] sm:text-xs text-slate-300 truncate">
                {tipText}
              </p>
            )}
            {instructionsExpanded && (
              <span className="text-[11px] text-emerald-300 font-bold">إرشادات الأداء</span>
            )}
          </div>
          <span className="shrink-0 text-slate-400">
            {instructionsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        {instructionsExpanded && (
          <div className="px-2.5 pb-2.5 pt-0 space-y-1.5 animate-in slide-in-from-top-1 duration-150">
            {presc?.notes && (
              <p className="text-[11px] sm:text-xs leading-relaxed text-slate-300">
                <strong className="text-emerald-300 font-bold ml-1">إرشاد الجلسة:</strong>
                {presc.notes}
              </p>
            )}
            {currentExercise.instructions?.map((inst, i) => (
              <p key={i} className="text-[11px] sm:text-xs leading-relaxed text-slate-300">
                <strong className="text-emerald-300 font-bold ml-1">خطوة {i + 1}:</strong>
                {inst}
              </p>
            ))}
            {(currentExercise.precautions?.length ?? 0) > 0 && (
              <p className="text-[11px] sm:text-xs leading-relaxed text-amber-300">
                <strong className="font-bold ml-1">⚠️ تحذير:</strong>
                {currentExercise.precautions?.join(" • ")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
