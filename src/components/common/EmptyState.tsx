import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`w-full liquid-glass-card rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center border border-white/10 shadow-xl font-['Tajawal'] ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl sm:text-3xl mb-4 text-slate-300 shadow-inner">
          {icon}
        </div>
      )}

      <h3 className="text-base sm:text-lg font-black text-white mb-1.5">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed mb-5">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 liquid-button cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
