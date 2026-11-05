import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db, type SyncConflict } from '../../../db/database';
import { CURRENT_WORKSPACE } from '../../../db/workspaceScope';
import { resolveSyncConflict } from '../../../db/versionedSync';
import { useAuth } from '../../../context/AuthContext';

const fields: Record<string, string> = {
  location: 'المكان', quantity: 'الكمية', unit: 'الوحدة', state: 'الحالة', expires_on: 'الصلاحية', use_first: 'استخدم أولًا', approximate: 'كمية تقريبية', history: 'سجل التغييرات', last_counted_at: 'آخر جرد', package_size: 'حجم العبوة', package_unit: 'وحدة العبوة', low_threshold: 'حد النقص', category: 'التصنيف',
  meal_types: 'الوجبات', ingredients: 'المكونات', notes: 'ملاحظات', image_url: 'الصورة', video_url: 'الفيديو', duration_minutes: 'المدة', servings: 'الأفراد', is_favorite: 'مفضلة', is_light: 'خفيفة',
  title: 'العنوان', name: 'الاسم', description: 'التفاصيل', status: 'الحالة', priority: 'الأولوية',
  due_date: 'يوم التنفيذ', scheduled_time: 'الوقت', deadline_at: 'موعد التسليم', estimated_minutes: 'المدة المقدرة',
  actual_minutes: 'وقت التركيز', is_completed: 'مكتملة', completed_at: 'وقت الإكمال', steps: 'الخطوات',
  focus_sessions: 'جلسات التركيز', recurring_completion_dates: 'أيام الإنجاز', essential_task_ids: 'أساسيات اليوم',
  date: 'اليوم', available_minutes: 'الوقت المتاح', end_time: 'نهاية اليوم', waiting_context: 'سبب الانتظار',
  user_name: 'الاسم', today_preferences: 'تفضيلات Today', enabled_spaces: 'المساحات الظاهرة',
};
const words: Record<string, string> = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة', TODO: 'لم تبدأ', IN_PROGRESS: 'قيد التنفيذ', WAITING: 'انتظار', DONE: 'مكتملة', active: 'نشطة', paused: 'متوقفة', completed: 'مكتملة', backlog: 'مؤجلة', in_progress: 'قيد التنفيذ', waiting: 'انتظار' };
function display(value: unknown): string {
  if (value === null || value === undefined) return 'غير محدد';
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (Array.isArray(value)) return value.map(item => typeof item === 'object' && item ? String(item.title ?? item.name ?? (item.durationMinutes !== undefined ? item.durationMinutes + ' دقيقة' : 'عنصر مسجل')) : String(item)).join('، ') || 'لا يوجد';
  if (typeof value === 'object') return Object.values(value).map(display).join('، ');
  return words[String(value)] ?? String(value);
}

export function SyncConflictsSettings() {
  const [items, setItems] = useState<SyncConflict[]>([]);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const { triggerSync } = useAuth();
  useEffect(() => {
    const subscription = liveQuery(() => db.syncConflicts.toArray()).subscribe({ next: setItems, error: () => setMessage('تعذر تحميل التعارضات. أعد فتح الإعدادات.') });
    return () => subscription.unsubscribe();
  }, []);
  const choose = async (item: SyncConflict, choice: 'local' | 'remote') => {
    if (CURRENT_WORKSPACE === 'guest' || busy) return;
    setBusy(item.key); setMessage('');
    try {
      await resolveSyncConflict(db, CURRENT_WORKSPACE.slice(5), item.key, choice);
      setMessage('اتحفظ اختيارك. لو ظهرت نسخة أحدث أثناء الرفع، هنعرضها للمراجعة.');
      await triggerSync();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر حفظ الاختيار'); }
    finally { setBusy(''); }
  };
  if (!items.length && !message) return null;
  return <section dir="rtl" className="rounded-3xl border border-amber-500/30 bg-slate-900 p-5 space-y-4">
    <h3 className="text-white font-bold">مراجعة اختلافات الجهاز والسحابة {items.length > 0 && '(' + items.length + ')'}</h3>
    <p className="text-sm text-slate-400">احتفظنا بالنسختين. اختار النسخة المناسبة لكل عنصر؛ مفيش استبدال تلقائي للتعديلات المختلفة.</p>
    {message && <p role="status" className="text-sm text-amber-200">{message}</p>}
    {items.map(item => <article key={item.key} className="rounded-2xl border border-slate-700 p-4 space-y-3">
      <h4 className="font-bold text-slate-100">{String(item.local?.title ?? item.local?.name ?? item.remote?.title ?? item.remote?.name ?? 'بيانات اليوم أو الإعدادات')}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(['local', 'remote'] as const).map(side => <div key={side} className="rounded-xl bg-slate-950 p-3 space-y-2 text-sm text-slate-300">
          <p className="font-bold text-teal-300">{side === 'local' ? 'نسخة الجهاز' : 'نسخة السحابة'}</p>
          {!item[side] ? <p className="text-rose-300">محذوفة</p> : Object.entries(fields).filter(([key]) => item[side]?.[key] !== undefined && item[side]?.[key] !== null).map(([key, label]) => <p key={key} className="break-words"><span className="text-slate-400">{label}: </span>{display(item[side]?.[key])}</p>)}
        </div>)}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <button type="button" disabled={!!busy} onClick={() => void choose(item, 'local')} className="rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white">{item.local ? 'استخدم نسخة الجهاز' : 'اعتمد حذف الجهاز'}</button>
        <button type="button" disabled={!!busy} onClick={() => void choose(item, 'remote')} className="rounded-xl bg-slate-700 px-4 py-3 text-sm font-bold text-white">{item.remote ? 'استخدم نسخة السحابة' : 'اعتمد حذف السحابة'}</button>
        <button type="button" disabled={!!busy} onClick={() => {
          const url = URL.createObjectURL(new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' }));
          const link = document.createElement('a'); link.href = url; link.download = 'lifeos-conflict-' + new Date().toISOString().slice(0, 10) + '.json'; link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }} className="rounded-xl border border-slate-600 px-4 py-3 text-sm text-slate-200">تنزيل النسختين</button>
      </div>
    </article>)}
  </section>;
}
