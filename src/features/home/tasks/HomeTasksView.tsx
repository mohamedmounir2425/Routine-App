import { HomeButton } from '../components/HomeButton';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { InputRef } from 'antd';
import { HomeCompletion } from '../components/HomeCompletion';
import { liveQuery } from 'dexie';
import { Plus, Pencil, Trash2, ShoppingBasket, ListChecks, CheckCheck, CalendarPlus, Check } from 'lucide-react';
import { db } from '../../../db/database';
import type { LifeTask, HomeProject, DayPlan } from '../../../types';
import { saveTask, deleteTask, toggleTaskCompletion } from '../../../db/taskQueries';
import {
  getDayPlan,
  addItemToDayPlan,
  removeItemFromDayPlan,
  isItemSelectedForDay,
  buildTaskRefKey,
} from '../../../db/dayPlanQueries';
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

type HomeTaskFilter = 'pending' | 'quick' | 'later' | 'completed' | 'all';

export function HomeTasksView({ shopping = false }: { shopping?: boolean }) {
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [dayPlan, setDayPlan] = useState<DayPlan | undefined>(undefined);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<HomeTaskFilter>('pending');
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
      projects: (await db.projects.toArray()).filter(project => !project.spaceId || project.spaceId === 'home'),
      dayPlan: await getDayPlan(today),
    })).subscribe({
      next: data => {
        setTasks(data.tasks);
        setProjects(data.projects);
        setDayPlan(data.dayPlan);
        setLoading(false);
      },
      error: () => {
        setError('تعذر تحميل القائمة. أعد فتح الصفحة.');
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [today]);

  const scoped = useMemo(
    () =>
      tasks.filter(task =>
        shopping ? isShoppingTask(task) : !isShoppingTask(task) && !task.isRecurring && !isMaintenanceTask(task)
      ),
    [tasks, shopping]
  );

  const matchesTaskFilter = (task: LifeTask, targetFilter: HomeTaskFilter) => {
    const done = isHomeTaskDone(task, today);
    if (shopping) {
      if (targetFilter === 'all') return true;
      if (targetFilter === 'completed') return done;
      return !done;
    }
    const isDeferred = Boolean(
      task.isSomeday ||
      task.status === 'WAITING' ||
      (task.availableFrom && task.availableFrom > today)
    );
    const isReviewDue = Boolean(task.reviewDate && task.reviewDate <= today);
    if (targetFilter === 'all') return true;
    if (targetFilter === 'completed') return done;
    if (targetFilter === 'later') return !done && (isDeferred || isReviewDue);
    if (targetFilter === 'quick') return !done && !isDeferred && Boolean(task.estimatedMinutes && task.estimatedMinutes <= 15);
    // 'pending' -> ready tasks
    return !done && !isDeferred;
  };

  const visible = scoped
    .filter(
      task =>
        (!query.trim() || (task.title + ' ' + (task.description ?? '')).toLowerCase().includes(query.trim().toLowerCase())) &&
        matchesTaskFilter(task, filter)
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
        taskCategory: shopping ? undefined : 'general',
        createdAt: new Date().toISOString()
      });
      setQuick('');
      setQuickQty('');
      setFilter('pending');
      setQuery('');
    });
  };

  const toggleSelectForToday = async (task: LifeTask) => {
    const refKey = buildTaskRefKey(task.id);
    const selected = isItemSelectedForDay(dayPlan, refKey);
    await action(async () => {
      if (selected) {
        await removeItemFromDayPlan(today, refKey);
      } else {
        await addItemToDayPlan(today, {
          refKey,
          sourceType: 'task',
          taskId: task.id,
        });
      }
    });
  };

  const filterItems: Array<{ key: HomeTaskFilter; label: string }> = shopping
    ? [
        { key: 'pending', label: 'لم تُشترَ' },
        { key: 'completed', label: 'تم الشراء' },
        { key: 'all', label: 'الكل' },
      ]
    : [
        { key: 'pending', label: 'جاهز للتنفيذ' },
        { key: 'quick', label: 'سريعة ≤ ١٥ د' },
        { key: 'later', label: 'لاحقًا / للمراجعة' },
        { key: 'completed', label: 'المكتملة' },
        { key: 'all', label: 'الكل' },
      ];

  return (
    <HomeSection
      title={shopping ? 'قائمة المشتريات' : 'المهام المنزلية'}
      subtitle={
        shopping
          ? 'احتياجات واضحة قبل التسوق، مع تحديد الكمية لتسهيل الشراء وتفادي النسيان.'
          : 'سجّل أعمال البيت الجاهزة أو المؤجلة، واختر منها ما يناسب يومك دون ازدحام صفحة اليوم.'
      }
    >
      {shopping && totalCount > 0 && (
        <div className="home-shopping-progress-card bg-home-panel border border-solid border-home-border rounded-home-panel p-[12px_16px] mb-4 flex flex-col gap-2 [box-shadow:0_1px_3px_rgba(0,_0,_0,_0.02)]">
          <div className="home-shopping-progress-head flex items-center justify-between gap-3">
            <div className="home-shopping-progress-text flex flex-col gap-0.5">
              <span className="home-shopping-progress-title text-[13.5px] font-extrabold text-home-text">
                {progressPercent === 100
                  ? 'اكتملت جميع المشتريات بنجاح! ✨'
                  : `تم شراء ${completedCount} من ${totalCount} صنف (${progressPercent}%)`}
              </span>
              <span className="home-shopping-progress-sub text-[11.5px] text-home-muted">
                {totalCount - completedCount > 0
                  ? `متبقي ${totalCount - completedCount} صنف للشراء`
                  : 'عربة التسوق جاهزة تمامًا'}
              </span>
            </div>
            {completedCount > 0 && (
              <HomeButton
                type="button"
                className="home-shopping-clear-done-btn inline-flex items-center gap-[5px] p-[5px_11px] rounded-[8px] border border-solid border-home-border bg-home-input text-home-muted text-[11.5px] font-bold cursor-pointer whitespace-nowrap [transition:all_.15s_ease] [&:hover:not(:disabled)]:border-[#ef4444] [&:hover:not(:disabled)]:text-[#ef4444] [&:hover:not(:disabled)]:bg-[rgba(239,__68,__68,__0.08)]"
                disabled={busy}
                onClick={() => void clearCompletedShopping()}
                title="مسح كل العناصر التي تم شراؤها لتفريغ القائمة"
              >
                <CheckCheck size={14} />
                <span>مسح المكتمل</span>
              </HomeButton>
            )}
          </div>
          <div className="home-shopping-progress-bar-track w-full h-1.5 rounded-[4px] bg-home-input overflow-hidden">
            <div
              className="home-shopping-progress-bar-fill h-full rounded-[4px] [background:linear-gradient(90deg,_var(--home-accent),_var(--home-green))] [transition:width_.3s_ease]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <form
        className="home-quick-add flex items-center gap-2 bg-home-panel border border-solid border-home-border p-[4px_6px] rounded-home-panel mb-4.5 [transition:border-color_.15s_ease] [&_input]:w-full [&_input]:min-w-0 [&_input]:min-h-9.5 [&_input]:text-home-text [&_input]:bg-transparent [&_input]:[border:0] [&_input]:p-[6px_10px] [&_input]:text-[13.5px] [&_input]:[outline:none] focus-within:border-home-accent focus-within:[outline:none] max-[600.01px]:p-[7px] max-[600.01px]:gap-[5px] max-[600.01px]:[&_input]:text-[16px]"
        onSubmit={event => {
          event.preventDefault();
          void addQuick();
        }}
      >
        <div className="home-grow flex-1 min-w-0">
          <span className="home-sr-only absolute w-[1px] h-[1px] p-0 m-[-1px] overflow-hidden [clip:rect(0,_0,_0,_0)] whitespace-nowrap [border:0]">{shopping ? 'اسم المشتريات' : 'عنوان المهمة'}</span>
          <HomeInput
            ref={quickInputRef}
            value={quick}
            maxLength={200}
            onChange={event => setQuick(event.target.value)}
            placeholder={shopping ? 'أضف احتياجًا (مثل: حليب، جبن، منظف)… (/)' : 'أضف مهمة منزلية جاهزة بالاسم فقط… (/)'}
          />
        </div>
        {shopping && (
          <div className="home-qty-input-wrap w-32.5 shrink-0 border-s border-solid border-s-home-border ps-2">
            <span className="home-sr-only absolute w-[1px] h-[1px] p-0 m-[-1px] overflow-hidden [clip:rect(0,_0,_0,_0)] whitespace-nowrap [border:0]">الكمية</span>
            <HomeInput
              value={quickQty}
              maxLength={60}
              onChange={event => setQuickQty(event.target.value)}
              placeholder="الكمية (مثل: ٢ لتر)…"
              className="home-quick-qty w-full min-w-0 min-h-9.5 text-home-text bg-transparent [border:0] p-[6px_8px] text-[13px] [outline:none]"
            />
          </div>
        )}
        <HomeButton variant="primary" type="submit" className="home-primary-button inline-flex items-center justify-center gap-2 min-h-11.5 p-[10px_17px] rounded-home-control text-[14px] font-bold no-underline whitespace-nowrap bg-home-button border border-solid border-home-button text-home-button-text hover:bg-home-button-hover [.home-quick-add_&]:min-h-9 [.home-quick-add_&]:p-[6px_14px] [.home-quick-add_&]:rounded-[10px] [.home-quick-add_&]:text-[13px] max-[600.01px]:[.home-inline-empty_&]:w-full max-[600.01px]:[.home-quick-add_&]:p-[10px_12px]" disabled={busy || !quick.trim()}>
          <Plus size={18} />
          <span>إضافة</span>
        </HomeButton>
      </form>

      <div className="home-list-toolbar flex gap-2.5 mb-3.5 max-[600.01px]:flex-wrap [.home-space_&]:items-center">
        <HomeSearchInput
          aria-label={shopping ? 'البحث في المشتريات' : 'البحث في المهام'}
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={shopping ? 'ابحث في قائمة المشتريات…' : 'ابحث في المهام…'}
          className="flex-1 max-w-[500px]"
          shortcut=""
        />
        <HomeButton variant="secondary"
          type="button"
          className="home-secondary-button inline-flex items-center justify-center gap-2 min-h-11.5 p-[10px_17px] rounded-home-control text-[14px] font-bold no-underline whitespace-nowrap bg-home-raised border border-solid border-home-border text-home-text max-[600.01px]:[.home-list-toolbar_&]:text-[13px]"
          onClick={() => {
            setEditing(null);
            setModal(true);
          }}
        >
          <Plus size={16} /> إضافة بتفاصيل
        </HomeButton>
      </div>

      <div className="home-list-filters flex gap-2 mb-4 overflow-x-auto p-0.5 [&_button]:flex [&_button]:items-center [&_button]:gap-1.5 [&_button]:whitespace-nowrap [&_button]:min-h-9.5 [&_button]:p-[7px_14px] [&_button]:rounded-[10px] [&_button]:border [&_button]:border-solid [&_button]:border-home-border [&_button]:text-home-muted [&_button]:bg-transparent [&_button]:text-[12.5px] [&_button]:font-semibold [&_button[aria-pressed='true']]:text-home-green-text [&_button[aria-pressed='true']]:bg-home-green-bg [&_button[aria-pressed='true']]:border-home-green-border [&_button[aria-pressed='true']]:font-bold [&_span]:text-[11.5px] [&_span]:opacity-[.9] max-[600.01px]:[&_button]:p-[8px_11px] max-[600.01px]:[&_button]:text-[12px] max-[600.01px]:[&_button]:gap-1.5 max-[700.01px]:[.inventory-library_&]:overflow-x-auto max-[700.01px]:[.inventory-library_&]:flex-nowrap" aria-label="حالة العناصر">
        {filterItems.map(item => (
          <HomeButton
            type="button"
            key={item.key}
            aria-pressed={filter === item.key}
            onClick={() => setFilter(item.key)}
          >
            {item.label}{' '}
            <span>
              {scoped.filter(task => matchesTaskFilter(task, item.key)).length}
            </span>
          </HomeButton>
        ))}
      </div>

      {error && <p className="home-error p-[12px_16px] border border-solid border-home-border rounded-home-control bg-home-error-bg text-home-error-text text-[14px]" role="alert">{error}</p>}

      {loading ? (
        <p role="status" className="home-empty flex flex-col items-center gap-2.5 p-[28px_14px] text-home-muted text-[14px] text-center [&>svg]:text-home-green [&_h3]:text-[16px] [&_h3]:font-bold [&_h3]:text-home-text">
          جارٍ تحميل القائمة…
        </p>
      ) : visible.length === 0 ? (
        <div className="home-empty home-panel flex flex-col items-center gap-2.5 p-[28px_14px] text-home-muted text-[14px] text-center [&>svg]:text-home-green [&_h3]:text-[16px] [&_h3]:font-bold [&_h3]:text-home-text max-[600.01px]:p-[17px_14px] max-[600.01px]:rounded-[16px] [.home-space_&]:rounded-home-panel [.home-space_&]:p-4.5 max-[600.01px]:[.home-space_&]:p-3.5">
          {shopping ? <ShoppingBasket size={32} /> : <ListChecks size={32} />}
          <h3>
            {query
              ? 'لا توجد نتائج مطابقة'
              : filter === 'pending'
              ? shopping
                ? 'كل احتياجاتك مسجلة وتحت السيطرة'
                : 'لا توجد مهام جاهزة معلقة'
              : 'لا توجد عناصر في هذا التصنيف'}
          </h3>
          <p>{query ? 'جرّب كلمة أخرى أو غيّر الفلتر.' : 'استخدم خانة الإضافة أعلاه لتسجيل عنصر جديد.'}</p>
        </div>
      ) : (
        <ul className="home-task-list flex flex-col gap-2 list-none m-0 p-0 [&>li]:flex [&>li]:gap-3 [&>li]:items-center [&>li]:p-[12px_14px] [&>li]:bg-home-panel [&>li]:border [&>li]:border-solid [&>li]:border-home-border [&>li]:rounded-home-panel [&>li]:[transition:all_.15s_ease] [&>li:hover]:border-home-accent [&>li.is-complete]:opacity-[0.65] [&>li.is-complete]:bg-home-raised [&_.is-complete_h3]:line-through [&_.is-complete_h3]:text-home-muted max-[600.01px]:[&>li]:p-[13px_10px] max-[600.01px]:[&>li]:gap-[9px]">
          {visible.map(task => {
            const done = isHomeTaskDone(task, today);
            const parsed = shopping ? parseShoppingTitle(task.title) : { name: task.title, quantity: '' };
            const selectedForToday = !shopping && isItemSelectedForDay(dayPlan, buildTaskRefKey(task.id));

            return (
              <li key={task.id} className={done ? 'is-complete' : ''}>
                <HomeCompletion
                  checked={done}
                  aria-label={(done ? 'إعادة فتح: ' : shopping ? 'تم شراء: ' : 'إكمال: ') + task.title}
                  disabled={busy}
                  onChange={() => void action(() => toggleTaskCompletion(task.id, today))}
                />
                <div className="home-task-content flex-1 min-w-0 [&_h3]:text-[14px] [&_h3]:font-bold [&_h3]:leading-[1.5] [&_h3]:m-0 [&_h3]:wrap-anywhere [&>p]:text-[12px] [&>p]:text-home-muted [&>p]:mt-[3px] [&>p]:whitespace-pre-wrap [&>p]:wrap-anywhere max-[600.01px]:[&_h3]:text-[14px] max-[600.01px]:[&>p]:text-[12px]">
                  <div className="home-task-title-row flex items-center gap-2 flex-wrap">
                    <h3>{parsed.name}</h3>
                    {parsed.quantity && (
                      <span className="home-shopping-qty-badge ms-auto shrink-0 text-[11px] font-bold p-[2px_8px] rounded-[6px] bg-home-raised border border-solid border-home-border text-home-accent">
                        {parsed.quantity}
                      </span>
                    )}
                    {!shopping && !done && (
                      <HomeButton
                        type="button"
                        disabled={busy}
                        onClick={() => void toggleSelectForToday(task)}
                        className={`ms-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-[11.5px] font-bold border border-solid cursor-pointer transition-all ${
                          selectedForToday
                            ? 'bg-home-green-bg border-home-green-border text-home-green-text'
                            : 'bg-home-raised border-home-border text-home-text hover:border-home-accent'
                        }`}
                      >
                        {selectedForToday ? <Check size={13} /> : <CalendarPlus size={13} />}
                        <span>{selectedForToday ? 'مختارة لليوم ✓' : '+ أضف ليومي'}</span>
                      </HomeButton>
                    )}
                  </div>
                  {task.description && <p>{task.description}</p>}
                  <div className="home-task-meta flex gap-[9px] flex-wrap text-home-muted text-[11px] mt-[7px]">
                    {task.priority === 'high' && <span className="home-priority text-home-accent">أولوية عالية</span>}
                    {task.estimatedMinutes && <span>{task.estimatedMinutes} دقيقة</span>}
                    {task.isSomeday && <span className="text-amber-300 font-bold">لاحقًا / مؤجلة</span>}
                    {task.reviewDate && (
                      <span>
                        للمراجعة: {task.reviewDate === today ? 'اليوم' : task.reviewDate}
                      </span>
                    )}
                    {task.dueDate && (
                      <span>
                        {task.dueDate === today ? 'مخططة لليوم' : task.dueDate}
                        {task.dueDate < today && !done && !task.isSomeday ? ' · متأخرة' : ''}
                      </span>
                    )}
                    {task.scheduledTime && <span>{task.scheduledTime}</span>}
                  </div>
                  {deleting === task.id && (
                    <div className="home-delete-confirm flex items-center gap-3 flex-wrap mt-[13px] text-home-error-text text-[13px] [&_button]:border [&_button]:border-solid [&_button]:border-home-border [&_button]:rounded-[9px] [&_button]:min-h-11 [&_button]:p-[8px_13px]">
                      <span>تأكيد حذف هذا العنصر؟</span>
                      <HomeButton
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
                      </HomeButton>
                      <HomeButton type="button" onClick={() => setDeleting(null)}>
                        إلغاء
                      </HomeButton>
                    </div>
                  )}
                </div>
                <div className="home-task-actions flex gap-[3px] max-[600.01px]:flex-col">
                  <HomeButton icon={<Pencil size={16} />}
                    type="button"
                    className="home-icon-button w-11 h-11 grid place-items-center bg-transparent border border-solid border-transparent rounded-home-control text-home-muted hover:bg-home-raised hover:text-home-text"
                    aria-label={'تعديل ' + task.title}
                    onClick={() => {
                      setEditing(task);
                      setModal(true);
                    }}
                  >
                  </HomeButton>
                  <HomeButton icon={<Trash2 size={16} />}
                    type="button"
                    className="home-icon-button w-11 h-11 grid place-items-center bg-transparent border border-solid border-transparent rounded-home-control text-home-muted hover:bg-home-raised hover:text-home-text"
                    aria-label={'حذف ' + task.title}
                    onClick={() => setDeleting(task.id)}
                  >
                  </HomeButton>
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
