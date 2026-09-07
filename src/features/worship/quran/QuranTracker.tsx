import React, { useState, useEffect } from 'react';
import { Bookmark, Plus, Minus, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getTodayDateString } from '../../../db/worshipQueries';

export const QuranTracker: React.FC = () => {
  const today = getTodayDateString();
  const storageKey = `routine_quran_${today}`;

  const [pagesReadToday, setPagesReadToday] = useState<number>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [targetPages] = useState<number>(() => {
    const saved = localStorage.getItem('routine_quran_target');
    return saved ? parseInt(saved, 10) : 10;
  });

  const [currentSurah, setCurrentSurah] = useState<string>(() => {
    return localStorage.getItem('routine_quran_bookmark_surah') || 'سورة البقرة';
  });

  const [currentPage, setCurrentPage] = useState<number>(() => {
    const saved = localStorage.getItem('routine_quran_bookmark_page');
    return saved ? parseInt(saved, 10) : 1;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, pagesReadToday.toString());
  }, [pagesReadToday, storageKey]);

  useEffect(() => {
    localStorage.setItem('routine_quran_target', targetPages.toString());
  }, [targetPages]);

  useEffect(() => {
    localStorage.setItem('routine_quran_bookmark_surah', currentSurah);
    localStorage.setItem('routine_quran_bookmark_page', currentPage.toString());
  }, [currentSurah, currentPage]);

  const handleAddPage = (amount: number = 1) => {
    const next = Math.max(0, pagesReadToday + amount);
    setPagesReadToday(next);
    setCurrentPage((p) => Math.min(604, p + amount));

    if (next >= targetPages && pagesReadToday < targetPages) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {}
    }
  };

  const isGoalAchieved = pagesReadToday >= targetPages && targetPages > 0;
  const progressPercent = targetPages > 0 ? Math.min(100, Math.round((pagesReadToday / targetPages) * 100)) : 0;

  return (
    <div className="max-w-xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📖</span>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Tajawal']">
              الورد القرآني اليومي
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            «خيركم من تعلم القرآن وعلمه» - ثبّت وردك اليومي من كتاب الله
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            <span>{isGoalAchieved ? 'أُنجز الورد اليوم ✓' : `${pagesReadToday} / ${targetPages} صفحات`}</span>
          </div>
        </div>
      </div>

      {/* Goal Progress Card */}
      <div className="liquid-glass-card rounded-3xl p-6 border border-emerald-500/25 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl">
              📗
            </div>
            <div>
              <h2 className="text-base font-black text-white font-['Tajawal']">إنجاز ورد اليوم</h2>
              <p className="text-xs text-slate-400">الهدف اليومي: {targetPages} صفحات (نصف جزء تقريباً)</p>
            </div>
          </div>

          <div className="text-left">
            <span className="text-2xl font-black text-emerald-400 font-mono">{progressPercent}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Counter Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-400">الصفحات المقروءة اليوم:</span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddPage(-1)}
              disabled={pagesReadToday <= 0}
              className="w-9 h-9 rounded-xl liquid-glass-pill flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="w-12 text-center font-black text-lg text-white font-mono">
              {pagesReadToday}
            </span>

            <button
              onClick={() => handleAddPage(1)}
              className="w-9 h-9 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleAddPage(5)}
              className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20 transition-all cursor-pointer"
            >
              +٥ صفحات
            </button>
          </div>
        </div>
      </div>

      {/* Bookmark Card */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-black text-white font-['Tajawal']">علامة الوقف والمتابعة (الفاصل)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">السورة الحالية:</label>
            <input
              type="text"
              value={currentSurah}
              onChange={(e) => setCurrentSurah(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">رقم الصفحة (المصحف الشريف):</label>
            <input
              type="number"
              min="1"
              max="604"
              value={currentPage}
              onChange={(e) => setCurrentPage(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 font-mono"
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-500 text-center pt-2">
          تُحفظ علامة التوقف تلقائياً لتستأنف قراءتك غداً من نفس الموضع
        </p>
      </div>
    </div>
  );
};
