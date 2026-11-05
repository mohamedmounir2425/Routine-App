import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { db } from '../../db/database';
import { LifeSpaceId, LifeTask } from '../../types';
import { LIFE_SPACES_CONFIG } from '../../config/spacesConfig';
import { useTranslation } from '../../i18n';
import { SpaceShell } from '../../components/layout/SpaceShell';
import { TodayQuickAddModal } from '../today/components/TodayQuickAddModal';
import { TodayItemCard } from '../today/components/TodayItemCard';
import { TodayItem } from '../today/todayTypes';
import { executeToggleTask } from '../today/todayActions';
import { getLocalDateString } from '../../utils/dateUtils';
import { getTaskTimeTag } from '../today/todayScheduling';
import '../today/today.css';

/** Shared task workspace for spaces that previously had no standalone task screen. */
export function SpaceTasksView({ spaceId }: { spaceId: LifeSpaceId }) {
  const { t, language } = useTranslation();
  const ar = language === 'ar';
  const config = LIFE_SPACES_CONFIG.find(space => space.id === spaceId)!;
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<LifeTask | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const subscription = liveQuery(() => db.tasks.where('spaceId').equals(spaceId).toArray()).subscribe({ next: items => { setTasks(items); setLoading(false); }, error: () => { setError(ar ? 'تعذر تحميل المهام.' : 'Could not load tasks.'); setLoading(false); } });
    return () => subscription.unsubscribe();
  }, [spaceId, ar]);
  const today = getLocalDateString();
  const isComplete = (task: LifeTask) => task.isRecurring ? !!task.recurringCompletionDates?.includes(today) : task.isCompleted;
  const visible = tasks.filter(task => task.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()) && (filter === 'all' || (filter === 'pending' ? !isComplete(task) : isComplete(task))));
  return <SpaceShell icon={config.icon} title={`${ar ? 'مهام' : 'Tasks ·'} ${t(config.titleKey as Parameters<typeof t>[0])}`} subtitle={ar ? 'أضف مهامك هنا أو من Today؛ هتظهر في يومها وتقدر تعدّلها من المكانين.' : 'Create tasks here or from Today. The same tasks appear on their scheduled day.'} actions={<><Link to="/today" className="today-secondary">Today</Link><button className="today-primary" onClick={() => { setEditing(null); setIsOpen(true); }}><Plus size={16} />{ar ? 'إضافة مهمة' : 'Add task'}</button></>}>
    <div className="today-dashboard">
      {error && <p role="alert" className="today-alert">{error}</p>}
      <div className="today-toolbar"><label className="today-search"><input aria-label={ar ? 'البحث في المهام' : 'Search tasks'} placeholder={ar ? 'ابحث عن مهمة...' : 'Find a task…'} value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label={ar ? 'حالة المهام' : 'Task status'} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">{ar ? 'الكل' : 'All'}</option><option value="pending">{ar ? 'المتبقي' : 'Pending'}</option><option value="completed">{ar ? 'المكتمل' : 'Completed'}</option></select></div>
      {loading ? <p role="status" className="today-empty">{ar ? 'جاري التحميل...' : 'Loading…'}</p> : visible.length ? <fieldset disabled={busy} className="space-y-3 min-w-0">{visible.map(task => {
        const done = isComplete(task);
        const item: TodayItem = { id: task.id, sourceId: task.id, title: task.title, subtitle: task.dueDate && task.dueDate > today ? `${ar ? 'مجدولة ليوم' : 'Scheduled for'} ${task.dueDate}` : task.description,
          type: spaceId === 'health' ? 'health_task' : spaceId === 'worship' ? 'worship_task' : 'plan_action', space: spaceId, priority: task.priority, estimatedMinutes: task.estimatedMinutes,
          timeTag: getTaskTimeTag(task, done, today), status: done ? 'completed' : 'pending', isCompleted: done, actionType: 'toggle_task', sortKey: 0 };
        return <TodayItemCard key={task.id} item={item} onEditTask={() => { setEditing(task); setIsOpen(true); }} onExecuteAction={async () => { if (busy) return; setBusy(true); setError(''); try { if (!await executeToggleTask(task.id)) throw new Error('Save failed'); } catch { setError(ar ? 'تعذر حفظ الإنجاز.' : 'Could not save completion.'); } finally { setBusy(false); } }} />;
      })}</fieldset> : <div className="today-empty"><h3>{ar ? 'ابدأ بأول مهمة في المساحة دي' : 'Start with a task in this space'}</h3><p>{ar ? 'المهام مش لازم تكون مرتبطة بهدف أو مشروع عشان تبدأ.' : 'A goal or project link is optional.'}</p><button className="today-primary mt-4" onClick={() => { setEditing(null); setIsOpen(true); }}>{ar ? 'إضافة مهمة' : 'Add task'}</button></div>}
      <TodayQuickAddModal isOpen={isOpen} initialSpace={spaceId} initialTask={editing} onClose={() => setIsOpen(false)} onTaskCreated={() => { setQuery(''); setFilter('all'); }} />
    </div>
  </SpaceShell>;
}
