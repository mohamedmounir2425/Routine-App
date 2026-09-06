import React, { useRef, useState, useEffect } from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SlidingTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
  tabClassName?: string;
  indicatorClassName?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md';
  variant?: 'emerald' | 'subtle';
}

export function SlidingTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  tabClassName = '',
  indicatorClassName = '',
  fullWidth = false,
  size = 'md',
  variant = 'emerald',
}: SlidingTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const updateIndicator = () => {
    const activeBtn = tabRefs.current[activeTab];
    const container = containerRef.current;
    if (activeBtn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicator({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
        opacity: 1,
      });
    }
  };

  useEffect(() => {
    updateIndicator();
    const raf = requestAnimationFrame(updateIndicator);
    const timer = setTimeout(updateIndicator, 60);
    window.addEventListener('resize', updateIndicator);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab, tabs]);

  const sizeClasses = size === 'sm' ? 'py-1.5 px-3 text-xs' : 'py-2 px-3.5 sm:px-4 text-xs sm:text-sm';

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center p-1.5 rounded-2xl liquid-glass border border-white/10 ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {/* Smooth Sliding Active Indicator (Pill + Swipe Bottom Underline Bar) */}
      <div
        className={`absolute top-1.5 bottom-1.5 rounded-xl pointer-events-none transition-all duration-350 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          variant === 'emerald'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25'
            : 'bg-emerald-500/20 border border-emerald-500/35 text-emerald-400'
        } ${indicatorClassName}`}
        style={{
          left: `${indicator.left}px`,
          width: `${indicator.width}px`,
          opacity: indicator.opacity,
        }}
      >
        {/* Subtle glossy glass highlight on top */}
        <div className="absolute inset-0 rounded-xl bg-white/15 opacity-60" />
      </div>

      {/* Tabs */}
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[tab.id] = el; }}
            onClick={() => onChange(tab.id)}
            className={`relative z-10 flex items-center justify-center gap-2 font-bold select-none cursor-pointer transition-colors duration-200 ${
              fullWidth ? 'flex-1' : ''
            } ${sizeClasses} ${
              isActive
                ? 'text-white'
                : 'text-slate-400 hover:text-white font-medium hover:bg-white/5 rounded-xl'
            } ${tabClassName}`}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0 transition-transform duration-200" />}
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
