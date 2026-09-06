import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface Props {
  className?: string;
  showLabel?: boolean;
}

export const LanguageToggle: React.FC<Props> = ({ className = '', showLabel = false }) => {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none active:scale-95 ${
        language === 'en'
          ? 'bg-sky-500/15 border-sky-500/30 text-sky-300 hover:bg-sky-500/25'
          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
      } ${className}`}
    >
      <Globe className="w-3.5 h-3.5 shrink-0" />
      <span className="text-xs font-bold font-mono">
        {language === 'ar' ? 'EN' : 'عربي'}
      </span>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
          {language === 'ar' ? 'English' : 'العربية'}
        </span>
      )}
    </button>
  );
};
