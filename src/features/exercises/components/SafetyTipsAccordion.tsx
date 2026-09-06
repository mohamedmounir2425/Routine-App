import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { BACK_SAFETY_TIPS } from '../../../db/seedData';

export const SafetyTipsAccordion: React.FC = () => {
  const [showTips, setShowTips] = useState(false);

  return (
    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 shadow-lg">
      <button
        onClick={() => setShowTips(!showTips)}
        className="w-full flex items-center justify-between gap-3 text-right"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-['Tajawal']">
              7 إرشادات طبية ذهبية لحماية الظهر والديسك 🛡️
            </h3>
            <p className="text-[11px] text-slate-400">قواعد هامة قبل وأثناء ممارسة التمارين</p>
          </div>
        </div>
        <div className="text-slate-400 p-1 rounded-lg bg-slate-800">
          {showTips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {showTips && (
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
          {BACK_SAFETY_TIPS.map(tip => (
            <div key={tip.id} className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {tip.id}
              </span>
              <div>
                <h4 className="text-xs font-bold text-emerald-300">{tip.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
