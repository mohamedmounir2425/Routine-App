import React, { useState, useEffect } from 'react';
import { X, Wrench, Calendar } from 'lucide-react';
import { LifeTask, TaskPriority } from '../../../types';
import { saveTask } from '../../../db/taskQueries';

export type MaintenanceCategory = 'ac' | 'plumbing' | 'electrical' | 'appliances' | 'furniture' | 'general';

interface HomeMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMaintenanceSaved: () => void;
  initialTask?: LifeTask | null;
  defaultCategory?: MaintenanceCategory;
}

const CATEGORY_LABELS: Record<MaintenanceCategory, { label: string; icon: string }> = {
  ac: { label: 'تكييف وتهوية', icon: '❄️' },
  plumbing: { label: 'سباكة ومياه', icon: '🚰' },
  electrical: { label: 'كهرباء وإضاءة', icon: '⚡' },
  appliances: { label: 'أجهزة منزلية', icon: '🔌' },
  furniture: { label: 'أثاث وترميمات', icon: '🔨' },
  general: { label: 'فحص دوري عام', icon: '🔍' },
};

export const HomeMaintenanceModal: React.FC<HomeMaintenanceModalProps> = ({
  isOpen,
  onClose,
  onMaintenanceSaved,
  initialTask,
  defaultCategory = 'ac',
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MaintenanceCategory>(defaultCategory);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<'daily' | 'weekdays' | 'weekly'>('weekly');

  useEffect(() => {
    if (initialTask) {
      // Parse category tag from title if present
      let cleanTitle = initialTask.title;
      for (const [catKey, catVal] of Object.entries(CATEGORY_LABELS)) {
        if (cleanTitle.startsWith(`[${catVal.label}]`)) {
          cleanTitle = cleanTitle.replace(`[${catVal.label}]`, '').trim();
          setCategory(catKey as MaintenanceCategory);
          break;
        }
      }
      setTitle(cleanTitle);
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority);
      setDueDate(initialTask.dueDate || '');
      setIsRecurring(!!initialTask.isRecurring);
      setRecurrenceRule(initialTask.recurrenceRule || 'weekly');
    } else {
      setTitle('');
      setCategory(defaultCategory);
      setDescription('');
      setPriority('medium');
      setDueDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(false);
      setRecurrenceRule('weekly');
    }
  }, [initialTask, isOpen, defaultCategory]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const catInfo = CATEGORY_LABELS[category];
    const formattedTitle = `[${catInfo.label}] ${title.trim()}`;

    const taskToSave: LifeTask = {
      id: initialTask?.id || `task_maint_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      spaceId: 'home',
      title: formattedTitle,
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      isRecurring,
      recurrenceRule: isRecurring ? recurrenceRule : undefined,
      sourceType: 'manual',
      isCompleted: initialTask ? initialTask.isCompleted : false,
      completedAt: initialTask?.completedAt,
      recurringCompletionDates: initialTask?.recurringCompletionDates,
      createdAt: initialTask?.createdAt || new Date().toISOString(),
    };

    await saveTask(taskToSave);
    onMaintenanceSaved();
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
            <Wrench className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-white">
              {initialTask ? 'تعديل مهمة صيانة' : 'إضافة صيانة منزلية'}
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              تصنيف الصيانة
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(CATEGORY_LABELS) as MaintenanceCategory[]).map((catKey) => {
                const item = CATEGORY_LABELS[catKey];
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      category === catKey
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              موضوع الصيانة أو الإصلاح *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تنظيف فلاتر التكييف، فحص خراطيم الغسالة، فحص السخان..."
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              ملاحظات أو مواصفات الفني (اختياري)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="رقم الفني، قطع الغيار المطلوبة، أو ملاحظات الصيانة السابقة..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          {/* Urgency / Priority */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              درجة العجلة / الأولوية
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
                🔴 عاجلة (تسريب أو عطل)
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
                🟡 وقائية / مجدولة
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
                🟢 مرنة / فحص لاحق
              </button>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>الموعد المحدد للصيانة</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/50"
            />
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              {initialTask ? 'حفظ التعديلات' : 'تسجيل الصيانة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
