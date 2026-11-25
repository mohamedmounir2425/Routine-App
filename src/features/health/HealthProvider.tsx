import { lazy, Suspense, type ReactNode } from 'react';
import type { UserSettings } from '../../types';
import type { NutritionRecipeAdapter } from '../../types/health';
import { NutritionRecipeContext } from './nutrition/NutritionContext';
import { HealthContext } from './HealthContext';
import { useHealthController } from './hooks/useHealthController';
import { SpaceBoundary } from '../../shared/ui/SpaceBoundary';

const HealthOverlays = lazy(() => import('./HealthOverlays'));

export function HealthProvider({ settings, isTvMode, children, recipes }: {
  settings: UserSettings; isTvMode: boolean; children: ReactNode; recipes: NutritionRecipeAdapter;
}) {
  const health = useHealthController(settings);
  return <NutritionRecipeContext.Provider value={recipes}><HealthContext.Provider value={health}>
    {children}
    {health.playbackLoading && <div role="status" className="fixed inset-x-4 bottom-24 z-[1500] mx-auto max-w-sm rounded-xl bg-slate-900 p-4 text-center text-white shadow-lg">جارٍ تجهيز التمرين…</div>}
    {health.actionError && <div role="alert" className="fixed inset-x-4 bottom-24 z-[1500] mx-auto flex max-w-md items-center justify-between gap-4 rounded-xl bg-red-950 p-4 text-white shadow-lg">
      <span>{health.actionError}</span><button type="button" className="shrink-0 rounded-lg border px-3 py-2" onClick={() => health.setActionError(null)}>إغلاق</button>
    </div>}
    {(health.activeRoutine || health.isRoutineBuilderOpen) && <SpaceBoundary fallback={<section role="alert" className="fixed inset-x-4 bottom-24 z-[1500] mx-auto max-w-md space-y-3 rounded-xl bg-slate-900 p-4 text-center text-white shadow-lg">
      <p>تعذر فتح أدوات التمرين. أغلقها وحاول بعد إعادة تحميل الصفحة.</p>
      <button type="button" className="rounded-lg border px-4 py-2" onClick={() => { health.closePlayer(); health.setIsRoutineBuilderOpen(false); }}>إغلاق</button>
    </section>}><Suspense fallback={<p role="status" className="fixed inset-x-4 bottom-24 z-[1500] rounded-xl bg-slate-900 p-4 text-center text-white">جارٍ تحميل أدوات التمرين…</p>}>
      <HealthOverlays settings={settings} isTvMode={isTvMode} />
    </Suspense></SpaceBoundary>}
  </HealthContext.Provider></NutritionRecipeContext.Provider>;
}
