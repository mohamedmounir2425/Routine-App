import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Exercise } from '../../../types';

interface RestPhaseOverlayProps {
  restTimeLeft: number;
  formatTime: (seconds: number) => string;
  nextExercise?: Exercise;
  onAddRestSeconds: (sec: number) => void;
  onSkipRest: () => void;
}

export const RestPhaseOverlay: React.FC<RestPhaseOverlayProps> = ({
  restTimeLeft,
  formatTime,
  nextExercise,
  onAddRestSeconds,
  onSkipRest,
}) => {
  return (
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
          onClick={() => onAddRestSeconds(10)}
          className="px-3.5 py-2.5 rounded-xl liquid-glass-pill text-xs font-bold text-slate-300 hover:text-white transition-colors liquid-button"
        >
          +10 ثوانٍ
        </button>
        <button
          onClick={onSkipRest}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-black text-xs sm:text-sm hover:brightness-110 transition-all flex items-center gap-1.5 shadow-lg shadow-teal-500/25 liquid-button"
        >
          <span>تخطي والبدء</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
