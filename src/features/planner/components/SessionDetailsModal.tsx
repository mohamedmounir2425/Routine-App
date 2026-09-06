import React from 'react';
import { X, Clock, Play } from 'lucide-react';
import { PlanSession, Exercise } from '../../../types';

interface SessionDetailsModalProps {
  session: PlanSession | null;
  selectedWeekNum: number;
  exercises: Exercise[];
  onClose: () => void;
  onLaunch: (session: PlanSession) => void;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  session,
  selectedWeekNum,
  exercises,
  onClose,
  onLaunch,
}) => {
  if (!session) return null;

  const getExerciseById = (id: string): Exercise | undefined => {
    return exercises.find(e => e.id === id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl liquid-glass rounded-3xl p-5 sm:p-7 shadow-2xl border-emerald-500/30 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl liquid-glass-pill text-slate-400 hover:text-white transition-colors"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-right pr-2 mb-5">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-['Tajawal']">
            الأسبوع {selectedWeekNum} • الجلسة {session.sessionCode}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] mt-1">
            {session.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {session.description}
          </p>
          <div className="flex items-center gap-3 mt-3 text-xs text-slate-300">
            <span className="flex items-center gap-1 font-bold text-emerald-400">
              <Clock className="w-4 h-4" />
              <span>المدة المقدرة: {session.estimatedMinutes} دقيقة</span>
            </span>
            <span>•</span>
            <span>{session.prescriptions.length} تمارين أساسية</span>
          </div>
        </div>

        {/* Exercises Prescriptions List */}
        <div className="space-y-3 my-4">
          <h4 className="text-xs font-bold text-slate-300 font-['Tajawal']">
            التمارين والتكرارات الموصوفة في هذه الجلسة:
          </h4>

          {session.prescriptions.map((presc, idx) => {
            const ex = getExerciseById(presc.exerciseId);

            return (
              <div 
                key={idx}
                className="liquid-glass-card rounded-2xl p-3.5 sm:p-4 text-right border-white/10 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white font-['Tajawal']">
                        {ex?.arabicName || presc.exerciseId}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {ex?.name}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full liquid-glass-pill text-emerald-400 font-mono shrink-0">
                    {presc.sets} مجموعات {presc.reps ? `× ${presc.reps} عدات` : ''} {presc.holdSeconds ? `(ثبات ${presc.holdSeconds}ث)` : ''} {presc.durationSeconds ? `(ثبات ${presc.durationSeconds}ث)` : ''}
                  </span>
                </div>

                {presc.notes && (
                  <div className="text-[11px] text-slate-300 bg-white/5 rounded-xl p-2 font-medium">
                    💡 {presc.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Doctor Safety Note */}
        <div className="liquid-glass-pill rounded-2xl p-3 text-right text-xs text-slate-400 space-y-1 mb-6 border-white/5">
          <span className="text-amber-400 font-bold">⚠️ تنبيه أمان:</span>
          <p className="text-[11px] leading-relaxed">
            توقف فوراً عند الشعور بأي ألم حاد أو امتداد للألم أو تنميل للساق. خذ 45–60 ثانية راحة بين المجموعات للتنفس والاسترخاء.
          </p>
        </div>

        {/* Launch Workout Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onLaunch(session)}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm sm:text-base hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 liquid-button"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>ابدأ هذه الجلسة الآن ▶</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3.5 rounded-2xl liquid-glass-pill text-slate-300 hover:text-white text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
