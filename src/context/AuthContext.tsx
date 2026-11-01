import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncAllWithCloud, flushPendingSyncQueue, getPendingSyncCount, retryFailedMutations } from '../db/syncEngine';

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
  // Modal controls
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: AuthModalMode) => void;
  // Auth operations
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Guards against duplicate / infinite loop syncing
  const userRef = useRef<User | null>(null);
  userRef.current = user;
  const isSyncingRef = useRef<boolean>(false);
  const hasInitialSyncedRef = useRef<boolean>(false);

  // Modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('signin');

  const isConfigured = isSupabaseConfigured();

  // Internal execution of cloud sync with concurrency lock
  const runSync = useCallback(async (userId: string) => {
    if (isSyncingRef.current || !isConfigured) return;
    isSyncingRef.current = true;
    setSyncError(null);
    setSyncStatus('syncing');

    try {
      // First flush any pending offline mutations
      await flushPendingSyncQueue(userId);
      const remainingCount = await getPendingSyncCount(userId);
      if (userRef.current?.id !== userId) return;
      setPendingCount(remainingCount);
      if (remainingCount > 0) throw new Error(`توجد ${remainingCount} تعديلات لم تصل للسحابة. أعد محاولة المزامنة؛ لن يتم سحب بيانات فوقها.`);

      const result = await syncAllWithCloud(userId);
      if (userRef.current?.id !== userId) return;
      if (result.success) {
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
      } else {
        setSyncStatus('error');
        setSyncError(result.error || 'تعذرت المزامنة');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      if (userRef.current?.id === userId) {
        setSyncStatus('error');
        setSyncError(err instanceof Error ? err.message : 'تعذرت المزامنة');
      }
    } finally {
      isSyncingRef.current = false;
      if (userRef.current?.id === userId) {
        getPendingSyncCount(userId).then(count => { if (userRef.current?.id === userId) setPendingCount(count); }).catch(() => {});
      }
    }
  }, [isConfigured]);

  const triggerSync = useCallback(async () => {
    if (userRef.current?.id) {
      await retryFailedMutations(userRef.current.id);
      await runSync(userRef.current.id);
    }
  }, [runSync]);

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // Clean up access token hash if returning from email confirmation
    if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('error'))) {
      setTimeout(() => {
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }, 500);
    }

    // Check active session once on initial mount
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      userRef.current = initSession?.user ?? null;
      setSession(initSession);
      setUser(initSession?.user ?? null);
      setIsLoading(false);

      if (initSession?.user) {
        getPendingSyncCount(initSession.user.id).then(setPendingCount);
        if (!hasInitialSyncedRef.current) {
          hasInitialSyncedRef.current = true;
          runSync(initSession.user.id);
        }
      }
    });

    // Listen for auth state changes (strictly once)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      userRef.current = newSession?.user ?? null;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);

      if (event === 'SIGNED_IN' && newSession?.user) {
        getPendingSyncCount(newSession.user.id).then(setPendingCount);
        if (!hasInitialSyncedRef.current) {
          hasInitialSyncedRef.current = true;
          setTimeout(() => { void runSync(newSession.user.id); }, 0);
        }
      } else if (event === 'SIGNED_OUT') {
        hasInitialSyncedRef.current = false;
        setSyncStatus('idle');
        setSyncError(null);
        setLastSyncedAt(null);
        setPendingCount(0);
      }
    });

    // Listen for network reconnect to automatically flush offline mutation queue
    const handleOnline = () => { if (userRef.current?.id) void runSync(userRef.current.id); };
    const handlePending = () => {
      setSyncStatus('idle');
      if (userRef.current?.id) void getPendingSyncCount(userRef.current.id).then(setPendingCount).catch(() => {});
    };
    const handleOffline = () => setSyncStatus('idle');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('lifeos:sync-pending', handlePending);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('lifeos:sync-pending', handlePending);
    };
  }, [isConfigured, runSync]);

  const openAuthModal = (mode: AuthModalMode = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: { message: 'خدمة Supabase غير مهيأة بعد في ملف الإعدادات' } };
    }
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (!res.error) {
      closeAuthModal();
      if (res.data.user) {
        hasInitialSyncedRef.current = false; // allow fresh sync
        runSync(res.data.user.id);
      }
    }
    return { error: res.error };
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    if (!isConfigured) {
      return { error: { message: 'خدمة Supabase غير مهيأة بعد في ملف الإعدادات' }, data: null };
    }
    const res = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
      },
    });
    return { error: res.error, data: res.data };
  };

  const signOut = async () => {
    if (!isConfigured) return;
    hasInitialSyncedRef.current = false;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSyncStatus('idle');
  };

  const resetPassword = async (email: string) => {
    if (!isConfigured) {
      return { error: { message: 'خدمة Supabase غير مهيأة' } };
    }
    const res = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return { error: res.error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured,
        syncStatus,
        lastSyncedAt,
        syncError,
        pendingCount,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        resetPassword,
        triggerSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
