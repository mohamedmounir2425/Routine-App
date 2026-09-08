import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, 
  Folder, 
  ListChecks, 
  Wrench, 
  Plus, 
  Check, 
  Sparkles, 
  ArrowRight,
  Calendar
} from 'lucide-react';
import { LifeTask, HomeProject } from '../../types';
import { getTasksBySpace, saveTask, toggleTaskCompletion } from '../../db/taskQueries';
import { getHomeProjects, completeProjectStep } from '../../db/projectQueries';
import { SpaceShell } from '../../components/layout/SpaceShell';
import { getLocalDateString } from '../../utils/dateUtils';
import { HomeTaskModal } from './tasks/HomeTaskModal';
import { HomeProjectModal } from './projects/HomeProjectModal';
import { HomeRoutineModal } from './routines/HomeRoutineModal';
import { HomeMaintenanceModal } from './maintenance/HomeMaintenanceModal';

export const HomeOverview: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  const todayStr = useMemo(() => getLocalDateString(), []);

  const loadData = async () => {
    try {
      const [taskList, projectList] = await Promise.all([
        getTasksBySpace('home'),
        getHomeProjects(),
      ]);
      setTasks(taskList);
      setProjects(projectList);
    } catch (err) {
      console.error('Failed to load home overview data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter tasks
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.isRecurring) return false;
      if (t.isCompleted) return false;
      return !t.dueDate || t.dueDate === todayStr || t.dueDate < todayStr;
    });
  }, [tasks, todayStr]);

  const routines = useMemo(() => {
    return tasks.filter((t) => t.isRecurring);
  }, [tasks]);

  const maintenanceTasks = useMemo(() => {
    return tasks.filter((t) => 
      !t.isCompleted && 
      (t.title.includes('صيانة') || t.title.includes('تكييف') || t.title.includes('سباكة') || t.title.includes('كهرباء') || t.title.startsWith('['))
    );
  }, [tasks]);

  const activeProjects = useMemo(() => {
    return projects.filter((p) => p.status === 'in_progress');
  }, [projects]);

  const completedRoutinesToday = useMemo(() => {
    return routines.filter((r) => Array.isArray(r.recurringCompletionDates) && r.recurringCompletionDates.includes(todayStr)).length;
  }, [routines, todayStr]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    const newTask: LifeTask = {
      id: `task_home_${Date.now()}`,
      spaceId: 'home',
      title: quickTaskTitle.trim(),
      priority: 'medium',
      dueDate: todayStr,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    await saveTask(newTask);
    setQuickTaskTitle('');
    await loadData();
  };

  const handleToggleTask = async (task: LifeTask) => {
    await toggleTaskCompletion(task.id, todayStr);
    await loadData();
  };

  const handleCompleteNextAction = async (projectId: string, stepId: string) => {
    await completeProjectStep(projectId, stepId);
    await loadData();
  };

  return (
    <SpaceShell
      icon="🏠"
      title="مساحة المنزل والأسرة"
      subtitle="روتينات البيت المريحة، تنظيم المهام الأسرية، ومتابعة الاحتياجات والصيانة"
      badge={
        <div className="px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-amber-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>بيئة منزلية هادئة ومنظمة</span>
        </div>
      }
    >
      <div className="space-y-6 text-right font-['Tajawal']">
        {/* Quick KPI Overview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[11px] text-slate-400 font-bold block">مهام اليوم</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">{todayTasks.length}</span>
              <span className="text-[10px] text-slate-500">مهمة معلقة</span>
            </div>
          </div>

          <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[11px] text-slate-400 font-bold block">روتينات اليوم</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">
                {completedRoutinesToday}/{routines.length}
              </span>
              <span className="text-[10px] text-slate-500">مكتملة</span>
            </div>
          </div>

          <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[11px] text-slate-400 font-bold block">مشاريع نشطة</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-sky-400">{activeProjects.length}</span>
              <span className="text-[10px] text-slate-500">مشروع منزلي</span>
            </div>
          </div>

          <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[11px] text-slate-400 font-bold block">تنبيهات الصيانة</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-400">{maintenanceTasks.length}</span>
              <span className="text-[10px] text-slate-500">تحت المتابعة</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Navigation Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/home/tasks')}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-right transition-all group cursor-pointer flex flex-col justify-between h-28"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-white group-hover:text-amber-300 block transition-colors">
                المهام والمشتريات
              </span>
              <span className="text-[10px] text-slate-400">إدارة القوائم والمقاضي</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/home/projects')}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-right transition-all group cursor-pointer flex flex-col justify-between h-28"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-white group-hover:text-amber-300 block transition-colors">
                مشاريع المنزل
              </span>
              <span className="text-[10px] text-slate-400">تجديد، دهان، ترتيب</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/home/routines')}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-right transition-all group cursor-pointer flex flex-col justify-between h-28"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <ListChecks className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-white group-hover:text-emerald-300 block transition-colors">
                الروتين اليومي
              </span>
              <span className="text-[10px] text-slate-400">صباحي ومسائي دوري</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/home/maintenance')}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-right transition-all group cursor-pointer flex flex-col justify-between h-28"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-white group-hover:text-rose-300 block transition-colors">
                صيانة البيت
              </span>
              <span className="text-[10px] text-slate-400">تكييف، سباكة، كهرباء</span>
            </div>
          </button>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <input
            type="text"
            value={quickTaskTitle}
            onChange={(e) => setQuickTaskTitle(e.target.value)}
            placeholder="أضف مهمة منزلية أو غرض شراء سريعاً... (اضغط Enter)"
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

        {/* Main Grid: Today's Home Tasks & Active Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Tasks & Groceries */}
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white">مهام ومشتريات اليوم ({todayTasks.length})</h3>
              </div>
              <button
                onClick={() => navigate('/home/tasks')}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>عرض الكل</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>

            <div className="space-y-2">
              {todayTasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  🎉 رائع! لا توجد مهام منزلية معلقة لليوم.
                </div>
              ) : (
                todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="w-5 h-5 rounded-md border border-white/20 hover:border-amber-400 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                      />
                      <span className="text-xs font-bold text-slate-200 truncate">
                        {task.title}
                      </span>
                    </div>

                    {task.priority === 'high' && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold shrink-0">
                        عاجل
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Home Projects & Next Actions */}
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white">مشاريع المنزل النشطة ({activeProjects.length})</h3>
              </div>
              <button
                onClick={() => navigate('/home/projects')}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>إدارة المشاريع</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>

            <div className="space-y-2.5">
              {activeProjects.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  لا توجد مشاريع منزلية نشطة حالياً. أضف مشروع تجديد أو تنظيم!
                </div>
              ) : (
                activeProjects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2 hover:border-amber-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-white truncate">
                        {project.title}
                      </span>
                      {project.targetDate && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                          <Calendar className="w-3 h-3 text-amber-400" />
                          <span>{project.targetDate}</span>
                        </span>
                      )}
                    </div>

                    {project.nextActionTitle && project.nextActionId ? (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold text-amber-400 shrink-0">
                            الخطوة التالية:
                          </span>
                          <span className="text-xs text-slate-200 font-bold truncate">
                            {project.nextActionTitle}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCompleteNextAction(project.id, project.nextActionId!)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all shrink-0"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>تم</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic block">
                        لا توجد خطوة محددة
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Secondary Grid: Daily Routines & Maintenance Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Routines Checklist */}
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white">روتينات البيت الدورية</h3>
              </div>
              <button
                onClick={() => navigate('/home/routines')}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>عرض الروتينات</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>

            <div className="space-y-2">
              {routines.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  لم يتم تفعيل روتينات بعد. توجه لصفحة الروتين لاستيرادها بضغطة زر!
                </div>
              ) : (
                routines.slice(0, 4).map((routine) => {
                  const isDone = Array.isArray(routine.recurringCompletionDates) && routine.recurringCompletionDates.includes(todayStr);

                  return (
                    <div
                      key={routine.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isDone
                          ? 'bg-amber-950/15 border-amber-500/20 text-slate-400'
                          : 'bg-white/5 border-white/5 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          onClick={() => handleToggleTask(routine)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                            isDone
                              ? 'bg-amber-400 border-amber-300 text-slate-950'
                              : 'border-white/20 hover:border-amber-400'
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <span className={`text-xs font-bold truncate ${isDone ? 'line-through opacity-70' : ''}`}>
                          {routine.title}
                        </span>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400 shrink-0">
                        {routine.title.includes('صباح') ? 'صباحي' : routine.title.includes('مساء') ? 'مسائي' : 'يومي'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Maintenance Reminders */}
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-black text-white">صيانات وتفقدات قادمة</h3>
              </div>
              <button
                onClick={() => navigate('/home/maintenance')}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>جدول الصيانة</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>

            <div className="space-y-2">
              {maintenanceTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  ✨ جميع مرافق البيت بحالة ممتازة! لا توجد صيانات معلقة.
                </div>
              ) : (
                maintenanceTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-rose-500/30 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="w-5 h-5 rounded-md border border-white/20 hover:border-rose-400 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                      />
                      <span className="text-xs font-bold text-slate-200 truncate">
                        {task.title}
                      </span>
                    </div>

                    {task.dueDate && (
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {task.dueDate}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <HomeTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onTaskSaved={loadData}
          homeProjects={projects}
        />
        <HomeProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          onProjectSaved={loadData}
        />
        <HomeRoutineModal
          isOpen={isRoutineModalOpen}
          onClose={() => setIsRoutineModalOpen(false)}
          onRoutineSaved={loadData}
        />
        <HomeMaintenanceModal
          isOpen={isMaintenanceModalOpen}
          onClose={() => setIsMaintenanceModalOpen(false)}
          onMaintenanceSaved={loadData}
        />
      </div>
    </SpaceShell>
  );
};
