import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, 
  Folder, 
  Timer, 
  BarChart2, 
  Plus, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Dumbbell, 
  ArrowRight,
  Clock
} from 'lucide-react';
import { LifeTask, HomeProject } from '../../types';
import { getTasksBySpace, saveTask, toggleTaskCompletion } from '../../db/taskQueries';
import { getWorkProjects, completeProjectStep } from '../../db/projectQueries';
import { SpaceShell } from '../../components/layout/SpaceShell';
import { sounds } from '../../utils/audio';
import { getFocusStats, recordCompletedFocusSession } from './focus/focusService';
import { ProjectHubModal } from './projects/ProjectHubModal';

export const WorkOverview: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [focusStats, setFocusStats] = useState(getFocusStats());
  const [selectedHubProject, setSelectedHubProject] = useState<HomeProject | null>(null);

  // Quick Pomodoro Timer
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const loadData = async () => {
    const [taskList, projectList] = await Promise.all([
      getTasksBySpace('work'),
      getWorkProjects(),
    ]);
    setTasks(taskList);
    setProjects(projectList);
    setFocusStats(getFocusStats());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick Timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isTimerRunning) {
      sounds.playGoChime();
      if (!isBreak) {
        setIsBreak(true);
        setSecondsLeft(5 * 60);
        recordCompletedFocusSession(25);
        setFocusStats(getFocusStats());
      } else {
        setIsBreak(false);
        setSecondsLeft(25 * 60);
      }
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, secondsLeft, isBreak]);

  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setSecondsLeft((isBreak ? 5 : 25) * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const task: LifeTask = {
      id: `task_work_${Date.now()}`,
      spaceId: 'work',
      title: newTaskTitle.trim(),
      priority: 'high',
      isCompleted: false,
      dueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    await saveTask(task);
    setNewTaskTitle('');
    await loadData();
  };

  const handleToggleTask = async (id: string) => {
    await toggleTaskCompletion(id);
    await loadData();
  };

  const handleCompleteProjectStep = async (projectId: string, stepId: string) => {
    await completeProjectStep(projectId, stepId);
    await loadData();
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const pendingTasks = tasks.filter((t) => {
    const isDone = t.isRecurring
      ? Array.isArray(t.recurringCompletionDates) && t.recurringCompletionDates.includes(todayStr)
      : t.isCompleted;
    return !isDone;
  });

  const overdueTasks = pendingTasks.filter((t) => t.dueDate && t.dueDate < todayStr);
  const todayTasks = pendingTasks.filter((t) => t.dueDate === todayStr || t.priority === 'high' || t.isRecurring);
  const activeProjects = projects.filter((p) => p.status !== 'completed');

  return (
    <SpaceShell
      icon="💼"
      title="مساحة العمل والإنتاجية"
      subtitle="إدارة وتتبع مهام العمل، مشاريع الإنجاز، وجلسات التركيز العميق"
      badge={
        <div className="px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-sky-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>{focusStats.completedSessions} جلسات تركيز مكتملة</span>
        </div>
      }
    >
      <div className="space-y-6 pb-20">
        {/* 1. Quick Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <button
            onClick={() => navigate('/work/tasks')}
            className="liquid-glass-card rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2.5 text-right hover:border-sky-500/40 hover:bg-white/5 transition-all group cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center shrink-0 text-sky-400 group-hover:scale-105 transition-transform">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate font-['Tajawal']">المهام</span>
                <span className="text-[10px] text-slate-400 block truncate">{pendingTasks.length} قيد الانتظار</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 shrink-0 transition-colors rtl:-scale-x-100" />
          </button>

          <button
            onClick={() => navigate('/work/projects')}
            className="liquid-glass-card rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2.5 text-right hover:border-cyan-500/40 hover:bg-white/5 transition-all group cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center shrink-0 text-cyan-400 group-hover:scale-105 transition-transform">
                <Folder className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate font-['Tajawal']">المشاريع</span>
                <span className="text-[10px] text-slate-400 block truncate">{activeProjects.length} مشروع نشط</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 transition-colors rtl:-scale-x-100" />
          </button>

          <button
            onClick={() => navigate('/work/focus')}
            className="liquid-glass-card rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2.5 text-right hover:border-amber-500/40 hover:bg-white/5 transition-all group cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition-transform">
                <Timer className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate font-['Tajawal']">جلسة تركيز</span>
                <span className="text-[10px] text-slate-400 block truncate">بومودورو 25د</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0 transition-colors rtl:-scale-x-100" />
          </button>

          <button
            onClick={() => navigate('/work/progress')}
            className="liquid-glass-card rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2.5 text-right hover:border-emerald-500/40 hover:bg-white/5 transition-all group cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 text-emerald-400 group-hover:scale-105 transition-transform">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate font-['Tajawal']">سجل الإنتاجية</span>
                <span className="text-[10px] text-slate-400 block truncate">{focusStats.todayMinutes}د تركيز اليوم</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 transition-colors rtl:-scale-x-100" />
          </button>
        </div>

        {/* 2. Responsive 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Column (Col 7/8): Today's Tasks & Projects Next Actions */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">
            {/* Overdue Tasks Alert (if any) */}
            {overdueTasks.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                  <AlertCircle className="w-4 h-4" />
                  <span>مهام متأخرة تحتاج الحسم ({overdueTasks.length})</span>
                </div>
                <div className="space-y-1.5">
                  {overdueTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-rose-500/20 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className="w-5 h-5 rounded-md border border-rose-500/40 hover:border-rose-400 flex items-center justify-center shrink-0 cursor-pointer"
                        />
                        <span className="truncate text-white font-medium">{task.title}</span>
                      </div>
                      <span className="text-[10px] text-rose-400 font-mono shrink-0">{task.dueDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Priorities & Tasks */}
            <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white font-['Tajawal']">
                    أولويات ومهام اليوم ({todayTasks.length})
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/work/tasks')}
                  className="text-xs text-sky-400 hover:text-sky-300 font-bold transition-colors"
                >
                  عرض جميع المهام &larr;
                </button>
              </div>

              {/* Quick inline add */}
              <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="أضف مهمة رئيسية للعمل اليوم..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>إضافة</span>
                </button>
              </form>

              {/* Today Task List */}
              <div className="space-y-2">
                {todayTasks.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    لا توجد أولويات عمل متبقية لليوم. عمل رائع! 🎉
                  </div>
                ) : (
                  todayTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className="w-5 h-5 rounded-md border border-white/20 hover:border-sky-400 flex items-center justify-center shrink-0 cursor-pointer"
                        />
                        <span className="truncate text-white font-medium">{task.title}</span>
                        {task.priority === 'high' && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                            عالية
                          </span>
                        )}
                      </div>
                      {task.scheduledTime && (
                        <span className="text-[10px] text-sky-300 font-mono shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{task.scheduledTime}</span>
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Projects: Next Actions */}
            <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white font-['Tajawal']">
                    الخطوات القادمة في المشاريع (Next Actions)
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/work/projects')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                >
                  إدارة المشاريع &larr;
                </button>
              </div>

              <div className="space-y-2.5">
                {activeProjects.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    لا توجد مشاريع عمل نشطة حالياً.
                  </div>
                ) : (
                  activeProjects.map((proj) => {
                    if (!proj.nextActionTitle || !proj.nextActionId) return null;
                    return (
                      <div
                        key={proj.id}
                        className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setSelectedHubProject(proj)}
                            className="text-[10px] text-cyan-300 hover:text-cyan-200 font-bold mb-0.5 flex items-center gap-1 cursor-pointer"
                            title="فتح Project Hub"
                          >
                            <span>مشروع: {proj.title}</span>
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-[9px]">Hub ⚡</span>
                          </button>
                          <div className="text-white font-bold truncate">
                            {proj.nextActionTitle}
                          </div>
                        </div>

                        <button
                          onClick={() => handleCompleteProjectStep(proj.id, proj.nextActionId!)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-md shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>إنجاز</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Secondary Column (Col 5/4): Quick Focus & Desk Break */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            {/* Quick Pomodoro Widget */}
            <div className="liquid-glass-card rounded-3xl p-5 border border-amber-500/25 space-y-3.5 text-center">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-1.5 font-['Tajawal']">
                  <Timer className="w-4 h-4 text-amber-400" />
                  <span>{isBreak ? 'استراحة وتمدد' : 'مؤقت التركيز السريع'}</span>
                </span>
                <span className="text-[10px] text-slate-400">25 دقيقة</span>
              </div>

              <div className="text-4xl font-black text-white font-mono my-2">
                {formatTime(secondsLeft)}
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleToggleTimer}
                  className={`px-5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    isTimerRunning
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>إيقاف مؤقت</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>ابدأ التركيز</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleResetTimer}
                  className="p-2 rounded-xl liquid-glass-pill text-slate-400 hover:text-white"
                  title="إعادة ضبط"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Work Execution Summary */}
            <div className="liquid-glass-card rounded-3xl p-5 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-white font-['Tajawal'] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>ملخص إنتاجية اليوم</span>
              </h4>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-lg font-black text-white font-mono">
                    {tasks.filter((t) => t.isCompleted).length} / {tasks.length}
                  </div>
                  <div className="text-[10px] text-slate-400">مهام منجزة</div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-lg font-black text-amber-400 font-mono">
                    {focusStats.todayMinutes}د
                  </div>
                  <div className="text-[10px] text-slate-400">وقت التركيز</div>
                </div>
              </div>
            </div>

            {/* Desk Break Reminder */}
            <div className="liquid-glass-card rounded-3xl p-5 border border-teal-500/20 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🧍‍♂️</span>
                <div>
                  <h4 className="text-xs font-bold text-white font-['Tajawal']">
                    استراحة لفقرات الظهر
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    الجلوس المتواصل يرهق عضلات الجذع
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/health')}
                className="w-full py-2 px-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 hover:bg-teal-500/25 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>تمارين فك تشنج الجلوس</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Project Hub Modal */}
      <ProjectHubModal
        isOpen={Boolean(selectedHubProject)}
        project={selectedHubProject}
        onClose={() => setSelectedHubProject(null)}
        onProjectUpdated={loadData}
      />
    </SpaceShell>
  );
};
