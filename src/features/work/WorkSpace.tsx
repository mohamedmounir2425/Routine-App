import React, { useState, useEffect } from 'react';
import { LifeTask } from '../../types/tasks';
import { getTasksBySpace, saveTask, toggleTaskCompletion, deleteTask } from '../../db/taskQueries';
import { sounds } from '../../utils/audio';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Check, 
  Trash2, 
  Sparkles, 
  CheckSquare, 
  Dumbbell,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WorkSpace: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Pomodoro timer state
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Load work tasks
  const loadTasks = async () => {
    const list = await getTasksBySpace('work');
    setTasks(list);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Timer interval
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
        setSecondsLeft(5 * 60); // 5 min break
        setCompletedSessions((c) => c + 1);
      } else {
        setIsBreak(false);
        setSecondsLeft(pomodoroMinutes * 60);
      }
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, secondsLeft, isBreak, pomodoroMinutes]);

  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setSecondsLeft((isBreak ? 5 : pomodoroMinutes) * 60);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const task: LifeTask = {
      id: `task_${Date.now()}`,
      spaceId: 'work',
      title: newTaskTitle.trim(),
      priority: 'high',
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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">💼</span>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
              مساحة العمل والإنتاجية
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            ركّز على أولوياتك، قسّم عملك لجلسات بومودورو عميقة، وتجنب إجهاد الجلوس
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-sky-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>{completedSessions} جلسات تركيز مكتملة</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Pomodoro + Desk Mobility Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Pomodoro Focus Timer Card */}
        <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 border border-sky-500/25 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between w-full mb-6">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              isBreak ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
            }`}>
              {isBreak ? '☕ استراحة وتمدد خفيف' : '🎯 جلسة تركيز عميق'}
            </span>

            <div className="flex items-center gap-1 text-xs text-slate-400">
              <button
                onClick={() => {
                  setPomodoroMinutes(25);
                  setSecondsLeft(25 * 60);
                  setIsTimerRunning(false);
                }}
                className={`px-2.5 py-1 rounded-lg ${pomodoroMinutes === 25 ? 'bg-sky-500/30 text-sky-200' : 'hover:bg-white/5'}`}
              >
                25 د
              </button>
              <button
                onClick={() => {
                  setPomodoroMinutes(50);
                  setSecondsLeft(50 * 60);
                  setIsTimerRunning(false);
                }}
                className={`px-2.5 py-1 rounded-lg ${pomodoroMinutes === 50 ? 'bg-sky-500/30 text-sky-200' : 'hover:bg-white/5'}`}
              >
                50 د
              </button>
            </div>
          </div>

          {/* Time Display */}
          <div className="my-4">
            <span className="text-6xl sm:text-7xl font-black text-white font-mono tracking-tight">
              {formatTime(secondsLeft)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleToggleTimer}
              className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                isTimerRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 shadow-sky-500/25 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isTimerRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>إيقاف مؤقت</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>ابدأ التركيز</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetTimer}
              className="p-3 rounded-2xl liquid-glass-pill text-slate-400 hover:text-white transition-all cursor-pointer"
              title="إعادة ضبط"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desk Ergonomics & Mini Rescue Integration */}
        <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-2xl">
                🧘‍♂️
              </div>
              <div>
                <h3 className="text-base font-black text-white font-['Tajawal']">استراحة مكتبية لفقرات الظهر</h3>
                <p className="text-xs text-slate-400">تجنب أضرار الجلوس المطول بتمدد 3 دقائق</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              الجلوس لأكثر من 45 دقيقة يزيد الضغط على الفقرات القطنية بنسبة 40%. قف الآن وقم بإطالة عضلات الصدر والجذع.
            </p>

            <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 space-y-1.5 mb-4">
              <div className="font-bold flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5" />
                <span>بروتوكول فك التشنج السريع:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-teal-200/90 space-y-1">
                <li>إرجاع الكتفين للخلف ودوران الصدر 10 مرات</li>
                <li>إطالة عضلات الفخذ الأمامية والخلفية أثناء الوقوف</li>
                <li>شرب كوب ماء والتنفس بعمق</li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => navigate('/health')}
            className="w-full py-2.5 px-4 rounded-xl liquid-glass-pill hover:border-teal-500/40 text-xs font-bold text-teal-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>الانتقال لتمارين العلاج الطبيعي</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
          </button>
        </div>
      </div>

      {/* Top 3 Tasks & Action Checklist */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 border border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-black text-white font-['Tajawal']">
              أهم أولويات العمل اليوم ({completedCount} / {tasks.length} منجزة)
            </h2>
          </div>
          <span className="text-xs text-slate-400">قاعدة أهم 3 مهام تركز طاقتك اليوم</span>
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="أضف مهمة رئيسية للعمل اليوم..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة</span>
          </button>
        </form>

        {/* Task List */}
        <div className="space-y-2.5 pt-2">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              لا توجد مهام عمل مسجلة لليوم. أضف أهم 3 مهام للبدء!
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                  task.isCompleted
                    ? 'bg-sky-950/20 border-sky-500/30 text-slate-400'
                    : 'bg-white/5 border-white/10 text-white hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                      task.isCompleted
                        ? 'bg-sky-500 border-sky-400 text-slate-950'
                        : 'border-white/20 hover:border-sky-400'
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
                  title="حذف المهمة"
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
