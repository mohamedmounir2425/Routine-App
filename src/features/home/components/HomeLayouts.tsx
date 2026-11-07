import type { HTMLAttributes } from 'react';

/** Shared layout patterns; page-specific layout stays with its page. */
export function HomeFieldGrid({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 ${className}`} {...props}>{children}</div>;
}

export function HomeStack({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex min-w-0 flex-col gap-4 ${className}`} {...props}>{children}</div>;
}

export function HomePanel({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-home-panel border border-home-border bg-home-panel ${className}`} {...props}>{children}</div>;
}
