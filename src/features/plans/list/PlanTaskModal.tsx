import React, { useState, useEffect } from 'react';
import { X, Calendar, Sparkles } from 'lucide-react';
import { LifeTask, TaskPriority, LifeSpaceId, GoalPlan, PlanMilestone } from '../../../types';
import { saveTask } from '../../../db/taskQueries';
import { getPlanMilestones } from '../../../db/goalPlanQueries';

interface PlanTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSaved: () => void;
  plan: GoalPlan;
  defaultMilestoneId?: string;
}

const SPACE_OPTIONS: Array<{ key: LifeSpaceId; label: string; icon: string }> = [
  { key: 'work', label: 'العمل والإنتاجية (Work)', icon: '💼' },
  { key: 'health', label: 'الصحة والتمارين (Health)', icon: '🏋️' },
  { key: 'worship', label: 'العبادات والروحانيات (Worship)', icon: '🕌' },
  { key: 'home', label: 'المنزل والأسرة (Home)', icon: '🏠' },
];

export const PlanTaskModal: React.FC<PlanTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskSaved,
  plan,
  defaultMilestoneId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [spaceId, setSpaceId] = useState<LifeSpaceId>(
    plan.category === 'health' ? 'health' : plan.category === 'faith' ? 'worship' : 'work'
  );
  const [milestoneId, setMilestoneId] = useState<string>(defaultMilestoneId || '');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [dueDate, setDueDate] = useState('');
  const [milestones, setMilestones] = useState<PlanMilestone[]>([]);

  useEffect(() => {
    if (isOpen && plan) {
      getPlanMilestones(plan.id).then((list) => {
        setMilestones(list);
        if (defaultMilestoneId) {
          setMilestoneId(defaultMilestoneId);
        } else if (list.length > 0) {
          const firstIncomplete = list.find((m) => !m.isCompleted);
          setMilestoneId(firstIncomplete ? firstIncomplete.id : list[0].id);
        }
      });
      setTitle('');
      setDescription('');
      setPriority('high');
      setDueDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, plan, defaultMilestoneId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskToSave: LifeTask = {
      id: `task_plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      spaceId, // Preserves the originating primary Space!
      planId: plan.id,
      milestoneId: milestoneId || undefined,
      sourceType: 'plan',
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    await saveTask(taskToSave);
    onTaskSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg liquid-glass-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl text-right font-['Tajawal']">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-black text-white">
              إضافة مهمة تنفيذية للخطة ({plan.title})
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Primary Space selector (Critical Life OS Semantic Rule) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              مساحة الحياة التي ينتمي إليها التنفيذ (Space) *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SPACE_OPTIONS.map((sp) => (
                <button
                  key={sp.key}
                  type="button"
                  onClick={() => setSpaceId(sp.key)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
                    spaceId === sp.key
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{sp.icon}</span>
                  <span className="truncate">{sp.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Milestone selector */}
          {milestones.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                المرحلة المستهدفة في الخطة (Milestone)
              </label>
              <select
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
              >
                <option value="">-- بدون مرحلة محددة (مهمة عامة في الخطة) --</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    المرحلة {m.order}: {m.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              عنوان المهمة التنفيذية *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: دراسة درس Interfaces وحل التمارين..."
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              تفاصيل إضافية (اختياري)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="روابط المراجع أو تفاصيل التنفيذ..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500/50 resize-none"
            />
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                درجة الأولوية
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
              >
                <option value="high">عالية (أولوية اليوم)</option>
                <option value="medium">متوسطة</option>
                <option value="low">مرنة</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>تاريخ التنفيذ</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
              />
            </div>
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
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              إضافة المهمة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
