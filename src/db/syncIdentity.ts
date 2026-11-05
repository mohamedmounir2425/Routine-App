import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { workspaceGuard } from './workspaceScope';

/** Verify the immutable local workspace and the SDK session before a cloud operation. */
export async function requireSyncIdentity(userId: string, client: SupabaseClient = supabase) {
  if (client !== supabase) return; // Explicitly supplied transports are used by isolated tests.
  workspaceGuard.assertAccount(userId);
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (data.session?.user.id !== userId) throw new Error('جلسة الدخول لا تطابق بيانات الجهاز؛ أعد فتح التطبيق.');
  workspaceGuard.assertAccount(userId);
}
