import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [message, setMessage] = useState('Verifying authentication token...');

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      try {
        // Check for error parameters in query string or URL hash
        const errorDescription = searchParams.get('error_description') || searchParams.get('error');
        if (errorDescription) {
          if (isMounted) {
            setStatus('error');
            setMessage(errorDescription);
          }
          return;
        }

        const type = searchParams.get('type');

        // Check hash fragments if using implicit flow (e.g. #access_token=...&type=recovery)
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const hashType = hashParams.get('type') || type;
        const hashError = hashParams.get('error_description');

        if (hashError) {
          if (isMounted) {
            setStatus('error');
            setMessage(hashError);
          }
          return;
        }

        // Get session
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }

        if (hashType === 'recovery') {
          // Password recovery flow -> direct to reset password page
          if (isMounted) {
            setStatus('success');
            setMessage('Identity verified. Redirecting to reset password...');
            setTimeout(() => navigate('/reset-password', { replace: true }), 1200);
          }
          return;
        }

        if (hashType === 'email_change') {
          if (isMounted) {
            setStatus('success');
            setMessage('Email address successfully confirmed and updated!');
            setTimeout(() => navigate('/profile?email_changed=true', { replace: true }), 1500);
          }
          return;
        }

        const isSignupConfirmation = searchParams.get('flow') === 'signup' || hashType === 'signup';
        if (isSignupConfirmation) {
          const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
          if (signOutError) throw signOutError;
        }

        // Signup or standard email confirmation
        if (isMounted) {
          setStatus('success');
          setMessage(
            isSignupConfirmation
              ? 'Email confirmed successfully! Redirecting you to sign in...'
              : 'Email confirmed successfully! Taking you to SyncCast...'
          );
          setTimeout(() => {
            if (isSignupConfirmation) {
              navigate('/sign-in?verified=true', { replace: true });
            } else if (data?.session) {
              navigate('/', { replace: true });
            } else {
              navigate('/sign-in?verified=true', { replace: true });
            }
          }, 1500);
        }
      } catch (err) {
        if (isMounted) {
          setStatus('error');
          setMessage(err.message || 'Authentication token validation failed or expired.');
        }
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#090b10] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 text-center space-y-6 animate-scaleIn">
        <div className="flex justify-center mb-1">
          <Logo size="md" />
        </div>

        {status === 'processing' && (
          <div className="space-y-4">
            <div className="w-12 h-12 border-3 border-[#e50914] border-t-transparent rounded-full animate-spin mx-auto" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Verifying Authorization
            </h1>
            <p className="text-xs text-zinc-400 font-mono">
              {message}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Verification Complete
            </h1>
            <p className="text-xs text-zinc-300">
              {message}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-950/40">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Verification Failed
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {message}
            </p>
            <div className="pt-2">
              <Link
                to="/sign-in"
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-[#e50914] hover:bg-[#c90812] text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Go to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthCallbackPage;
