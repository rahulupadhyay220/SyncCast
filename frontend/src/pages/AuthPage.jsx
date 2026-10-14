import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link, Navigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, resendVerificationEmail, isSignedIn, loading } = useAuth();

  // Derive mode directly from URL path or search query (?mode=signup or /sign-up)
  const mode =
    location.pathname.includes('sign-up') ||
    location.pathname.includes('signup') ||
    searchParams.get('mode') === 'signup'
      ? 'signup'
      : 'login';
  const redirectUrl = searchParams.get('redirect_url') || '/';
  const justRegistered = searchParams.get('registered') === 'true';
  const justVerified = searchParams.get('verified') === 'true';
  const justReset = searchParams.get('reset') === 'true';

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign up form state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & validation states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  // Password validation rules for sign up
  const passwordCriteria = useMemo(() => {
    return {
      minLength: signupPassword.length >= 8,
      hasUpper: /[A-Z]/.test(signupPassword),
      hasLower: /[a-z]/.test(signupPassword),
      hasNumber: /[0-9]/.test(signupPassword),
      hasSpecial: /[^A-Za-z0-9]/.test(signupPassword),
      matches: signupPassword.length > 0 && signupPassword === confirmPassword,
    };
  }, [signupPassword, confirmPassword]);

  // Calculate password strength score (0 to 100)
  const passwordStrength = useMemo(() => {
    if (!signupPassword) return 0;
    let score = 0;
    if (passwordCriteria.minLength) score += 20;
    if (passwordCriteria.hasUpper) score += 20;
    if (passwordCriteria.hasLower) score += 20;
    if (passwordCriteria.hasNumber) score += 20;
    if (passwordCriteria.hasSpecial) score += 20;
    return score;
  }, [signupPassword, passwordCriteria]);

  const strengthLabel = useMemo(() => {
    if (passwordStrength === 0) return { text: '', color: 'bg-zinc-700' };
    if (passwordStrength <= 40) return { text: 'Weak', color: 'bg-red-500' };
    if (passwordStrength <= 60) return { text: 'Moderate', color: 'bg-amber-500' };
    if (passwordStrength <= 80) return { text: 'Good', color: 'bg-blue-500' };
    return { text: 'Strong', color: 'bg-emerald-500' };
  }, [passwordStrength]);

  const isPasswordValid =
    passwordCriteria.minLength &&
    passwordCriteria.hasUpper &&
    passwordCriteria.hasLower &&
    passwordCriteria.hasNumber &&
    passwordCriteria.hasSpecial;

  // If already authenticated, redirect
  if (!loading && isSignedIn) {
    return <Navigate to={redirectUrl} replace />;
  }

  const switchMode = (newMode) => {
    setErrorMessage('');
    setSuccessMessage('');
    setUnverifiedEmail('');
    const next = new URLSearchParams(searchParams);
    next.delete('mode');
    navigate({
      pathname: newMode === 'signup' ? '/sign-up' : '/sign-in',
      search: next.toString(),
    });
  };

  // Rate Limiting helper constants (OWASP authentication protection)
  const AUTH_WINDOW_MS = 10 * 60 * 1000; // 10-minute sliding window
  const MAX_AUTH_ATTEMPTS = 10; // Max 10 attempts per window

  const getRemainingAttempts = (storageKey) => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return MAX_AUTH_ATTEMPTS;
      const timestamps = JSON.parse(raw);
      const now = Date.now();
      const active = timestamps.filter((t) => now - t < AUTH_WINDOW_MS);
      return Math.max(0, MAX_AUTH_ATTEMPTS - active.length);
    } catch {
      return MAX_AUTH_ATTEMPTS;
    }
  };

  const recordAuthAttempt = (storageKey) => {
    try {
      const raw = localStorage.getItem(storageKey);
      const timestamps = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      const active = timestamps.filter((t) => now - t < AUTH_WINDOW_MS);
      active.push(now);
      localStorage.setItem(storageKey, JSON.stringify(active));
      return Math.max(0, MAX_AUTH_ATTEMPTS - active.length);
    } catch {
      return MAX_AUTH_ATTEMPTS;
    }
  };

  // Handle Login submission with 10 attempts / 10-minute rate limit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setUnverifiedEmail('');

    const remaining = getRemainingAttempts('synccast_auth_login_attempts');
    if (remaining <= 0) {
      setErrorMessage(
        'Rate limit reached: Maximum 10 login attempts exceeded within 10 minutes. Please wait before retrying to protect your account.'
      );
      return;
    }

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }

    // Record this attempt toward the 10-minute limit
    const attemptsLeft = recordAuthAttempt('synccast_auth_login_attempts');

    setSubmitting(true);
    try {
      const cleanEmail = loginEmail.trim().toLowerCase();
      const res = await signIn({
        email: cleanEmail,
        password: loginPassword,
      });

      if (!res.success) {
        if (res.requiresEmailConfirmation) {
          setUnverifiedEmail(cleanEmail);
          setErrorMessage('Your email address has not been verified yet. Please check your inbox or resend the verification email.');
          return;
        }
        const warningSuffix = attemptsLeft <= 3 ? ` (${attemptsLeft} attempts remaining in this 10-minute window)` : '';
        setErrorMessage((res.error || 'Invalid email or password. Please try again.') + warningSuffix);
      } else {
        // Reset rate limiter on successful login
        try {
          localStorage.removeItem('synccast_auth_login_attempts');
        } catch {}
        navigate(redirectUrl, { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Sign Up submission with 10 attempts / 10-minute rate limit and input sanitization
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setUnverifiedEmail('');

    const remaining = getRemainingAttempts('synccast_auth_signup_attempts');
    if (remaining <= 0) {
      setErrorMessage(
        'Rate limit reached: Maximum 10 account creation requests exceeded within 10 minutes. Please try again later.'
      );
      return;
    }

    // Sanitize user inputs against XSS and whitespace injection
    const cleanFullName = fullName.replace(/<[^>]*>/g, '').trim();
    const cleanEmail = signupEmail.replace(/<[^>]*>/g, '').trim().toLowerCase();

    if (!cleanFullName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Please ensure your password satisfies all security requirements.');
      return;
    }

    if (signupPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    // Record this attempt toward the 10-minute limit
    const attemptsLeft = recordAuthAttempt('synccast_auth_signup_attempts');

    setSubmitting(true);
    try {
      const res = await signUp({
        email: cleanEmail,
        password: signupPassword,
        fullName: cleanFullName,
      });

      if (!res.success) {
        const warningSuffix = attemptsLeft <= 3 ? ` (${attemptsLeft} sign up attempts remaining)` : '';
        setErrorMessage((res.error || 'Failed to create account. Please try again.') + warningSuffix);
      } else if (res.requiresEmailConfirmation) {
        navigate(`/verify-email?email=${encodeURIComponent(cleanEmail)}`);
      } else {
        try {
          localStorage.removeItem('synccast_auth_signup_attempts');
        } catch {}
        navigate(redirectUrl, { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred during account creation.');
    } finally {
      setSubmitting(false);
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendingVerification(true);
    try {
      const res = await resendVerificationEmail(unverifiedEmail);
      if (res.success) {
        setSuccessMessage('A fresh verification link has been sent to your email.');
      } else {
        setErrorMessage(res.error || 'Failed to resend verification email.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error resending verification email.');
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center py-10 px-4 sm:px-6 relative overflow-hidden bg-[#050608]">
      {/* Dynamic Background Glow & Ambient Gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-zinc-800/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card Container */}
        <div className="bg-[#0b0c10]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          
          {/* Header & Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex justify-center mb-3">
              <Logo size="lg" />
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">
              {mode === 'login' ? 'Welcome Back to SyncCast' : 'Create Your SyncCast Account'}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              {mode === 'login'
                ? 'Sign in to access live synchronized cinema and stream rooms'
                : 'Join watch parties, chat with friends, and host YouTube streams'}
            </p>
          </div>


          {/* Segmented Switcher: Sign In vs Create Account */}
          <div className="bg-zinc-900/90 p-1 rounded-xl border border-white/10 grid grid-cols-2 gap-1 mb-6">
            <button
              type="button"
              id="auth-tab-login"
              onClick={() => switchMode('login')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login'
                  ? 'bg-zinc-800 text-white shadow-md border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              id="auth-tab-signup"
              onClick={() => switchMode('signup')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#e50914] text-white shadow-md shadow-red-950/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Contextual Notice Banners */}
          {justRegistered && mode === 'login' && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-300 text-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200">Registration Complete!</p>
                <p className="text-emerald-400/90 text-[11px] mt-0.5">
                  Your account was created. Please sign in with your credentials.
                </p>
              </div>
            </div>
          )}

          {justVerified && mode === 'login' && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-300 text-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200">Email Successfully Verified!</p>
                <p className="text-emerald-400/90 text-[11px] mt-0.5">
                  Your email has been confirmed. You can now access all protected features.
                </p>
              </div>
            </div>
          )}

          {justReset && mode === 'login' && (
            <div className="mb-5 p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-2.5 text-blue-300 text-xs animate-fadeIn">
              <KeyRound className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-200">Password Updated</p>
                <p className="text-blue-400/90 text-[11px] mt-0.5">
                  Your password has been changed. Sign in with your new credentials.
                </p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-300 text-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="flex-1 text-[11px] font-medium">{successMessage}</p>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-2.5 text-red-300 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[12px] font-medium leading-relaxed">{errorMessage}</p>
                {unverifiedEmail && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                    className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-900/60 hover:bg-red-800 text-white font-medium text-[11px] transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${resendingVerification ? 'animate-spin' : ''}`} />
                    <span>{resendingVerification ? 'Resending...' : 'Resend Verification Email'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-form">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    id="login-email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full bg-[#14151b] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-medium text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    id="login-password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full bg-[#14151b] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-red-600 focus:ring-red-500 accent-red-600"
                  />
                  <span className="text-xs text-zinc-300">Remember this device</span>
                </label>
              </div>

              {/* Sign In Submit Button */}
              <button
                type="submit"
                id="login-submit-button"
                disabled={submitting}
                className="w-full mt-2 py-2.5 px-4 bg-[#e50914] hover:bg-[#c90812] active:bg-[#a5070f] text-white text-xs font-semibold rounded-xl shadow-lg shadow-red-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In to SyncCast</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Bottom Switcher */}
              <div className="text-center pt-2">
                <p className="text-xs text-zinc-400">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-white hover:text-red-400 font-semibold underline underline-offset-2 transition-colors cursor-pointer ml-1"
                  >
                    Create one now
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignupSubmit} className="space-y-4" id="signup-form">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    id="signup-name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    autoComplete="name"
                    className="w-full bg-[#14151b] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    id="signup-email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full bg-[#14151b] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    id="signup-password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    className="w-full bg-[#14151b] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title={showSignupPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {signupPassword.length > 0 && (
                  <div className="mt-2 space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400 font-medium">Strength:</span>
                      <span className={`font-semibold ${strengthLabel.text === 'Strong' ? 'text-emerald-400' : strengthLabel.text === 'Good' ? 'text-blue-400' : strengthLabel.text === 'Moderate' ? 'text-amber-400' : 'text-red-400'}`}>
                        {strengthLabel.text}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strengthLabel.color}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="signup-confirm-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className="w-full bg-[#14151b] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl space-y-1.5 text-[11px]">
                <p className="text-zinc-400 font-medium mb-1">Security Requirements:</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.minLength ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    <span className="text-xs">{passwordCriteria.minLength ? '✓' : '○'}</span>
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    <span className="text-xs">{passwordCriteria.hasUpper ? '✓' : '○'}</span>
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasLower ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    <span className="text-xs">{passwordCriteria.hasLower ? '✓' : '○'}</span>
                    <span>Lowercase (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    <span className="text-xs">{passwordCriteria.hasNumber ? '✓' : '○'}</span>
                    <span>Number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    <span className="text-xs">{passwordCriteria.hasSpecial ? '✓' : '○'}</span>
                    <span>Special character</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.matches ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    <span className="text-xs">{passwordCriteria.matches ? '✓' : '○'}</span>
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>

              {/* Sign Up Submit Button */}
              <button
                type="submit"
                id="signup-submit-button"
                disabled={submitting}
                className="w-full mt-2 py-2.5 px-4 bg-[#e50914] hover:bg-[#c90812] active:bg-[#a5070f] text-white text-xs font-semibold rounded-xl shadow-lg shadow-red-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Account & Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Bottom Switcher */}
              <div className="text-center pt-2">
                <p className="text-xs text-zinc-400">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-white hover:text-red-400 font-semibold underline underline-offset-2 transition-colors cursor-pointer ml-1"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Security Footer Note */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>End-to-end encrypted sessions & Row Level Security</span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AuthPage;
