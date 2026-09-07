import React, { useState, useEffect } from 'react';
import { LifeTask } from '../../types/tasks';
import { getTasksBySpace, saveTask, toggleTaskCompletion, deleteTask } from '../../db/taskQueries';
import { 
  Plus, 
  Check, 
  Trash2, 
  Sparkles, 
  ShoppingCart, 
  ListChecks 
} from 'lucide-react';

const HOME_ROUTINE_PRESETS = [
  { id: 'h1', title: 'تهوية المنزل وفتح النوافذ صباحاً', period: 'morning' },
  { id: 'h2', title: 'ترتيب السرير ومكتب العمل', period: 'morning' },
  { id: 'h3', title: 'سقي النباتات وتفقد إضاءات المنزل', period: 'morning' },
  { id: 'h4', title: 'تنظيف المطبخ وتجهيز قهوة الصباح', period: 'morning' },
  { id: 'h5', title: 'مراجعة قائمة مشتريات واحتياجات البيت', period: 'evening' },
  { id: 'h6', title: 'إطفاء الشاشات والأجهزة الإلكترونية قبل النوم', period: 'evening' },
];

export const HomeSpace: React.FC = () => {
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [completedPresets, setCompletedPresets] = useState<Record<string, boolean>>(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`routine_home_presets_${today}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const loadTasks = async () => {
    const list = await getTasksBySpace('home');
    setTasks(list);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const togglePreset = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setCompletedPresets((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(`routine_home_presets_${today}`, JSON.stringify(next));
      return next;
    });
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const task: LifeTask = {
      id: `task_${Date.now()}`,
      spaceId: 'home',
      title: newTaskTitle.trim(),
      priority: 'medium',
      isCompleted: false,
      dueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    await saveTask(task);
    setNewTaskTitle('');
    await loadTasks();
  };

  const handleToggleTask = async (id: string) => {
    await toggleTaskCompletion(id);
    await loadTasks();
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
    await loadTasks();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🏠</span>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
              مساحة المنزل والأسرة
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            روتينات البيت المريحة، تنظيم المهام الأسرية، ومتابعة الاحتياجات والمشتريات
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>بيئة منزلية هادئة ومنظمة</span>
          </div>
        </div>
      </div>

      {/* Daily Home Routines (Morning & Evening) */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 border border-amber-500/25 space-y-4">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-black text-white font-['Tajawal']">روتينات البيت الأساسية</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HOME_ROUTINE_PRESETS.map((item) => {
            const isDone = !!completedPresets[item.id];
            return (
              <div
                key={item.id}
                onClick={() => togglePreset(item.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                  isDone
                    ? 'bg-amber-500/15 border-amber-500/40 text-slate-300'
                    : 'bg-white/5 border-white/10 hover:border-amber-500/30 text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                      isDone ? 'bg-amber-400 border-amber-300 text-slate-950' : 'border-white/20'
                    }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className={`text-xs font-bold ${isDone ? 'line-through opacity-70' : ''}`}>
                    {item.title}
                  </span>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400 shrink-0">
                  {item.period === 'morning' ? 'صباحي' : 'مسائي'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Household Tasks & Groceries Checklist */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 border border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white font-['Tajawal']">
              مهام المنزل والمشتريات الدورية ({tasks.length})
            </h2>
          </div>
        </div>

        {/* Add Task */}
        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="أضف غرضاً للشراء أو مهمة منزلية..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة</span>
          </button>
        </form>

        {/* List */}
        <div className="space-y-2.5 pt-2">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              لا توجد مشتريات أو مهام منزلية مسجلة. أضف ما تحتاجه!
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                  task.isCompleted
                    ? 'bg-amber-950/20 border-amber-500/30 text-slate-400'
                    : 'bg-white/5 border-white/10 text-white hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                      task.isCompleted
                        ? 'bg-amber-400 border-amber-300 text-slate-950'
                        : 'border-white/20 hover:border-amber-400'
                    }`}
                  >
                    {task.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <span className={`text-xs font-bold truncate ${task.isCompleted ? 'line-through opacity-60' : ''}`}>
                    {task.title}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
