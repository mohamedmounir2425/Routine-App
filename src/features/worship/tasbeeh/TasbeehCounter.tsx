import React, { useState } from 'react';
import { sounds } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface TasbeehPreset {
  id: string;
  arabic: string;
  transliteration?: string;
  target: number;
  virtue?: string;
}

const PRESETS: TasbeehPreset[] = [
  { id: 'subhanallah', arabic: 'سُبْحَانَ اللَّهِ', target: 33, virtue: 'تسبيح وثناء وتنزيه لله عز وجل' },
  { id: 'alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', target: 33, virtue: 'تملأ الميزان بالخير والبركة' },
  { id: 'allahuakbar', arabic: 'اللَّهُ أَكْبَرُ', target: 34, virtue: 'تكبير وتوحيد لعظمة الله' },
  { id: 'tahlil', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', target: 100, virtue: 'حرز من الشيطان وعتق رقاب' },
  { id: 'astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ', target: 100, virtue: 'تفريج الهموم وسعة الرزق وغفران الذنوب' },
  { id: 'salawat', arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ', target: 100, virtue: 'من صلى عليّ صلاة صلى الله عليه بها عشراً' },
  { id: 'hawqalah', arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', target: 100, virtue: 'كنز من كنوز الجنة ودافع للبلاء' },
  { id: 'subhanallah_bihamdihi', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ', target: 100, virtue: 'كلمتان خفيفتان على اللسان ثقيلتان في الميزان' },
  { id: 'free', arabic: 'تسبيح حر (مفتوح)', target: 0, virtue: 'اذكر الله قياماً وقعوداً وعلى جنوبكم' },
];

export const TasbeehCounter: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<TasbeehPreset>(PRESETS[0]);
  const [count, setCount] = useState(0);
  const [round, setRound] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [totalToday, setTotalToday] = useState(() => {
    const saved = localStorage.getItem('routine_tasbeeh_today');
    return saved ? parseInt(saved, 10) : 0;
  });

  const target = selectedPreset.target;
  const isInfinite = target === 0;
  const progressPercent = isInfinite ? 100 : Math.min(100, Math.round((count / target) * 100));

  const handleTap = () => {
    // Haptic pulse
    if ('vibrate' in navigator) {
      navigator.vibrate(35);
    }

    const nextCount = count + 1;
    const nextTotal = totalToday + 1;
    setTotalToday(nextTotal);
    localStorage.setItem('routine_tasbeeh_today', nextTotal.toString());

    if (!isInfinite && nextCount >= target) {
      // Completed target round!
      setCount(target);
      if (soundEnabled) {
        sounds.playGoChime();
      }
      if ('vibrate' in navigator) {
        navigator.vibrate([40, 50, 80]);
      }

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // ignore
      }

      setTimeout(() => {
        setCount(0);
        setRound((r) => r + 1);
      }, 500);
    } else {
      setCount(nextCount);
    }
  };

  const handleReset = () => {
    setCount(0);
    setRound(1);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📿</span>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Tajawal']">
              السبحة الإلكترونية الذكية
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            أذكار مأثورة، عدّاد نبضات تفاعلي، ومتابعة فورية لأوراد التسبيح
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl liquid-glass-pill transition-all ${
              soundEnabled ? 'text-emerald-400' : 'text-slate-500'
            }`}
            title={soundEnabled ? 'كتم الصوت' : 'تفعيل الصوت'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl liquid-glass-pill text-slate-400 hover:text-white transition-all"
            title="إعادة ضبط العداد"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Selector Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {PRESETS.map((preset) => {
          const isSelected = selectedPreset.id === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => {
                setSelectedPreset(preset);
                setCount(0);
                setRound(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer select-none ${
                isSelected
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                  : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span>{preset.arabic}</span>
              {preset.target > 0 && <span className="opacity-70 mr-1.5 font-sans">({preset.target})</span>}
            </button>
          );
        })}
      </div>

      {/* Main Interactive Counter Sphere Card */}
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/25 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Current Dhikr Arabic Heading */}
        <div className="my-4 max-w-md">
          <h2 className="dhikr-text text-2xl sm:text-3xl text-emerald-300 font-black mb-2 leading-relaxed">
            {selectedPreset.arabic}
          </h2>
          {selectedPreset.virtue && (
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              {selectedPreset.virtue}
            </p>
          )}
        </div>

        {/* Giant Circular Click Area */}
        <div className="my-6 relative">
          <button
            onClick={handleTap}
            className="w-48 h-48 sm:w-56 sm:h-56 rounded-full liquid-glass-card border-2 border-emerald-500/40 hover:border-emerald-400 flex flex-col items-center justify-center transition-all duration-150 active:scale-95 shadow-2xl shadow-emerald-500/20 cursor-pointer group relative select-none"
            style={{
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.6) 80%)',
            }}
          >
            {/* Progress ring ring svg */}
            {!isInfinite && (
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-white/5 fill-none"
                  strokeWidth="4"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-emerald-400 fill-none transition-all duration-200"
                  strokeWidth="4"
                  strokeDasharray={283}
                  strokeDashoffset={283 - (283 * progressPercent) / 100}
                  strokeLinecap="round"
                />
              </svg>
            )}

            <span className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight group-hover:scale-105 transition-transform">
              {count}
            </span>

            {!isInfinite && (
              <span className="text-xs font-bold text-slate-400 mt-1">
                من أصل {target}
              </span>
            )}

            <span className="text-[11px] text-emerald-400 font-bold mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
              اضغط للتسبيح
            </span>
          </button>
        </div>

        {/* Round & Total Stats Footnotes */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm pt-4 border-t border-white/5 text-xs text-slate-300">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-1.5">
            <span className="text-slate-400">الجولة:</span>
            <span className="font-bold text-white font-mono">{round}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-1.5 text-emerald-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>مجموع اليوم:</span>
            <span className="font-black font-mono">{totalToday}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
