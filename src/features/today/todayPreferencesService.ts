import { workspaceStorage } from '../../db/workspaceScope';
import { TodayPreferences, DEFAULT_TODAY_PREFERENCES } from '../../types';

const STORAGE_KEY = 'routine_today_preferences';

export function getSavedTodayPreferences(): TodayPreferences {
  try {
    const saved = workspaceStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_TODAY_PREFERENCES;
    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_TODAY_PREFERENCES,
      ...parsed,
      worshipOptions: {
        ...DEFAULT_TODAY_PREFERENCES.worshipOptions,
        ...(parsed.worshipOptions || {}),
      },
      workOptions: {
        ...DEFAULT_TODAY_PREFERENCES.workOptions,
        ...(parsed.workOptions || {}),
      },
      homeOptions: {
        ...DEFAULT_TODAY_PREFERENCES.homeOptions,
        ...(parsed.homeOptions || {}),
      },
      plansOptions: {
        ...DEFAULT_TODAY_PREFERENCES.plansOptions,
        ...(parsed.plansOptions || {}),
      },
    };
  } catch {
    return DEFAULT_TODAY_PREFERENCES;
  }
}

export function saveTodayPreferences(prefs: TodayPreferences): void {
  try {
    workspaceStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save Today preferences:', err);
  }
}
