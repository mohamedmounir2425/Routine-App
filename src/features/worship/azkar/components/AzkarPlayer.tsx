import React, { useState, useRef } from 'react';
import { Dhikr, AzkarCategoryKey } from '../../types';
import { sounds } from '../../../../utils/audio';
import confetti from 'canvas-confetti';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Sparkles, 
  Check, 
  Volume2, 
  VolumeX, 
  Copy
} from 'lucide-react';

interface Props {
  dhikrList: Dhikr[];
  title: string;
  categoryKey: AzkarCategoryKey;
  onClose: () => void;
  onComplete: (durationSeconds: number) => void;
}

export const AzkarPlayer: React.FC<Props> = ({
  dhikrList,
  title,
  onClose,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCount, setCurrentCount] = useState(0);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState<number>(1); // 0.85, 1, 1.2
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [copied, setCopied] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  const currentDhikr = dhikrList[currentIndex] || dhikrList[0];
  const totalDhikrs = dhikrList.length;
  const targetCount = currentDhikr?.count || 1;
  const remainingInCurrent = Math.max(0, targetCount - currentCount);
  const overallProgressPercent = Math.round(((currentIndex + (currentCount / targetCount)) / totalDhikrs) * 100);

  // Trigger tap count
  const handleCountTap = () => {
    if (isFinished || !currentDhikr) return;

    // Haptic vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(35);
    }

    const nextCount = currentCount + 1;

    if (nextCount >= targetCount) {
      // Completed this dhikr
      if (soundEnabled) {
        sounds.playGoChime();
      }
      if ('vibrate' in navigator) {
        navigator.vibrate([40, 40, 70]);
      }

      // Check if this was the last dhikr
      if (currentIndex >= totalDhikrs - 1) {
        // Complete the entire session!
        const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        setIsFinished(true);

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore if canvas not supported
        }

        onComplete(durationSec);
      } else {
        // Auto-advance to next dhikr
        setCurrentIndex((prev) => prev + 1);
        setCurrentCount(0);
      }
    } else {
      if (soundEnabled) {
        sounds.playCountdownTick();
      }
      setCurrentCount(nextCount);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setCurrentCount(0);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < totalDhikrs - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentCount(0);
    }
  };

  const handleResetCurrent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentCount(0);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentDhikr) {
      navigator.clipboard.writeText(currentDhikr.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleFontSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFontSizeMultiplier((prev) => (prev === 1 ? 1.2 : prev === 1.2 ? 0.9 : 1));
  };

  if (!currentDhikr) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#070b14]/95 backdrop-blur-2xl text-slate-100 font-['Tajawal'] select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Ambient Orbs */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-500/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl liquid-glass-pill text-slate-400 hover:text-white transition-colors"
            title="إغلاق والعودة"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{title}</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              الذكر {currentIndex + 1} من {totalDhikrs}
            </p>
          </div>
        </div>

        {/* Right Tools (Sound, Font size, Copy) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggleFontSize}
            className="px-2.5 py-1.5 rounded-xl liquid-glass-pill text-xs text-slate-300 hover:text-white transition-all font-bold"
            title="تغيير حجم الخط"
          >
            A{fontSizeMultiplier > 1 ? '+' : fontSizeMultiplier < 1 ? '-' : ''}
          </button>

          <button
            onClick={handleCopy}
            className="p-2 rounded-xl liquid-glass-pill text-slate-300 hover:text-white transition-all"
            title="نسخ الذكر"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl liquid-glass-pill text-slate-300 hover:text-white transition-all"
            title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </header>

      {/* Overall Progress Line */}
      <div className="w-full bg-slate-900/60 h-1.5 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300"
          style={{ width: `${overallProgressPercent}%` }}
        />
      </div>

      {/* Main Reading Area — scrollable ONLY, no counter tap here */}
      <main
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 flex flex-col items-center justify-start cursor-default relative z-10 no-scrollbar"
      >
        <div className="max-w-2xl w-full mx-auto text-center space-y-5">
          {/* Subtitle / Category badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full liquid-glass-pill text-xs text-emerald-300 border border-emerald-500/25">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentDhikr.categoryArabic}</span>
          </div>

          {/* Dhikr Paragraphs */}
          <div className="py-2 px-2">
            {currentDhikr.paragraphs.map((para, i) => (
              <p
                key={i}
                className="dhikr-text text-white text-center leading-[2.3] mb-4 last:mb-0 transition-all duration-200"
                style={{
                  fontSize: fontSizeMultiplier === 1.2 ? '1.55rem' : fontSizeMultiplier === 0.9 ? '1.15rem' : '1.35rem',
                }}
              >
                {para}
              </p>
            ))}
          </div>

          {/* Description & Reference */}
          {currentDhikr.description && (
            <div className="p-3 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm text-emerald-300 max-w-lg mx-auto leading-relaxed">
              <span className="font-bold">الفضل: </span>
              <span>{currentDhikr.description}</span>
            </div>
          )}

          {currentDhikr.reference && (
            <p className="text-xs text-slate-500">
              {currentDhikr.reference}
            </p>
          )}
        </div>
      </main>

      {/* Bottom Counter Dock — safe-area aware */}
      <footer className="relative z-20 px-4 sm:px-6 pt-4 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          {/* Previous Dhikr Button */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-3 rounded-2xl liquid-glass-pill text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="الذكر السابق"
          >
            <ChevronRight className="w-5 h-5 rtl:scale-x-100" />
          </button>

          {/* Giant Center Counter Button */}
          <button
            onClick={handleCountTap}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer liquid-button"
          >
            <div className="text-right">
              <div className="text-lg font-black tracking-tight">
                {currentCount} / {targetCount}
              </div>
              <div className="text-[10px] text-slate-900 font-bold">
                {remainingInCurrent > 0 ? `متبقي ${remainingInCurrent} - اضغط للعد` : 'اكتمل الذكر'}
              </div>
            </div>

            {/* Visual Dots for repetition if target <= 10 */}
            {targetCount > 1 && targetCount <= 10 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: targetCount }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i < currentCount ? 'bg-slate-950 scale-110' : 'bg-slate-950/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </button>

          {/* Reset Current Count Button */}
          <button
            onClick={handleResetCurrent}
            className="p-3 rounded-2xl liquid-glass-pill text-slate-300 hover:text-white transition-all cursor-pointer"
            title="إعادة ضبط عداد الذكر الحالي"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Next Dhikr Button */}
          <button
            onClick={handleNext}
            disabled={currentIndex === totalDhikrs - 1}
            className="p-3 rounded-2xl liquid-glass-pill text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="الذكر التالي"
          >
            <ChevronLeft className="w-5 h-5 rtl:scale-x-100" />
          </button>
        </div>
      </footer>

      {/* Completion Modal */}
      {isFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-md liquid-glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border-emerald-500/40 text-center font-['Tajawal']">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 mx-auto mb-4 shadow-xl shadow-emerald-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-3xl">
                🌿
              </div>
            </div>

            <h3 className="text-2xl font-black text-white">تقبل الله طاعتكم</h3>
            <p className="text-sm text-emerald-400 font-bold mt-1">أتممت {title} بنجاح</p>
            <p className="text-xs text-slate-400 mt-2">
              تم تسجيل إنجازك في سجل العبادات اليومي والحفاظ على استمراريتك
            </p>

            <div className="grid grid-cols-2 gap-3 my-5">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xl font-black text-emerald-400">{totalDhikrs}</div>
                <div className="text-[11px] text-slate-400">إجمالي الأذكار</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xl font-black text-teal-400">
                  {Math.round((Date.now() - startTimeRef.current) / 1000)} ث
                </div>
                <div className="text-[11px] text-slate-400">المدة المستغرقة</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer liquid-button"
            >
              تم
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
