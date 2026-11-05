import type { UserSettings } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { syncSingleSettings } from './syncEngine';

export function syncSettingsInBackground(settings: UserSettings): void {
  if (!isSupabaseConfigured()) return;
  void supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) await syncSingleSettings(session.user.id, settings);
  }).catch(error => console.warn('Settings sync could not start:', error));
}
