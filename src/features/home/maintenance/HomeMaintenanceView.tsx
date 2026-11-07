import { HomePanel } from '../components/HomeLayouts';
import { HomeButton } from '../components/HomeButton';
import { HomeCompletion } from '../components/HomeCompletion';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Wrench,
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
        <div className="px-3.5 py-1.5 rounded-xl bg-home-raised border border-home-border text-xs font-bold text-home-accent flex items-center gap-1.5">
          <Wrench className="w-4 h-4" />
          <span>{pendingCount} بنود صيانة قيد المتابعة</span>
        </div>
      }
    >
      <div className="space-y-6 text-right font-home">
        {/* Quick Maintenance Presets Carousel / Cards */}
        <HomePanel className=" p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-home-text">
            <Sparkles className="w-4 h-4 text-home-accent" />
            <span>صيانات وقائية دورية مقترحة للبيت (إضافة سريعة بضغطة زر)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {MAINTENANCE_PRESETS.map((p, idx) => (
              <HomeButton
                key={idx}
                onClick={() => handleQuickAddPreset(p)}
                className="p-3 rounded-2xl bg-home-raised hover:bg-home-selection border border-home-border hover:border-amber-500/30 text-right transition-all flex items-start gap-2.5 cursor-pointer select-none group"
              >
                <span className="text-lg shrink-0 mt-0.5">{p.icon}</span>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-home-text group-hover:text-home-accent transition-colors line-clamp-2 leading-relaxed">
                    {p.title}
                  </span>
                  <span className="text-[10px] text-home-accent font-bold block pt-1">
                    + جدولة الآن
                  </span>
                </div>
              </HomeButton>
            ))}
          </div>
        </HomePanel>

        {/* Controls Header: Tabs + New Maintenance Button */}
        <HomePanel className=" p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <HomeButton
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'all'
                  ? 'bg-amber-500/20 text-home-accent border border-amber-500/40'
                  : 'bg-home-raised text-home-muted hover:text-home-text border border-transparent'
              }`}
            >
              الكل ({tasks.length})
            </HomeButton>
            <HomeButton
              onClick={() => setActiveFilter('pending')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'pending'
                  ? 'bg-amber-500/20 text-home-accent border border-amber-500/40'
                  : 'bg-home-raised text-home-muted hover:text-home-text border border-transparent'
              }`}
            >
              قيد المتابعة ({pendingCount})
            </HomeButton>
            <HomeButton
              onClick={() => setActiveFilter('ac')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'ac'
                  ? 'bg-amber-500/20 text-home-accent border border-amber-500/40'
                  : 'bg-home-raised text-home-muted hover:text-home-text border border-transparent'
              }`}
            >
              ❄️ التكييف
            </HomeButton>
            <HomeButton
              onClick={() => setActiveFilter('plumbing')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'plumbing'
                  ? 'bg-amber-500/20 text-home-accent border border-amber-500/40'
                  : 'bg-home-raised text-home-muted hover:text-home-text border border-transparent'
              }`}
            >
              🚰 السباكة
            </HomeButton>
            <HomeButton
              onClick={() => setActiveFilter('electrical')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'electrical'
                  ? 'bg-amber-500/20 text-home-accent border border-amber-500/40'
                  : 'bg-home-raised text-home-muted hover:text-home-text border border-transparent'
              }`}
            >
              ⚡ الكهرباء
            </HomeButton>
            <HomeButton
              onClick={() => setActiveFilter('completed')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'completed'
                  ? 'bg-amber-500/20 text-home-accent border border-amber-500/40'
                  : 'bg-home-raised text-home-muted hover:text-home-text border border-transparent'
              }`}
            >
              المنجزة ({tasks.filter((t) => t.isCompleted).length})
            </HomeButton>
          </div>

          <HomeButton variant="primary"
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>صيانة جديدة</span>
          </HomeButton>
        </HomePanel>

        {/* Tasks List */}
        {isLoading ? (
          <div className="text-center py-12 text-home-muted text-xs">
            جاري تحميل جدول صيانة المنزل...
          </div>
        ) : filteredTasks.length === 0 ? (
          <HomePanel className=" p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-home-raised border border-home-border flex items-center justify-center mx-auto text-xl text-home-accent">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-home-text">لا توجد أعمال صيانة مسجلة في هذا التصنيف</h3>
            <p className="text-xs text-home-muted max-w-sm mx-auto">
              اضغط على الصيانات الوقائية المقترحة بالأعلى أو أضف موعد صيانة جديد لحماية ممتلكات بيتك
            </p>
          </HomePanel>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isOverdue = !task.isCompleted && task.dueDate && task.dueDate < todayStr;

              return (
                <div
                  key={task.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    task.isCompleted
                      ? 'bg-amber-950/15 border-amber-500/20 text-home-muted opacity-75'
                      : 'bg-home-raised border-home-border hover:border-amber-500/30 text-home-text'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <HomeCompletion checked={task.isCompleted} aria-label={'إتمام ' + task.title} onChange={() => void handleToggle(task)} />

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
                        <p className="text-[11px] text-home-muted leading-normal line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {task.dueDate && (
                        <div className="flex items-center gap-3 text-[10px] text-home-muted pt-1">
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400 font-bold' : ''}`}>
                            {isOverdue && <AlertCircle className="w-3 h-3 text-rose-400" />}
                            <Calendar className="w-3 h-3 text-home-muted" />
                            <span>{task.dueDate === todayStr ? 'اليوم' : task.dueDate}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <HomeButton icon={<Edit3 className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setEditingTask(task);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-home-muted hover:text-home-text hover:bg-home-selection transition-colors cursor-pointer"
                      title="تعديل"
                    >

                    </HomeButton>
                    <HomeButton icon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 rounded-lg text-home-muted hover:text-rose-400 hover:bg-home-selection transition-colors cursor-pointer"
                      title="حذف"
                    >

                    </HomeButton>
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
