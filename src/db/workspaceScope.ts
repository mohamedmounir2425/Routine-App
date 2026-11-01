export type WorkspaceScope = 'guest' | `user:${string}`;
export const ACTIVE_WORKSPACE_KEY = 'lifeos_active_workspace_v1';
export const LEGACY_DATABASE_NAME = 'RoutineAppDB';

export function scopeForUser(userId: string | null): WorkspaceScope {
  if (userId === null) return 'guest';
  if (!/^[a-zA-Z0-9-]{1,128}$/.test(userId)) throw new Error('معرّف حساب غير صالح');
  return `user:${userId}`;
}

export function readWorkspaceScope(storage: Storage = localStorage): WorkspaceScope {
  const value = storage.getItem(ACTIVE_WORKSPACE_KEY);
  if (value === null || value === 'guest') return 'guest';
  if (/^user:[a-zA-Z0-9-]{1,128}$/.test(value)) return value as WorkspaceScope;
  throw new Error('تعذر تحديد مساحة الحساب؛ لم يتم تغيير البيانات.');
}

function initialScope(): WorkspaceScope {
  try { return readWorkspaceScope(); } catch { return 'guest'; }
}

// A page never changes its database identity. Account changes require a new page.
export const CURRENT_WORKSPACE = initialScope();
export function workspaceDatabaseName(scope: WorkspaceScope) {
  return scope === 'guest' ? 'LifeOS_guest_v1' : `LifeOS_user_${scope.slice(5)}_v1`;
}

export function createWorkspaceStorage(scope: WorkspaceScope, suppliedStorage?: Storage): Storage {
  const prefix = `lifeos_workspace/${scope}/`;
  const raw = () => suppliedStorage ?? localStorage;
  const keys = () => {
    const result: string[] = [];
    const storage = raw();
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(prefix)) result.push(key);
    }
    return result;
  };
  return {
    get length() { return keys().length; },
    key(index) { return keys()[index]?.slice(prefix.length) ?? null; },
    getItem(key) { return raw().getItem(prefix + key); },
    setItem(key, value) { raw().setItem(prefix + key, value); },
    removeItem(key) { raw().removeItem(prefix + key); },
    clear() { for (const key of keys()) raw().removeItem(key); },
  };
}

export const workspaceStorage = createWorkspaceStorage(CURRENT_WORKSPACE);

/** Enumerate once for backup export instead of repeatedly scanning all namespaces. */
export function workspaceStorageEntries(scope: WorkspaceScope = CURRENT_WORKSPACE, suppliedStorage?: Storage): Array<[string, string]> {
  const storage = suppliedStorage ?? localStorage;
  const prefix = `lifeos_workspace/${scope}/`;
  const entries: Array<[string, string]> = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (!key?.startsWith(prefix)) continue;
    const value = storage.getItem(key);
    if (value !== null) entries.push([key.slice(prefix.length), value]);
  }
  return entries;
}

export function createWorkspaceGuard(scope: WorkspaceScope, suppliedStorage?: Storage) {
  let sessionUserId: string | null = null;
  return {
    bindSession(userId: string | null) { sessionUserId = userId; },
    assertAccount(userId: string) {
      if (scope !== scopeForUser(userId) || readWorkspaceScope(suppliedStorage) !== scope || sessionUserId !== userId) {
        throw new Error('تغيّر الحساب؛ أوقفنا المزامنة لحماية بياناتك. أعد فتح التطبيق.');
      }
    },
  };
}

export const workspaceGuard = createWorkspaceGuard(CURRENT_WORKSPACE);

export function persistWorkspaceForSession(userId: string | null): boolean {
  const next = scopeForUser(userId);
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, next);
  workspaceGuard.bindSession(userId);
  return next !== CURRENT_WORKSPACE;
}
