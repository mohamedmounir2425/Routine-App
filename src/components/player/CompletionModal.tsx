import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, CheckCircle2, HeartHandshake, Smile, Meh, Frown } from 'lucide-react';
import { Routine, WorkoutLog } from '../../types';
import { sounds } from '../../utils/audio';

interface Props {
  routine: Routine;
  durationSeconds: number;
  exercisesCompletedCount: number;
  onSaveAndClose: (logData: Omit<WorkoutLog, 'id'>) => void;
}

export const CompletionModal: React.FC<Props> = ({
  routine,
  durationSeconds,
  exercisesCompletedCount,
  onSaveAndClose,
}) => {
  const [prePain, setPrePain] = useState<number>(3);
  const [postPain, setPostPain] = useState<number>(1);
  const [difficultyRating, setDifficultyRating] = useState<'easy' | 'moderate' | 'challenging' | 'hard'>('moderate');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    // Sound fanfare
    sounds.playVictoryFanfare();

    // Trigger double confetti blast
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#38bdf8', '#fbbf24', '#f43f5e']
    });

    const timer = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#34d399']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#38bdf8', '#818cf8']
      });
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const durationMin = Math.max(1, Math.round(durationSeconds / 60));

  const getPainFeedback = (level: number) => {
    if (level === 0) return { text: 'بدون ألم تماماً وراحة ممتازة', color: 'text-emerald-400', icon: Smile };
    if (level <= 3) return { text: 'ألم خفيف جداً ومحتمل', color: 'text-teal-400', icon: Smile };
    if (level <= 6) return { text: 'ألم متوسط / إجهاد عضلي', color: 'text-amber-400', icon: Meh };
    return { text: 'ألم شديد (احرص على الراحة واستشارة الطبيب)', color: 'text-rose-400', icon: Frown };
  };

  const currentFeedback = getPainFeedback(postPain);
  const FeedbackIcon = currentFeedback.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAndClose({
      routineId: routine.id,
      routineName: routine.name,
      completedAt: new Date().toISOString(),
      durationMinutes: durationMin,
      exercisesCompleted: exercisesCompletedCount,
      totalExercises: routine.exerciseIds.length,
      weekNumber: routine.weekNumber,
      sessionCode: routine.sessionCode,
      prePainScore: prePain,
      postPainScore: postPain,
      difficultyRating,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/10 text-center animate-in fade-in zoom-in duration-300">
        {/* Trophy icon */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4 transform hover:scale-105 transition-transform">
          <Trophy className="w-10 h-10 text-slate-950 stroke-[2.2]" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight">
          أحسنت يا بطل! أنجزت تمرينك 🎉
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          خطوة جديدة نحو ظهر أقوى وجسم خفيف ومرن. الالتزام اليومي يصنع الفارق!
        </p>

        {/* Quick summary cards */}
        <div className="grid grid-cols-2 gap-3 my-6">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">مدة التمرين</div>
              <div className="text-lg font-bold text-white">{durationMin} دقيقة</div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">التمارين المكتملة</div>
              <div className="text-lg font-bold text-white">{exercisesCompletedCount} من {routine.exerciseIds.length}</div>
            </div>
          </div>
        </div>

        {/* Pain / Comfort tracker */}
        <form onSubmit={handleSubmit} className="text-right space-y-5">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                كيف تشعر بظهرك بعد التمرين؟
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 ${currentFeedback.color} flex items-center gap-1`}>
                <FeedbackIcon className="w-3.5 h-3.5" />
                {postPain} من 10
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="10"
              value={postPain}
              onChange={(e) => setPostPain(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 my-2"
            />

            <div className="flex justify-between text-[11px] text-slate-500 px-1">
              <span>0 (راحة تامة 😊)</span>
              <span>5 (متوسط)</span>
              <span>10 (ألم شديد 😣)</span>
            </div>

            <p className={`text-xs mt-2 font-medium ${currentFeedback.color}`}>
              {currentFeedback.text}
            </p>
          </div>

          {/* Difficulty & Feeling Selection */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-right">
            <label className="block text-xs font-bold text-slate-300 mb-2">
              كيف كان مستوى التمرين اليوم؟
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'easy', label: 'سهل', emoji: '😊' },
                { id: 'moderate', label: 'مناسب', emoji: '🙂' },
                { id: 'challenging', label: 'تحدي', emoji: '😐' },
                { id: 'hard', label: 'صعب', emoji: '😣' },
              ].map(item => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setDifficultyRating(item.id as any)}
                  className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    difficultyRating === item.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-[11px] font-bold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pre pain assessment toggle / optional */}
          <div className="text-xs text-slate-400 flex items-center justify-between px-1">
            <span>مستوى الألم قبل التمرين:</span>
            <div className="flex gap-1">
              {[0, 2, 4, 6, 8].map((score) => (
                <button
                  type="button"
                  key={score}
                  onClick={() => setPrePain(score)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                    prePain === score
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          {/* Optional notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              ملاحظاتك الشخصية (اختياري):
            </label>
            <input
              type="text"
              placeholder="مثال: شعرت براحة أكبر في فقرات أسفل الظهر..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transform active:scale-98 transition-all"
          >
            حفظ الإنجاز وتثبيت الـ Streak 🔥
          </button>
        </form>
      </div>
    </div>
  );
};
