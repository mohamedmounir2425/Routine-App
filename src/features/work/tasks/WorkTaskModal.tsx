import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Sparkles, Folder } from 'lucide-react';
import { LifeTask, TaskPriority, HomeProject } from '../../../types';
import { saveTask } from '../../../db/taskQueries';
import { Modal } from '../../../components/common/Modal';

interface WorkTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSaved: () => void;
  initialTask?: LifeTask | null;
  workProjects?: HomeProject[];
}

export const WorkTaskModal: React.FC<WorkTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskSaved,
  initialTask,
  workProjects = [],
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>(25);
  const [projectId, setProjectId] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<'daily' | 'weekdays' | 'weekly'>('daily');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority);
      setDueDate(initialTask.dueDate || '');
      setScheduledTime(initialTask.scheduledTime || '');
      setEstimatedMinutes(initialTask.estimatedMinutes || 25);
      setProjectId(initialTask.projectId || '');
      setIsRecurring(!!initialTask.isRecurring);
      setRecurrenceRule(initialTask.recurrenceRule || 'daily');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(new Date().toISOString().split('T')[0]);
      setScheduledTime('');
      setEstimatedMinutes(25);
      setProjectId('');
      setIsRecurring(false);
      setRecurrenceRule('daily');
    }
  }, [initialTask, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskToSave: LifeTask = {
      id: initialTask?.id || `task_work_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      spaceId: 'work',
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      scheduledTime: scheduledTime || undefined,
      estimatedMinutes: typeof estimatedMinutes === 'number' ? estimatedMinutes : undefined,
      projectId: projectId || undefined,
      sourceType: projectId ? 'project' : 'manual',
      isRecurring,
      recurrenceRule: isRecurring ? recurrenceRule : undefined,
      isCompleted: initialTask ? initialTask.isCompleted : false,
      completedAt: initialTask?.completedAt,
      recurringCompletionDates: initialTask?.recurringCompletionDates,
      createdAt: initialTask?.createdAt || new Date().toISOString(),
    };

    await saveTask(taskToSave);
    onTaskSaved();
    onClose();
  };

  const modalTitle = (
    <div className="flex items-center gap-2">
      <span className="text-xl">💼</span>
      <span className="font-['Tajawal'] font-black">
        {initialTask ? 'تعديل مهمة عمل' : 'إضافة مهمة عمل جديدة'}
      </span>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="max-w-lg">
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal']">
              عنوان المهمة <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مراجعة العرض التقديمي للعميل"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal']">
              تفاصيل أو ملاحظات إضافية (اختياري)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="نقاط إضافية للمهمة..."
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 resize-none"
            />
          </div>

          {/* Priority & Project Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal']">
                الأولوية
              </label>
              <div className="flex rounded-xl overflow-hidden border border-white/10 p-0.5 bg-white/5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPriority('high')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${priority === 'high' ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40' : 'text-slate-400'}`}
                >
                  عالية 🔴
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('medium')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${priority === 'medium' ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'text-slate-400'}`}
                >
                  متوسطة 🟡
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('low')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${priority === 'low' ? 'bg-slate-500/25 text-slate-300 border border-slate-500/40' : 'text-slate-400'}`}
                >
                  منخفضة ⚪
                </button>
              </div>
            </div>

            {/* Project Link */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal'] flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-sky-400" />
                <span>ربط بمشروع عمل</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500/50 cursor-pointer"
              >
                <option value="">(بدون مشروع - مهمة مستقلة)</option>
                {workProjects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date & Scheduled Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal'] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>تاريخ الاستحقاق</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal'] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>وقت التنفيذ المحدد</span>
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="10:00"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal']">
                المدة التقديرية (د)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value) || '')}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500/50"
              />
            </div>
          </div>

          {/* Recurring Option */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white font-['Tajawal'] flex items-center gap-1.5 cursor-pointer">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>مهمة عمل متكررة دورياً</span>
              </label>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 accent-sky-500 cursor-pointer"
              />
            </div>

            {isRecurring && (
              <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-xs">
                <span className="text-slate-400 font-medium">نمط التكرار:</span>
                <select
                  value={recurrenceRule}
                  onChange={(e) => setRecurrenceRule(e.target.value as any)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs text-sky-300"
                >
                  <option value="daily">يومياً</option>
                  <option value="weekdays">أيام العمل (الأحد - الخميس)</option>
                  <option value="weekly">أسبوعياً</option>
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 text-xs font-black shadow-lg shadow-sky-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              {initialTask ? 'حفظ التعديلات' : 'إضافة المهمة'}
            </button>
          </div>
        </form>
    </Modal>
  );
};
