import React from 'react';

interface Props {
  slug?: string;
  category: string;
  className?: string;
}

export const ExerciseAnimation: React.FC<Props> = ({ slug, category, className = '' }) => {
  // Render specific animated SVG depending on slug
  switch (slug) {
    case 'cat-cow':
      return (
        <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
          <svg viewBox="0 0 200 120" className="w-full max-w-[280px] h-40 overflow-visible">
            {/* Floor */}
            <line x1="20" y1="105" x2="180" y2="105" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
            
            {/* Dynamic Cat-Cow Spine & Body */}
            <g className="animate-pulse">
              {/* Hands & Knees support points */}
              <circle cx="50" cy="102" r="5" fill="#10b981" />
              <circle cx="150" cy="102" r="5" fill="#10b981" />

              {/* Arms */}
              <line x1="50" y1="102" x2="55" y2="65" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
              {/* Thighs */}
              <line x1="150" y1="102" x2="145" y2="65" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />

              {/* Spine Path with breathing animation */}
              <path
                d="M 55 65 Q 100 45 145 65"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="6"
                strokeLinecap="round"
              >
                <animate
                  attributeName="d"
                  dur="4s"
                  repeatCount="indefinite"
                  values="M 55 65 Q 100 40 145 65; M 55 65 Q 100 85 145 65; M 55 65 Q 100 40 145 65"
                />
              </path>

              {/* Head */}
              <circle cx="35" cy="55" r="10" fill="#38bdf8">
                <animate
                  attributeName="cy"
                  dur="4s"
                  repeatCount="indefinite"
                  values="48; 68; 48"
                />
              </circle>
            </g>
          </svg>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-1">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            شهيق: تقويس الظهر لأسفل | زفير: تقويس للأعلى برفق
          </div>
        </div>
      );

    case 'bird-dog':
      return (
        <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
          <svg viewBox="0 0 220 120" className="w-full max-w-[300px] h-40 overflow-visible">
            <line x1="20" y1="105" x2="200" y2="105" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
            
            {/* Left Arm & Right Leg extending */}
            <g>
              <circle cx="80" cy="102" r="5" fill="#10b981" />
              <circle cx="130" cy="102" r="5" fill="#10b981" />
              <line x1="80" y1="102" x2="85" y2="65" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
              <line x1="130" y1="102" x2="125" y2="65" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />

              {/* Torso */}
              <line x1="85" y1="65" x2="125" y2="65" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
              <circle cx="70" cy="65" r="9" fill="#38bdf8" />

              {/* Extended Arm */}
              <line x1="85" y1="65" x2="35" y2="65" stroke="#10b981" strokeWidth="5" strokeLinecap="round">
                <animate
                  attributeName="x2"
                  dur="3s"
                  repeatCount="indefinite"
                  values="35; 75; 35"
                />
                <animate
                  attributeName="y2"
                  dur="3s"
                  repeatCount="indefinite"
                  values="65; 95; 65"
                />
              </line>

              {/* Extended Leg */}
              <line x1="125" y1="65" x2="185" y2="65" stroke="#10b981" strokeWidth="5" strokeLinecap="round">
                <animate
                  attributeName="x2"
                  dur="3s"
                  repeatCount="indefinite"
                  values="185; 135; 185"
                />
                <animate
                  attributeName="y2"
                  dur="3s"
                  repeatCount="indefinite"
                  values="65; 95; 65"
                />
              </line>
            </g>
          </svg>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            استقامة الظهر التامة بدون أي ميلان في الحوض
          </div>
        </div>
      );

    case 'glute-bridge':
      return (
        <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
          <svg viewBox="0 0 200 120" className="w-full max-w-[280px] h-40 overflow-visible">
            <line x1="20" y1="105" x2="180" y2="105" stroke="#334155" strokeWidth="3" strokeLinecap="round" />

            {/* Head and Shoulders pinned to floor */}
            <circle cx="45" cy="98" r="9" fill="#94a3b8" />
            <circle cx="65" cy="100" r="5" fill="#64748b" />

            {/* Feet pinned */}
            <circle cx="155" cy="102" r="5" fill="#10b981" />

            {/* Dynamic Bridge */}
            <path
              d="M 65 100 L 115 60 L 155 102"
              fill="none"
              stroke="#10b981"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <animate
                attributeName="d"
                dur="3s"
                repeatCount="indefinite"
                values="M 65 100 L 115 60 L 155 102; M 65 100 L 115 95 L 155 102; M 65 100 L 115 60 L 155 102"
              />
            </path>
          </svg>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            الدفع من الكعبين وعصر عضلات الألوية في الأعلى
          </div>
        </div>
      );

    case 'childs-pose':
      return (
        <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
          <svg viewBox="0 0 200 120" className="w-full max-w-[280px] h-40 overflow-visible">
            <line x1="20" y1="105" x2="180" y2="105" stroke="#334155" strokeWidth="3" strokeLinecap="round" />

            {/* Folded legs */}
            <path d="M 150 102 L 135 90 L 160 102" fill="none" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />

            {/* Torso & Resting Head */}
            <path
              d="M 135 90 Q 95 80 50 100"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Stretched arms */}
            <line x1="75" y1="88" x2="30" y2="102" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
            <circle cx="50" cy="98" r="8" fill="#38bdf8" />
          </svg>
          <div className="flex items-center gap-2 text-xs text-sky-400 font-medium mt-1">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            تنفس بعمق وفك أي ضغط على فقرات أسفل الظهر
          </div>
        </div>
      );

    default:
      return (
        <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
            <span className="text-3xl">🧘‍♂️</span>
          </div>
          <p className="text-sm text-slate-300 font-medium">حركة {category === 'back' ? 'علاجية للظهر' : category === 'core' ? 'تثبيت الجذع' : 'مرونة وإطالة'}</p>
          <p className="text-xs text-slate-400 mt-1">اتبع إرشادات الحركة وتنفس بهدوء</p>
        </div>
      );
  }
};
