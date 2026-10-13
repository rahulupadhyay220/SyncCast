import React, { useState } from 'react';
import { Lock, ShieldCheck, X, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ReauthModal({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Sensitive Action',
  actionDescription = 'Please confirm your current password to proceed with this sensitive action.',
}) {
  const { reauthenticate } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter your current password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await reauthenticate(password);
      if (res.success) {
        setPassword('');
        onSuccess?.();
        onClose?.();
      } else {
        setError(res.error || 'Incorrect password. Verification failed.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during verification.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="max-w-md w-full bg-[#090b10] border border-white/15 rounded-2xl p-6 sm:p-7 shadow-2xl relative space-y-5 animate-scaleIn">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-mono text-[11px] font-semibold">
            <ShieldCheck className="w-3 h-3" />
            <span>Security Verification</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {actionTitle}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {actionDescription}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-red-200 text-xs shadow-md animate-fadeIn flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
              Current Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter current password"
                required
                autoFocus
                className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-zinc-900/60 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#e50914] hover:bg-[#c90812] active:bg-[#a5070f] text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-red-950/30"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Confirm & Proceed</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReauthModal;
