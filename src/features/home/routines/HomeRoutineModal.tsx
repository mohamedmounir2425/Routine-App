import { HomeWorkflowDialog } from '../HomeWorkflowDialog';
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, Sun, Moon } from 'lucide-react';
import { LifeTask } from '../../../types';
import { saveTask } from '../../../db/taskQueries';

interface HomeRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoutineSaved: () => void;
  initialRoutine?: LifeTask | null;
}

export const HomeRoutineModal: React.FC<HomeRoutineModalProps> = ({
  isOpen,
  onClose,
  onRoutineSaved,
  initialRoutine,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'evening' | 'any'>('morning');
  const [scheduledTime, setScheduledTime] = useState('');
  const [recurrenceRule, setRecurrenceRule] = useState<'daily' | 'weekdays' | 'weekly'>('daily');

  useEffect(() => {
    if (initialRoutine) {
      setTitle(initialRoutine.title);
      setDescription(initialRoutine.description || '');
      setScheduledTime(initialRoutine.scheduledTime || '');
      setRecurrenceRule(initialRoutine.recurrenceRule || 'daily');
      if (initialRoutine.title.includes('صباح') || initialRoutine.scheduledTime && initialRoutine.scheduledTime < '12:00') {
        setTimeOfDay('morning');
      } else if (initialRoutine.title.includes('مساء') || initialRoutine.title.includes('نوم') || initialRoutine.scheduledTime && initialRoutine.scheduledTime >= '18:00') {
        setTimeOfDay('evening');
      } else {
        setTimeOfDay('any');
      }
    } else {
      setTitle('');
      setDescription('');
      setTimeOfDay('morning');
      setScheduledTime('');
      setRecurrenceRule('daily');
    }
  }, [initialRoutine, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const routineToSave: LifeTask = {
      id: initialRoutine?.id || `routine_home_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      spaceId: 'home',
      title: title.trim(),
      description: description.trim() || undefined,
      priority: 'medium',
      scheduledTime: scheduledTime || undefined,
      isCompleted: false,
      isRecurring: true,
      recurrenceRule,
      sourceType: 'routine',
      recurringCompletionDates: initialRoutine?.recurringCompletionDates || [],
      createdAt: initialRoutine?.createdAt || new Date().toISOString(),
    };

    await saveTask(routineToSave);
    onRoutineSaved();
    onClose();
  };

  return (
    <HomeWorkflowDialog open={isOpen} onClose={onClose} title="روتين منزلي">
      <div className="home-legacy-dialog relative w-full max-w-lg liquid-glass-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl text-right font-['Tajawal']">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <button
            aria-label="إغلاق النافذة"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 className="text-lg font-black text-white">
              {initialRoutine ? 'تعديل الروتين المنزلي' : 'إضافة روتين منزلي جديد'}
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              عنوان الروتين المنزلي *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تهوية البيت، سقي النباتات، جرد الثلاجة..."
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              تفاصيل أو إرشادات (اختياري)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أي تفاصيل خاصة بتنفيذ هذا الروتين..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          {/* Period selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              فترة الروتين المفضلة
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTimeOfDay('morning')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  timeOfDay === 'morning'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>صباحي</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeOfDay('evening')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  timeOfDay === 'evening'
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>مسائي</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeOfDay('any')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  timeOfDay === 'any'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>مرن</span>
              </button>
            </div>
          </div>

          {/* Recurrence Rule */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              تكرار الروتين
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecurrenceRule('daily')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  recurrenceRule === 'daily'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                يومياً
              </button>
              <button
                type="button"
                onClick={() => setRecurrenceRule('weekdays')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  recurrenceRule === 'weekdays'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                أيام العمل
              </button>
              <button
                type="button"
                onClick={() => setRecurrenceRule('weekly')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  recurrenceRule === 'weekly'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                أسبوعياً
              </button>
            </div>
          </div>

          {/* Time input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>وقت التذكير المفضل (اختياري)</span>
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
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
              {initialRoutine ? 'حفظ التعديلات' : 'إضافة الروتين'}
            </button>
          </div>
        </form>
      </div>
    </HomeWorkflowDialog>
  );
};
