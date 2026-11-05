import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Wrench, 
  Check, 
  Trash2, 
  Edit3, 
  Calendar, 
  AlertCircle, 
  Sparkles
} from 'lucide-react';
import { HomeSection as SpaceShell } from '../HomeSection';
import { LifeTask } from '../../../types';
import { getTasksBySpace, toggleTaskCompletion, deleteTask, saveTask } from '../../../db/taskQueries';
import { HomeMaintenanceModal, MaintenanceCategory } from './HomeMaintenanceModal';
import { getLocalDateString } from '../../../utils/dateUtils';

const MAINTENANCE_PRESETS = [
  { cat: 'ac' as MaintenanceCategory, title: 'تنظيف فلاتر التكييف وفحص التبريد', icon: '❄️' },
  { cat: 'plumbing' as MaintenanceCategory, title: 'فحص خراطيم وتصريف الغسالة والأحواض', icon: '🚰' },
  { cat: 'plumbing' as MaintenanceCategory, title: 'تفقد سخان المياه والتأكد من صمامات الأمان', icon: '🔥' },
  { cat: 'electrical' as MaintenanceCategory, title: 'فحص لوحة القواطع الكهربائية والإضاءات', icon: '⚡' },
  { cat: 'appliances' as MaintenanceCategory, title: 'تنظيف مكثف الثلاجة وفحص جوانات الأبواب', icon: '🔌' },
  { cat: 'furniture' as MaintenanceCategory, title: 'تشحيم مفصلات الأبواب وتثبيت المقابض', icon: '🔨' },
];

export const HomeMaintenanceView: React.FC = () => {
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<LifeTask | null>(null);

  const todayStr = useMemo(() => getLocalDateString(), []);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const allTasks = await getTasksBySpace('home');
      // Filter maintenance related tasks
      const maint = allTasks.filter((t) => 
        t.title.includes('صيانة') ||
        t.title.includes('تكييف') ||
        t.title.includes('سباكة') ||
        t.title.includes('كهرباء') ||
        t.title.includes('أجهزة') ||
        t.title.includes('فحص') ||
        t.title.startsWith('[')
      );
      setTasks(maint);
    } catch (err) {
      console.error('Failed to load maintenance tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleQuickAddPreset = async (preset: typeof MAINTENANCE_PRESETS[0]) => {
    const newTask: LifeTask = {
      id: `task_maint_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      spaceId: 'home',
      title: `[صيانة] ${preset.title}`,
      priority: 'medium',
      dueDate: todayStr,
      isCompleted: false,
      sourceType: 'manual',
      createdAt: new Date().toISOString(),
    };
    await saveTask(newTask);
    await loadTasks();
  };

  const handleToggle = async (task: LifeTask) => {
    await toggleTaskCompletion(task.id, todayStr);
    await loadTasks();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف مهمة الصيانة هذه؟')) {
      await deleteTask(id);
      await loadTasks();
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'pending') return !t.isCompleted;
      if (activeFilter === 'completed') return t.isCompleted;
      if (activeFilter === 'ac') return t.title.includes('تكييف');
      if (activeFilter === 'plumbing') return t.title.includes('سباكة') || t.title.includes('مياه') || t.title.includes('سخان');
      if (activeFilter === 'electrical') return t.title.includes('كهرباء') || t.title.includes('إضاءة');
      if (activeFilter === 'appliances') return t.title.includes('أجهزة') || t.title.includes('ثلاجة') || t.title.includes('غسالة');
      return true;
    });
  }, [tasks, activeFilter]);

  const pendingCount = tasks.filter((t) => !t.isCompleted).length;

  return (
    <SpaceShell
      icon="🏠"
      title="صيانة وأعطال المنزل"
      subtitle="جدولة الفحص الدوري، صيانة الأجهزة والتكييف، وتفقد مرافق البيت الوقائية"
      badge={
        <div className="px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-amber-400 flex items-center gap-1.5">
          <Wrench className="w-4 h-4" />
          <span>{pendingCount} بنود صيانة قيد المتابعة</span>
        </div>
      }
    >
      <div className="space-y-6 text-right font-['Tajawal']">
        {/* Quick Maintenance Presets Carousel / Cards */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-white">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>صيانات وقائية دورية مقترحة للبيت (إضافة سريعة بضغطة زر)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {MAINTENANCE_PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAddPreset(p)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/30 text-right transition-all flex items-start gap-2.5 cursor-pointer select-none group"
              >
                <span className="text-lg shrink-0 mt-0.5">{p.icon}</span>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors line-clamp-2 leading-relaxed">
                    {p.title}
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold block pt-1">
                    + جدولة الآن
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Controls Header: Tabs + New Maintenance Button */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              الكل ({tasks.length})
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              قيد المتابعة ({pendingCount})
            </button>
            <button
              onClick={() => setActiveFilter('ac')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'ac'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              ❄️ التكييف
            </button>
            <button
              onClick={() => setActiveFilter('plumbing')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'plumbing'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              🚰 السباكة
            </button>
            <button
              onClick={() => setActiveFilter('electrical')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'electrical'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              ⚡ الكهرباء
            </button>
            <button
              onClick={() => setActiveFilter('completed')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'completed'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              المنجزة ({tasks.filter((t) => t.isCompleted).length})
            </button>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>صيانة جديدة</span>
          </button>
        </div>

        {/* Tasks List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            جاري تحميل جدول صيانة المنزل...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="liquid-glass-card rounded-3xl p-10 border border-white/5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-xl text-amber-400">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">لا توجد أعمال صيانة مسجلة في هذا التصنيف</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              اضغط على الصيانات الوقائية المقترحة بالأعلى أو أضف موعد صيانة جديد لحماية ممتلكات بيتك
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isOverdue = !task.isCompleted && task.dueDate && task.dueDate < todayStr;

              return (
                <div
                  key={task.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    task.isCompleted
                      ? 'bg-amber-950/15 border-amber-500/20 text-slate-400 opacity-75'
                      : 'bg-white/5 border-white/10 hover:border-amber-500/30 text-white'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggle(task)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-all ${
                        task.isCompleted
                          ? 'bg-amber-400 border-amber-300 text-slate-950'
                          : 'border-white/20 hover:border-amber-400'
                      }`}
                    >
                      {task.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold leading-relaxed ${task.isCompleted ? 'line-through opacity-70' : ''}`}>
                          {task.title}
                        </span>

                        {task.priority === 'high' && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                            عاجلة
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {task.dueDate && (
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400 font-bold' : ''}`}>
                            {isOverdue && <AlertCircle className="w-3 h-3 text-rose-400" />}
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{task.dueDate === todayStr ? 'اليوم' : task.dueDate}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="تعديل"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                      title="حذف"
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
        <HomeMaintenanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onMaintenanceSaved={loadTasks}
          initialTask={editingTask}
        />
      </div>
    </SpaceShell>
  );
};
