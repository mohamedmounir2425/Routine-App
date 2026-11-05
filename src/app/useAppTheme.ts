import { workspaceStorage } from '../db/workspaceScope';
import { useState, useEffect } from 'react';
import { db } from '../db';
import { UserSettings } from '../types';

export function useAppTheme(settings: UserSettings, setSettings: (s: UserSettings) => void) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = workspaceStorage.getItem('movecare_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-transition');

    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }

    workspaceStorage.setItem('movecare_theme', theme);
    const timer = setTimeout(() => root.classList.remove('theme-transition'), 450);
    return () => clearTimeout(timer);
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    const updated: UserSettings = { ...settings, theme: nextTheme };
    db.settings.put(updated);
    setSettings(updated);
  };

  const handleSetTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    const updated: UserSettings = { ...settings, theme: newTheme };
    db.settings.put(updated);
    setSettings(updated);
  };

  return {
    theme,
    setTheme,
    handleToggleTheme,
    handleSetTheme,
  };
}
