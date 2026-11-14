import { useCallback, useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../db/database';
import { DEFAULT_USER_SETTINGS } from '../db/seeds/tipsAndDefaults';
import type { UserSettings } from '../types';
import { useAppTheme } from './useAppTheme';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Application lifecycle only. Space data and failures must not gate the shell. */
export function useAppController() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isTvMode, setIsTvMode] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPrompt | null>(null);
  const { theme, setTheme, handleToggleTheme, handleSetTheme } = useAppTheme(settings, setSettings);

  const loadAppData = useCallback(async () => {
    setLoadError(null);
    try {
      // AuthProvider has already opened and initialized this account's database.
      const current = await db.settings.get('current_settings');
      if (current) {
        setSettings(current);
        if (current.theme) setTheme(current.theme);
      }
    } catch (error) {
      console.error('Application settings could not be loaded:', error);
      setLoadError('تعذر تحميل إعدادات التطبيق. تأكد من السماح بالتخزين المحلي ثم أعد المحاولة.');
    } finally {
      setIsLoading(false);
    }
  }, [setTheme]);

  useEffect(() => {
    void loadAppData();
    const subscription = liveQuery(() => db.settings.get('current_settings')).subscribe({
      next: current => {
        if (current) {
          setSettings(current);
          if (current.theme) setTheme(current.theme);
        }
      },
      error: error => console.error('Settings subscription failed:', error),
    });
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as InstallPrompt);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [loadAppData, setTheme]);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    if ((await deferredPrompt.userChoice).outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleUpdateSettings = async (next: UserSettings) => {
    await db.settings.put(next);
    setSettings(next);
  };

  return {
    isLoading, loadError, settings, isTvMode, setIsTvMode, deferredPrompt,
    theme, handleToggleTheme, handleSetTheme, handleInstallPwa,
    handleUpdateSettings, loadAppData,
  };
}
