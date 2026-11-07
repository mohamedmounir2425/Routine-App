import { forwardRef, type ComponentRef, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { CookingPot } from 'lucide-react';
import { HomeButton, type HomeButtonProps } from './HomeButton';

export const KitchenActionButton = forwardRef<ComponentRef<typeof HomeButton>, HomeButtonProps>(({ className = '', variant = 'secondary', ...props }, ref) => {
  return <HomeButton ref={ref} {...props} variant={variant}
    className={'inline-flex min-h-home-control shrink-0 items-center justify-center gap-1.5 rounded-[10px] px-3 py-1.5 text-sm font-bold whitespace-nowrap max-[600px]:px-2 max-[600px]:text-xs max-[359px]:px-1.5 ' + (variant === 'primary' ? 'max-[359px]:[&_svg]:hidden ' : '') + className} />;
});
KitchenActionButton.displayName = 'KitchenActionButton';

/** Recipe and inventory actions share one responsive kitchen header. */
export function KitchenHeader({ children }: { children: ReactNode }) {
  return <header className="flex w-full items-center justify-between gap-3 !bg-transparent pb-3.5 !shadow-none !backdrop-filter-none max-[600px]:gap-1.5">
    <div className="flex min-w-0 items-center gap-2 max-[600px]:flex-1">
      <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-home-text max-[600px]:hidden"><CookingPot size={15} className="text-home-accent" /> المطبخ</span>
      <nav className="inline-flex items-center gap-1 rounded-full border border-home-border bg-home-panel p-1 max-[600px]:w-full max-[359px]:min-w-[120px]" aria-label="أقسام المطبخ">
        {[{ to: '/home/recipes', full: '🍲 أكلات البيت', short: '🍲 أكلات' }, { to: '/home/inventory', full: '🧊 خزين البيت', short: '🧊 خزين' }].map(item => <NavLink key={item.to} to={item.to}
          className={({ isActive }) => 'inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-bold whitespace-nowrap no-underline transition-colors max-[600px]:flex-1 max-[600px]:px-1.5 max-[600px]:text-xs ' + (isActive ? 'bg-home-selection text-home-selection-text' : 'text-home-muted hover:text-home-text')}>
          <span className="max-[600px]:hidden">{item.full}</span><span className="hidden max-[600px]:inline">{item.short}</span>
        </NavLink>)}
      </nav>
    </div>
    <div className="flex shrink-0 items-center gap-2 max-[600px]:gap-1">{children}</div>
  </header>;
}
