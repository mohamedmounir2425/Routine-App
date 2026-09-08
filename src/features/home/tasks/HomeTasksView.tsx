import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Check, 
  Trash2, 
  Edit3, 
  Calendar, 
  Clock, 
  Folder, 
  AlertCircle,
  ShoppingCart,
  Sparkles
} from 'lucide-react';
import { SpaceShell } from '../../../components/layout/SpaceShell';
import { LifeTask, HomeProject } from '../../../types';
import { getTasksBySpace, toggleTaskCompletion, deleteTask, saveTask } from '../../../db/taskQueries';
import { getHomeProjects } from '../../../db/projectQueries';
import { HomeTaskModal } from './HomeTaskModal';
import { getLocalDateString } from '../../../utils/dateUtils';

type FilterTab = 'all' | 'pending' | 'today' | 'shopping' | 'high' | 'completed';

export const HomeTasksView: React.FC = () => {
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [quickTitle, setQuickTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<LifeTask | null>(null);

  const todayStr = useMemo(() => getLocalDateString(), []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedTasks, fetchedProjects] = await Promise.all([
        getTasksBySpace('home'),
        getHomeProjects(),
      ]);
      setTasks(fetchedTasks);
      setProjects(fetchedProjects);
    } catch (err) {
      console.error('Failed to load home tasks data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) {
      map.set(p.id, p.title);
    }
    return map;
  }, [projects]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Check recurring completion for today
      const isDone = task.isRecurring
        ? Array.isArray(task.recurringCompletionDates) && task.recurringCompletionDates.includes(todayStr)
        : task.isCompleted;

      // 2. Tab filter
      switch (activeTab) {
        case 'pending':
          return !isDone;
        case 'today':
          if (isDone) return false;
          if (task.isRecurring) return true;
          return task.dueDate === todayStr;
        case 'shopping':
          return task.title.startsWith('🛒') || (task.description || '').includes('مشتريات');
        case 'high':
          return !isDone && task.priority === 'high';
        case 'completed':
          return isDone;
        case 'all':
        default:
          return true;
      }
    });
  }, [tasks, searchQuery, activeTab, todayStr]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const newTask: LifeTask = {
      id: `task_home_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      spaceId: 'home',
      title: quickTitle.trim(),
      priority: 'medium',
      dueDate: todayStr,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    await saveTask(newTask);
    setQuickTitle('');
    await loadData();
  };

  const handleToggle = async (task: LifeTask) => {
    await toggleTaskCompletion(task.id, todayStr);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      await deleteTask(id);
      await loadData();
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
            عاجل
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
            متوسط
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-500/20 text-slate-400 border border-white/10 text-[10px] font-bold">
            مرن
          </span>
        );
    }
  };

  return (
    <SpaceShell
      icon="🏠"
      title="مهام ومشتريات المنزل"
      subtitle="تنظيم المهام الأسرية، متابعة المقاضي والمشتريات، وجدول الأعمال الدورية"
      badge={
        <div className="px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-amber-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>{tasks.filter((t) => !t.isCompleted).length} مهام متبقية</span>
        </div>
      }
    >
      <div className="space-y-6 text-right font-['Tajawal']">
        {/* Controls Header: Search + Tabs + New Task Button */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث في المهام والمشتريات..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* New Task Trigger Button */}
            <button
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>مهمة جديدة</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              الكل ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              قيد الانتظار ({tasks.filter((t) => !t.isCompleted).length})
            </button>
            <button
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'today'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setActiveTab('shopping')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'shopping'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              🛒 المشتريات
            </button>
            <button
              onClick={() => setActiveTab('high')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'high'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              عاجلة
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'completed'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              المنجزة ({tasks.filter((t) => t.isCompleted).length})
            </button>
          </div>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="إضافة مهمة أو غرض شراء سريعاً... (اضغط Enter)"
            className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/50"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة</span>
          </button>
        </form>

        {/* Task Cards List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            جاري تحميل مهام ومشتريات المنزل...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="liquid-glass-card rounded-3xl p-10 border border-white/5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-xl text-amber-400">
              🏠
            </div>
            <h3 className="text-sm font-bold text-white">لا توجد مهام في هذا التصنيف</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              أضف مهمة جديدة أو غرضاً للمشتريات لتنظيم شؤون بيتك بكل سلاسة
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isDone = task.isRecurring
                ? Array.isArray(task.recurringCompletionDates) && task.recurringCompletionDates.includes(todayStr)
                : task.isCompleted;

              const isOverdue = !isDone && task.dueDate && task.dueDate < todayStr;
              const linkedProjectTitle = task.projectId ? projectMap.get(task.projectId) : undefined;
              const isShoppingItem = task.title.startsWith('🛒') || (task.description || '').includes('مشتريات');

              return (
                <div
                  key={task.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    isDone
                      ? 'bg-amber-950/15 border-amber-500/20 text-slate-400 opacity-75'
                      : 'bg-white/5 border-white/10 hover:border-amber-500/30 text-white'
                  }`}
                >
                  {/* Right side: Checkbox + Content */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggle(task)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-all ${
                        isDone
                          ? 'bg-amber-400 border-amber-300 text-slate-950'
                          : 'border-white/20 hover:border-amber-400'
                      }`}
                    >
                      {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold leading-relaxed ${isDone ? 'line-through opacity-70' : ''}`}>
                          {task.title}
                        </span>

                        {getPriorityBadge(task.priority)}

                        {isShoppingItem && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" />
                            <span>مشتريات</span>
                          </span>
                        )}

                        {task.isRecurring && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                            دورية ({task.recurrenceRule === 'weekdays' ? 'أيام العمل' : task.recurrenceRule === 'weekly' ? 'أسبوعية' : 'يومية'})
                          </span>
                        )}

                        {linkedProjectTitle && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300/80 border border-amber-500/20 text-[10px] flex items-center gap-1">
                            <Folder className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">{linkedProjectTitle}</span>
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Meta info: Due date, scheduled time */}
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400 font-bold' : ''}`}>
                            {isOverdue && <AlertCircle className="w-3 h-3 text-rose-400" />}
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{task.dueDate === todayStr ? 'اليوم' : task.dueDate}</span>
                          </span>
                        )}

                        {task.scheduledTime && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{task.scheduledTime}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Left side: Edit & Delete buttons */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="تعديل المهمة"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                      title="حذف المهمة"
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
        <HomeTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onTaskSaved={loadData}
          initialTask={editingTask}
          homeProjects={projects}
        />
      </div>
    </SpaceShell>
  );
};
