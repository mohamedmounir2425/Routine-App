import Dexie from 'dexie';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { CURRENT_WORKSPACE, readWorkspaceScope, workspaceDatabaseName, type WorkspaceScope } from './workspaceScope';

/** Cached local access is not a cloud session and never authorizes an upload. */
export async function canOpenCachedWorkspace(error: unknown, scope: WorkspaceScope = CURRENT_WORKSPACE): Promise<boolean> {
  if (scope === 'guest' || !isAuthRetryableFetchError(error) || readWorkspaceScope() !== scope) return false;
  const exists = await Dexie.exists(workspaceDatabaseName(scope));
  return exists && readWorkspaceScope() === scope;
}
