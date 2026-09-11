import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, Edit3, Calendar, Clock, Sparkles, Folder, CheckSquare, Search } from 'lucide-react';
import { LifeTask, HomeProject } from '../../../types';
import { getTasksBySpace, toggleTaskCompletion, deleteTask } from '../../../db/taskQueries';
import { getWorkProjects } from '../../../db/projectQueries';
import { SpaceShell } from '../../../components/layout/SpaceShell';
import { EmptyState } from '../../../components/common/EmptyState';
import { WorkTaskModal } from './WorkTaskModal';

export const WorkTasksView: React.FC = () => {
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'high' | 'pending' | 'completed' | 'recurring'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<LifeTask | null>(null);

  const loadData = async () => {
    const [taskList, projectList] = await Promise.all([
      getTasksBySpace('work'),
      getWorkProjects(),
    ]);
    setTasks(taskList);
    setProjects(projectList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (taskId: string) => {
    await toggleTaskCompletion(taskId);
    await loadData();
  };

  const handleDelete = async (taskId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      await deleteTask(taskId);
      await loadData();
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter((t) => {
    if (searchQuery.trim()) {
      const matchTitle = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDesc = t.description?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchTitle && !matchDesc) return false;
    }

    const isDone = t.isRecurring
      ? Array.isArray(t.recurringCompletionDates) && t.recurringCompletionDates.includes(todayStr)
      : t.isCompleted;

    switch (filter) {
      case 'today':
        return t.dueDate === todayStr || t.isRecurring;
      case 'high':
        return t.priority === 'high';
      case 'pending':
        return !isDone;
      case 'completed':
        return isDone;
      case 'recurring':
        return !!t.isRecurring;
      case 'all':
      default:
        return true;
    }
  });

  const completedCount = tasks.filter((t) =>
    t.isRecurring
      ? Array.isArray(t.recurringCompletionDates) && t.recurringCompletionDates.includes(todayStr)
      : t.isCompleted
  ).length;

  return (
    <SpaceShell
      icon="💼"
      title="مهام العمل والأولويات"
      subtitle="إدارة وتتبع مهام العمل اليومية والمشاريع المتزامنة"
      actions={
        <button
          onClick={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-sky-500/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>إضافة مهمة عمل</span>
        </button>
      }
    >
      <div className="space-y-5 pb-20">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في مهام العمل..."
              className="w-full pl-3 pr-9 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${filter === 'all' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:bg-white/5'}`}
            >
              الكل ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${filter === 'pending' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:bg-white/5'}`}
            >
              قيد الانتظار ({tasks.length - completedCount})
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${filter === 'today' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:bg-white/5'}`}
            >
              اليوم 📅
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${filter === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:bg-white/5'}`}
            >
              أولوية عالية 🔴
            </button>
            <button
              onClick={() => setFilter('recurring')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${filter === 'recurring' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:bg-white/5'}`}
            >
              المتكررة 🔄
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${filter === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:bg-white/5'}`}
            >
              المنجزة ({completedCount}) ✓
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2.5">
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={<CheckSquare className="w-7 h-7 text-slate-400" />}
              title="لا توجد مهام تطابق هذا التصنيف"
              description="يمكنك إضافة مهمة جديدة أو تغيير فلاتر البحث الحالية"
              actionLabel="+ إضافة مهمة عمل"
              onAction={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
            />
          ) : (
            filteredTasks.map((task) => {
              const isDone = task.isRecurring
                ? Array.isArray(task.recurringCompletionDates) && task.recurringCompletionDates.includes(todayStr)
                : task.isCompleted;

              const project = projects.find((p) => p.id === task.projectId);

              return (
                <div
                  key={task.id}
                  className={`liquid-glass-card rounded-2xl p-4 flex items-center justify-between gap-3 border transition-all ${
                    isDone
                      ? 'border-sky-500/20 bg-sky-950/10 text-slate-400'
                      : 'border-white/10 hover:border-white/20 text-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Toggle Button */}
                    <button
                      onClick={() => handleToggle(task.id)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                        isDone
                          ? 'bg-sky-500 border-sky-400 text-slate-950 shadow-md shadow-sky-500/30'
                          : 'border-white/20 hover:border-sky-400'
                      }`}
                    >
                      {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs sm:text-sm font-bold truncate ${isDone ? 'line-through opacity-60 text-slate-400' : 'text-white'}`}>
                          {task.title}
                        </span>

                        {/* Priority Badge */}
                        {task.priority === 'high' && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
                            عالية
                          </span>
                        )}

                        {/* Recurring Badge */}
                        {task.isRecurring && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>متكررة</span>
                          </span>
                        )}

                        {/* Linked Project Badge */}
                        {project && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-bold flex items-center gap-1">
                            <Folder className="w-2.5 h-2.5" />
                            <span>{project.title}</span>
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {task.description}
                        </p>
                      )}

                      {/* Meta: Due Date & Scheduled Time */}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-sky-400" />
                            <span>{task.dueDate}</span>
                          </span>
                        )}
                        {task.scheduledTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-sky-400" />
                            <span className="font-mono">{task.scheduledTime}</span>
                          </span>
                        )}
                        {task.estimatedMinutes && (
                          <span>{task.estimatedMinutes} دقيقة</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="تعديل المهمة"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="حذف المهمة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Task Modal */}
      <WorkTaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onTaskSaved={loadData}
        initialTask={editingTask}
        workProjects={projects}
      />
    </SpaceShell>
  );
};
