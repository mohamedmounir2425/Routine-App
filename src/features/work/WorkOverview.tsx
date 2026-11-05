import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Check, 
  Clock, 
  Folder, 
  Plus, 
  Sparkles, 
  Hourglass, 
  AlertTriangle, 
  Flame,
  Calendar,
  X,
} from 'lucide-react';
import { LifeTask, HomeProject, TaskPriority, TaskWaitingContext } from '../../types';
import { getTasksBySpace, saveTask } from '../../db/taskQueries';
import { getWorkProjects } from '../../db/projectQueries';
import { SpaceShell } from '../../components/layout/SpaceShell';
import { createPortal } from 'react-dom';
import { sounds } from '../../utils/audio';
import { 
  getPersistedActiveFocusState, 
  startTaskFocus, 
  pauseActiveFocus, 
  completeTaskWithFocus, 
  setTaskWaitingState, 
  captureAndStartInterruption,
  ActiveFocusState
} from './focus/focusEngine';
import { calculateAvailableWorkMinutes } from './time/workdayTimeEngine';
import { ProjectHubModal } from './projects/ProjectHubModal';

export const WorkOverview: React.FC = () => {
  const navigate = useNavigate();

  // Core Data
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [activeFocus, setActiveFocus] = useState<ActiveFocusState>(getPersistedActiveFocusState());
  const [selectedHubProject, setSelectedHubProject] = useState<HomeProject | null>(null);

  // Live Timer Seconds (Ticking every second when task is focused)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Modal / Quick action states
  const [isInterruptOpen, setIsInterruptOpen] = useState<boolean>(false);
  const [interruptTitle, setInterruptTitle] = useState<string>('');
  const [interruptReason, setInterruptReason] = useState<string>('');
  const [interruptSource, setInterruptSource] = useState<string>('');

  const [waitingTaskId, setWaitingTaskId] = useState<string | null>(null);
  const [waitingOn, setWaitingOn] = useState<string>('');
  const [waitingReason, setWaitingReason] = useState<string>('');
  const [waitingFollowUp, setWaitingFollowUp] = useState<string>('');

  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickTitle, setQuickTitle] = useState<string>('');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('medium');
  const [quickEstMinutes, setQuickEstMinutes] = useState<string>('');
  const [quickProjectId, setQuickProjectId] = useState<string>('');

  // Load Work Space Data
  const loadData = async () => {
    const [taskList, projectList] = await Promise.all([
      getTasksBySpace('work'),
      getWorkProjects(),
    ]);
    setTasks(taskList);
    setProjects(projectList);
    setActiveFocus(getPersistedActiveFocusState());
  };

  useEffect(() => {
    loadData();

    // Listen to focus changes dispatched across tabs/components
    const handleFocusChanged = (e: Event) => {
      const customEvt = e as CustomEvent<ActiveFocusState>;
      if (customEvt.detail) {
        setActiveFocus(customEvt.detail);
      } else {
        setActiveFocus(getPersistedActiveFocusState());
      }
    };

    window.addEventListener('work_focus_state_changed', handleFocusChanged);
    return () => {
      window.removeEventListener('work_focus_state_changed', handleFocusChanged);
    };
  }, []);

  // Compute live seconds of active session
  useEffect(() => {
    if (!activeFocus.focusedTaskId || !activeFocus.activeSession) {
      setElapsedSeconds(0);
      return;
    }

    const computeSeconds = () => {
      if (!activeFocus.activeSession?.startedAt) return 0;
      const startMs = new Date(activeFocus.activeSession.startedAt).getTime();
      const nowMs = Date.now();
      return Math.max(0, Math.floor((nowMs - startMs) / 1000));
    };

    setElapsedSeconds(computeSeconds());

    const interval = setInterval(() => {
      setElapsedSeconds(computeSeconds());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeFocus]);

  // Derived Today String (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Focused Task Object
  const focusedTask = useMemo(() => {
    if (!activeFocus.focusedTaskId) return null;
    return tasks.find((t) => t.id === activeFocus.focusedTaskId) || null;
  }, [activeFocus.focusedTaskId, tasks]);

  // Project lookup map
  const projectMap = useMemo(() => {
    const map = new Map<string, HomeProject>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  // Task Slices
  const activeTasks = useMemo(() => {
    // IN_PROGRESS tasks that are not completed and not waiting
    return tasks.filter((t) => !t.isCompleted && t.status === 'IN_PROGRESS');
  }, [tasks]);

  const todayTasks = useMemo(() => {
    // Due today or high priority / scheduled today
    const filtered = tasks.filter((t) => {
      if (t.isCompleted || t.status === 'DONE') return false;
      const isDueToday = t.dueDate === todayStr;
      const isScheduledToday = Boolean(t.scheduledTime && !t.dueDate);
      return isDueToday || isScheduledToday || (t.priority === 'high' && !t.dueDate);
    });

    return [...filtered].sort((a, b) => {
      // 1. Currently focused task first
      const aIsFocused = a.id === activeFocus.focusedTaskId ? 1 : 0;
      const bIsFocused = b.id === activeFocus.focusedTaskId ? 1 : 0;
      if (aIsFocused !== bIsFocused) return bIsFocused - aIsFocused;

      // 2. Active / IN_PROGRESS next
      const aIsProg = a.status === 'IN_PROGRESS' ? 1 : 0;
      const bIsProg = b.status === 'IN_PROGRESS' ? 1 : 0;
      if (aIsProg !== bIsProg) return bIsProg - aIsProg;

      // 3. High-priority due today
      const aHighDue = (a.priority === 'high' && a.dueDate === todayStr) ? 1 : 0;
      const bHighDue = (b.priority === 'high' && b.dueDate === todayStr) ? 1 : 0;
      if (aHighDue !== bHighDue) return bHighDue - aHighDue;

      // 4. Any high priority
      const aHigh = a.priority === 'high' ? 1 : 0;
      const bHigh = b.priority === 'high' ? 1 : 0;
      if (aHigh !== bHigh) return bHigh - aHigh;

      return 0;
    });
  }, [tasks, todayStr, activeFocus.focusedTaskId]);

  const waitingTasks = useMemo(() => {
    return tasks.filter((t) => !t.isCompleted && t.status === 'WAITING');
  }, [tasks]);

  // Available Work Time Engine Calculation
  const workdayTimeStats = useMemo(() => {
    const calculation = calculateAvailableWorkMinutes({
      workStart: '08:30',
      workEnd: '15:00',
      nonProductiveIntervals: [
        { start: '08:30', end: '09:00', label: 'طابور الصباح / التنظيم', type: 'break' },
        { start: '12:00', end: '12:30', label: 'استراحة الغداء', type: 'break' },
        { start: '12:20', end: '12:40', label: 'صلاة الظهر والوضوء', type: 'prayer' },
      ],
    });

    // Determine current time in minutes to calculate true "remaining" available time
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const workEndMinutes = calculation.workEndMinutes;
    
    // Remaining minutes until workday end minus remaining breaks
    let remainingMinutes = 0;
    if (currentMinutes < workEndMinutes) {
      const remainingWindow = Math.max(0, workEndMinutes - Math.max(currentMinutes, calculation.workStartMinutes));
      // subtract intervals that lie strictly in the future
      let upcomingNonProductive = 0;
      calculation.mergedNonProductiveIntervals.forEach((m) => {
        const [sh, sm] = m.start.split(':').map(Number);
        const [eh, em] = m.end.split(':').map(Number);
        const startM = sh * 60 + sm;
        const endM = eh * 60 + em;
        if (endM > currentMinutes) {
          const overlap = endM - Math.max(currentMinutes, startM);
          upcomingNonProductive += Math.max(0, overlap);
        }
      });
      remainingMinutes = Math.max(0, remainingWindow - upcomingNonProductive);
    }

    const availableHours = Math.floor(calculation.availableProductiveMinutes / 60);
    const availableMins = calculation.availableProductiveMinutes % 60;
    const formattedAvailable = `${availableHours}س ${availableMins}د`;

    const remHours = Math.floor(remainingMinutes / 60);
    const remMins = remainingMinutes % 60;
    const formattedRemaining = `${remHours}س ${remMins}د`;

    return {
      calculation,
      formattedAvailable,
      formattedRemaining,
      remainingMinutes,
    };
  }, []);

  // Recommended Next Task: (due today, high priority, fits available time, not done, not waiting)
  const recommendedTask = useMemo(() => {
    if (focusedTask) return null;
    const candidates = tasks.filter((t) => {
      if (t.isCompleted || t.status === 'DONE' || t.status === 'WAITING') return false;
      return true;
    });

    if (candidates.length === 0) return null;

    // Sorting score:
    // Due today (+100) > High priority (+50) > Fits remaining time (+25) > Created earlier
    return [...candidates].sort((a, b) => {
      const aDue = a.dueDate === todayStr ? 100 : 0;
      const bDue = b.dueDate === todayStr ? 100 : 0;
      const aPri = a.priority === 'high' ? 50 : a.priority === 'medium' ? 20 : 0;
      const bPri = b.priority === 'high' ? 50 : b.priority === 'medium' ? 20 : 0;
      const aFits = a.estimatedMinutes && a.estimatedMinutes <= workdayTimeStats.remainingMinutes ? 25 : 0;
      const bFits = b.estimatedMinutes && b.estimatedMinutes <= workdayTimeStats.remainingMinutes ? 25 : 0;
      
      const scoreA = aDue + aPri + aFits;
      const scoreB = bDue + bPri + bFits;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })[0] || null;
  }, [focusedTask, tasks, todayStr, workdayTimeStats.remainingMinutes]);

  // Actions
  const handleStartFocus = async (taskId: string) => {
    sounds.playGoChime();
    await startTaskFocus(taskId);
    await loadData();
  };

  const handlePauseFocus = async () => {
    sounds.playRestChime();
    await pauseActiveFocus();
    await loadData();
  };

  const handleCompleteFocusedTask = async () => {
    if (!focusedTask) return;
    sounds.playVictoryFanfare();
    await completeTaskWithFocus(focusedTask.id);
    await loadData();
  };

  const handleCompleteAnyTask = async (taskId: string) => {
    sounds.playVictoryFanfare();
    await completeTaskWithFocus(taskId);
    await loadData();
  };

  const handleOpenWaitingModal = (taskId: string) => {
    const t = tasks.find((item) => item.id === taskId);
    setWaitingTaskId(taskId);
    setWaitingOn(t?.waitingContext?.waitingOn || '');
    setWaitingReason(t?.waitingContext?.waitingReason || '');
    setWaitingFollowUp(t?.waitingContext?.followUpDate || '');
  };

  const handleConfirmSetWaiting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitingTaskId) return;
    const context: TaskWaitingContext = {
      waitingOn: waitingOn.trim() || undefined,
      waitingReason: waitingReason.trim() || undefined,
      followUpDate: waitingFollowUp || undefined,
      blockedSince: new Date().toISOString(),
    };
    await setTaskWaitingState(waitingTaskId, context);
    setWaitingTaskId(null);
    await loadData();
  };

  const handleConfirmInterruption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interruptTitle.trim()) return;

    await captureAndStartInterruption(
      {
        spaceId: 'work',
        title: interruptTitle.trim(),
        priority: 'high',
        sourceType: 'manual',
        isCompleted: false,
        actualMinutes: 0,
      },
      interruptReason.trim() || undefined,
      interruptSource.trim() || undefined
    );

    setInterruptTitle('');
    setInterruptReason('');
    setInterruptSource('');
    setIsInterruptOpen(false);
    sounds.playWarningBeep();
    await loadData();
  };

  const handleCreateQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const est = quickEstMinutes.trim() ? parseInt(quickEstMinutes.trim(), 10) : undefined;
    const newTask: LifeTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      spaceId: 'work',
      title: quickTitle.trim(),
      priority: quickPriority,
      status: 'TODO',
      isCompleted: false,
      dueDate: todayStr, // Quick task added from workday defaults to today
      projectId: quickProjectId || undefined,
      estimatedMinutes: Number.isFinite(est) && (est as number) > 0 ? est : undefined,
      actualMinutes: 0,
      focusSessions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveTask(newTask);
    setQuickTitle('');
    setQuickEstMinutes('');
    setQuickProjectId('');
    setIsQuickAddOpen(false);
    await loadData();
  };

  // Helper format seconds into MM:SS or HH:MM:SS
  const formatTimer = (totalSec: number): string => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <SpaceShell
      icon="💼"
      title="غرفة قيادة يوم العمل (Workday Command Center)"
      subtitle="إدارة التركيز اللحظي، المهام النشطة، وأولويات اليوم في شاشة واحدة متكاملة"
      badge={
        <div className="px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-sky-400 flex items-center gap-1.5 font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>الوقت المتاح: {workdayTimeStats.formattedAvailable}</span>
        </div>
      }
      actions={
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-sky-500/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>مهمة جديدة لليوم</span>
        </button>
      }
    >
      <div className="space-y-6 pb-32 sm:pb-28" dir="rtl">
        
        {/* ==================================================================== */}
        {/* 1. NOW / FOCUSED TASK SECTION (Prominent Command Header)              */}
        {/* ==================================================================== */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-7 border border-white/15 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Glow when Focused */}
          {focusedTask && (
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none animate-pulse" />
          )}

          {focusedTask ? (
            <div className="space-y-5 relative z-10">
              {/* Header Label */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <span className="text-xs font-bold text-amber-300 font-['Tajawal'] uppercase tracking-wider">
                    جاري التركيز الآن (Focused Task)
                  </span>
                </div>

                {focusedTask.projectId && projectMap.has(focusedTask.projectId) && (
                  <button
                    onClick={() => setSelectedHubProject(projectMap.get(focusedTask.projectId!)!)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>{projectMap.get(focusedTask.projectId!)!.title}</span>
                  </button>
                )}
              </div>

              {/* Title & Stats */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] break-words">
                    {focusedTask.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-['Tajawal'] flex-wrap">
                    {focusedTask.estimatedMinutes && (
                      <span className="flex items-center gap-1 font-mono">
                        <span>المقدّر:</span>
                        <span className="text-slate-200">{focusedTask.estimatedMinutes}د</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-mono">
                      <span>الإجمالي المنجز:</span>
                      <span className="text-emerald-400 font-bold">
                        {(focusedTask.actualMinutes || 0) + Math.round(elapsedSeconds / 60)}د تركيز
                      </span>
                    </span>
                  </div>
                </div>

                {/* Running Timer Display */}
                <div className="flex items-baseline gap-2 bg-slate-950/80 px-5 py-3 rounded-2xl border border-amber-500/30 self-start md:self-auto shrink-0 shadow-inner">
                  <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
                  <span className="text-3xl sm:text-4xl font-black font-mono text-amber-300 tracking-wider">
                    {formatTimer(elapsedSeconds)}
                  </span>
                </div>
              </div>

              {/* Command Action Buttons */}
              <div className="pt-2 flex items-center gap-2.5 flex-wrap border-t border-white/10">
                <button
                  onClick={handlePauseFocus}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <Pause className="w-4 h-4 fill-amber-300" />
                  <span>إيقاف مؤقت (Pause)</span>
                </button>

                <button
                  onClick={handleCompleteFocusedTask}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>إنجاز المهمة (Done)</span>
                </button>

                <button
                  onClick={() => handleOpenWaitingModal(focusedTask.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Hourglass className="w-3.5 h-3.5 text-amber-400" />
                  <span>تعليق / انتظار (Waiting)</span>
                </button>

                <button
                  onClick={() => setIsInterruptOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer mr-auto"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>مقاطعة طارئة (Interrupt)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Empty Focus State */
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
                <Play className="w-6 h-6 ml-0.5 opacity-80" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white font-['Tajawal']">
                  لا توجد مهمة قيد التركيز
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto font-['Tajawal']">
                  {activeTasks.length > 0
                    ? `لديك ${activeTasks.length} مهمة نشطة قيد العمل حالياً. اختر مهمة لبدء جلسة التركيز عليها.`
                    : 'اختر من المهام النشطة أو أولويات اليوم أدناه للبدء في جلسة تركيز، أو اتبع توصية النظام.'}
                </p>
              </div>

              {/* Instant Focus Prompt for Active Tasks or Recommended Task */}
              {activeTasks.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-white/10 max-w-lg mx-auto">
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-right">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1 mb-0.5">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>مهمة نشطة بانتظار التركيز:</span>
                      </span>
                      <span className="text-xs font-bold text-white block truncate">
                        {activeTasks[0].title}
                      </span>
                    </div>

                    <button
                      onClick={() => handleStartFocus(activeTasks[0].id)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/25 transition-all shrink-0 active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>ابدأ التركيز</span>
                    </button>
                  </div>
                </div>
              ) : recommendedTask ? (
                <div className="mt-4 pt-4 border-t border-white/10 max-w-lg mx-auto">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/15 to-cyan-500/10 border border-sky-500/30 flex items-center justify-between gap-3 text-right">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-sky-300 flex items-center gap-1 mb-0.5">
                        <Sparkles className="w-3 h-3 text-sky-400" />
                        <span>مهمة مقترحة للبدء فوراً:</span>
                      </span>
                      <span className="text-xs font-bold text-white block truncate">
                        {recommendedTask.title}
                      </span>
                    </div>

                    <button
                      onClick={() => handleStartFocus(recommendedTask.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/25 transition-all shrink-0 active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>ابدأ التركيز</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* 2. Responsive 2-Column Workday Grid                                  */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Column (Col 8): Active Tasks & Today Tasks */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ---------------------------------------------------------------- */}
            {/* Section 2: Active Tasks (IN_PROGRESS)                            */}
            {/* ---------------------------------------------------------------- */}
            <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white font-['Tajawal']">
                    المهام النشطة قيد العمل (Active Tasks — {activeTasks.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-['Tajawal']">
                  يُفضّل التركيز على مهمة واحدة بالتوازي
                </span>
              </div>

              {activeTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 font-['Tajawal']">
                  لا توجد مهام نشطة حالياً. حدد مهمة من قائمة اليوم أدناه لبدء العمل عليها.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeTasks.map((task) => {
                    const isCurrentFocus = task.id === focusedTask?.id;
                    const project = task.projectId ? projectMap.get(task.projectId) : null;

                    return (
                      <div
                        key={task.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${
                          isCurrentFocus
                            ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            onClick={() => handleCompleteAnyTask(task.id)}
                            className="w-5 h-5 rounded-md border border-white/20 hover:border-emerald-400 flex items-center justify-center shrink-0 cursor-pointer transition-all"
                            title="إنجاز المهمة"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-bold truncate ${isCurrentFocus ? 'text-amber-200' : 'text-white'}`}>
                                {task.title}
                              </span>
                              {isCurrentFocus && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                                  قيد التركيز ⚡
                                </span>
                              )}
                              {project && (
                                <button
                                  onClick={() => setSelectedHubProject(project)}
                                  className="text-[10px] text-sky-400 hover:text-sky-300 font-bold underline-offset-2 hover:underline"
                                >
                                  @{project.title}
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                              {task.actualMinutes ? <span>{task.actualMinutes}د تركيز مسجل</span> : null}
                              {task.estimatedMinutes ? <span>مقدّر: {task.estimatedMinutes}د</span> : null}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isCurrentFocus ? (
                            <button
                              onClick={() => handleStartFocus(task.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                              title="بدء التركيز على هذه المهمة"
                            >
                              <Play className="w-3 h-3 fill-sky-300" />
                              <span>تركيز</span>
                            </button>
                          ) : (
                            <button
                              onClick={handlePauseFocus}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                            >
                              <Pause className="w-3 h-3 fill-amber-300" />
                              <span>إيقاف</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenWaitingModal(task.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="نقل للانتظار"
                          >
                            <Hourglass className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Section 3: Today's Tasks                                         */}
            {/* ---------------------------------------------------------------- */}
            <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white font-['Tajawal']">
                    مهام اليوم المستحقة (Today's Tasks — {todayTasks.length})
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/work/tasks')}
                  className="text-xs text-sky-400 hover:text-sky-300 font-bold transition-colors"
                >
                  جميع المهام &larr;
                </button>
              </div>

              {todayTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 font-['Tajawal']">
                  لا توجد مهام عمل أخرى مجدولة لليوم. عمل رائع! 🎉
                </div>
              ) : (
                <div className="space-y-2">
                  {todayTasks.map((task) => {
                    const project = task.projectId ? projectMap.get(task.projectId) : null;
                    const isFocused = task.id === focusedTask?.id;

                    return (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <button
                            onClick={() => handleCompleteAnyTask(task.id)}
                            className="w-5 h-5 rounded-md border border-white/20 hover:border-emerald-400 flex items-center justify-center shrink-0 cursor-pointer transition-all"
                            title="إنجاز المهمة"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="truncate text-white font-medium">{task.title}</span>
                              {task.priority === 'high' && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold">
                                  عالية
                                </span>
                              )}
                              {project && (
                                <button
                                  onClick={() => setSelectedHubProject(project)}
                                  className="text-[10px] text-sky-400 hover:text-sky-300 font-bold"
                                >
                                  @{project.title}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {task.estimatedMinutes && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              {task.estimatedMinutes}د
                            </span>
                          )}

                          {!isFocused ? (
                            <button
                              onClick={() => handleStartFocus(task.id)}
                              className="px-2 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/25 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                            >
                              <Play className="w-2.5 h-2.5 fill-sky-300" />
                              <span>تركيز</span>
                            </button>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                              نشط الآن
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Section 4: Waiting / Blocked                                     */}
            {/* ---------------------------------------------------------------- */}
            <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hourglass className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white font-['Tajawal']">
                    المهام المعلقة وفي الانتظار (Waiting / Blocked — {waitingTasks.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-['Tajawal']">
                  مهام بانتظار ردود خارجية
                </span>
              </div>

              {waitingTasks.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500 font-['Tajawal']">
                  لا توجد مهام بانتظار رد أو مراجعة حالياً.
                </div>
              ) : (
                <div className="space-y-2">
                  {waitingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <span className="font-bold text-white block truncate">{task.title}</span>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-['Tajawal'] flex-wrap">
                          {task.waitingContext?.waitingOn && (
                            <span className="text-amber-300">
                              بانتظار: <strong>{task.waitingContext.waitingOn}</strong>
                            </span>
                          )}
                          {task.waitingContext?.waitingReason && (
                            <span>السبب: {task.waitingContext.waitingReason}</span>
                          )}
                          {task.waitingContext?.followUpDate && (
                            <span className="font-mono text-slate-400">
                              متابعة: {task.waitingContext.followUpDate}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Resume / Complete */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => handleStartFocus(task.id)}
                          className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer"
                        >
                          استئناف التركيز &larr;
                        </button>
                        <button
                          onClick={() => handleCompleteAnyTask(task.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-colors"
                          title="إنجاز"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Secondary Column (Col 4): Available Work Time & Quick Projects Hub */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* ---------------------------------------------------------------- */}
            {/* Section 5: Available Productive Time Engine Card                 */}
            {/* ---------------------------------------------------------------- */}
            <div className="liquid-glass-card rounded-3xl p-5 border border-sky-500/25 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300 font-['Tajawal'] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>الوقت الإنتاجي لليوم</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono dir-ltr">08:30 → 15:00</span>
              </div>

              {/* Primary: المتاح الآن */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/10 border border-sky-500/30 text-center space-y-1">
                <span className="text-xs font-bold text-sky-200 block font-['Tajawal']">المتاح الآن</span>
                <span className="text-3xl font-black text-white font-mono tracking-tight block">
                  {workdayTimeStats.formattedRemaining}
                </span>
                <span className="text-[10px] text-slate-400 block font-['Tajawal']">
                  متبقي حتى نهاية يوم العمل بعد استبعاد الاستراحات
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-['Tajawal']">المتاح الصافي لليوم</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {workdayTimeStats.formattedAvailable}
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-['Tajawal']">إجمالي الدوام</span>
                  <span className="text-sm font-bold text-slate-300 font-mono">
                    6س 30د
                  </span>
                </div>
              </div>

              {/* Intervals breakdown */}
              <div className="space-y-1.5 text-[11px] text-slate-400 border-t border-white/10 pt-3">
                <div className="flex justify-between items-center">
                  <span>استراحات مجدولة وصلاة:</span>
                  <span className="font-mono text-amber-300">
                    -{workdayTimeStats.calculation.nonProductiveMinutes}د
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 font-['Tajawal']">
                  * الوقت المتاح هو تقدير إنتاجي مرن لتنظيم الطاقة وليس حصة إجبارية.
                </div>
              </div>
            </div>

            {/* Quick Projects Access */}
            <div className="liquid-glass-card rounded-3xl p-5 border border-white/10 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white font-['Tajawal']">
                    مشاريع العمل النشطة ({projects.filter((p) => p.status !== 'completed').length})
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/work/projects')}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold"
                >
                  عرض الكل &larr;
                </button>
              </div>

              <div className="space-y-2">
                {projects.filter((p) => p.status !== 'completed').slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedHubProject(p)}
                    className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 flex items-center justify-between text-right text-xs transition-all cursor-pointer group"
                  >
                    <span className="font-bold text-slate-200 group-hover:text-white truncate">
                      {p.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 font-mono">
                      Hub ⚡
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODALS & QUICK ACTIONS                                              */}
      {/* ==================================================================== */}

      {/* 1. Quick Interruption Modal */}
      {isInterruptOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md liquid-glass-card rounded-3xl border border-rose-500/30 shadow-2xl text-right max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden">
            {/* Header (Sticky / Non-scrolling) */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
              <span className="text-sm font-bold text-rose-300 flex items-center gap-1.5 font-['Tajawal']">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>تسجيل مقاطعة طارئة (Interruption)</span>
              </span>
              <button
                type="button"
                onClick={() => setIsInterruptOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleConfirmInterruption} id="interrupt-form" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 text-xs">
              <p className="text-[11px] text-slate-300 leading-relaxed font-['Tajawal'] bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                سيتم إيقاف المهمة الحالية مؤقتاً وبدء جلسة تركيز فورية على هذا الطارئ مع ربطهما معاً.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  عنوان المقاطعة / الطارئ <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={interruptTitle}
                  onChange={(e) => setInterruptTitle(e.target.value)}
                  placeholder="مثال: تصحيح خطأ فوري في السيرفر الإنتاجي..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  السبب أو المصدر (اختياري)
                </label>
                <input
                  type="text"
                  value={interruptReason}
                  onChange={(e) => setInterruptReason(e.target.value)}
                  placeholder="مثال: اتصال من المدير / رسالة سلاك عاجلة"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  جهة المقاطعة (اختياري)
                </label>
                <input
                  type="text"
                  value={interruptSource}
                  onChange={(e) => setInterruptSource(e.target.value)}
                  placeholder="مثال: Slack / مدير الفريق / العميل"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500/50"
                />
              </div>
            </form>

            {/* Footer (Sticky / Non-scrolling) */}
            <div className="flex items-center justify-end gap-2.5 p-4 sm:p-5 border-t border-white/10 bg-slate-950/50 shrink-0">
              <button
                type="button"
                onClick={() => setIsInterruptOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="submit"
                form="interrupt-form"
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
              >
                بدء المقاطعة فوراً ⚡
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* 2. Set Waiting Modal */}
      {waitingTaskId && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md liquid-glass-card rounded-3xl border border-amber-500/30 shadow-2xl text-right max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden">
            {/* Header (Sticky / Non-scrolling) */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
              <span className="text-sm font-bold text-amber-300 flex items-center gap-1.5 font-['Tajawal']">
                <Hourglass className="w-4 h-4 shrink-0" />
                <span>نقل المهمة إلى حالة الانتظار (Waiting)</span>
              </span>
              <button
                type="button"
                onClick={() => setWaitingTaskId(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleConfirmSetWaiting} id="waiting-form" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  في انتظار من؟ (Waiting On) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={waitingOn}
                  onChange={(e) => setWaitingOn(e.target.value)}
                  placeholder="مثال: فريق الباك إند / موافقة العميل..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  السبب أو الملاحظة
                </label>
                <textarea
                  rows={2}
                  value={waitingReason}
                  onChange={(e) => setWaitingReason(e.target.value)}
                  placeholder="مثال: في انتظار رفع الـ API الجديد..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  تاريخ المتابعة (Follow-up Date)
                </label>
                <input
                  type="date"
                  value={waitingFollowUp}
                  onChange={(e) => setWaitingFollowUp(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </form>

            {/* Footer (Sticky / Non-scrolling) */}
            <div className="flex items-center justify-end gap-2.5 p-4 sm:p-5 border-t border-white/10 bg-slate-950/50 shrink-0">
              <button
                type="button"
                onClick={() => setWaitingTaskId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="waiting-form"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                حفظ كمعلقة
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* 3. Quick Add Workday Task Modal */}
      {isQuickAddOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md liquid-glass-card rounded-3xl border border-white/15 shadow-2xl text-right max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden">
            {/* Header (Sticky / Non-scrolling) */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
              <span className="text-sm font-bold text-white font-['Tajawal'] flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-sky-400 shrink-0" />
                <span>إضافة مهمة جديدة لليوم</span>
              </span>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleCreateQuickTask} id="quick-add-task-form" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  عنوان المهمة <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="مثال: مراجعة كود الفرونت إند..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">الأولوية</label>
                  <select
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500/50"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية ⚡</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">الوقت المقدر (بالدقائق)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="مثال: 30"
                    value={quickEstMinutes}
                    onChange={(e) => setQuickEstMinutes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>

              {projects.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">ربط بمشروع (اختياري)</label>
                  <select
                    value={quickProjectId}
                    onChange={(e) => setQuickProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500/50"
                  >
                    <option value="">بدون مشروع (مهمة مستقلة)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </form>

            {/* Footer (Sticky / Non-scrolling) */}
            <div className="flex items-center justify-end gap-2.5 p-4 sm:p-5 border-t border-white/10 bg-slate-950/50 shrink-0">
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="quick-add-task-form"
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer"
              >
                إضافة المهمة
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* 4. Phase 2 Project Hub Modal (Reused directly) */}
      <ProjectHubModal
        isOpen={Boolean(selectedHubProject)}
        project={selectedHubProject}
        onClose={() => setSelectedHubProject(null)}
        onProjectUpdated={loadData}
        onStartFocusTask={(taskId) => {
          handleStartFocus(taskId);
        }}
      />
    </SpaceShell>
  );
};
