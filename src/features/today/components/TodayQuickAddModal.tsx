import React, { useState, useEffect } from 'react';
import { Plus, Briefcase, Home, Target } from 'lucide-react';
import { db } from '../../../db/database';
import { LifeTask, LifeSpaceId, TaskPriority, GoalPlan } from '../../../types';
import { saveTask } from '../../../db/taskQueries';
import { getLocalDateString } from '../../../utils/dateUtils';
import { Modal } from '../../../components/common/Modal';

interface TodayQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

export const TodayQuickAddModal: React.FC<TodayQuickAddModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
}) => {
  const [title, setTitle] = useState('');
  const [spaceId, setSpaceId] = useState<LifeSpaceId>('work');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [scheduledTime, setScheduledTime] = useState('');
  const [planId, setPlanId] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [activePlans, setActivePlans] = useState<GoalPlan[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      db.plans.toArray().then((plans) => {
        setActivePlans(plans.filter((p) => p.status === 'active'));
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const todayStr = getLocalDateString();
      const newTask: LifeTask = {
        id: `task-${Date.now()}`,
        title: title.trim(),
        spaceId,
        priority,
        scheduledTime: scheduledTime ? scheduledTime : undefined,
        planId: spaceId === 'plans' && planId ? planId : undefined,
        isRecurring,
        recurrenceRule: isRecurring ? 'daily' : undefined,
        dueDate: todayStr,
        isCompleted: false,
        createdAt: new Date().toISOString(),
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
        <Plus className="w-4 h-4" />
      </div>
      <span className="font-['Tajawal'] font-black">إضافة مهمة سريعة لليوم</span>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Space Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 block">المساحة:</label>
          <div className="grid grid-cols-3 gap-2">
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
          {spaceId === 'plans' && activePlans.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">اختر الخطة التابعة لها:</label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">بدون ربط مباشر بخطة</option>
                {activePlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
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
              {isSubmitting ? 'جاري الحفظ...' : 'إضافة إلى اليوم'}
            </button>
          </div>
        </form>
    </Modal>
  );
};
