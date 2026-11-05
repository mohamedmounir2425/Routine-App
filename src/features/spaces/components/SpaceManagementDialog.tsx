import { useState } from 'react';
import { PlanningDialog } from '../../../components/common/PlanningDialog';
import { LIFE_SPACES_CONFIG } from '../../../config/spacesConfig';
import { LifeSpaceId, TodayPreferences } from '../../../types';
import { saveEnabledSpaces } from '../../today/spaceTaskService';
import { useTranslation } from '../../../i18n';

export function SpaceManagementDialog({ enabledSpaces, onClose, onSaved }: { enabledSpaces: LifeSpaceId[]; onClose: () => void; onSaved: (prefs: TodayPreferences) => void }) {
  const { t, language } = useTranslation();
  const ar = language === 'ar';
  const [enabled, setEnabled] = useState(enabledSpaces);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  return <PlanningDialog open onOpenChange={open => { if (!open && !saving) onClose(); }} title={ar ? 'المساحات اللي تناسب يومك' : 'Spaces for your day'} description={ar ? 'فعّل المساحات اللي بتستخدمها. تعطيل مساحة بيخفيها من العرض ويحافظ على بياناتها؛ الالتزامات الضرورية تفضل في مساعد اليوم.' : 'Choose the spaces you use. Hiding a space preserves its data; essential commitments remain in your daily guide.'}>
    <form className="space-y-4" onSubmit={async event => { event.preventDefault(); if (saving) return; setSaving(true); setError(''); try { const prefs = await saveEnabledSpaces(enabled); onSaved(prefs); onClose(); } catch (err) { setError(err instanceof Error ? err.message : 'تعذر الحفظ.'); } finally { setSaving(false); } }}>
      {error && <p role="alert" className="text-rose-300 text-sm">{error}</p>}
      <fieldset disabled={saving} className="space-y-3">{LIFE_SPACES_CONFIG.map(space => <label key={space.id} className="flex gap-3 items-center border border-slate-700 rounded-xl p-4 cursor-pointer"><span className="text-2xl">{space.icon}</span><span className="flex-1"><strong className="block text-sm">{t(space.titleKey as Parameters<typeof t>[0])}</strong><small className="text-slate-400">{t(space.descriptionKey as Parameters<typeof t>[0])}</small></span><input type="checkbox" aria-label={t(space.titleKey as Parameters<typeof t>[0])} checked={enabled.includes(space.id)} onChange={e => setEnabled(e.target.checked ? [...enabled, space.id] : enabled.filter(id => id !== space.id))} className="accent-emerald-400 w-5 h-5" /></label>)}
        <button type="submit" className="today-primary w-full" disabled={saving || enabled.length === 0}>{saving ? (ar ? 'جاري الحفظ...' : 'Saving…') : (ar ? 'حفظ المساحات' : 'Save spaces')}</button>
        {enabled.length === 0 && <p className="text-xs text-amber-300">{ar ? 'اختار مساحة واحدة على الأقل.' : 'Choose at least one space.'}</p>}
      </fieldset>
    </form>
  </PlanningDialog>;
}
