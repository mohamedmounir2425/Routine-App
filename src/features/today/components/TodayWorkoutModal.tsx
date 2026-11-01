import { useEffect, useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { db } from '../../../db/database';
import { createSchedule } from '../../../db/workoutScheduleQueries';
import { Routine } from '../../../types';
import { useTranslation } from '../../../i18n';

export function TodayWorkoutModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineId, setRoutineId] = useState('');
  const [time, setTime] = useState('18:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    db.routines.toArray().then(items => {
      if (active) { setRoutines(items); setRoutineId(items[0]?.id || ''); }
    }).catch(() => { if (active) setError(ar ? 'تعذر تحميل الروتينات.' : 'Could not load routines.'); });
    return () => { active = false; };
  }, [ar]);
  return <Modal isOpen onClose={onClose} title={ar ? 'أضف تمريناً إلى جدولك' : 'Schedule a workout'} maxWidth="max-w-md">
    <form className="space-y-4" onSubmit={async event => {
      event.preventDefault(); if (saving) return;
      const routine = routines.find(item => item.id === routineId);
      if (!routine) return;
      setSaving(true); setError('');
      try {
        await createSchedule({ routineId, dayOfWeek: new Date().getDay(), scheduledTime: time, durationMinutes: routine.totalEstimatedMinutes, isEnabled: true });
        onSaved(); onClose();
      } catch { setError(ar ? 'تعذر حفظ الموعد. حاول مرة أخرى.' : 'Could not save the schedule. Please retry.'); }
      finally { setSaving(false); }
    }}>
      <p className="text-sm text-slate-400">{ar ? 'سيظهر في اليوم، ويتكرر أسبوعياً في نفس اليوم. يمكنك إدارة مواعيدك من مخطط الصحة.' : 'Appears in Today and repeats on this weekday. Manage your sessions in the Health planner.'}</p>
      {error && <p role="alert" className="text-rose-300 text-sm">{error}</p>}
      <fieldset disabled={saving} className="space-y-4">
        <label className="block text-sm space-y-2"><span>{ar ? 'الروتين' : 'Routine'}</span><select required value={routineId} onChange={e => setRoutineId(e.target.value)} className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700">{routines.map(routine => <option key={routine.id} value={routine.id}>{routine.name} · {routine.totalEstimatedMinutes} {ar ? 'دقيقة' : 'min'}</option>)}</select></label>
        <label className="block text-sm space-y-2"><span>{ar ? 'وقت التمرين' : 'Time'}</span><input required type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700" /></label>
        <button disabled={!routineId || saving} className="today-primary w-full" type="submit">{saving ? (ar ? 'جاري الحفظ...' : 'Saving…') : (ar ? 'حفظ الموعد' : 'Save schedule')}</button>
      </fieldset>
    </form>
  </Modal>;
}
