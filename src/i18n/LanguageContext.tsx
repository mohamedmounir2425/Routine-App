import { workspaceStorage } from '../db/workspaceScope';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TranslationDictionary } from './types';
import { ar } from './ar';
import { en } from './en';

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
  t: (key: keyof TranslationDictionary) => string;
}

const dictionaries: Record<Language, TranslationDictionary> = { ar, en };

const LanguageContext = createContext<LanguageContextType>({
  language: 'ar',
  isRTL: true,
  setLanguage: () => {},
  t: (key) => ar[key] || String(key),
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = workspaceStorage.getItem('routine_app_lang');
      if (saved === 'ar' || saved === 'en') return saved;
    }
    return 'ar';
  });

  const isRTL = language === 'ar';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      workspaceStorage.setItem('routine_app_lang', lang);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    }
  }, [language, isRTL]);

  const t = (key: keyof TranslationDictionary): string => {
    const dict = dictionaries[language] || dictionaries.ar;
    return dict[key] || dictionaries.ar[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, isRTL, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
