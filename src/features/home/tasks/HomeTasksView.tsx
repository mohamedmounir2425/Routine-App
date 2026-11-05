import { useEffect, useMemo, useRef, useState } from 'react';
import type { InputRef } from 'antd';
import { liveQuery } from 'dexie';
import { Check, Plus, Pencil, Trash2, ShoppingBasket, ListChecks, CheckCheck } from 'lucide-react';
import { db } from '../../../db/database';
import type { LifeTask, HomeProject } from '../../../types';
import { saveTask, deleteTask, toggleTaskCompletion } from '../../../db/taskQueries';
import { getLocalDateString } from '../../../utils/dateUtils';
import { HomeTaskModal } from './HomeTaskModal';
import { isShoppingTask, isMaintenanceTask, isHomeTaskDone } from '../homeTasks';
import { HomeSection } from '../HomeSection';
import { HomeInput, HomeSearchInput } from '../components/HomeInputs';

export function parseShoppingTitle(rawTitle: string) {
  const clean = rawTitle.replace(/^🛒\s*/, '').trim();
  const match = clean.match(/^(.*?)\s*·\s*(.+)$/);
  if (match) {
    return { name: match[1].trim(), quantity: match[2].trim() };
  }
  return { name: clean, quantity: '' };
}

export function HomeTasksView({ shopping = false }: { shopping?: boolean }) {
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'pending' | 'all' | 'completed'>('pending');
  const [quick, setQuick] = useState('');
  const [quickQty, setQuickQty] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<LifeTask | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const quickInputRef = useRef<InputRef>(null);
  const today = getLocalDateString();

  useEffect(() => {
    const subscription = liveQuery(async () => ({
      tasks: await db.tasks.where('spaceId').equals('home').toArray(),
      projects: (await db.projects.toArray()).filter(project => !project.spaceId || project.spaceId === 'home')
    })).subscribe({
      next: data => {
        setTasks(data.tasks);
        setProjects(data.projects);
        setLoading(false);
      },
      error: () => {
        setError('تعذر تحميل القائمة. أعد فتح الصفحة.');
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const scoped = useMemo(
    () =>
      tasks.filter(task =>
        shopping ? isShoppingTask(task) : !isShoppingTask(task) && !task.isRecurring && !isMaintenanceTask(task)
      ),
    [tasks, shopping]
  );

  const visible = scoped
    .filter(
      task =>
        (!query.trim() || (task.title + ' ' + (task.description ?? '')).toLowerCase().includes(query.trim().toLowerCase())) &&
        (filter === 'all' || isHomeTaskDone(task, today) === (filter === 'completed'))
    )
    .sort(
      (a, b) =>
        Number(isHomeTaskDone(a, today)) - Number(isHomeTaskDone(b, today)) ||
        Number(b.priority === 'high') - Number(a.priority === 'high') ||
        (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
    );

  const action = async (callback: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await callback();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر حفظ التغيير. حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  };

  const completedCount = useMemo(
    () => scoped.filter(task => isHomeTaskDone(task, today)).length,
    [scoped, today]
  );
  const totalCount = scoped.length;
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const clearCompletedShopping = async () => {
    const completedTasks = scoped.filter(task => isHomeTaskDone(task, today));
    if (!completedTasks.length) return;
    if (!window.confirm(`هل تريد مسح ${completedTasks.length} من عناصر المشتريات المكتملة؟`)) return;
    await action(async () => {
      for (const t of completedTasks) {
        await deleteTask(t.id);
      }
    });
  };

  useEffect(() => {
    if (modal || editing || deleting) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        target.closest('input,textarea,select,[role="dialog"],[contenteditable=true]')
      )
        return;
      if (event.key === '/' || event.key.toLowerCase() === 'n') {
        event.preventDefault();
        quickInputRef.current?.focus();
      } else if (shopping && event.key.toLowerCase() === 'c' && completedCount > 0) {
        event.preventDefault();
        void clearCompletedShopping();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modal, editing, deleting, shopping, completedCount]);

  const addQuick = async () => {
    const title = quick.trim();
    if (!title) return;
    await action(async () => {
      let finalTitle = title;
      if (shopping) {
        let cleanName = title.replace(/^🛒\s*/, '').trim();
        let qtyPart = quickQty.trim() ? ` · ${quickQty.trim()}` : '';
        const match = cleanName.match(/^(.*?)\s*·\s*(.+)$/);
        if (match && !quickQty.trim()) {
          cleanName = match[1].trim();
          qtyPart = ` · ${match[2].trim()}`;
        }
        finalTitle = `🛒 ${cleanName}${qtyPart}`;
      }
      await saveTask({
        id: crypto.randomUUID(),
        spaceId: 'home',
        title: finalTitle,
        priority: 'medium',
        isCompleted: false,
        createdAt: new Date().toISOString()
      });
      setQuick('');
      setQuickQty('');
      setFilter('pending');
      setQuery('');
    });
  };

  return (
    <HomeSection
      title={shopping ? 'قائمة المشتريات' : 'المهام المنزلية'}
      subtitle={
        shopping
          ? 'احتياجات واضحة قبل التسوق، مع تحديد الكمية لتسهيل الشراء وتفادي النسيان.'
          : 'تابع الأعمال المنزلية، وحدد المواعيد والأولويات عند الحاجة.'
      }
    >
      {shopping && totalCount > 0 && (
        <div className="home-shopping-progress-card">
          <div className="home-shopping-progress-head">
            <div className="home-shopping-progress-text">
              <span className="home-shopping-progress-title">
                {progressPercent === 100
                  ? 'اكتملت جميع المشتريات بنجاح! ✨'
                  : `تم شراء ${completedCount} من ${totalCount} صنف (${progressPercent}%)`}
              </span>
              <span className="home-shopping-progress-sub">
                {totalCount - completedCount > 0
                  ? `متبقي ${totalCount - completedCount} صنف للشراء`
                  : 'عربة التسوق جاهزة تمامًا'}
              </span>
            </div>
            {completedCount > 0 && (
              <button
                type="button"
                className="home-shopping-clear-done-btn"
                disabled={busy}
                onClick={() => void clearCompletedShopping()}
                title="مسح كل العناصر التي تم شراؤها لتفريغ القائمة"
              >
                <CheckCheck size={14} />
                <span>مسح المكتمل</span>
              </button>
            )}
          </div>
          <div className="home-shopping-progress-bar-track">
            <div
              className="home-shopping-progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <form
        className="home-quick-add"
        onSubmit={event => {
          event.preventDefault();
          void addQuick();
        }}
      >
        <div className="home-grow">
          <span className="home-sr-only">{shopping ? 'اسم المشتريات' : 'عنوان المهمة'}</span>
          <HomeInput
            ref={quickInputRef}
            value={quick}
            maxLength={200}
            onChange={event => setQuick(event.target.value)}
            placeholder={shopping ? 'أضف احتياجًا (مثل: حليب، جبن، منظف)… (/)' : 'أضف مهمة منزلية… (/)'}
          />
        </div>
        {shopping && (
          <div className="home-qty-input-wrap">
            <span className="home-sr-only">الكمية</span>
            <HomeInput
              value={quickQty}
              maxLength={60}
              onChange={event => setQuickQty(event.target.value)}
              placeholder="الكمية (مثل: ٢ لتر)…"
              className="home-quick-qty"
            />
          </div>
        )}
        <button type="submit" className="home-primary-button" disabled={busy || !quick.trim()}>
          <Plus size={18} />
          <span>إضافة</span>
        </button>
      </form>

      <div className="home-list-toolbar">
        <HomeSearchInput
          aria-label={shopping ? 'البحث في المشتريات' : 'البحث في المهام'}
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={shopping ? 'ابحث في قائمة المشتريات…' : 'ابحث في المهام…'}
          className="flex-1 max-w-[500px]"
          shortcut=""
        />
        <button
          type="button"
          className="home-secondary-button"
          onClick={() => {
            setEditing(null);
            setModal(true);
          }}
        >
          <Plus size={16} /> إضافة بتفاصيل
        </button>
      </div>

      <div className="home-list-filters" aria-label="حالة العناصر">
        {(
          [
            { key: 'pending', label: shopping ? 'لم تُشترَ' : 'قيد التنفيذ' },
            { key: 'completed', label: shopping ? 'تم الشراء' : 'المكتملة' },
            { key: 'all', label: 'الكل' }
          ] as const
        ).map(item => (
          <button
            type="button"
            key={item.key}
            aria-pressed={filter === item.key}
            onClick={() => setFilter(item.key)}
          >
            {item.label}{' '}
            <span>
              {scoped.filter(task => item.key === 'all' || isHomeTaskDone(task, today) === (item.key === 'completed')).length}
            </span>
          </button>
        ))}
      </div>

      {error && <p className="home-error" role="alert">{error}</p>}

      {loading ? (
        <p role="status" className="home-empty">
          جارٍ تحميل القائمة…
        </p>
      ) : visible.length === 0 ? (
        <div className="home-empty home-panel">
          {shopping ? <ShoppingBasket size={32} /> : <ListChecks size={32} />}
          <h3>
            {query
              ? 'لا توجد نتائج مطابقة'
              : filter === 'pending'
              ? shopping
                ? 'كل احتياجاتك مسجلة وتحت السيطرة'
                : 'لا توجد مهام معلقة'
              : 'لا توجد عناصر في هذا التصنيف'}
          </h3>
          <p>{query ? 'جرّب كلمة أخرى أو غيّر الفلتر.' : 'استخدم خانة الإضافة أعلاه لتسجيل عنصر جديد.'}</p>
        </div>
      ) : (
        <ul className="home-task-list">
          {visible.map(task => {
            const done = isHomeTaskDone(task, today);
            const parsed = shopping ? parseShoppingTitle(task.title) : { name: task.title, quantity: '' };

            return (
              <li key={task.id} className={done ? 'is-complete' : ''}>
                <button
                  type="button"
                  className="home-check"
                  aria-pressed={done}
                  aria-label={(done ? 'إعادة فتح: ' : shopping ? 'تم شراء: ' : 'إكمال: ') + task.title}
                  disabled={busy}
                  onClick={() => void action(() => toggleTaskCompletion(task.id, today))}
                >
                  {done && <Check size={18} />}
                </button>
                <div className="home-task-content">
                  <div className="home-task-title-row">
                    <h3>{parsed.name}</h3>
                    {parsed.quantity && (
                      <span className="home-shopping-qty-badge">
                        {parsed.quantity}
                      </span>
                    )}
                  </div>
                  {task.description && <p>{task.description}</p>}
                  <div className="home-task-meta">
                    {task.priority === 'high' && <span className="home-priority">أولوية عالية</span>}
                    {task.dueDate && (
                      <span>
                        {task.dueDate === today ? 'اليوم' : task.dueDate}
                        {task.dueDate < today && !done ? ' · متأخرة' : ''}
                      </span>
                    )}
                    {task.scheduledTime && <span>{task.scheduledTime}</span>}
                  </div>
                  {deleting === task.id && (
                    <div className="home-delete-confirm">
                      <span>تأكيد حذف هذا العنصر؟</span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void action(async () => {
                            await deleteTask(task.id);
                            setDeleting(null);
                          })
                        }
                      >
                        حذف
                      </button>
                      <button type="button" onClick={() => setDeleting(null)}>
                        إلغاء
                      </button>
                    </div>
                  )}
                </div>
                <div className="home-task-actions">
                  <button
                    type="button"
                    className="home-icon-button"
                    aria-label={'تعديل ' + task.title}
                    onClick={() => {
                      setEditing(task);
                      setModal(true);
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="home-icon-button"
                    aria-label={'حذف ' + task.title}
                    onClick={() => setDeleting(task.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <HomeTaskModal
        isOpen={modal}
        onClose={() => setModal(false)}
        onTaskSaved={() => setModal(false)}
        initialTask={editing}
        homeProjects={projects}
        defaultCategory={shopping ? 'shopping' : 'general'}
      />
    </HomeSection>
  );
}
