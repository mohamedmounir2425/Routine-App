import React from 'react';

interface SpaceShellProps {
  icon: string | React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SpaceShell: React.FC<SpaceShellProps> = ({
  icon,
  title,
  subtitle,
  badge,
  actions,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-6 sm:space-y-8 animate-in fade-in duration-300 w-full ${className}`}>
      {/* Space Identity & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{icon}</span>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {(badge || actions) && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
            {badge}
          </div>
        )}
      </div>

      {/* Space Content Body */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};
