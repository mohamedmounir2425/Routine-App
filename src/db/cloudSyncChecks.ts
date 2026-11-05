import type { SupabaseClient } from '@supabase/supabase-js';

export const CLOUD_SYNC_TABLES = [
  'profiles', 'workout_logs', 'custom_routines', 'weekly_schedule', 'azkar_logs',
  'life_tasks', 'projects', 'plans', 'plan_milestones', 'workout_schedules', 'day_plans',
] as const;

/** Read every required source before allowing any local writes. */
export async function fetchCloudSnapshot(client: SupabaseClient, userId: string) {
  const entries = await Promise.all(CLOUD_SYNC_TABLES.map(async table => {
    // Explicit pages prevent PostgREST's row limit silently truncating a backup/sync.
    const first = await client.from(table).select('*').eq(table === 'profiles' ? 'id' : 'user_id', userId)
      .order('id').range(0, 499);
    if (first.error) throw new Error(`تعذر قراءة ${table}: ${first.error.message}`);
    if (!Array.isArray(first.data)) throw new Error(`استجابة غير صالحة من ${table}`);
    const rows = [...first.data];
    let pageLength = first.data.length;
    while (pageLength === 500) {
      const { data, error } = await client.from(table).select('*')
        .eq(table === 'profiles' ? 'id' : 'user_id', userId).order('id').range(rows.length, rows.length + 499);
      if (error) throw new Error(`تعذر قراءة ${table}: ${error.message}`);
      if (!Array.isArray(data)) throw new Error(`استجابة غير صالحة من ${table}`);
      rows.push(...data);
      pageLength = data.length;
    }
    if (table === 'profiles' && rows.length > 1) throw new Error('ملف الحساب مكرر');
    return [table, rows] as const;
  }));
  return Object.fromEntries(entries);
}

export function syncErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);
  return 'تعذرت المزامنة؛ بياناتك المحلية محفوظة. أعد المحاولة عند توفر الاتصال.';
}
