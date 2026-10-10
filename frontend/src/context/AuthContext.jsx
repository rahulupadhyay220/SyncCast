import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

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
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
    };
  }, [user]);

  // Initial session restoration
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[Supabase Auth] getSession notice:', error.message);
        }
        if (mounted) {
          setSession(data?.session || null);
          setUser(data?.session?.user || null);
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
    try {
      const cleanEmail = email.trim().toLowerCase();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName?.trim() || cleanEmail.split('@')[0],
            display_name: fullName?.trim() || cleanEmail.split('@')[0],
          },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }

      // Check if duplicate user without confirmation
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        const dupMsg = 'An account with this email address already exists. Please sign in instead.';
        setAuthError(dupMsg);
        return { success: false, error: dupMsg };
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        requiresEmailConfirmation: !data.session,
      };
    } catch (err) {
      const msg = err.message || 'An error occurred during registration.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 2. User Login (Sign In)
  const signIn = useCallback(async ({ email, password }) => {
    setAuthError(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('Email not confirmed')) {
          msg = 'Please verify your email address before signing in. Check your inbox or request a new confirmation link.';
        } else if (msg.includes('Invalid login credentials')) {
          msg = 'Invalid email or password. Please verify your credentials and try again.';
        }
        setAuthError(msg);
        return { success: false, error: msg, requiresEmailConfirmation: error.message.includes('Email not confirmed') };
      }

      setUser(data.user);
      setSession(data.session);
      return { success: true, user: data.user, session: data.session };
    } catch (err) {
      const msg = err.message || 'Failed to sign in. Please try again.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 3. Logout
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Supabase Auth] SignOut notice:', err);
    } finally {
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
    try {
      const cleanEmail = email.trim().toLowerCase();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${origin}/reset-password`,
      });

      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
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
  }, []);

  // 6. Change Email Address
  const updateEmail = useCallback(async (newEmail) => {
    setAuthError(null);
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
  }, []);

  // 7. Update User Profile Metadata
  const updateProfile = useCallback(async (updates) => {
    setAuthError(null);
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
  }, []);

  // 8. Re-authentication for Sensitive Actions
  const reauthenticate = useCallback(async (currentPassword) => {
    if (!user?.email) {
      return { success: false, error: 'No active user found to re-authenticate.' };
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
          emailRedirectTo: `${origin}/auth/callback`,
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
