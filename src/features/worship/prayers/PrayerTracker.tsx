import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Moon, Sun, Sunrise, Sunset, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getTodayDateString } from '../../../db/worshipQueries';

interface PrayerItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  timeHint: string;
  sunnahHint: string;
}

const PRAYERS: PrayerItem[] = [
  { id: 'fajr', name: 'الفجر', icon: <Sunrise className="w-4 h-4 text-amber-300" />, timeHint: 'الفجر الصادق', sunnahHint: 'ركعتان قبل الفجر (خير من الدنيا)' },
  { id: 'dhuhr', name: 'الظهر', icon: <Sun className="w-4 h-4 text-yellow-400" />, timeHint: 'زوال الشمس', sunnahHint: '٤ ركعات قبلها + ٢ بعدها' },
  { id: 'asr', name: 'العصر', icon: <Sun className="w-4 h-4 text-orange-400" />, timeHint: 'ظل كل شيء مثله', sunnahHint: '٤ ركعات قبلها مستحبة' },
  { id: 'maghrib', name: 'المغرب', icon: <Sunset className="w-4 h-4 text-rose-400" />, timeHint: 'غروب الشمس', sunnahHint: 'ركعتان بعدها' },
  { id: 'isha', name: 'العشاء', icon: <Moon className="w-4 h-4 text-indigo-400" />, timeHint: 'مغيب الشفق الأحمر', sunnahHint: 'ركعتان بعدها + الشفع والوتر' },
];

const NAWAFIL = [
  { id: 'duha', name: 'صلاة الضحى', description: 'صلاة الأوابين (ركعتان إلى ٨ ركعات)' },
  { id: 'witr', name: 'الشفع والوتر', description: 'خاتمة صلاة الليل' },
  { id: 'qiyam', name: 'قيام الليل', description: 'شرف المؤمن وخلوته بربه' },
];

export const PrayerTracker: React.FC = () => {
  const today = getTodayDateString();
  const storageKey = `routine_prayers_${today}`;

  // State: Record<prayerId, { fard: boolean; jamaah: boolean; sunnah: boolean }>
  const [prayerState, setPrayerState] = useState<Record<string, { fard: boolean; jamaah: boolean; sunnah: boolean }>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [nawafilState, setNawafilState] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_nawafil`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(prayerState));
  }, [prayerState, storageKey]);

  useEffect(() => {
    localStorage.setItem(`${storageKey}_nawafil`, JSON.stringify(nawafilState));
  }, [nawafilState, storageKey]);

  const toggleFard = (id: string) => {
    setPrayerState((prev) => {
      const current = prev[id] || { fard: false, jamaah: false, sunnah: false };
      const nextFard = !current.fard;
      const updated = {
        ...prev,
        [id]: {
          ...current,
          fard: nextFard,
          // if unchecking fard, also uncheck jamaah
          jamaah: nextFard ? current.jamaah : false,
        },
      };

      // Check if all 5 completed
      const allDone = PRAYERS.every((p) => (p.id === id ? nextFard : prev[p.id]?.fard));
      if (allDone) {
        try {
          confetti({
            particleCount: 70,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }

      return updated;
    });
  };

  const toggleJamaah = (id: string) => {
    setPrayerState((prev) => {
      const current = prev[id] || { fard: false, jamaah: false, sunnah: false };
      return {
        ...prev,
        [id]: {
          ...current,
          fard: true, // Jamaah implies fard was performed
          jamaah: !current.jamaah,
        },
      };
    });
  };

  const toggleSunnah = (id: string) => {
    setPrayerState((prev) => {
      const current = prev[id] || { fard: false, jamaah: false, sunnah: false };
      return {
        ...prev,
        [id]: {
          ...current,
          sunnah: !current.sunnah,
        },
      };
    });
  };

  const toggleNafl = (id: string) => {
    setNawafilState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const fardCompletedCount = PRAYERS.filter((p) => prayerState[p.id]?.fard).length;
  const jamaahCompletedCount = PRAYERS.filter((p) => prayerState[p.id]?.jamaah).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🕌</span>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Tajawal']">
              متابعة الصلوات الخمس والسنن
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            «إن الصلاة كانت على المؤمنين كتاباً موقوتاً» - حافظ على صلاتك في وقتها وبجماعة
          </p>
        </div>

        {/* Status Score */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            <span>{fardCompletedCount} / 5 فرائض {jamaahCompletedCount > 0 ? `(${jamaahCompletedCount} جماعة)` : ''}</span>
          </div>
        </div>
      </div>

      {/* 5 Daily Prayers List */}
      <div className="space-y-3">
        {PRAYERS.map((prayer) => {
          const state = prayerState[prayer.id] || { fard: false, jamaah: false, sunnah: false };

          return (
            <div
              key={prayer.id}
              className={`liquid-glass-card rounded-2xl p-4 sm:p-5 border transition-all ${
                state.fard
                  ? 'border-emerald-500/30 bg-emerald-950/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left: Name & Sunnah Hint */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleFard(prayer.id)}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      state.fard
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/25'
                        : 'bg-white/5 border-white/15 text-transparent hover:border-emerald-500/50'
                    }`}
                  >
                    <Check className={`w-5 h-5 stroke-[3] ${state.fard ? 'block' : 'hidden'}`} />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white font-['Tajawal']">
                        صلاة {prayer.name}
                      </h3>
                      <span className="p-1 rounded-lg bg-white/5 border border-white/10">
                        {prayer.icon}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {prayer.sunnahHint}
                    </p>
                  </div>
                </div>

                {/* Right: Sub-Checkboxes (Jamaah & Sunnah) */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0">
                  {/* Jamaah Toggle */}
                  <button
                    onClick={() => toggleJamaah(prayer.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                      state.jamaah
                        ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Check className={`w-3 h-3 ${state.jamaah ? 'opacity-100' : 'opacity-30'}`} />
                    <span>في جماعة</span>
                  </button>

                  {/* Sunnah Toggle */}
                  <button
                    onClick={() => toggleSunnah(prayer.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                      state.sunnah
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Check className={`w-3 h-3 ${state.sunnah ? 'opacity-100' : 'opacity-30'}`} />
                    <span>السنة الراتبة</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nawafil Section */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
        <h3 className="text-sm font-black text-white font-['Tajawal'] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>النوافل والسنن المستحبة</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {NAWAFIL.map((nafl) => {
            const isDone = !!nawafilState[nafl.id];
            return (
              <div
                key={nafl.id}
                onClick={() => toggleNafl(nafl.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  isDone
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold">{nafl.name}</span>
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                      isDone ? 'bg-amber-400 border-amber-300 text-slate-950' : 'border-white/20'
                    }`}
                  >
                    {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">{nafl.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
