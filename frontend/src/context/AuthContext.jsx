import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

const syncWithMongoDB = async (userData) => {
  if (!userData) return;
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
    const meta = userData.user_metadata || {};
    const effectiveName = meta.full_name || meta.display_name || meta.name || userData.email?.split('@')[0] || 'User';
    await fetch(`${backendUrl}/api/auth/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userData.id,
        email: userData.email,
        fullName: effectiveName,
        username: effectiveName.replace(/\s+/g, '_'),
      }),
    });
  } catch (err) {
    // Non-blocking background sync notice
    console.warn('[MongoDB User Sync Notice]:', err?.message);
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Derive profile info from user object & metadata
  const profile = useMemo(() => {
    if (!user) return null;
    const meta = user.user_metadata || {};
    return {
      id: user.id,
      email: user.email,
      fullName: meta.full_name || meta.display_name || meta.name || user.email?.split('@')[0] || 'User',
      displayName: meta.display_name || meta.full_name || user.email?.split('@')[0] || 'User',
      avatarColor: meta.avatar_color || 'bg-red-600',
      isEmailConfirmed: Boolean(user.email_confirmed_at || user.confirmed_at),
      canHost: true, // Every authenticated account is treated as a Host account by default
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
    };
  }, [user]);

  // Initial session restoration
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        if (!isSupabaseConfigured) {
          // Restore local development / demo session
          const storedLocalSession = typeof window !== 'undefined' ? localStorage.getItem('synccast_local_session') : null;
          if (storedLocalSession) {
            try {
              const parsed = JSON.parse(storedLocalSession);
              if (mounted && parsed?.user) {
                setSession(parsed);
                setUser(parsed.user);
                syncWithMongoDB(parsed.user);
              }
            } catch (e) {
              console.warn('[Local Auth] Failed to restore session:', e);
            }
          }
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[Supabase Auth] getSession notice:', error.message);
        }
        if (mounted) {
          setSession(data?.session || null);
          setUser(data?.session?.user || null);
          if (data?.session?.user) {
            syncWithMongoDB(data.session.user);
          }
        }
      } catch (err) {
        console.warn('[Supabase Auth] Initialization exception:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    if (!isSupabaseConfigured) {
      return () => {
        mounted = false;
      };
    }

    // Listen to real-time auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user || null);
      setLoading(false);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        setUser(currentSession?.user || null);
        if (currentSession?.user) {
          syncWithMongoDB(currentSession.user);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // 1. User Registration (Sign Up)
  const signUp = useCallback(async ({ email, password, fullName }) => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();
    const effectiveName = fullName?.trim() || cleanEmail.split('@')[0];

    // Local Development / Demo Mode Fallback
    if (!isSupabaseConfigured) {
      try {
        let accounts = [];
        try {
          accounts = JSON.parse(localStorage.getItem('synccast_local_accounts') || '[]');
        } catch {}

        if (accounts.some((acc) => acc.email === cleanEmail)) {
          const dupMsg = 'An account with this email address already exists. Please sign in instead.';
          setAuthError(dupMsg);
          return { success: false, error: dupMsg };
        }

        const userId = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        const demoUser = {
          id: userId,
          email: cleanEmail,
          user_metadata: {
            full_name: effectiveName,
            display_name: effectiveName,
            avatar_color: 'bg-red-600',
          },
          email_confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          app_metadata: { provider: 'local' },
        };

        const demoSession = {
          access_token: 'local-token-' + userId,
          token_type: 'bearer',
          user: demoUser,
          expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
        };

        accounts.push({
          id: userId,
          email: cleanEmail,
          password,
          fullName: effectiveName,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('synccast_local_accounts', JSON.stringify(accounts));
        localStorage.setItem('synccast_local_session', JSON.stringify(demoSession));

        setUser(demoUser);
        setSession(demoSession);
        syncWithMongoDB(demoUser);

        return {
          success: true,
          user: demoUser,
          session: demoSession,
          requiresEmailConfirmation: false,
        };
      } catch (err) {
        const msg = err.message || 'An error occurred during local registration.';
        setAuthError(msg);
        return { success: false, error: msg };
      }
    }

    // Live Supabase Authentication
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: effectiveName,
            display_name: effectiveName,
          },
          emailRedirectTo: `${origin}/auth/callback?flow=signup`,
        },
      });

      if (error) {
        let msg = error.message;
        if (msg === 'Failed to fetch' || msg.includes('Failed to fetch')) {
          msg = 'Unable to connect to Supabase (Failed to fetch). Please verify your VITE_SUPABASE_URL in frontend/.env.local and check your internet connection.';
        }
        setAuthError(msg);
        return { success: false, error: msg };
      }

      // Check if duplicate user without confirmation
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        const dupMsg = 'An account with this email address already exists. Please sign in instead.';
        setAuthError(dupMsg);
        return { success: false, error: dupMsg };
      }

      if (data?.user) {
        syncWithMongoDB(data.user);
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        requiresEmailConfirmation: !data.session,
      };
    } catch (err) {
      let msg = err.message || 'An error occurred during registration.';
      if (msg === 'Failed to fetch' || msg.includes('Failed to fetch')) {
        msg = 'Unable to connect to Supabase (Failed to fetch). Please verify your VITE_SUPABASE_URL in frontend/.env.local and check your internet connection.';
      }
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 2. User Login (Sign In)
  const signIn = useCallback(async ({ email, password }) => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();

    // Local Development / Demo Mode Fallback
    if (!isSupabaseConfigured) {
      try {
        let accounts = [];
        try {
          accounts = JSON.parse(localStorage.getItem('synccast_local_accounts') || '[]');
        } catch {}

        const matchedAccount = accounts.find((acc) => acc.email === cleanEmail);
        if (matchedAccount && matchedAccount.password && matchedAccount.password !== password) {
          const msg = 'Invalid email or password.';
          setAuthError(msg);
          return { success: false, error: msg };
        }

        const effectiveName = matchedAccount?.fullName || cleanEmail.split('@')[0];
        const userId = matchedAccount?.id || ('usr_' + Math.random().toString(36).substring(2, 9));
        const demoUser = {
          id: userId,
          email: cleanEmail,
          user_metadata: {
            full_name: effectiveName,
            display_name: effectiveName,
            avatar_color: 'bg-red-600',
          },
          email_confirmed_at: new Date().toISOString(),
          created_at: matchedAccount?.createdAt || new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          app_metadata: { provider: 'local' },
        };

        const demoSession = {
          access_token: 'local-token-' + userId,
          token_type: 'bearer',
          user: demoUser,
          expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
        };

        localStorage.setItem('synccast_local_session', JSON.stringify(demoSession));
        setUser(demoUser);
        setSession(demoSession);
        syncWithMongoDB(demoUser);

        return { success: true, user: demoUser, session: demoSession };
      } catch (err) {
        const msg = err.message || 'Failed to sign in locally.';
        setAuthError(msg);
        return { success: false, error: msg };
      }
    }

    // Live Supabase Authentication
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        let msg = error.message;
        if (msg === 'Failed to fetch' || msg.includes('Failed to fetch')) {
          msg = 'Unable to connect to Supabase (Failed to fetch). Please verify your VITE_SUPABASE_URL in frontend/.env.local and check your internet connection.';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'Please verify your email address before signing in. Check your inbox or request a new confirmation link.';
        } else if (msg.includes('Invalid login credentials')) {
          msg = 'Invalid email or password. Please verify your credentials and try again.';
        }
        setAuthError(msg);
        return { success: false, error: msg, requiresEmailConfirmation: error.message.includes('Email not confirmed') };
      }

      setUser(data.user);
      setSession(data.session);
      if (data?.user) {
        syncWithMongoDB(data.user);
      }
      return { success: true, user: data.user, session: data.session };
    } catch (err) {
      let msg = err.message || 'Failed to sign in. Please try again.';
      if (msg === 'Failed to fetch' || msg.includes('Failed to fetch')) {
        msg = 'Unable to connect to Supabase (Failed to fetch). Please verify your VITE_SUPABASE_URL in frontend/.env.local and check your internet connection.';
      }
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 3. Logout
  const signOut = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('[Supabase Auth] SignOut notice:', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('synccast_local_session');
      }
      setUser(null);
      setSession(null);
      try {
        sessionStorage.removeItem('pendingJoin');
        sessionStorage.removeItem('pendingHost');
      } catch {}
    }
  }, []);

  // 4. Forgot Password Flow
  const resetPassword = useCallback(async (email) => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      return { success: true };
    }
    try {
      const cleanEmail = email.trim().toLowerCase();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${origin}/reset-password`,
      });

      if (error) {
        let msg = error.message;
        if (msg === 'Failed to fetch' || msg.includes('Failed to fetch')) {
          msg = 'Unable to connect to Supabase. Please verify your network and settings.';
        }
        setAuthError(msg);
        return { success: false, error: msg };
      }
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Failed to send password reset email.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 5. Update Password (from Reset Password page or Profile)
  const updatePassword = useCallback(async (newPassword) => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      try {
        let accounts = JSON.parse(localStorage.getItem('synccast_local_accounts') || '[]');
        if (user?.email) {
          accounts = accounts.map((acc) =>
            acc.email === user.email ? { ...acc, password: newPassword } : acc
          );
          localStorage.setItem('synccast_local_accounts', JSON.stringify(accounts));
        }
        return { success: true };
      } catch {
        return { success: true };
      }
    }
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Failed to update password.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, [user]);

  // 6. Change Email Address
  const updateEmail = useCallback(async (newEmail) => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      if (!user) return { success: false, error: 'No active session.' };
      const cleanEmail = newEmail.trim().toLowerCase();
      const updatedUser = { ...user, email: cleanEmail };
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('synccast_local_session');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.user = updatedUser;
            localStorage.setItem('synccast_local_session', JSON.stringify(parsed));
          } catch {}
        }
      }
      return { success: true, user: updatedUser };
    }
    try {
      const cleanEmail = newEmail.trim().toLowerCase();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { data, error } = await supabase.auth.updateUser(
        { email: cleanEmail },
        { emailRedirectTo: `${origin}/auth/callback?type=email_change` }
      );
      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }
      return { success: true, user: data.user };
    } catch (err) {
      const msg = err.message || 'Failed to update email address.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, [user]);

  // 7. Update User Profile Metadata
  const updateProfile = useCallback(async (updates) => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      if (!user) return { success: false, error: 'No active session.' };
      const updatedUser = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...updates,
        },
      };
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('synccast_local_session');
        const parsed = stored ? JSON.parse(stored) : { user: updatedUser, access_token: 'local-token' };
        parsed.user = updatedUser;
        localStorage.setItem('synccast_local_session', JSON.stringify(parsed));
      }
      return { success: true, user: updatedUser };
    }
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });
      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      const msg = err.message || 'Failed to update user profile.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, [user]);

  // 8. Re-authentication for Sensitive Actions
  const reauthenticate = useCallback(async (currentPassword) => {
    if (!user?.email) {
      return { success: false, error: 'No active user found to re-authenticate.' };
    }
    if (!isSupabaseConfigured) {
      return { success: true };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (error) {
        return { success: false, error: 'Incorrect password. Verification failed.' };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Re-authentication failed.' };
    }
  }, [user]);

  // 9. Resend Verification Email
  const resendVerificationEmail = useCallback(async (email) => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      return { success: true };
    }
    try {
      const targetEmail = (email || user?.email || '').trim().toLowerCase();
      if (!targetEmail) {
        return { success: false, error: 'Email address is required.' };
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: {
          emailRedirectTo: `${origin}/auth/callback?flow=signup`,
        },
      });
      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Failed to resend verification email.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, [user]);

  // Unified authentication state flag (supports test automation override)
  const effectiveSignedIn = Boolean(user) || (typeof window !== 'undefined' && Boolean(window.__E2E_TESTING_SIGNED_IN__));

  const value = {
    user,
    session,
    profile,
    loading,
    isLoaded: !loading,
    authError,
    setAuthError,
    isSignedIn: effectiveSignedIn,
    isAuthenticated: effectiveSignedIn,
    effectiveSignedIn,
    isConfigured: isSupabaseConfigured,
    isEmailConfirmed: Boolean(user?.email_confirmed_at || user?.confirmed_at),
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateEmail,
    updateProfile,
    reauthenticate,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// oxlint-disable-next-line react/only-export-components
export function useUser() {
  const { user, profile, loading, isSignedIn } = useAuth();
  return {
    user,
    profile,
    isLoaded: !loading,
    isSignedIn,
  };
}

export default AuthContext;
