import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Play, 
  X, 
  ShieldCheck, 
  Layers, 
  Info 
} from 'lucide-react';
import { Exercise, PlanSession, Routine } from '../../types';
import { FOUR_WEEK_PLAN, FOUNDATION_LEVELS_PLAN, ALL_PLAN_ROUTINES } from '../../db/seedData';
import { db, getUserSettings, updateUserSettings, setActivePlanWeek } from '../../db';

interface Props {
  exercises: Exercise[];
  onStartRoutine: (routine: Routine) => void;
}

export const TrainingPlanView: React.FC<Props> = ({ exercises, onStartRoutine }) => {
  const [activeTab, setActiveTab] = useState<'4-weeks' | '3-levels'>('4-weeks');
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);
  const [selectedSession, setSelectedSession] = useState<PlanSession | null>(null);
  const [completedSessions, setCompletedSessions] = useState<string[]>([]);
  const [activeWeekNumber, setActiveWeekNumber] = useState<number>(1);
  const [activeLevelNumber, setActiveLevelNumber] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    loadSettingsAndLogs();
  }, [selectedWeekNum]);

  const loadSettingsAndLogs = async () => {
    const settings = await getUserSettings();
    setActiveWeekNumber(settings.currentWeekNumber || 1);
    setActiveLevelNumber(settings.currentLevelNumber || 1);
    if (!selectedWeekNum) {
      setSelectedWeekNum(settings.currentWeekNumber || 1);
    }

    const logs = await db.workoutLogs.toArray();
    const completedRoutineIds = logs.map(l => l.routineId).filter(Boolean);
    setCompletedSessions(completedRoutineIds);
  };

  const currentWeek = FOUR_WEEK_PLAN.find(w => w.weekNumber === selectedWeekNum) || FOUR_WEEK_PLAN[0];

  const handleSetCurrentWeek = async (weekNum: number) => {
    setSelectedWeekNum(weekNum);
    setActiveWeekNumber(weekNum);
    await setActivePlanWeek(weekNum);
  };

  const handleLaunchSession = (session: PlanSession) => {
    const routine = ALL_PLAN_ROUTINES.find(r => r.id === session.routineId);
    if (routine) {
      setSelectedSession(null);
      onStartRoutine(routine);
    }
  };

  const getExerciseById = (id: string): Exercise | undefined => {
    return exercises.find(e => e.id === id);
  };

  // Calculate completed sessions in the selected week
  const weekCompletedCount = currentWeek.sessions.filter((s: PlanSession) => completedSessions.includes(s.routineId)).length;
  const overallCompletedCount = ALL_PLAN_ROUTINES.filter(r => completedSessions.includes(r.id)).length;

  // Day order starting Saturday
  const weekDays = [
    { dayNum: 6, dayNameAr: 'السبت', sessionCode: 'A' as const },
    { dayNum: 0, dayNameAr: 'الأحد', isRest: true, reason: 'راحة سلبية أو مشي خفيف (15–20 دقيقة) لتروية الأنسجة' },
    { dayNum: 1, dayNameAr: 'الاثنين', sessionCode: 'B' as const },
    { dayNum: 2, dayNameAr: 'الثلاثاء', isRest: true, reason: 'راحة واستشفاء للغضاريف وإعادة امتصاص السوائل' },
    { dayNum: 3, dayNameAr: 'الأربعاء', sessionCode: 'C' as const },
    { dayNum: 4, dayNameAr: 'الخميس', sessionCode: 'D' as const },
    { dayNum: 5, dayNameAr: 'الجمعة', isRest: true, reason: 'راحة تامة واستشفاء أسبوعي كامل' },
  ];

  const todayDay = new Date().getDay();

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>البرنامج العلاجي الطبي المتكامل</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight">
            خطة التمارين وحماية الظهر 🏋️
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            مصممة وفق جدول 4 أيام تمرين + 3 أيام راحة أسبوعياً لتقوية الحزام العضلي دون إجهاد.
          </p>
        </div>

        {/* Dual Mode Switcher (4-Week Schedule vs 3 Foundation Levels) */}
        <div className="flex items-center p-1.5 liquid-glass-pill rounded-2xl shrink-0 self-start sm:self-auto border-white/10">
          <button
            onClick={() => setActiveTab('4-weeks')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === '4-weeks'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>جدول الـ 4 أسابيع</span>
          </button>

          <button
            onClick={() => setActiveTab('3-levels')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === '3-levels'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>المستويات الـ 3</span>
          </button>
        </div>
      </div>

      {activeTab === '4-weeks' ? (
        /* ================= 4-WEEKS STRUCTURED PLAN VIEW ================= */
        <div className="space-y-6">
          {/* Progress Overview Card */}
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-400 font-semibold mb-1">التقدم الكلي في الخطة العلاجية</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {overallCompletedCount} <span className="text-base text-slate-400 font-normal">من 16 جلسة</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                    {Math.round((overallCompletedCount / 16) * 100)}% مكتمل
                  </span>
                </div>
              </div>

              {/* Week progress bar */}
              <div className="w-full sm:w-64 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>إنجاز الأسبوع {selectedWeekNum}:</span>
                  <span className="font-bold text-emerald-400 font-mono">{weekCompletedCount} / 4 جلسات</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950/70 rounded-full overflow-hidden border border-white/10">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                    style={{ width: `${(weekCompletedCount / 4) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Week Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-white/10">
              {FOUR_WEEK_PLAN.map(week => {
                const isSelected = week.weekNumber === selectedWeekNum;
                const isCurrentActive = week.weekNumber === activeWeekNumber;
                const weekCompleted = week.sessions.filter((s: PlanSession) => completedSessions.includes(s.routineId)).length;

                return (
                  <button
                    key={week.weekNumber}
                    onClick={() => handleSetCurrentWeek(week.weekNumber)}
                    className={`p-3 sm:p-4 rounded-2xl text-right transition-all border ${
                      isSelected
                        ? 'liquid-glass border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : 'liquid-glass-pill border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={`text-xs font-black font-['Tajawal'] ${isSelected ? 'text-emerald-400' : 'text-slate-300'}`}>
                        الأسبوع {week.weekNumber}
                      </span>
                      {isCurrentActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          الحالي
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {weekCompleted === 4 ? 'تم إنجازه بالكامل ✓' : `${weekCompleted} من 4 جلسات`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Week Focus Banner */}
          <div className="p-4 sm:p-5 rounded-2xl liquid-glass-pill flex items-start gap-3 border-emerald-500/20">
            <span className="text-xl shrink-0 mt-0.5">🎯</span>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white font-['Tajawal']">
                {currentWeek.title}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {currentWeek.description}
              </p>
            </div>
          </div>

          {/* 7-Day Schedule Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white font-['Tajawal'] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>جدول أيام الأسبوع {selectedWeekNum} (4 جلسات + 3 أيام تعافي)</span>
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {weekDays.map(day => {
                const isToday = todayDay === day.dayNum;
                
                if (day.isRest) {
                  /* REST DAY CARD */
                  return (
                    <div
                      key={day.dayNum}
                      className={`rounded-2xl p-4 transition-all border flex items-center justify-between gap-3 ${
                        isToday
                          ? 'liquid-glass border-teal-500/40 shadow-md'
                          : 'liquid-glass-pill border-transparent opacity-85 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-lg shrink-0">
                          🌿
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white font-['Tajawal']">
                              {day.dayNameAr}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 font-bold">
                              يوم راحة وتعافي
                            </span>
                            {isToday && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                                اليوم
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {day.reason}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs text-slate-500 hidden sm:inline-block font-medium">
                        استشفاء الأنسجة
                      </span>
                    </div>
                  );
                }

                /* WORKOUT SESSION CARD (A, B, C, D) */
                const session = currentWeek.sessions.find((s: PlanSession) => s.sessionCode === day.sessionCode)!;
                const isCompleted = completedSessions.includes(session.routineId);

                return (
                  <div
                    key={day.dayNum}
                    className={`rounded-2xl p-4 sm:p-5 transition-all border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isToday
                        ? 'liquid-glass-card border-emerald-500/50 shadow-xl shadow-emerald-500/10'
                        : isCompleted
                        ? 'liquid-glass-card border-emerald-500/25'
                        : 'liquid-glass-card border-white/5 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex flex-col items-center justify-center font-bold font-mono shrink-0 shadow-sm ${
                        isCompleted
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : isToday
                          ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-emerald-500/20'
                          : 'liquid-glass-pill text-emerald-400 border border-emerald-500/30'
                      }`}>
                        <span className="text-xs">جلسة</span>
                        <span className="text-sm font-black">{session.sessionCode}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-400 font-['Tajawal']">
                            {day.dayNameAr}
                          </span>
                          <span className="text-sm font-black text-white font-['Tajawal']">
                            {session.title}
                          </span>
                          {isCompleted ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>تمت بنجاح</span>
                            </span>
                          ) : isToday ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black animate-pulse">
                              تمرين اليوم ▶
                            </span>
                          ) : null}
                        </div>

                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {session.description}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{session.estimatedMinutes} دقيقة</span>
                          </span>
                          <span>•</span>
                          <span>{session.prescriptions.length} تمارين أساسية</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="px-3.5 py-2 rounded-xl liquid-glass-pill text-xs font-bold text-slate-300 hover:text-white transition-colors"
                      >
                        عرض التمارين
                      </button>

                      <button
                        onClick={() => handleLaunchSession(session)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 liquid-button"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>{isCompleted ? 'إعادة الجلسة' : 'بدء الجلسة'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ================= 3 FOUNDATION LEVELS PLAN VIEW ================= */
        <div className="space-y-6">
          {/* Medical Guidance Banner */}
          <div className="p-4 sm:p-5 rounded-2xl liquid-glass-pill border-emerald-500/30 text-right space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Info className="w-4 h-4 shrink-0" />
              <span>قاعدة الانتقال بين المستويات الثلاثة:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>قاعدة الـ 3 إلى 4 أسابيع:</strong> لا تنتقل من مستوى إلى المستوى الأعلى إلا بعد قضاء 3-4 أسابيع كاملة في مستواك الحالي بدون أي زيادة في الألم أو إشعاع عصبي (تنميل/وخز). التدرج يكون بزيادة <strong>زمن الثبات والتحكم</strong> وليس بزيادة السرعة.
            </p>
          </div>

          {/* Level Cards */}
          <div className="space-y-4">
            {FOUNDATION_LEVELS_PLAN.map(level => {
              const isActive = level.levelNumber === activeLevelNumber;

              return (
                <div
                  key={level.levelNumber}
                  className={`rounded-3xl p-5 sm:p-7 transition-all border ${
                    isActive
                      ? 'liquid-glass-card border-emerald-500/50 shadow-2xl'
                      : 'liquid-glass-card border-white/5'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          {level.subtitle}
                        </span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full liquid-glass-pill text-slate-300 font-medium">
                          {level.durationWeeks}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white font-['Tajawal'] mt-1">
                        {level.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        الهدف: {level.goal}
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        setActiveLevelNumber(level.levelNumber);
                        await updateUserSettings({ currentLevelNumber: level.levelNumber });
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 self-start sm:self-auto ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                          : 'liquid-glass-pill text-slate-300 hover:text-white'
                      }`}
                    >
                      {isActive ? 'المستوى الحالي المحدد ✓' : 'تحديد كمستواي الحالي'}
                    </button>
                  </div>

                  {/* Level Sections & Exercises */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                    {level.sections.map((section: any, sIdx: number) => (
                      <div key={sIdx} className="liquid-glass-pill rounded-2xl p-4 space-y-2 border-white/5">
                        <h4 className="text-xs font-bold text-emerald-400 font-['Tajawal']">
                          {section.title}
                        </h4>
                        <div className="space-y-2">
                          {section.exercises.map((ex: any, eIdx: number) => (
                            <div key={eIdx} className="flex items-start justify-between gap-2 text-xs">
                              <span className="font-medium text-slate-200">
                                • {ex.arabicName}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono shrink-0">
                                {ex.sets} مجموعات × {ex.reps ? `${ex.reps} عدات` : `${ex.durationSeconds || ex.holdSeconds}ث`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Level Rules */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-start gap-2 text-[11px] text-slate-400">
                    <span className="text-amber-400 font-bold shrink-0">⚠️ إرشاد:</span>
                    <span>{level.rules[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SESSION DETAILS MODAL ================= */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl liquid-glass rounded-3xl p-5 sm:p-7 shadow-2xl border-emerald-500/30 max-h-[92vh] overflow-y-auto custom-scrollbar">
            {/* Close Button */}
            <button
              onClick={() => setSelectedSession(null)}
              className="absolute top-4 left-4 p-2 rounded-xl liquid-glass-pill text-slate-400 hover:text-white transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-right pr-2 mb-5">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-['Tajawal']">
                الأسبوع {selectedWeekNum} • الجلسة {selectedSession.sessionCode}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] mt-1">
                {selectedSession.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {selectedSession.description}
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-300">
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <Clock className="w-4 h-4" />
                  <span>المدة المقدرة: {selectedSession.estimatedMinutes} دقيقة</span>
                </span>
                <span>•</span>
                <span>{selectedSession.prescriptions.length} تمارين أساسية</span>
              </div>
            </div>

            {/* Exercises Prescriptions List */}
            <div className="space-y-3 my-4">
              <h4 className="text-xs font-bold text-slate-300 font-['Tajawal']">
                التمارين والتكرارات الموصوفة في هذه الجلسة:
              </h4>

              {selectedSession.prescriptions.map((presc, idx) => {
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

            {/* Doctor Note */}
            <div className="liquid-glass-pill rounded-2xl p-3 text-right text-xs text-slate-400 space-y-1 mb-6 border-white/5">
              <span className="text-amber-400 font-bold">⚠️ تنبيه أمان:</span>
              <p className="text-[11px] leading-relaxed">
                توقف فوراً عند الشعور بأي ألم حاد أو امتداد للألم أو تنميل للساق. خذ 45–60 ثانية راحة بين المجموعات للتنفس والاسترخاء.
              </p>
            </div>

            {/* Launch Workout Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleLaunchSession(selectedSession)}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm sm:text-base hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 liquid-button"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>ابدأ هذه الجلسة الآن ▶</span>
              </button>

              <button
                onClick={() => setSelectedSession(null)}
                className="px-5 py-3.5 rounded-2xl liquid-glass-pill text-slate-300 hover:text-white text-xs font-bold transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
