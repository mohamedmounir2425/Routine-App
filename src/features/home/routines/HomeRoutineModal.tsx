import { HomePanel } from '../components/HomeLayouts';
import { HomeButton } from '../components/HomeButton';
import { HomeInput as HomeTextField, HomeTextArea } from '../components/HomeInputs';
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
      <HomePanel className="home-form-surface relative max-w-lg p-6 sm:p-7 text-right [.home-modal-content>&]:overflow-y-auto w-full border-0 bg-home-panel font-home text-home-text shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-home-border mb-5">
          <HomeButton icon={<X className="w-5 h-5" />}
            aria-label="إغلاق النافذة"
            onClick={onClose}
            className="p-2 rounded-xl text-home-muted hover:text-home-text hover:bg-home-selection transition-colors cursor-pointer"
          >

          </HomeButton>
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 className="text-lg font-black text-home-text">
              {initialRoutine ? 'تعديل الروتين المنزلي' : 'إضافة روتين منزلي جديد'}
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-home-text mb-1.5">
              عنوان الروتين المنزلي *
            </label>
            <HomeTextField
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تهوية البيت، سقي النباتات، جرد الثلاجة..."
              required
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-home-text mb-1.5">
              تفاصيل أو إرشادات (اختياري)
            </label>
            <HomeTextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أي تفاصيل خاصة بتنفيذ هذا الروتين..."
              rows={2}
              className="w-full"
            />
          </div>

          {/* Period selector */}
          <div>
            <label className="block text-xs font-bold text-home-text mb-1.5">
              فترة الروتين المفضلة
            </label>
            <div className="grid grid-cols-3 gap-2">
              <HomeButton
                type="button"
                onClick={() => setTimeOfDay('morning')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  timeOfDay === 'morning'
                    ? 'bg-amber-500/20 border-amber-500/40 text-home-accent'
                    : 'bg-home-raised border-home-border text-home-muted hover:text-home-text'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-home-accent" />
                <span>صباحي</span>
              </HomeButton>
              <HomeButton
                type="button"
                onClick={() => setTimeOfDay('evening')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  timeOfDay === 'evening'
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-home-raised border-home-border text-home-muted hover:text-home-text'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>مسائي</span>
              </HomeButton>
              <HomeButton
                type="button"
                onClick={() => setTimeOfDay('any')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  timeOfDay === 'any'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-home-raised border-home-border text-home-muted hover:text-home-text'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>مرن</span>
              </HomeButton>
            </div>
          </div>

          {/* Recurrence Rule */}
          <div>
            <label className="block text-xs font-bold text-home-text mb-1.5">
              تكرار الروتين
            </label>
            <div className="grid grid-cols-3 gap-2">
              <HomeButton
                type="button"
                onClick={() => setRecurrenceRule('daily')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  recurrenceRule === 'daily'
                    ? 'bg-amber-500/20 border-amber-500/40 text-home-accent'
                    : 'bg-home-raised border-home-border text-home-muted hover:text-home-text'
                }`}
              >
                يومياً
              </HomeButton>
              <HomeButton
                type="button"
                onClick={() => setRecurrenceRule('weekdays')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  recurrenceRule === 'weekdays'
                    ? 'bg-amber-500/20 border-amber-500/40 text-home-accent'
                    : 'bg-home-raised border-home-border text-home-muted hover:text-home-text'
                }`}
              >
                أيام العمل
              </HomeButton>
              <HomeButton
                type="button"
                onClick={() => setRecurrenceRule('weekly')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  recurrenceRule === 'weekly'
                    ? 'bg-amber-500/20 border-amber-500/40 text-home-accent'
                    : 'bg-home-raised border-home-border text-home-muted hover:text-home-text'
                }`}
              >
                أسبوعياً
              </HomeButton>
            </div>
          </div>

          {/* Time input */}
          <div>
            <label className="block text-xs font-bold text-home-text mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-home-accent" />
              <span>وقت التذكير المفضل (اختياري)</span>
            </label>
            <HomeTextField
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-home-border">
            <HomeButton
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-home-muted hover:text-home-text hover:bg-home-raised transition-colors cursor-pointer"
            >
              إلغاء
            </HomeButton>
            <HomeButton variant="primary"
              type="submit"
              className="shrink-0"
            >
              {initialRoutine ? 'حفظ التعديلات' : 'إضافة الروتين'}
            </HomeButton>
          </div>
        </form>
      </HomePanel>
    </HomeWorkflowDialog>
  );
};
