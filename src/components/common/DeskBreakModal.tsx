import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Sparkles } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const DeskBreakModal: React.FC<Props> = ({ isOpen, onClose, onComplete }) => {
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isActive, setIsActive] = useState(true);
  const [repCount, setRepCount] = useState(1); // 3 reps total

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(60);
      setRepCount(1);
      setIsActive(true);
      return;
    }

    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            sounds.playGoChime();
            return 0;
          }
          if (prev % 20 === 0 && prev > 0) {
            sounds.playCountdownTick();
            setRepCount(r => Math.min(3, r + 1));
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, isActive, secondsLeft]);

  if (!isOpen) return null;

  const handleFinish = () => {
    sounds.playGoChime();
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md liquid-glass-card rounded-3xl p-6 sm:p-7 shadow-2xl border-emerald-500/30 text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl liquid-glass-pill text-slate-400 hover:text-white transition-colors"
          title="إغلاق التنبيه"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-['Tajawal'] mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>وقفة العمل وتفريغ ضغط الغضاريف (60 ثانية)</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
          قف وافرد ظهرك دقيقة واحدة 🧍‍♂️
        </h3>

        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
          الجلوس المستمر يضاعف الضغط المائي على الديسك. قف الآن، وضع يديك خلف أسفل ظهرك ومِل للخلف بلطف.
        </p>

        {/* Visual Animation & Countdown Circle */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 rounded-full flex items-center justify-center bg-slate-950/60 border-2 border-emerald-500/30 shadow-inner">
            {/* SVG Circle Progress */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                className="stroke-slate-800 fill-none stroke-[6]"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                className="stroke-emerald-400 fill-none stroke-[6] transition-all duration-1000"
                strokeDasharray="351.85"
                strokeDashoffset={351.85 * (1 - secondsLeft / 60)}
                strokeLinecap="round"
              />
            </svg>

            <div className="text-center z-10">
              <div className="text-3xl font-black font-mono text-emerald-400">
                {secondsLeft}s
              </div>
              <div className="text-[10px] text-slate-400 font-semibold font-['Tajawal']">
                العدة {repCount} من 3
              </div>
            </div>
          </div>
        </div>

        {/* Guided Step Instruction */}
        <div className="liquid-glass-pill rounded-2xl p-3 text-right text-xs text-slate-300 space-y-1.5 mb-5 border-white/5">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <span>💡</span>
            <span>تمرين مد الظهر أثناء الوقوف (Standing Extension):</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed pr-5">
            1. ضع يديك على منطقة الحزام كدعامة لأسفل الظهر.
            <br />
            2. ارجع بجذعك للخلف بنعومة لثانية واحدة مع الزفير.
            <br />
            3. عد لوضع الاستقامة ببطء، وكرر 3 مرات لاستعادة التقوس الطبيعي.
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={handleFinish}
          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 liquid-button"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>تمت الوقفة بنجاح والعودة للعمل ✓</span>
        </button>
      </div>
    </div>
  );
};
