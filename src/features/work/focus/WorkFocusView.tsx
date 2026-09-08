import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Dumbbell, ArrowRight, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LifeTask } from '../../../types';
import { getTasksBySpace } from '../../../db/taskQueries';
import { sounds } from '../../../utils/audio';
import { SpaceShell } from '../../../components/layout/SpaceShell';
import { recordCompletedFocusSession, getFocusStats } from './focusService';

export const WorkFocusView: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // Pomodoro timer state
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [stats, setStats] = useState(getFocusStats());

  useEffect(() => {
    getTasksBySpace('work').then((list) => {
      setTasks(list.filter((t) => !t.isCompleted));
    });
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
        // Record completed work session
        const activeTask = tasks.find((t) => t.id === selectedTaskId);
        recordCompletedFocusSession(pomodoroMinutes, selectedTaskId || undefined, activeTask?.title);
        setStats(getFocusStats());
      } else {
        setIsBreak(false);
        setSecondsLeft(pomodoroMinutes * 60);
      }
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, secondsLeft, isBreak, pomodoroMinutes, selectedTaskId, tasks]);

  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setSecondsLeft((isBreak ? 5 : pomodoroMinutes) * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <SpaceShell
      icon="💼"
      title="جلسات التركيز العميق (بومودورو)"
      subtitle="ركّز على مهمة واحدة، قسّم عملك لجلسات عميقة، وتجنب إجهاد الجلوس المستمر"
      badge={
        <div className="px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-sky-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>{stats.completedSessions} جلسات تركيز مكتملة</span>
        </div>
      }
    >
      <div className="space-y-6 pb-20">
        {/* Main Grid: Pomodoro + Desk Mobility Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Pomodoro Focus Timer Card */}
          <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 border border-sky-500/25 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Top preset switcher */}
            <div className="flex items-center justify-between w-full mb-5">
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
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${pomodoroMinutes === 25 ? 'bg-sky-500/30 text-sky-200 font-bold' : 'hover:bg-white/5'}`}
                >
                  25 د
                </button>
                <button
                  onClick={() => {
                    setPomodoroMinutes(50);
                    setSecondsLeft(50 * 60);
                    setIsTimerRunning(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${pomodoroMinutes === 50 ? 'bg-sky-500/30 text-sky-200 font-bold' : 'hover:bg-white/5'}`}
                >
                  50 د
                </button>
              </div>
            </div>

            {/* Task Focus Selection */}
            {!isBreak && tasks.length > 0 && (
              <div className="w-full mb-3 text-right">
                <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1 font-bold">
                  <CheckSquare className="w-3 h-3 text-sky-400" />
                  <span>المهمة الحالية للتركيز:</span>
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500/50 cursor-pointer"
                >
                  <option value="">(تركيز عام - بدون مهمة محددة)</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                الجلوس لأكثر من 45 دقيقة يزيد الضغط على الفقرات القطنية بنسبة 40%. قف الآن وقم بإطالة عضلات الصدر والجذع لتجديد نشاطك الذهني.
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
      </div>
    </SpaceShell>
  );
};
