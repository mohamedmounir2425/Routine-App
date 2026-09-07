import React, { useState } from 'react';
import { Dhikr } from '../../types';
import { Copy, Check, Headphones } from 'lucide-react';

interface Props {
  dhikr: Dhikr;
  onStartSingle?: (dhikr: Dhikr) => void;
}

export const AzkarCard: React.FC<Props> = ({ dhikr, onStartSingle }) => {
  const [copied, setCopied] = useState(false);
  const [countLeft, setCountLeft] = useState(dhikr.count);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(dhikr.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCountClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (countLeft > 0) {
      if ('vibrate' in navigator) {
        navigator.vibrate(40);
      }
      setCountLeft((prev) => prev - 1);
    }
  };

  return (
    <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 hover:border-emerald-500/30 transition-all font-['Tajawal'] relative group">
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/5 text-xs text-slate-400">
        <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 font-bold text-slate-300">
          {dhikr.categoryArabic}
        </span>

        <div className="flex items-center gap-2">
          {onStartSingle && (
            <button
              onClick={() => onStartSingle(dhikr)}
              className="p-1.5 rounded-lg liquid-glass-pill hover:text-emerald-300 transition-colors flex items-center gap-1 text-[11px]"
              title="فتح في وضع التلاوة"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-bold">تلاوة</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg liquid-glass-pill hover:text-white transition-colors"
            title="نسخ الذكر"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold">
            التكرار: {dhikr.count}
          </span>
        </div>
      </div>

      {/* Main Dhikr Text */}
      <div className="my-4 text-center px-1">
        {dhikr.paragraphs.map((p, idx) => (
          <p
            key={idx}
            className="dhikr-text text-lg sm:text-xl md:text-2xl text-slate-100 mb-3 last:mb-0 leading-[2.2] select-text"
          >
            {p}
          </p>
        ))}
      </div>

      {/* Description / Virtue */}
      {dhikr.description && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 text-center my-3 leading-relaxed">
          <span className="font-bold">الفضل: </span>
          <span>{dhikr.description}</span>
        </div>
      )}

      {/* Reference & Accordion */}
      {dhikr.reference && (
        <div className="text-[11px] text-slate-500 text-center mt-2">
          {dhikr.reference}
        </div>
      )}

      {/* Interactive Quick Counter Button */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-3">
        <button
          onClick={handleCountClick}
          disabled={countLeft === 0}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            countLeft === 0
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {countLeft === 0 ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>تم الإكمال</span>
            </>
          ) : (
            <>
              <span>اضغط للعد</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-950/25 text-slate-950 font-black">
                {countLeft} متبقي
              </span>
            </>
          )}
        </button>

        {countLeft < dhikr.count && countLeft > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCountLeft(dhikr.count);
            }}
            className="p-2.5 rounded-xl liquid-glass-pill text-xs text-slate-400 hover:text-white"
            title="إعادة ضبط العداد"
          >
            إعادة
          </button>
        )}
      </div>
    </div>
  );
};
