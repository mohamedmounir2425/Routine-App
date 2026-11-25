import React from 'react';

interface Props {
  slug?: string;
  category?: string;
  className?: string;
  thumbnail?: boolean;
  isPaused?: boolean;
}

export const ExerciseAnimation: React.FC<Props> = ({
  slug,
  className = '',
  thumbnail = false,
  isPaused = false,
}) => {
  const renderSvg = () => {
    switch (slug) {
      case 'cat-cow':
        return {
          cue: 'شهيق: إرخاء الظهر بتقوس لطيف | زفير: تقويس الظهر للأعلى بهدوء',
          svg: (
            <svg viewBox="0 0 220 125" className="w-full h-full overflow-visible" aria-label="رسم حركي لتمرين القطة والجمل">
              <line x1="20" y1="108" x2="200" y2="108" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
              {/* Support points */}
              <circle cx="60" cy="105" r="4.5" fill="#10b981" />
              <circle cx="155" cy="105" r="4.5" fill="#10b981" />
              {/* Arms & Thighs */}
              <line x1="60" y1="105" x2="64" y2="66" stroke="#94a3b8" strokeWidth="5.5" strokeLinecap="round" />
              <line x1="155" y1="105" x2="150" y2="66" stroke="#94a3b8" strokeWidth="5.5" strokeLinecap="round" />
              <line x1="155" y1="105" x2="180" y2="105" stroke="#64748b" strokeWidth="4.5" strokeLinecap="round" />
              {/* Animated Spine */}
              <path
                d="M 64 66 Q 107 42 150 66"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="6.5"
                strokeLinecap="round"
              >
                {!thumbnail && !isPaused && (
                  <animate
                    attributeName="d"
                    dur="4s"
                    repeatCount="indefinite"
                    values="M 64 66 Q 107 38 150 66; M 64 66 Q 107 84 150 66; M 64 66 Q 107 38 150 66"
                  />
                )}
              </path>
              {/* Head */}
              <circle cx="46" cy="58" r="9.5" fill="#38bdf8">
                {!thumbnail && !isPaused && (
                  <animate attributeName="cy" dur="4s" repeatCount="indefinite" values="66; 50; 66" />
                )}
              </circle>
            </svg>
          ),
        };

      case 'mcgill-curlup':
        return {
          cue: 'ارفع الرأس وأعلى الكتفين سنتيمترات بسيطة مع ثبات أسفل الظهر على اليدين',
          svg: (
            <svg viewBox="0 0 220 125" className="w-full h-full overflow-visible" aria-label="رسم حركي لتمرين ماكجيل للبطن">
              <line x1="15" y1="108" x2="205" y2="108" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
              {/* Hands under lumbar */}
              <rect x="86" y="101" width="18" height="5" rx="2.5" fill="#f59e0b" />
              {/* Straight leg & Bent knee leg (McGill signature position) */}
              <line x1="115" y1="102" x2="185" y2="103" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
              <path
                d="M 115 102 L 148 64 L 175 104"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Torso & subtle curl-up */}
              <path
                d="M 115 102 Q 85 101 56 86"
                fill="none"
                stroke="#10b981"
                strokeWidth="6.5"
                strokeLinecap="round"
              >
                {!thumbnail && !isPaused && (
                  <animate
                    attributeName="d"
                    dur="4s"
                    repeatCount="indefinite"
                    values="M 115 102 Q 85 102 52 98; M 115 102 Q 85 101 56 82; M 115 102 Q 85 101 56 82; M 115 102 Q 85 102 52 98"
                  />
                )}
              </path>
              {/* Head */}
              <circle cx="42" cy="78" r="9.5" fill="#38bdf8">
                {!thumbnail && !isPaused && (
                  <animate
                    attributeName="cy"
                    dur="4s"
                    repeatCount="indefinite"
                    values="92; 74; 74; 92"
                  />
                )}
              </circle>
            </svg>
          ),
        };

      case 'bird-dog':
        return {
          cue: 'مد الذراع والساق العكسية بمستوى الظهر فقط دون تقويس الفقرات القطنية',
          svg: (
            <svg viewBox="0 0 220 125" className="w-full h-full overflow-visible" aria-label="رسم حركي لتمرين الطائر والكلب">
              <line x1="15" y1="108" x2="205" y2="108" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
              <circle cx="80" cy="105" r="4.5" fill="#10b981" />
              <circle cx="132" cy="105" r="4.5" fill="#10b981" />
              <line x1="80" y1="105" x2="84" y2="66" stroke="#64748b" strokeWidth="5.5" strokeLinecap="round" />
              <line x1="132" y1="105" x2="128" y2="66" stroke="#64748b" strokeWidth="5.5" strokeLinecap="round" />
              {/* Neutral flat torso */}
              <line x1="82" y1="66" x2="130" y2="66" stroke="#38bdf8" strokeWidth="6.5" strokeLinecap="round" />
              <circle cx="67" cy="64" r="9" fill="#38bdf8" />
              {/* Extended Arm */}
              <line x1="84" y1="66" x2="32" y2="64" stroke="#10b981" strokeWidth="5.5" strokeLinecap="round">
                {!thumbnail && !isPaused && (
                  <>
                    <animate attributeName="x2" dur="3.5s" repeatCount="indefinite" values="76; 32; 32; 76" />
                    <animate attributeName="y2" dur="3.5s" repeatCount="indefinite" values="98; 64; 64; 98" />
                  </>
                )}
              </line>
              {/* Extended Leg */}
              <line x1="128" y1="66" x2="188" y2="64" stroke="#10b981" strokeWidth="5.5" strokeLinecap="round">
                {!thumbnail && !isPaused && (
                  <>
                    <animate attributeName="x2" dur="3.5s" repeatCount="indefinite" values="138; 188; 188; 138" />
                    <animate attributeName="y2" dur="3.5s" repeatCount="indefinite" values="98; 64; 64; 98" />
                  </>
                )}
              </line>
            </svg>
          ),
        };

      case 'side-plank-knees':
        return {
          cue: 'ارتكز على الساعد والركبتين وارفع الحوض في خط مستقيم مشدود',
          svg: (
            <svg viewBox="0 0 220 125" className="w-full h-full overflow-visible" aria-label="رسم حركي للبلانك الجانبي على الركبتين">
              <line x1="15" y1="108" x2="205" y2="108" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
              {/* Forearm & Knee anchors */}
              <line x1="52" y1="105" x2="72" y2="105" stroke="#10b981" strokeWidth="5" strokeLinecap="round" />
              <circle cx="158" cy="104" r="5" fill="#10b981" />
              {/* Supporting vertical upper arm */}
              <line x1="60" y1="105" x2="64" y2="68" stroke="#94a3b8" strokeWidth="5.5" strokeLinecap="round" />
              {/* Lower legs bent back */}
              <line x1="158" y1="104" x2="184" y2="96" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
              {/* Torso & Hip Bridge Line */}
              <path
                d="M 64 68 L 112 84 L 158 104"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {!thumbnail && !isPaused && (
                  <animate
                    attributeName="d"
                    dur="3.6s"
                    repeatCount="indefinite"
                    values="M 64 68 L 112 98 L 158 104; M 64 68 L 112 82 L 158 104; M 64 68 L 112 82 L 158 104; M 64 68 L 112 98 L 158 104"
                  />
                )}
              </path>
              {/* Head aligned with spine */}
              <circle cx="48" cy="61" r="9" fill="#38bdf8" />
            </svg>
          ),
        };

      case 'glute-bridge':
        return {
          cue: 'ادفع من الكعبين وارفع الحوض حتى يستقيم مع الركبتين والكتفين دون تقوس زائد',
          svg: (
            <svg viewBox="0 0 220 125" className="w-full h-full overflow-visible" aria-label="رسم حركي لتمرين الجسر">
              <line x1="15" y1="108" x2="205" y2="108" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
              <circle cx="44" cy="100" r="9" fill="#94a3b8" />
              <circle cx="64" cy="102" r="5" fill="#64748b" />
              <circle cx="164" cy="104" r="5" fill="#10b981" />
              <path
                d="M 64 102 L 114 66 L 146 56 L 164 104"
                fill="none"
                stroke="#10b981"
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {!thumbnail && !isPaused && (
                  <animate
                    attributeName="d"
                    dur="3.2s"
                    repeatCount="indefinite"
                    values="M 64 102 L 112 98 L 146 62 L 164 104; M 64 102 L 114 68 L 146 54 L 164 104; M 64 102 L 114 68 L 146 54 L 164 104; M 64 102 L 112 98 L 146 62 L 164 104"
                  />
                )}
              </path>
            </svg>
          ),
        };

      case 'dead-bug':
        return {
          cue: 'ألصق أسفل الظهر بالأرض تمامًا أثناء مد الذراع والساق المتعاكستين ببطء',
          svg: (
            <svg viewBox="0 0 220 125" className="w-full h-full overflow-visible" aria-label="رسم حركي لتمرين الحشرة الميتة">
              <line x1="15" y1="108" x2="205" y2="108" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
              {/* Head & Flat Spine pinned to floor */}
              <circle cx="52" cy="99" r="9" fill="#38bdf8" />
              <line x1="64" y1="102" x2="122" y2="102" stroke="#38bdf8" strokeWidth="6.5" strokeLinecap="round" />
              {/* Stationary bent knee (90 deg tabletop) & vertical arm */}
              <line x1="72" y1="100" x2="72" y2="56" stroke="#64748b" strokeWidth="4.5" strokeLinecap="round" />
              <path
                d="M 122 102 L 122 64 L 154 64"
                fill="none"
                stroke="#64748b"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Moving Contralateral Arm */}
              <line x1="72" y1="100" x2="28" y2="88" stroke="#10b981" strokeWidth="5" strokeLinecap="round">
                {!thumbnail && !isPaused && (
                  <>
                    <animate attributeName="x2" dur="3.5s" repeatCount="indefinite" values="72; 28; 72" />
                    <animate attributeName="y2" dur="3.5s" repeatCount="indefinite" values="56; 90; 56" />
                  </>
                )}
              </line>
              {/* Moving Contralateral Leg */}
              <path
                d="M 122 102 L 158 88 L 190 92"
                fill="none"
                stroke="#10b981"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {!thumbnail && !isPaused && (
                  <animate
                    attributeName="d"
                    dur="3.5s"
                    repeatCount="indefinite"
                    values="M 122 102 L 124 64 L 156 64; M 122 102 L 158 92 L 192 94; M 122 102 L 124 64 L 156 64"
                  />
                )}
              </path>
            </svg>
          ),
        };

      case 'standing-lumbar-extension':
        return {
          cue: 'ادعم أسفل الظهر بيديك ومل للخلف بلطف في حدود الراحة التامة',
          svg: (
            <svg viewBox="0 0 220 125" className="w-full h-full overflow-visible" aria-label="رسم حركي لمد الظهر واقفًا">
              <line x1="40" y1="112" x2="180" y2="112" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
              {/* Legs */}
              <line x1="110" y1="110" x2="110" y2="68" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
              {/* Hands supporting lower back */}
              <circle cx="104" cy="68" r="4.5" fill="#f59e0b" />
              {/* Extending Upper Torso */}
              <path
                d="M 110 68 Q 108 46 96 30"
                fill="none"
                stroke="#10b981"
                strokeWidth="6.5"
                strokeLinecap="round"
              >
                {!thumbnail && !isPaused && (
                  <animate
                    attributeName="d"
                    dur="3.5s"
                    repeatCount="indefinite"
                    values="M 110 68 Q 110 46 110 26; M 110 68 Q 105 46 92 30; M 110 68 Q 110 46 110 26"
                  />
                )}
              </path>
              <circle cx="92" cy="20" r="8.5" fill="#38bdf8">
                {!thumbnail && !isPaused && (
                  <animate attributeName="cx" dur="3.5s" repeatCount="indefinite" values="110; 88; 110" />
                )}
              </circle>
            </svg>
          ),
        };

      case 'wall-angels':
        return {
          cue: 'أسند ظهرك وذراعيك على الحائط وارفع الذراعين للأعلى وللأسفل ببطء',
          svg: (
            <svg viewBox="0 0 220 125" className="w-full h-full overflow-visible" aria-label="رسم حركي لانزلاق الحائط">
              {/* Wall backdrop */}
              <rect x="60" y="12" width="100" height="98" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="2" />
              {/* Head & Torso against wall */}
              <circle cx="110" cy="34" r="9" fill="#38bdf8" />
              <line x1="110" y1="45" x2="110" y2="85" stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />
              <line x1="102" y1="85" x2="100" y2="108" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
              <line x1="118" y1="85" x2="120" y2="108" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
              {/* Left & Right Arms sliding W to Y */}
              <path
                d="M 106 52 L 82 62 L 78 36"
                fill="none"
                stroke="#10b981"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {!thumbnail && !isPaused && (
                  <animate
                    attributeName="d"
                    dur="3.4s"
                    repeatCount="indefinite"
                    values="M 106 52 L 82 64 L 80 42; M 106 52 L 86 40 L 82 18; M 106 52 L 82 64 L 80 42"
                  />
                )}
              </path>
              <path
                d="M 114 52 L 138 62 L 142 36"
                fill="none"
                stroke="#10b981"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {!thumbnail && !isPaused && (
                  <animate
                    attributeName="d"
                    dur="3.4s"
                    repeatCount="indefinite"
                    values="M 114 52 L 138 64 L 140 42; M 114 52 L 134 40 L 138 18; M 114 52 L 138 64 L 140 42"
                  />
                )}
              </path>
            </svg>
          ),
        };

      case 'childs-pose':
        return {
          cue: 'تنفس بعمق وفك أي ضغط على فقرات أسفل الظهر',
          svg: (
            <svg viewBox="0 0 220 125" className="w-full h-full overflow-visible" aria-label="رسم حركي لوضعية الطفل">
              <line x1="20" y1="108" x2="200" y2="108" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
              <path d="M 150 104 L 135 90 L 164 104" fill="none" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
              <path d="M 135 90 Q 95 80 54 100" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
              <line x1="75" y1="88" x2="32" y2="104" stroke="#10b981" strokeWidth="5" strokeLinecap="round" />
              <circle cx="54" cy="98" r="8" fill="#38bdf8" />
            </svg>
          ),
        };

      default:
        return null;
    }
  };

  const match = renderSvg();

  if (thumbnail) {
    if (!match) {
      return (
        <div
          className={`flex h-full w-full items-center justify-center bg-slate-800/40 text-[10px] font-bold text-slate-400 ${className}`}
          title="لا يتوفر رسم حركي مخصص"
        >
          تمرين
        </div>
      );
    }
    return (
      <div className={`flex h-full w-full items-center justify-center p-1 ${className}`}>
        {match.svg}
      </div>
    );
  }

  if (!match) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
        <div className="mb-3 rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-xs font-bold text-slate-300">
          لا يتوفر رسم توضيحي مخصص لهذه الحركة
        </div>
        <p className="max-w-sm text-xs leading-relaxed text-slate-400">
          اضغط على «شرح الحركة» بالأسفل لقراءة خطوات الأداء الدقيقة والتحذيرات الخاصة بهذا التمرين.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-4 sm:p-6 ${className}`}>
      <div className="w-full max-w-[300px] h-40 sm:h-48 flex items-center justify-center">
        {match.svg}
      </div>
      <div className="mt-2 flex items-center gap-2 text-center text-xs font-medium text-emerald-300">
        <span className={`h-2 w-2 shrink-0 rounded-full bg-emerald-400 ${isPaused ? '' : 'animate-pulse'}`} />
        <span>{match.cue}</span>
      </div>
    </div>
  );
};
