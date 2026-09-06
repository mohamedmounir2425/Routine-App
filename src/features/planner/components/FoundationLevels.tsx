import React from 'react';
import { Info } from 'lucide-react';
import { PlanLevel } from '../../../types';

interface FoundationLevelsProps {
  levels: PlanLevel[];
  activeLevelNumber: 1 | 2 | 3;
  onSelectLevel: (levelNum: 1 | 2 | 3) => void;
}

export const FoundationLevels: React.FC<FoundationLevelsProps> = ({
  levels,
  activeLevelNumber,
  onSelectLevel,
}) => {
  return (
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
        {levels.map(level => {
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
                  onClick={() => onSelectLevel(level.levelNumber)}
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
                {level.sections.map((section, sIdx) => (
                  <div key={sIdx} className="liquid-glass-pill rounded-2xl p-4 space-y-2 border-white/5">
                    <h4 className="text-xs font-bold text-emerald-400 font-['Tajawal']">
                      {section.title}
                    </h4>
                    <div className="space-y-2">
                      {section.exercises.map((ex, eIdx) => (
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
  );
};
