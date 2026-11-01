import type { ReactNode } from 'react';
export function HomeSection({ title, subtitle, actions, children }: { icon?: ReactNode; title: string; subtitle?: string; badge?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className="home-section"><header className="home-section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{actions}</header><div className="home-legacy-content">{children}</div></section>;
}
