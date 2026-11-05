import { useState } from 'react';
import { PlanningDialog } from '../../../components/common/PlanningDialog';
import { DayPlan, LifeTask } from '../../../types';
import { getLocalDateString } from '../../../utils/dateUtils';
import { saveDayPlan } from '../todayPlanningService';

export function DayPlanningDialog({ plan, tasks, ar, onClose, onSaved }: {
  plan?: DayPlan; tasks: LifeTask[]; ar: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [minutes, setMinutes] = useState(plan?.availableMinutes.toString() || '120');
  const [endTime, setEndTime] = useState(plan?.endTime || '22:00');
  const [selected, setSelected] = useState(plan?.essentialTaskIds || []);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const today = getLocalDateString();
  const candidates = tasks.filter(task => !task.isCompleted && (!task.dueDate || task.dueDate <= today || selected.includes(task.id)) && task.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <PlanningDialog open onOpenChange={open => { if (!open && !saving) onClose(); }} title={ar ? 'خلّينا نرتّب يومك' : 'Plan a realistic day'} description={ar ? 'حدد وقتك ونتائجك الأساسية. المواعيد النهائية الثابتة بتفضل ظاهرة حتى لو ما اخترتهاش.' : 'Set your capacity and key outcomes. Fixed deadlines stay visible even when not selected.'}>
    <form className="space-y-5" onSubmit={async event => {
      event.preventDefault(); if (saving) return;
      setSaving(true); setError('');
      try { await saveDayPlan({ date: today, availableMinutes: Number(minutes), endTime, essentialTaskIds: selected, updatedAt: new Date().toISOString() }); onSaved(); onClose(); }
      catch { setError(ar ? 'تعذر حفظ خطة اليوم. حاول مرة أخرى.' : 'Could not save your plan. Please retry.'); }
      finally { setSaving(false); }
    }}>
      {error && <p role="alert" className="text-rose-300">{error}</p>}
      <fieldset disabled={saving} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <label className="planning-field"><span>{ar ? 'وقت متاح متبقي (دقيقة)' : 'Remaining capacity (min)'}</span><input required type="number" min="0" max="1440" value={minutes} onChange={e => setMinutes(e.target.value)} /></label>
          <label className="planning-field"><span>{ar ? 'هتنهي يومك إمتى؟' : 'Your day ends at'}</span><input required type="time" value={endTime} onChange={e => setEndTime(e.target.value)} /></label>
        </div>
        <div><h3 className="font-bold mb-2">{ar ? 'اختار لحد ٣ نتائج تفرق معاك' : 'Choose up to 3 meaningful outcomes'}</h3>
          <input className="planning-search" aria-label={ar ? 'ابحث لاختيار النتائج' : 'Find outcomes'} placeholder={ar ? 'ابحث عن مهمة...' : 'Find a task…'} value={query} onChange={e => setQuery(e.target.value)} />
          <div className="planning-outcomes">{candidates.length ? candidates.map(task => <label key={task.id}>
            <input type="checkbox" checked={selected.includes(task.id)} disabled={!selected.includes(task.id) && selected.length >= 3} onChange={e => setSelected(e.target.checked ? [...selected, task.id] : selected.filter(id => id !== task.id))} />
            <span>{task.title}<small>{task.estimatedMinutes ? `${task.estimatedMinutes} ${ar ? 'دقيقة' : 'min'}` : (ar ? 'المدة غير محددة' : 'Duration not set')}</small></span>
          </label>) : <p className="today-muted p-3">{ar ? 'مفيش مهام متاحة للاختيار. تقدر تضيف مهمة من Today.' : 'No matching tasks. Add a task from Today.'}</p>}</div>
        </div>
        <button className="today-primary w-full" disabled={saving} type="submit">{saving ? (ar ? 'جاري الحفظ...' : 'Saving…') : (ar ? 'اعتمد خطة يومي' : 'Save my day plan')}</button>
      </fieldset>
    </form>
  </PlanningDialog>;
}
