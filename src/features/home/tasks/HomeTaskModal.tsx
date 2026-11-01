import { HomeSelect } from '../HomeSelect';
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Sparkles, Folder, ShoppingCart } from 'lucide-react';
import { LifeTask, TaskPriority, HomeProject } from '../../../types';
import { saveTask } from '../../../db/taskQueries';

import { HomeWorkflowDialog } from '../HomeWorkflowDialog';
import { getLocalDateString } from '../../../utils/dateUtils';

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
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>(15);
  const [projectId, setProjectId] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<'daily' | 'weekdays' | 'weekly'>('daily');
  const [isShopping, setIsShopping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority);
      setDueDate(initialTask.dueDate || '');
      setScheduledTime(initialTask.scheduledTime || '');
      setEstimatedMinutes(initialTask.estimatedMinutes || 15);
      setProjectId(initialTask.projectId || '');
      setIsRecurring(!!initialTask.isRecurring);
      setRecurrenceRule(initialTask.recurrenceRule || 'daily');
      setIsShopping(initialTask.title.startsWith('🛒') || (initialTask.description || '').includes('مشتريات'));
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(defaultCategory === 'shopping' ? '' : getLocalDateString());
      setScheduledTime('');
      setEstimatedMinutes(15);
      setProjectId('');
      setIsRecurring(false);
      setRecurrenceRule('daily');
      setIsShopping(defaultCategory === 'shopping');
    }
  }, [initialTask, isOpen, defaultCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;

    let finalTitle = title.trim();
    if (isShopping && !finalTitle.startsWith('🛒')) {
      finalTitle = `🛒 ${finalTitle}`;
    }

    const taskToSave: LifeTask = {
      ...(initialTask ?? {}),
      id: initialTask?.id || `task_home_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      spaceId: 'home',
      title: finalTitle,
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      scheduledTime: scheduledTime || undefined,
      estimatedMinutes: typeof estimatedMinutes === 'number' ? estimatedMinutes : undefined,
      projectId: projectId || undefined,
      sourceType: projectId ? 'project' : (isRecurring ? 'routine' : 'manual'),
      isRecurring,
      recurrenceRule: isRecurring ? recurrenceRule : undefined,
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
      <span className="font-['Tajawal'] font-black">
        {initialTask ? 'تعديل مهمة منزلية' : 'إضافة مهمة منزلية جديدة'}
      </span>
    </div>
  );

  return (
    <HomeWorkflowDialog open={isOpen} onClose={() => { if (!saving) onClose(); }} title={initialTask ? "تعديل العنصر" : isShopping ? "إضافة مشتريات" : "إضافة مهمة"}><div className="home-legacy-dialog liquid-glass-card p-5 sm:p-6"><header className="home-panel-heading"><div>{modalTitle}</div><button type="button" className="home-secondary-button" disabled={saving} onClick={onClose}>إغلاق</button></header>{error && <p className="home-error" role="alert">{error}</p>}
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal']">
              عنوان المهمة / الغرض *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: شراء منظفات ومستلزمات الحمام، تغيير ستارة الصالة..."
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal']">
              ملاحظات أو تفاصيل إضافية (اختياري)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أضف تفاصيل الماركة، الحجم، أو خطوات إضافية..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
            />
          </div>

          {/* Quick Tag: Shopping */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span>تصنيف كمشتريات / مقاضي منزلية</span>
            </div>
            <input
              type="checkbox"
              checked={isShopping}
              onChange={(e) => setIsShopping(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-white/10 border-white/20 focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal']">
              درجة الأهمية
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  priority === 'high'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                🔴 عاجلة / أساسية
              </button>
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  priority === 'medium'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                🟡 متوسطة
              </button>
              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  priority === 'low'
                    ? 'bg-slate-500/20 border-slate-500/50 text-slate-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                🟢 مرنة / مؤجلة
              </button>
            </div>
          </div>

          {/* Due Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal'] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>تاريخ الاستحقاق</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal'] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>وقت التنفيذ (اختياري)</span>
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Project Association */}
          {homeProjects.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal'] flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>ربط بمشروع منزلي (اختياري)</span>
              </label>
              <HomeSelect
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/50"
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
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>روتين منزلي متكرر؟</span>
              </span>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-white/10 border-white/20 focus:ring-0 cursor-pointer"
              />
            </div>

            {isRecurring && (
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRecurrenceRule('daily')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    recurrenceRule === 'daily'
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                      : 'bg-white/5 text-slate-400 border border-white/5'
                  }`}
                >
                  يومياً
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrenceRule('weekdays')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    recurrenceRule === 'weekdays'
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                      : 'bg-white/5 text-slate-400 border border-white/5'
                  }`}
                >
                  أيام العمل
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrenceRule('weekly')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    recurrenceRule === 'weekly'
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                      : 'bg-white/5 text-slate-400 border border-white/5'
                  }`}
                >
                  أسبوعياً
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit" disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              {initialTask ? 'حفظ التعديلات' : 'إضافة المهمة'}
            </button>
          </div>
        </form>
    </div></HomeWorkflowDialog>
  );
};
