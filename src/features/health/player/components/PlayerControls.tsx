import React from 'react';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';

interface PlayerControlsProps {
  currentIndex: number;
  isPaused: boolean;
  onPrev: () => void;
  onTogglePause: () => void;
  onNext: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentIndex,
  isPaused,
  onPrev,
  onTogglePause,
  onNext,
}) => {
  return (
    <div className="w-full max-w-md mx-auto shrink-0 flex items-center justify-center gap-5 sm:gap-7 py-2.5 border-t border-white/10 relative z-10">
      {/* Back / السابق button (Pointing to the right in RTL) */}
      <button
        onClick={onPrev}
        disabled={currentIndex === 0}
        className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl liquid-glass-pill text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 flex items-center gap-2 shadow-lg liquid-button"
        title="التمرين السابق"
      >
        <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        <span className="text-xs font-bold font-['Tajawal']">السابق</span>
      </button>

      {/* Play / Pause in the center */}
      <button
        onClick={onTogglePause}
        className={`w-13 h-13 sm:w-15 sm:h-15 rounded-2xl font-bold text-slate-950 shadow-xl transition-all active:scale-95 flex items-center justify-center liquid-button liquid-shimmer ${
          isPaused
            ? 'bg-gradient-to-tr from-amber-500 to-amber-300 shadow-amber-400/30'
            : 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-400 shadow-emerald-500/30'
        }`}
        title={isPaused ? 'استئناف' : 'إيقاف مؤقت'}
      >
        {isPaused ? (
          <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-slate-950 ml-0.5" />
        ) : (
          <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-slate-950" />
        )}
      </button>

      {/* Next / التالي button (Pointing to the left in RTL) */}
      <button
        onClick={onNext}
        className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl liquid-glass-pill text-slate-300 hover:text-white transition-all active:scale-95 flex items-center gap-2 shadow-lg liquid-button"
        title="التمرين التالي"
      >
        <span className="text-xs font-bold font-['Tajawal']">التالي</span>
        <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
      </button>
    </div>
  );
};
