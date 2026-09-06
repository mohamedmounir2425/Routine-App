import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Exercise, Routine } from '../../../types';

interface PlayerExerciseInfoProps {
  currentExercise: Exercise;
  routine: Routine;
  currentIndex: number;
  totalExercises: number;
  timeLeft: number;
  formatTime: (seconds: number) => string;
  onOpenSwapModal: () => void;
  hasAvailableExercises: boolean;
}

export const PlayerExerciseInfo: React.FC<PlayerExerciseInfoProps> = ({
  currentExercise,
  routine,
  currentIndex,
  totalExercises,
  timeLeft,
  formatTime,
  onOpenSwapModal,
  hasAvailableExercises,
}) => {
  const presc = routine.prescriptions?.find(p => p.exerciseId === currentExercise.id);

  return (
    <div className="w-full flex-1 min-h-0 liquid-glass-card rounded-3xl p-3 sm:p-4 flex flex-col justify-between shadow-2xl">
      {/* Top Row: Exercise Number + Prescription + Category + Swap Button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-xl liquid-glass-pill text-emerald-300 text-xs font-black font-['Tajawal'] flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>التمرين {currentIndex + 1} من {totalExercises}</span>
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
    </div>
  );
};
