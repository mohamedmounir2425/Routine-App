import { HomePanel, HomeFieldGrid } from '../components/HomeLayouts';
import { HomeButton } from '../components/HomeButton';
import { Checkbox as HomeCheckbox } from 'antd';
import { HomeInput as HomeTextField, HomeTextArea } from '../components/HomeInputs';
import { HomeSelect } from '../HomeSelect';
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Sparkles, Folder, ShoppingCart, Bookmark } from 'lucide-react';
import { LifeTask, TaskPriority, HomeProject } from '../../../types';
import { saveTask } from '../../../db/taskQueries';
import { parseShoppingTitle } from './HomeTasksView';
import { HomeWorkflowDialog } from '../HomeWorkflowDialog';

interface HomeTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSaved: () => void;
  initialTask?: LifeTask | null;
  homeProjects?: HomeProject[];
  defaultCategory?: 'general' | 'shopping' | 'maintenance';
}

export const HomeTaskModal: React.FC<HomeTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskSaved,
  initialTask,
  homeProjects = [],
  defaultCategory,
}) => {
  const [title, setTitle] = useState('');
  const [shoppingQty, setShoppingQty] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>(15);
  const [projectId, setProjectId] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<'daily' | 'weekdays' | 'weekly'>('daily');
  const [isShopping, setIsShopping] = useState(false);
  const [isSomeday, setIsSomeday] = useState(false);
  const [reviewDate, setReviewDate] = useState('');
  const [taskCategory, setTaskCategory] = useState<'general' | 'maintenance'>('general');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    if (initialTask) {
      if (initialTask.title.startsWith('🛒') || (initialTask.description || '').includes('مشتريات') || defaultCategory === 'shopping') {
        const parsed = parseShoppingTitle(initialTask.title);
        setTitle(parsed.name);
        setShoppingQty(parsed.quantity);
        setIsShopping(true);
      } else {
        setTitle(initialTask.title);
        setShoppingQty('');
        setIsShopping(false);
      }
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority);
      setDueDate(initialTask.dueDate || '');
      setScheduledTime(initialTask.scheduledTime || '');
      setEstimatedMinutes(initialTask.estimatedMinutes ?? 15);
      setProjectId(initialTask.projectId || '');
      setIsRecurring(!!initialTask.isRecurring);
      setRecurrenceRule(initialTask.recurrenceRule || 'daily');
      setIsSomeday(Boolean(initialTask.isSomeday));
      setReviewDate(initialTask.reviewDate || '');
      setTaskCategory(initialTask.taskCategory === 'maintenance' ? 'maintenance' : 'general');
    } else {
      setTitle('');
      setShoppingQty('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setScheduledTime('');
      setEstimatedMinutes(15);
      setProjectId('');
      setIsRecurring(false);
      setRecurrenceRule('daily');
      setIsShopping(defaultCategory === 'shopping');
      setIsSomeday(false);
      setReviewDate('');
      setTaskCategory(defaultCategory === 'maintenance' ? 'maintenance' : 'general');
    }
  }, [initialTask, isOpen, defaultCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;

    let finalTitle = title.trim();
    if (isShopping) {
      const cleanTitle = finalTitle.replace(/^🛒\s*/, '').trim();
      const qtyPart = shoppingQty.trim() ? ` · ${shoppingQty.trim()}` : '';
      finalTitle = `🛒 ${cleanTitle}${qtyPart}`;
    }

    const taskToSave: LifeTask = {
      ...(initialTask ?? {}),
      id: initialTask?.id || `task_home_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      spaceId: 'home',
      title: finalTitle,
      description: description.trim() || undefined,
      priority,
      dueDate: isSomeday ? undefined : (dueDate || undefined),
      scheduledTime: isSomeday ? undefined : (scheduledTime || undefined),
      estimatedMinutes: typeof estimatedMinutes === 'number' && estimatedMinutes > 0 ? estimatedMinutes : undefined,
      projectId: projectId || undefined,
      sourceType: projectId ? 'project' : (isRecurring ? 'routine' : 'manual'),
      isRecurring: isSomeday ? false : isRecurring,
      recurrenceRule: !isSomeday && isRecurring ? recurrenceRule : undefined,
      isSomeday: isShopping ? false : isSomeday,
      reviewDate: !isShopping && reviewDate ? reviewDate : undefined,
      taskCategory: isShopping ? undefined : taskCategory,
      isCompleted: initialTask ? initialTask.isCompleted : false,
      completedAt: initialTask?.completedAt,
      recurringCompletionDates: initialTask?.recurringCompletionDates,
      createdAt: initialTask?.createdAt || new Date().toISOString(),
    };

    setSaving(true); setError('');
    try { await saveTask(taskToSave); onTaskSaved(); onClose(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر الحفظ. حاول مرة أخرى.'); }
    finally { setSaving(false); }
  };

  const modalTitle = (
    <div className="flex items-center gap-2">
      <span className="text-xl">🏠</span>
      <span className="font-home font-black">
        {initialTask ? 'تعديل مهمة منزلية' : 'إضافة مهمة منزلية جديدة'}
      </span>
    </div>
  );

  return (
    <HomeWorkflowDialog open={isOpen} onClose={() => { if (!saving) onClose(); }} title={initialTask ? "تعديل العنصر" : isShopping ? "إضافة مشتريات" : "إضافة مهمة"}>
      <HomePanel className="home-form-surface p-5 sm:p-6 [.home-modal-content>&]:overflow-y-auto w-full border-0 bg-home-panel font-home text-home-text shadow-none">
        <header className="home-panel-heading !flex !items-start !justify-between !gap-3.5 !mb-3 !w-full [&>div]:flex-1 [&>div]:min-w-0 [&_h2]:!text-[19px] [&_h2]:!font-extrabold [&_h2]:!m-[2px_0_0] [&_h2]:!leading-[1.4] [&_p]:!text-[12px] [&_p]:!text-home-muted [&_p]:!m-[3px_0_0] [&_p]:!leading-[1.5] max-[600.01px]:[&_h2]:text-[21px] [.home-space_&]:!bg-transparent [.home-space_&]:!shadow-none [.home-space_&_h2]:text-[20px]">
          <div>{modalTitle}</div>
          <HomeButton variant="secondary" type="button" className="home-secondary-button inline-flex items-center justify-center gap-2 min-h-11.5 p-[10px_17px] rounded-home-control text-[14px] font-bold no-underline whitespace-nowrap bg-home-raised border border-solid border-home-border text-home-text max-[600.01px]:[.home-list-toolbar_&]:text-[13px]" disabled={saving} onClick={onClose}>إغلاق</HomeButton>
        </header>
        {error && <p className="home-error p-[12px_16px] border border-solid border-home-border rounded-home-control bg-home-error-bg text-home-error-text text-[14px]" role="alert">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-home-text mb-1.5 font-home">
              {isShopping ? 'اسم الصنف أو الغرض المطلوب *' : 'عنوان المهمة / الغرض *'}
            </label>
            <HomeTextField
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isShopping ? 'مثال: حليب، بيض، أرز، مسحوق غسيل...' : 'مثال: كي القميص، تنظيف فلاتر التكييف...'}
              required
              className="w-full"
            />
          </div>

          {isShopping && (
            <div>
              <label className="block text-xs font-bold text-home-text mb-1.5 font-home">
                الكمية أو العدد المطلوب (اختياري)
              </label>
              <HomeTextField
                type="text"
                value={shoppingQty}
                onChange={(e) => setShoppingQty(e.target.value)}
                placeholder="مثال: ٢ كيلو، ٣ لتر، كرتونة، ٤ علب..."
                className="w-full"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-home-text mb-1.5 font-home">
              ملاحظات أو تفاصيل إضافية (اختياري)
            </label>
            <HomeTextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أضف تفاصيل الماركة، الحجم، أو خطوات إضافية..."
              rows={2}
              className="w-full"
            />
          </div>

          {/* Quick Tag: Shopping */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-home-raised border border-home-border">
            <div className="flex items-center gap-2 text-xs text-home-text font-bold">
              <ShoppingCart className="w-4 h-4 text-home-accent" />
              <span>تصنيف كمشتريات / مقاضي منزلية</span>
            </div>
            <HomeCheckbox
              aria-label="تصنيف كمشتريات"
              checked={isShopping}
              onChange={(e) => setIsShopping(e.target.checked)}
            />
          </div>

          {!isShopping && (
            <div className="p-3.5 rounded-2xl bg-home-raised border border-home-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-home-text font-bold">
                  <Bookmark className="w-4 h-4 text-home-accent" />
                  <span>فكرة مؤجلة / لاحقًا (لا تدخل أجندة اليوم تلقائيًا)</span>
                </div>
                <HomeCheckbox
                  aria-label="فكرة مؤجلة / لاحقًا"
                  checked={isSomeday}
                  onChange={(e) => setIsSomeday(e.target.checked)}
                />
              </div>

              <HomeFieldGrid>
                <div>
                  <label className="block text-xs font-bold text-home-text mb-1.5 font-home">
                    تصنيف المهمة
                  </label>
                  <HomeSelect
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as 'general' | 'maintenance')}
                    className="w-full"
                  >
                    <option value="general">مهمة منزلية عامة</option>
                    <option value="maintenance">صيانة وفحص منزلي</option>
                  </HomeSelect>
                </div>

                <div>
                  <label className="block text-xs font-bold text-home-text mb-1.5 font-home">
                    تاريخ المراجعة (اختياري)
                  </label>
                  <HomeTextField
                    type="date"
                    value={reviewDate}
                    onChange={(e) => setReviewDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </HomeFieldGrid>
            </div>
          )}

          {/* Priority Selection */}
          <div>
            <label className="block text-xs font-bold text-home-text mb-1.5 font-home">
              درجة الأهمية
            </label>
            <div className="grid grid-cols-3 gap-2">
              <HomeButton
                type="button"
                onClick={() => setPriority('high')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  priority === 'high'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                    : 'bg-home-raised border-home-border text-home-muted hover:text-home-text'
                }`}
              >
                🔴 عاجلة / أساسية
              </HomeButton>
              <HomeButton
                type="button"
                onClick={() => setPriority('medium')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  priority === 'medium'
                    ? 'bg-amber-500/20 border-amber-500/50 text-home-accent'
                    : 'bg-home-raised border-home-border text-home-muted hover:text-home-text'
                }`}
              >
                🟡 متوسطة
              </HomeButton>
              <HomeButton
                type="button"
                onClick={() => setPriority('low')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  priority === 'low'
                    ? 'bg-slate-500/20 border-slate-500/50 text-home-text'
                    : 'bg-home-raised border-home-border text-home-muted hover:text-home-text'
                }`}
              >
                🟢 مرنة / مؤجلة
              </HomeButton>
            </div>
          </div>

          {/* Due Date, Time & Duration */}
          {!isSomeday && (
            <HomeFieldGrid>
              <div>
                <label className="block text-xs font-bold text-home-text mb-1.5 font-home flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-home-accent" />
                  <span>تاريخ مخطط (اختياري)</span>
                </label>
                <HomeTextField
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-home-text mb-1.5 font-home flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-home-accent" />
                  <span>المدة المقدرة (بالدقائق)</span>
                </label>
                <HomeTextField
                  type="number"
                  min={1}
                  max={1440}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : '')}
                  placeholder="15"
                  className="w-full"
                />
              </div>
            </HomeFieldGrid>
          )}

          {/* Project Association */}
          {homeProjects.length > 0 && !isShopping && (
            <div>
              <label className="block text-xs font-bold text-home-text mb-1.5 font-home flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-home-accent" />
                <span>ربط بمشروع منزلي (اختياري)</span>
              </label>
              <HomeSelect
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full"
              >
                <option value="">-- بدون مشروع مستقل --</option>
                {homeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </HomeSelect>
            </div>
          )}

          {/* Recurring Routine Toggle */}
          {!isShopping && !isSomeday && (
            <div className="p-3.5 rounded-2xl bg-home-raised border border-home-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-home-text flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-home-accent" />
                  <span>روتين منزلي متكرر؟</span>
                </span>
                <HomeCheckbox
                  aria-label="روتين منزلي متكرر"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
              </div>

              {isRecurring && (
                <div className="flex gap-2 pt-1">
                  <HomeButton
                    type="button"
                    onClick={() => setRecurrenceRule('daily')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      recurrenceRule === 'daily'
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                        : 'bg-home-raised text-home-muted border border-home-border'
                    }`}
                  >
                    يومياً
                  </HomeButton>
                  <HomeButton
                    type="button"
                    onClick={() => setRecurrenceRule('weekdays')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      recurrenceRule === 'weekdays'
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                        : 'bg-home-raised text-home-muted border border-home-border'
                    }`}
                  >
                    أيام العمل
                  </HomeButton>
                  <HomeButton
                    type="button"
                    onClick={() => setRecurrenceRule('weekly')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      recurrenceRule === 'weekly'
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                        : 'bg-home-raised text-home-muted border border-home-border'
                    }`}
                  >
                    أسبوعياً
                  </HomeButton>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-home-border">
            <HomeButton
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-home-muted hover:text-home-text hover:bg-home-raised transition-colors cursor-pointer"
            >
              إلغاء
            </HomeButton>
            <HomeButton variant="primary" type="submit" disabled={saving} className="shrink-0">
              {initialTask ? 'حفظ التعديلات' : 'إضافة المهمة'}
            </HomeButton>
          </div>
        </form>
      </HomePanel>
    </HomeWorkflowDialog>
  );
};
