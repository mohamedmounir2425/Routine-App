import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncAllWithCloud, flushPendingSyncQueue, getPendingSyncCount, retryFailedMutations } from '../db/syncEngine';
import { ACTIVE_WORKSPACE_KEY, CURRENT_WORKSPACE, persistWorkspaceForSession, readWorkspaceScope, scopeForUser, workspaceGuard } from '../db/workspaceScope';
import { prepareLegacyWorkspace, readLegacyBackup } from '../db/workspaceMigration';
import { initializeDatabase } from '../db/database';
import { suspendCurrentWorkspaceFocus, reconcileWorkspaceFocus } from '../db/workspaceFocus';
import { canOpenCachedWorkspace } from '../db/workspaceOffline';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';
export type AuthModalMode = 'signin' | 'signup' | 'forgot';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  syncError: string | null;
  pendingCount: number;
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: AuthModalMode) => void;
  signInWithEmail: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: { message: string } | null; data: Awaited<ReturnType<typeof supabase.auth.signUp>>['data'] | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: { message: string } | null }>;
  triggerSync: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [offlineWorkspace, setOfflineWorkspace] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [legacyRecovery, setLegacyRecovery] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('signin');
  const userRef = useRef<User | null>(null);
  const readyScopeRef = useRef<string | null>(null);
  const isSyncingRef = useRef(false);
  const initiallySyncedUser = useRef<string | null>(null);
  const departedAt = useRef<Date | null>(null);
  const offlineRef = useRef(false);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (!workspaceError) return;
    let mounted = true;
    void readLegacyBackup().then(({ backup }) => { if (mounted) setLegacyRecovery(backup); }).catch(() => {});
    return () => { mounted = false; };
  }, [workspaceError]);

  const runSync = useCallback(async (userId: string) => {
    if (isSyncingRef.current || !isConfigured || readyScopeRef.current !== CURRENT_WORKSPACE) return;
    isSyncingRef.current = true;
    setSyncError(null);
    setSyncStatus('syncing');
    try {
      workspaceGuard.assertAccount(userId);
      await flushPendingSyncQueue(userId);
      const remainingCount = await getPendingSyncCount(userId);
      workspaceGuard.assertAccount(userId);
      if (userRef.current?.id !== userId) return;
      setPendingCount(remainingCount);
      if (remainingCount) throw new Error('توجد ' + remainingCount + ' تعديلات لم تصل للسحابة. لن نسحب بيانات فوقها؛ أعد المحاولة.');
      const result = await syncAllWithCloud(userId);
      workspaceGuard.assertAccount(userId);
      if (userRef.current?.id !== userId) return;
      setSyncStatus(result.success ? 'synced' : 'error');
      if (result.success) setLastSyncedAt(new Date());
      else setSyncError(result.error ?? 'تعذرت المزامنة');
    } catch (error) {
      if (userRef.current?.id === userId && readyScopeRef.current === CURRENT_WORKSPACE) {
        setSyncStatus('error');
        setSyncError(error instanceof Error ? error.message : 'تعذرت المزامنة');
      }
    } finally {
      isSyncingRef.current = false;
      if (userRef.current?.id === userId && readyScopeRef.current === CURRENT_WORKSPACE) {
        void getPendingSyncCount(userId).then(count => {
          if (userRef.current?.id === userId) setPendingCount(count);
        }).catch(() => setSyncStatus('error'));
      }
    }
  }, [isConfigured]);

  const triggerSync = useCallback(async () => {
    const id = userRef.current?.id;
    if (!id || isSyncingRef.current) return;
    try {
      workspaceGuard.assertAccount(id);
      await retryFailedMutations(id);
      await runSync(id);
    } catch (error) {
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'تعذرت المزامنة');
    }
  }, [runSync]);

  useEffect(() => {
    let disposed = false;
    let generation = 0;
    const acceptSession = (nextSession: Session | null) => {
      if (disposed) return;
      const request = ++generation;
      const nextUser = nextSession?.user ?? null;
      const id = nextUser?.id ?? null;
      userRef.current = nextUser;
      workspaceGuard.bindSession(id);
      setUser(nextUser);
      setSession(nextSession);
      offlineRef.current = false;
      setOfflineWorkspace(false);
      if (nextSession && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      try {
        const scope = scopeForUser(id);
        if (readyScopeRef.current === scope && readWorkspaceScope() === scope) {
          if (id && initiallySyncedUser.current !== id) {
            initiallySyncedUser.current = id;
            setTimeout(() => { void runSync(id); }, 0);
          }
          return;
        }
        readyScopeRef.current = null;
        setWorkspaceReady(false);
        setIsLoading(true);
        setWorkspaceError('');
        setSyncStatus('idle');
        setSyncError(null);
        setPendingCount(0);
        setLastSyncedAt(null);
        const needsReload = persistWorkspaceForSession(id);
        const changedAt = new Date();
        if (needsReload) departedAt.current ??= changedAt;
        // Never await Supabase APIs inside onAuthStateChange's callback.
        setTimeout(() => {
          void (async () => {
            if (needsReload) await suspendCurrentWorkspaceFocus(departedAt.current ?? changedAt);
            await prepareLegacyWorkspace();
            if (disposed || request !== generation) return;
            if (needsReload) { window.location.reload(); return; }
            await initializeDatabase();
            await reconcileWorkspaceFocus();
            if (disposed || request !== generation) return;
            readyScopeRef.current = CURRENT_WORKSPACE;
            setWorkspaceReady(true);
            setIsLoading(false);
            if (id && initiallySyncedUser.current !== id) {
              initiallySyncedUser.current = id;
              void runSync(id);
            }
          })().catch(error => {
            if (!disposed && request === generation) {
              setWorkspaceError(error instanceof Error ? error.message : 'تعذر تجهيز بيانات الحساب.');
              setIsLoading(false);
            }
          });
        }, 0);
      } catch (error) {
        readyScopeRef.current = null;
        setWorkspaceReady(false);
        setWorkspaceError(error instanceof Error ? error.message : 'تعذر فتح مساحة الحساب.');
        setIsLoading(false);
      }
    };

    const readInitialSession = () => {
      const request = ++generation;
      setTimeout(() => {
        void supabase.auth.getSession().then(async ({ data, error }) => {
          if (disposed || request !== generation) return;
          if (!error) { acceptSession(data.session); return; }
          if (!await canOpenCachedWorkspace(error)) throw error;
          if (disposed || request !== generation) return;
          if (readyScopeRef.current !== CURRENT_WORKSPACE) {
            await prepareLegacyWorkspace();
            await initializeDatabase();
            await reconcileWorkspaceFocus();
          }
          if (disposed || request !== generation || readWorkspaceScope() !== CURRENT_WORKSPACE) return;
          // Keep last-selected local data available during a retryable network outage.
          // Do not invent a Supabase user/session or enable cloud mutations.
          userRef.current = null;
          initiallySyncedUser.current = null;
          workspaceGuard.bindSession(null);
          setUser(null); setSession(null);
          offlineRef.current = true;
          setOfflineWorkspace(true);
          readyScopeRef.current = CURRENT_WORKSPACE;
          setWorkspaceReady(true); setIsLoading(false); setWorkspaceError('');
          setSyncStatus('error'); setSyncError('بيانات الحساب متاحة محليًا؛ تجديد الدخول والمزامنة متوقفان لحين عودة الاتصال.');
        }).catch(error => {
          if (!disposed && request === generation) {
            readyScopeRef.current = null;
            setWorkspaceReady(false);
            setWorkspaceError(error instanceof Error ? error.message : 'تعذر قراءة جلسة الحساب.');
            setIsLoading(false);
          }
        });
      }, 0);
    };
    let unsubscribe = () => {};
    if (isConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (event === 'INITIAL_SESSION' && !nextSession && CURRENT_WORKSPACE !== 'guest') readInitialSession();
        else acceptSession(nextSession);
      });
      unsubscribe = () => subscription.unsubscribe();
      // Generation checks prevent a stale bootstrap read undoing a newer auth event.
      readInitialSession();
    } else acceptSession(null);

    const handleOnline = () => {
      if (userRef.current?.id) void runSync(userRef.current.id);
      else if (offlineRef.current) readInitialSession();
    };
    const handlePending = () => {
      if (readyScopeRef.current !== CURRENT_WORKSPACE) return;
      setSyncStatus('idle');
      const id = userRef.current?.id;
      if (id) void getPendingSyncCount(id).then(count => {
        if (userRef.current?.id === id) setPendingCount(count);
      }).catch(() => setSyncStatus('error'));
    };
    const handleOffline = () => setSyncStatus('idle');
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ACTIVE_WORKSPACE_KEY && event.key !== null) return;
      try {
        if (readWorkspaceScope() === CURRENT_WORKSPACE) return;
      } catch { /* Fail closed if the workspace marker is damaged. */ }
      workspaceGuard.bindSession(null);
      readyScopeRef.current = null;
      setWorkspaceReady(false);
      setIsLoading(true);
      departedAt.current ??= new Date();
      void suspendCurrentWorkspaceFocus(departedAt.current).then(() => window.location.reload()).catch(error => {
        setWorkspaceError(error instanceof Error ? error.message : 'تعذر إيقاف جلسة التركيز.');
        setIsLoading(false);
      });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('lifeos:sync-pending', handlePending);
    window.addEventListener('storage', handleStorage);
    return () => {
      disposed = true;
      ++generation;
      readyScopeRef.current = null;
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('lifeos:sync-pending', handlePending);
      window.removeEventListener('storage', handleStorage);
    };
  }, [isConfigured, runSync]);

  const openAuthModal = (mode: AuthModalMode = 'signin') => { setAuthModalMode(mode); setIsAuthModalOpen(true); };
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const signInWithEmail = async (email: string, password: string) => {
    if (!isConfigured) return { error: { message: 'خدمة الحسابات غير مهيأة' } };
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (!result.error) closeAuthModal();
    return { error: result.error };
  };
  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    if (!isConfigured) return { error: { message: 'خدمة الحسابات غير مهيأة' }, data: null };
    const result = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName || email.split('@')[0] } } });
    return { error: result.error, data: result.data };
  };
  const signOut = async () => {
    if (!isConfigured) return;
    readyScopeRef.current = null;
    workspaceGuard.bindSession(null);
    setWorkspaceReady(false);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر تسجيل الخروج؛ أعد المحاولة.';
      // Never reopen old data if a concurrent auth event already changed the identity.
      let unchanged = false;
      try { unchanged = scopeForUser(userRef.current?.id ?? null) === CURRENT_WORKSPACE && readWorkspaceScope() === CURRENT_WORKSPACE; } catch { /* Keep the gate closed. */ }
      if (unchanged) {
        workspaceGuard.bindSession(userRef.current?.id ?? null);
        readyScopeRef.current = CURRENT_WORKSPACE;
        setWorkspaceReady(true);
        setSyncStatus('error');
        setSyncError(message);
      } else setWorkspaceError(message);
      setIsLoading(false);
    }
  };
  const resetPassword = async (email: string) => {
    if (!isConfigured) return { error: { message: 'خدمة الحسابات غير مهيأة' } };
    const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    return { error: result.error };
  };
  const retryWorkspace = async () => {
    try {
      if (departedAt.current) await suspendCurrentWorkspaceFocus(departedAt.current);
      window.location.reload();
    } catch (error) { setWorkspaceError(error instanceof Error ? error.message : 'تعذرت إعادة المحاولة.'); }
  };

  return <AuthContext.Provider value={{
    user, session, isLoading, isConfigured, syncStatus, lastSyncedAt, syncError, pendingCount,
    isAuthModalOpen, authModalMode, openAuthModal, closeAuthModal, setAuthModalMode,
    signInWithEmail, signUpWithEmail, signOut, resetPassword, triggerSync,
  }}>
    {workspaceReady ? <>
      {offlineWorkspace && <p role="status" dir="rtl" className="fixed bottom-20 inset-x-4 z-[90] rounded-xl bg-amber-950 border border-amber-500/40 p-3 text-xs text-amber-100 shadow-lg">بيانات الحساب المحفوظة متاحة محليًا. المزامنة متوقفة لحين عودة الاتصال أو تسجيل الدخول.</p>}
      {children}
    </> : <main dir="rtl" className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6">
      <section role={workspaceError ? 'alert' : 'status'} className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-bold">{workspaceError ? 'تعذر فتح بيانات الحساب' : 'جارٍ تجهيز بياناتك'}</h1>
        <p className="text-sm leading-relaxed">{workspaceError || 'بنجهز مساحة مستقلة للحساب. بياناتك السابقة محفوظة ولن تُرفع لحساب آخر تلقائيًا.'}</p>
        {workspaceError && <button type="button" onClick={() => void retryWorkspace()} className="px-5 py-3 rounded-xl bg-teal-700 font-bold">إعادة المحاولة</button>}
        {workspaceError && legacyRecovery && <button type="button" className="block mx-auto text-teal-300 underline py-2" onClick={() => {
          const url = URL.createObjectURL(new Blob([legacyRecovery], { type: 'application/json' }));
          const link = document.createElement('a');
          link.href = url; link.download = 'lifeos-before-account-separation.json'; link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}>تنزيل نسخة البيانات القديمة قبل إعادة المحاولة</button>}
      </section>
    </main>}
  </AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
