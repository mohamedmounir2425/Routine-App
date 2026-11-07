import type { ReactNode } from 'react';
export function HomeSection({ title, subtitle, actions, children, className = '' }: { icon?: ReactNode; title: string; subtitle?: string; badge?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={'min-w-0 ' + className}>
    <header className="mb-4 flex items-center justify-between gap-4 !rounded-home-control border border-home-border !bg-home-panel p-4 !shadow-none !backdrop-filter-none max-[600px]:p-3">
      <div><h2 className="m-0 text-[22px] leading-normal font-extrabold">{title}</h2>{subtitle && <p className="mt-1 text-sm leading-relaxed text-home-muted">{subtitle}</p>}</div>
      {actions}
    </header>
    <div>{children}</div>
  </section>;
}
