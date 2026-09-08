import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  ListChecks, 
  Check, 
  Trash2, 
  Edit3, 
  Clock, 
  Sparkles, 
  Sun, 
  Moon,
  Download
} from 'lucide-react';
import { SpaceShell } from '../../../components/layout/SpaceShell';
import { LifeTask } from '../../../types';
import { getTasksBySpace, saveTask, toggleTaskCompletion, deleteTask } from '../../../db/taskQueries';
import { HomeRoutineModal } from './HomeRoutineModal';
import { getLocalDateString } from '../../../utils/dateUtils';

const DEFAULT_HOME_PRESETS = [
  { id: 'h1', title: 'تهوية المنزل وفتح النوافذ صباحاً', period: 'morning', time: '08:00' },
  { id: 'h2', title: 'ترتيب السرير ومكتب العمل', period: 'morning', time: '08:30' },
  { id: 'h3', title: 'سقي النباتات وتفقد إضاءات المنزل', period: 'morning', time: '09:00' },
  { id: 'h4', title: 'تنظيف المطبخ وتجهيز قهوة الصباح', period: 'morning', time: '09:30' },
  { id: 'h5', title: 'مراجعة قائمة مشتريات واحتياجات البيت', period: 'evening', time: '19:00' },
  { id: 'h6', title: 'إطفاء الشاشات والأجهزة الإلكترونية قبل النوم', period: 'evening', time: '22:30' },
];

type RoutineTab = 'all' | 'morning' | 'evening' | 'weekly';

export const HomeRoutinesView: React.FC = () => {
  const [routines, setRoutines] = useState<LifeTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RoutineTab>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<LifeTask | null>(null);

  const todayStr = useMemo(() => getLocalDateString(), []);

  const loadRoutines = async () => {
    setIsLoading(true);
    try {
      const allTasks = await getTasksBySpace('home');
      const recurringOnly = allTasks.filter((t) => t.isRecurring);
      setRoutines(recurringOnly);
    } catch (err) {
      console.error('Failed to load home routines:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoutines();
  }, []);

  const handleSeedPresets = async () => {
    for (const preset of DEFAULT_HOME_PRESETS) {
      const newTask: LifeTask = {
        id: `routine_${preset.id}_${Date.now()}`,
        spaceId: 'home',
        title: preset.title,
        priority: 'medium',
        scheduledTime: preset.time,
        isCompleted: false,
        isRecurring: true,
        recurrenceRule: 'daily',
        sourceType: 'routine',
        recurringCompletionDates: [],
        createdAt: new Date().toISOString(),
      };
      await saveTask(newTask);
    }
    await loadRoutines();
  };

  const handleToggle = async (routine: LifeTask) => {
    await toggleTaskCompletion(routine.id, todayStr);
    await loadRoutines();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الروتين المنزلي؟')) {
      await deleteTask(id);
      await loadRoutines();
    }
  };

  const filteredRoutines = useMemo(() => {
    return routines.filter((r) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'weekly') return r.recurrenceRule === 'weekly';

      const isMorning = r.title.includes('صباح') || (r.scheduledTime && r.scheduledTime < '12:00');
      const isEvening = r.title.includes('مساء') || r.title.includes('نوم') || (r.scheduledTime && r.scheduledTime >= '18:00');

      if (activeTab === 'morning') return isMorning || (!isEvening && r.recurrenceRule === 'daily');
      if (activeTab === 'evening') return isEvening;
      return true;
    });
  }, [routines, activeTab]);

  const completedTodayCount = useMemo(() => {
    return routines.filter((r) => Array.isArray(r.recurringCompletionDates) && r.recurringCompletionDates.includes(todayStr)).length;
  }, [routines, todayStr]);

  const progressPct = routines.length > 0 ? Math.round((completedTodayCount / routines.length) * 100) : 0;

  return (
    <SpaceShell
      icon="🏠"
      title="روتينات وعادات المنزل"
      subtitle="الإيقاع اليومي للبيت المريح، من نسمات الصباح إلى هدوء الليل"
      badge={
        <div className="px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-amber-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>{completedTodayCount} من {routines.length} أُنجزت اليوم</span>
        </div>
      }
    >
      <div className="space-y-6 text-right font-['Tajawal']">
        {/* Progress Card */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-black text-white">إنجاز روتينات اليوم</h2>
            </div>
            <span className="text-xs font-black text-amber-300">{progressPct}% مكتمل</span>
          </div>

          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Controls Header: Tabs + New Routine Button */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              الكل ({routines.length})
            </button>
            <button
              onClick={() => setActiveTab('morning')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeTab === 'morning'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>الروتين الصباحي</span>
            </button>
            <button
              onClick={() => setActiveTab('evening')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeTab === 'evening'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>الروتين المسائي</span>
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'weekly'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              الأسبوعي
            </button>
          </div>

          <div className="flex items-center gap-2">
            {routines.length === 0 && (
              <button
                onClick={handleSeedPresets}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>استيراد الروتينات المقترحة</span>
              </button>
            )}

            <button
              onClick={() => {
                setEditingRoutine(null);
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>روتين جديد</span>
            </button>
          </div>
        </div>

        {/* Routines Grid / List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            جاري تحميل روتينات المنزل...
          </div>
        ) : filteredRoutines.length === 0 ? (
          <div className="liquid-glass-card rounded-3xl p-10 border border-white/5 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-xl text-amber-400">
              <ListChecks className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">لا توجد روتينات منزلية مسجلة</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              يمكنك استيراد الروتينات الأساسية (التهوية، الترتيب، سقي النباتات، المطبخ) بضغطة زر
            </p>
            <button
              onClick={handleSeedPresets}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>استيراد 6 روتينات أساسية للبيت</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredRoutines.map((routine) => {
              const isDone = Array.isArray(routine.recurringCompletionDates) && routine.recurringCompletionDates.includes(todayStr);

              return (
                <div
                  key={routine.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 select-none ${
                    isDone
                      ? 'bg-amber-950/15 border-amber-500/30 text-slate-300'
                      : 'bg-white/5 border-white/10 hover:border-amber-500/30 text-white'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggle(routine)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-all ${
                        isDone
                          ? 'bg-amber-400 border-amber-300 text-slate-950'
                          : 'border-white/20 hover:border-amber-400'
                      }`}
                    >
                      {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="space-y-1 flex-1 min-w-0">
                      <span className={`text-xs font-bold leading-relaxed block ${isDone ? 'line-through opacity-70' : ''}`}>
                        {routine.title}
                      </span>

                      {routine.description && (
                        <p className="text-[11px] text-slate-400 leading-normal line-clamp-1">
                          {routine.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300">
                          {routine.recurrenceRule === 'weekdays' ? 'أيام العمل' : routine.recurrenceRule === 'weekly' ? 'أسبوعي' : 'يومي'}
                        </span>

                        {routine.scheduledTime && (
                          <span className="flex items-center gap-1 text-amber-300/80">
                            <Clock className="w-3 h-3" />
                            <span>{routine.scheduledTime}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      onClick={() => {
                        setEditingRoutine(routine);
                        setIsModalOpen(true);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="تعديل الروتين"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(routine.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                      title="حذف الروتين"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        <HomeRoutineModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onRoutineSaved={loadRoutines}
          initialRoutine={editingRoutine}
        />
      </div>
    </SpaceShell>
  );
};
