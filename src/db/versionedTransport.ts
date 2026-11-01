import type { SupabaseClient } from '@supabase/supabase-js';
import { requireSyncIdentity } from './syncIdentity';
import { workspaceGuard } from './workspaceScope';
import { supabase } from '../lib/supabase';
import type { CloudSnapshot, MutationReply, VersionedTransport } from './versionedSync';

export function versionedTransport(client: SupabaseClient, uid: string): VersionedTransport {
  return {
    async snapshot() {
      await requireSyncIdentity(uid, client);
      const { data, error } = await client.rpc('sync_read_snapshot');
      if (error) throw new Error('تعذر قراءة السحابة: ' + error.message);
      if (client === supabase) workspaceGuard.assertAccount(uid);
      if (!data || typeof data !== 'object' || !data.tables || !Array.isArray(data.versions)) throw new Error('إصدار خادم المزامنة غير متوافق.');
      return data as CloudSnapshot;
    },
    async mutate(request) {
      await requireSyncIdentity(uid, client);
      const { data, error } = await client.rpc('sync_apply_mutation', {
        p_table: request.table, p_id: request.id, p_action: request.action,
        p_data: request.data, p_expected_revision: request.expectedRevision, p_operation_id: request.operationId,
      });
      if (error) throw new Error(error.message);
      if (client === supabase) workspaceGuard.assertAccount(uid);
      if (!data || !['applied', 'conflict'].includes(data.status) || !Number.isSafeInteger(Number(data.revision)) || Number(data.revision) < 0) throw new Error('استجابة غير صالحة لتأكيد المزامنة.');
      return { ...data, revision: Number(data.revision) } as MutationReply;
    },
  };
}
