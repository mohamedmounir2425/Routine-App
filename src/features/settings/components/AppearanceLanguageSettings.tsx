import React from 'react';
import { Palette, Moon, Sun, Smartphone, Globe } from 'lucide-react';
import { LanguageToggle } from '../../../components/common/LanguageToggle';

interface AppearanceLanguageSettingsProps {
  theme?: 'dark' | 'light';
  onSetTheme?: (theme: 'dark' | 'light') => void;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
}

export const AppearanceLanguageSettings: React.FC<AppearanceLanguageSettingsProps> = ({
  theme = 'dark',
  onSetTheme,
  canInstallPwa,
  onInstallPwa,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
          <Palette className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white font-['Tajawal']">
            المظهر واللغة وتثبيت التطبيق
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            تغيير المظهر، التبديل بين العربية والإنجليزية، وتثبيت التطبيق
          </p>
        </div>
      </div>

      {/* Language Switcher Row */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-xs font-bold text-slate-200">لغة التطبيق (Language)</div>
            <div className="text-[11px] text-slate-400">التبديل بين العربية والإنجليزية مع دعم RTL/LTR</div>
          </div>
        </div>
        <LanguageToggle />
      </div>

      {/* Dark / Light Theme Row */}
      {onSetTheme && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">نمط العرض (الوضع الداكن / الفاتح)</span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {theme === 'dark' ? 'الوضع الليلي 🌙' : 'الوضع النهاري ☀️'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSetTheme('dark')}
              className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-xs transition-all active:scale-95 cursor-pointer select-none group ${
                theme === 'dark'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-slate-500 group-hover:text-white'}`} />
              <span>الوضع الداكن (Dark)</span>
            </button>

            <button
              type="button"
              onClick={() => onSetTheme('light')}
              className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-xs transition-all active:scale-95 cursor-pointer select-none group ${
                theme === 'light'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-600 shadow-md ring-1 ring-amber-500/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-amber-500' : 'text-slate-500 group-hover:text-amber-400'}`} />
              <span>الوضع الفاتح (Light)</span>
            </button>
          </div>
        </div>
      )}

      {/* PWA Section */}
      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-200">تطبيق الهاتف الخفيف (PWA)</div>
            <div className="text-[11px] text-slate-400">يعمل بدون إنترنت كتطبيق هاتف حقيقي وخفيف</div>
          </div>
        </div>
        {canInstallPwa && onInstallPwa ? (
          <button
            type="button"
            onClick={onInstallPwa}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shrink-0"
          >
            تثبيت التطبيق الآن
          </button>
        ) : (
          <span className="text-[11px] text-emerald-400/80 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 shrink-0 text-center">
            جاهز للتثبيت عبر المتصفح
          </span>
        )}
      </div>
    </div>
  );
};
