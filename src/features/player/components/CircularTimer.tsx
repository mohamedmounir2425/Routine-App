import React from 'react';

interface CircularTimerProps {
  timeLeft: number;
  totalTime: number;
  size?: number;
  strokeWidth?: number;
  readyCountdown?: number | null;
  isPaused?: boolean;
  label?: string;
  isWarning?: boolean;
  onClick?: () => void;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  timeLeft,
  totalTime,
  size = 104,
  strokeWidth = 6.5,
  readyCountdown = null,
  isPaused = false,
  label = 'ثانية',
  isWarning = false,
  onClick,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = totalTime > 0 ? totalTime : 60;
  const progress = Math.max(0, Math.min(1, timeLeft / safeTotal));
  const dashoffset = circumference * (1 - progress);

  // Format time display
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const formattedTime = mins > 0 
    ? `${mins}:${secs.toString().padStart(2, '0')}` 
    : secs.toString();

  const isCountingReady = readyCountdown !== null && readyCountdown > 0;

  return (
    <div 
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none ${onClick ? 'cursor-pointer' : ''}`}
      style={{ width: size, height: size }}
      title={isPaused ? 'مؤقت متوقف مؤقتاً' : `المتبقي: ${timeLeft} ثانية`}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 origin-center drop-shadow-[0_0_16px_rgba(16,185,129,0.25)]"
      >
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isWarning ? '#fbbf24' : '#34d399'} />
            <stop offset="100%" stopColor={isWarning ? '#f59e0b' : '#14b8a6'} />
          </linearGradient>
        </defs>

        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />

        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#timerGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isCountingReady ? 0 : dashoffset}
          className="transition-all duration-300 ease-linear"
        />
      </svg>

      {/* Center Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        {isCountingReady ? (
          <div className="flex flex-col items-center justify-center animate-in zoom-in-50 duration-200">
            <span className="text-4xl sm:text-5xl font-black font-mono text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]">
              {readyCountdown}
            </span>
            <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">
              استعد
            </span>
          </div>
        ) : readyCountdown === 0 ? (
          <div className="flex flex-col items-center justify-center animate-in zoom-in duration-150">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow-[0_0_16px_rgba(52,211,153,0.9)]">
              انطلق!
            </span>
          </div>
        ) : (
          <>
            <span className={`font-black font-mono tracking-tight leading-none ${
              mins > 0 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'
            } ${isWarning ? 'text-amber-400' : 'text-emerald-400'} drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]`}>
              {formattedTime}
            </span>
            {label && (
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {label}
              </span>
            )}
            {isPaused && (
              <span className="text-[9px] text-amber-300 font-bold bg-amber-500/20 px-1.5 py-0.2 rounded mt-0.5 animate-pulse">
                إيقاف مؤقت
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
