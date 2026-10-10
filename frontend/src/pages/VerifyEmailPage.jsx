import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { user, resendVerificationEmail } = useAuth();
  const emailParam = searchParams.get('email') || user?.email || '';

  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setResendSuccess(false);
    setResendError('');

    try {
      const res = await resendVerificationEmail(emailParam);
      if (res.success) {
        setResendSuccess(true);
        setCooldown(60); // 60s cooldown
      } else {
        setResendError(res.error || 'Failed to resend confirmation email.');
      }
    } catch (err) {
      setResendError(err.message || 'An unexpected error occurred.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 relative select-none">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#090b10] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 text-center animate-scaleIn">
        <div className="flex justify-center mb-1">
          <Logo size="md" />
        </div>

        {/* Mail Icon Pulse Circle */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-[#e50914] shadow-lg shadow-red-950/40">
          <Mail className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Check your email
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            We sent a verification link to{' '}
            <strong className="text-white font-mono break-all">
              {emailParam || 'your registered address'}
            </strong>
            . Please click the link inside to verify your account and start streaming.
          </p>
        </div>

        {/* Resend Status Feedback */}
        {resendSuccess && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs shadow-md animate-fadeIn flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Verification email sent! Please check your spam folder if not found.</span>
          </div>
        )}

        {resendError && (
          <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-red-200 text-xs shadow-md animate-fadeIn flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{resendError}</span>
          </div>
        )}

        {/* Resend Actions */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/20 text-white disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
            <span>
              {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend Verification Email'}
            </span>
          </button>

          <Link
            to="/sign-in"
            className="inline-flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
