import React, { useState, useEffect } from 'react';
import { Briefcase, Home, Target } from 'lucide-react';
import { db } from '../../../db/database';
import { LifeTask, LifeSpaceId, TaskPriority, GoalPlan } from '../../../types';
import { saveTask } from '../../../db/taskQueries';
import { getLocalDateString } from '../../../utils/dateUtils';
import { PlanningDialog } from '../../../components/common/PlanningDialog';
import { getLocalTimeString } from '../../../utils/dateUtils';

interface TodayQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  initialTask?: LifeTask | null;
  initialSpace?: LifeSpaceId;
}

export const TodayQuickAddModal: React.FC<TodayQuickAddModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  initialTask,
  initialSpace = 'work',
}) => {
  const [title, setTitle] = useState('');
  const [spaceId, setSpaceId] = useState<LifeSpaceId>('work');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [scheduledTime, setScheduledTime] = useState('');
  const [planId, setPlanId] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [activePlans, setActivePlans] = useState<GoalPlan[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dueDate, setDueDate] = useState(getLocalDateString);
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [commitment, setCommitment] = useState<NonNullable<LifeTask['commitment']>>('should');
  const [deadline, setDeadline] = useState('');
  const [goalImpact, setGoalImpact] = useState<NonNullable<LifeTask['goalImpact']>>('medium');
  const [dependencyIds, setDependencyIds] = useState<string[]>([]);
  const [otherTasks, setOtherTasks] = useState<LifeTask[]>([]);
  const [unblocked, setUnblocked] = useState(false);
  const [waitingOn, setWaitingOn] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTask?.title || '');
      setSpaceId(initialTask?.spaceId || initialSpace);
      setPriority(initialTask?.priority || 'medium');
      setScheduledTime(initialTask?.scheduledTime || '');
      setPlanId(initialTask?.planId || '');
      setIsRecurring(initialTask?.isRecurring || false);
      setDueDate(initialTask?.dueDate || getLocalDateString());
      setEstimatedMinutes(initialTask?.estimatedMinutes?.toString() || '');
      setError('');
      setCommitment(initialTask?.commitment || 'should');
      const delivery = initialTask?.deadlineAt ? new Date(initialTask.deadlineAt) : undefined;
      setDeadline(delivery && Number.isFinite(delivery.getTime()) ? `${getLocalDateString(delivery)}T${getLocalTimeString(delivery)}` : '');
      setGoalImpact(initialTask?.goalImpact || 'medium');
      setDependencyIds(initialTask?.dependsOnTaskIds || []);
      setUnblocked(false);
      setWaitingOn(initialTask?.waitingContext?.waitingOn || '');
      setFollowUpDate(initialTask?.waitingContext?.followUpDate || '');
      db.tasks.toArray().then(tasks => setOtherTasks(tasks.filter(task => task.id !== initialTask?.id && !task.isCompleted))).catch(() => setError('تعذر تحميل المهام المرتبطة.'));
      db.plans.toArray().then((plans) => {
        setActivePlans(plans.filter((p) => p.status === 'active' || p.id === initialTask?.planId));
      }).catch(() => setError('تعذر تحميل الخطط. أعد فتح النافذة.'));
    }
  }, [isOpen, initialTask, initialSpace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;
    if (spaceId === 'plans' && !planId) { setError('اختر خطة لظهور المهمة في جدول اليوم.'); return; }

    setIsSubmitting(true);
    setError('');
    try {
      const current = initialTask ? await db.tasks.get(initialTask.id) : undefined;
      if (initialTask && !current) throw new Error('Task no longer exists');
      const newTask: LifeTask = {
        ...current,
        id: initialTask?.id || `task-${crypto.randomUUID()}`,
        title: title.trim(),
        spaceId,
        priority,
        scheduledTime: scheduledTime ? scheduledTime : undefined,
        planId: planId || undefined,
        commitment,
        deadlineAt: deadline ? new Date(deadline).toISOString() : undefined,
        goalImpact,
        dependsOnTaskIds: dependencyIds,
        status: current?.status === 'WAITING' && unblocked ? 'TODO' : current?.status,
        waitingContext: current?.status === 'WAITING' ? (unblocked ? undefined : { ...current.waitingContext, waitingOn, followUpDate: followUpDate || undefined }) : current?.waitingContext,
        isRecurring,
        recurrenceRule: isRecurring ? (current?.recurrenceRule || 'daily') : undefined,
        dueDate: dueDate || getLocalDateString(),
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
        isCompleted: current?.isCompleted || false,
        createdAt: current?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveTask(newTask);
      onTaskCreated();
      onClose();
      // Reset form
      setTitle('');
      setScheduledTime('');
      setPlanId('');
      setIsRecurring(false);
    } catch (err) {
      console.error('Failed to create quick task:', err);
      setError('تعذر حفظ المهمة. بياناتك في النافذة محفوظة للمحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PlanningDialog open={isOpen} onOpenChange={open => { if (!open && !isSubmitting) onClose(); }} title={initialTask ? 'تعديل المهمة وتنظيم موعدها' : 'إضافة مهمة ليومك'} description="حدد المهمة وموعدها. لو مينفعش تتأجل، اختارها كالتزام أساسي أو حدد موعد تسليم ثابت.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        <fieldset disabled={isSubmitting} className="space-y-4 min-w-0">
        {/* Space Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 block">المساحة:</label>
          <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setSpaceId('worship')} aria-pressed={spaceId === 'worship'} className={`py-2 px-3 rounded-xl border text-xs font-bold ${spaceId === 'worship' ? 'border-emerald-500 text-emerald-300 bg-emerald-500/20' : 'border-white/10 text-slate-400 bg-white/5'}`}>🕌 العبادة</button>
              <button
                type="button"
                onClick={() => setSpaceId('work')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  spaceId === 'work'
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>العمل</span>
              </button>

              <button
                type="button"
                onClick={() => setSpaceId('home')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  spaceId === 'home'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>المنزل</span>
              </button>

              <button
                type="button"
                onClick={() => setSpaceId('plans')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  spaceId === 'plans'
                    ? 'bg-violet-500/20 border-violet-500 text-violet-300 shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>الخطط</span>
              </button>
            </div>
          </div>

          {/* If Plans selected: Choose Plan */}
          {(spaceId === 'plans' || activePlans.length > 0) && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">اختر الخطة التابعة لها:</label>
              <select
                required={spaceId === 'plans'}
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">{spaceId === 'plans' ? 'اختر خطة نشطة' : 'بدون ربط بهدف'}</option>
                {activePlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              {activePlans.length === 0 && <p className="text-xs text-amber-300">أنشئ خطة نشطة في مساحة الخطط أولاً، أو اختر مساحة أخرى للمهمة.</p>}
            </div>
          )}

          {/* Task Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">عنوان المهمة:</label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ما الذي تريد إنجازه اليوم؟"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="planning-field"><span>مدى التزامك بالمهمة</span><select value={commitment} onChange={e => setCommitment(e.target.value as NonNullable<LifeTask['commitment']>)}><option value="must">ضروري النهارده</option><option value="should">مهم، لكن قابل لإعادة التخطيط</option><option value="could">مرن حسب وقتي</option></select></label>
            <label className="planning-field"><span>موعد تسليم ثابت (اختياري)</span><input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} /><small>مختلف عن اليوم اللي ناوي تشتغل فيه على المهمة.</small></label>
          </div>
          <details className="planning-advanced"><summary>تأثير المهمة والحاجات اللي مستنياها</summary><div className="space-y-3 mt-3">
            {initialTask?.status === 'WAITING' && <div className="space-y-3"><label className="flex gap-2"><input type="checkbox" checked={unblocked} onChange={e => setUnblocked(e.target.checked)} />الرد وصل والمهمة جاهزة للعمل</label>{!unblocked && <><label className="planning-field"><span>مستني رد من مين؟</span><input value={waitingOn} onChange={e => setWaitingOn(e.target.value)} /></label><label className="planning-field"><span>موعد المتابعة</span><input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} /></label></>}</div>}
            <label className="planning-field"><span>تأثيرها على هدفك</span><select value={goalImpact} onChange={e => setGoalImpact(e.target.value as NonNullable<LifeTask['goalImpact']>)}><option value="high">خطوة مؤثرة</option><option value="medium">تقدم عادي</option><option value="low">مهمة بسيطة</option></select></label>
            <label className="planning-field"><span>مهام لازم تخلص قبلها (اختياري)</span><select multiple value={dependencyIds} onChange={e => setDependencyIds(Array.from(e.target.selectedOptions).map(option => option.value))}>{otherTasks.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}</select><small>استخدم Ctrl أو Cmd للاختيار المتعدد، أو الزر التالي لمسح الارتباطات.</small></label>
            {!!dependencyIds.length && <button type="button" className="today-secondary" onClick={() => setDependencyIds([])}>مسح المهام السابقة</button>}
          </div></details>

          {/* Priority & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">الأولوية:</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="high">🔥 عالية</option>
                <option value="medium">⚡ متوسطة</option>
                <option value="low">🌱 منخفضة</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">وقت محدد (اختياري):</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-300 space-y-1.5 block"><span>التاريخ</span><input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15" /></label>
            <label className="text-xs text-slate-300 space-y-1.5 block"><span>المدة بالدقائق</span><input type="number" min="1" max="1440" step="1" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15" /></label>
          </div>
          {/* Recurring Toggle (Home/Work) */}
          {spaceId !== 'plans' && (
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-white/5 border-white/10"
              />
              <span className="text-xs text-slate-300 font-medium">
                تكرار يومي كـ روتين دائم
              </span>
            </label>
          )}

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs cursor-pointer transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'جاري الحفظ...' : initialTask ? 'حفظ التعديلات' : 'إضافة المهمة'}
            </button>
          </div>
        </fieldset>
        </form>
    </PlanningDialog>
  );
};
