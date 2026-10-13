import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  KeyRound,
  LogOut,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAvatarColor, getInitials } from '../utils/avatar';
import { ReauthModal } from '../components/ReauthModal';

export function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailChanged = searchParams.get('email_changed') === 'true';

  const {
    user,
    profile,
    updateProfile,
    updateEmail,
    updatePassword,
    signOut,
  } = useAuth();

  // Tab: 'general' | 'security'
  const [activeTab, setActiveTab] = useState('general');

  // General profile state
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState(null); // { type: 'success'|'error', message }
  const [savingEmail, setSavingEmail] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState(null); // { type: 'success'|'error', message }
  const [savingPassword, setSavingPassword] = useState(false);

  // Reauth modal state
  const [reauthModalOpen, setReauthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'change_email' | 'change_password'

  const displayNameVal = profile?.displayName || user?.email?.split('@')[0] || 'User';

  // 1. Save Display Name
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);

    if (!displayName.trim()) {
      setProfileError('Display name cannot be blank.');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await updateProfile({
        display_name: displayName.trim(),
        full_name: displayName.trim(),
      });
      if (res.success) {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        setProfileError(res.error || 'Failed to update profile.');
      }
    } catch (err) {
      setProfileError(err.message || 'An unexpected error occurred.');
    } finally {
      setSavingProfile(false);
    }
  };

  // 2. Trigger Sensitive Actions requiring Re-Authentication
  const triggerEmailChange = (e) => {
    e.preventDefault();
    setEmailStatus(null);
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setEmailStatus({ type: 'error', message: 'Please enter a valid new email address.' });
      return;
    }
    if (newEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      setEmailStatus({ type: 'error', message: 'New email must be different from your current email.' });
      return;
    }

    setPendingAction('change_email');
    setReauthModalOpen(true);
  };

  const triggerPasswordChange = (e) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setPendingAction('change_password');
    setReauthModalOpen(true);
  };

  // Callback executed after ReauthModal verifies current password
  const handleReauthConfirmed = async () => {
    if (pendingAction === 'change_email') {
      setSavingEmail(true);
      try {
        const res = await updateEmail(newEmail.trim());
        if (res.success) {
          setEmailStatus({
            type: 'success',
            message: `Verification links sent! Please check both your current inbox (${user?.email}) and new inbox (${newEmail}) to confirm.`,
          });
          setNewEmail('');
        } else {
          setEmailStatus({ type: 'error', message: res.error || 'Failed to initiate email change.' });
        }
      } catch (err) {
        setEmailStatus({ type: 'error', message: err.message || 'Error updating email address.' });
      } finally {
        setSavingEmail(false);
      }
    } else if (pendingAction === 'change_password') {
      setSavingPassword(true);
      try {
        const res = await updatePassword(newPassword);
        if (res.success) {
          setPasswordStatus({ type: 'success', message: 'Your password has been securely updated!' });
          setNewPassword('');
          setConfirmNewPassword('');
        } else {
          setPasswordStatus({ type: 'error', message: res.error || 'Failed to update password.' });
        }
      } catch (err) {
        setPasswordStatus({ type: 'error', message: err.message || 'Error updating password.' });
      } finally {
        setSavingPassword(false);
      }
    }
    setPendingAction(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            Account Management
          </span>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            User Profile & Security
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Manage your account credentials, security settings, and profile details.
          </p>
        </div>

        {emailChanged && (
          <div className="p-4 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs shadow-md animate-fadeIn flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Your email address has been successfully confirmed and updated!</span>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="p-6 rounded-2xl bg-[#090b10] border border-white/[0.08] flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-2xl text-white font-mono shrink-0 shadow-lg ${getAvatarColor(
                displayNameVal
              )}`}
            >
              {getInitials(displayNameVal)}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white truncate max-w-xs sm:max-w-md">
                {displayNameVal}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-zinc-400 font-mono">
                <span>{user?.email}</span>
                <span>•</span>
                {profile?.isEmailConfirmed ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                    <Check className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[10px]">
                    <span>Unverified</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 font-mono pt-1">
                User ID: <span className="text-zinc-400">{user?.id}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="py-2 px-3.5 rounded-xl bg-zinc-900 hover:bg-red-500/10 hover:text-red-400 border border-white/10 hover:border-red-500/30 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.08] gap-4 text-xs font-mono uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'general'
                ? 'border-[#e50914] text-white font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            General Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'security'
                ? 'border-[#e50914] text-white font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Security & Credentials
          </button>
        </div>

        {/* TAB 1: General Profile */}
        {activeTab === 'general' && (
          <div className="p-6 sm:p-7 rounded-2xl bg-[#090b10] border border-white/[0.08] space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Profile Details</h3>
              <p className="text-xs text-zinc-400">
                Update how your name appears in live stream rooms and chatboxes.
              </p>
            </div>

            {profileSuccess && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs shadow-md animate-fadeIn flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-red-200 text-xs shadow-md animate-fadeIn flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter display name"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-900/60 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Email Address (Read Only)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-950/60 border border-white/5 text-sm text-zinc-400 opacity-60 cursor-not-allowed font-mono"
                  />
                </div>
                <span className="text-[11px] text-zinc-500">
                  To change your email address, use the Security tab with password confirmation.
                </span>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="py-2.5 px-5 rounded-xl font-semibold text-xs bg-[#e50914] text-white hover:bg-[#c90812] active:bg-[#a5070f] disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2 shadow-md shadow-red-950/30"
              >
                {savingProfile ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Security & Credentials (Change Email + Change Password) */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* 1. Change Email Section (Req 5) */}
            <div className="p-6 sm:p-7 rounded-2xl bg-[#090b10] border border-white/[0.08] space-y-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-[#e50914] font-semibold">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Change Email Address</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Update Registered Email
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                  Changing your email address requires re-authentication. A confirmation link will be sent to the new email address. Your current email will remain active until verified.
                </p>
              </div>

              {emailStatus && (
                <div
                  className={`p-3 rounded-xl text-xs shadow-md animate-fadeIn flex items-start gap-2 ${
                    emailStatus.type === 'success'
                      ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-200'
                      : 'bg-red-950/70 border border-red-500/40 text-red-200'
                  }`}
                >
                  {emailStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <span>{emailStatus.message}</span>
                </div>
              )}

              <form onSubmit={triggerEmailChange} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                    New Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email address"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-900/60 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914] transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingEmail}
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/20 text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verify Password & Update Email</span>
                </button>
              </form>
            </div>

            {/* 2. Change Password Section (Req 4 & 6) */}
            <div className="p-6 sm:p-7 rounded-2xl bg-[#090b10] border border-white/[0.08] space-y-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-[#e50914] font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Password Security</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Change Password
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                  Update your password to keep your account safe. You will be prompted to confirm your current password prior to saving changes.
                </p>
              </div>

              {passwordStatus && (
                <div
                  className={`p-3 rounded-xl text-xs shadow-md animate-fadeIn flex items-start gap-2 ${
                    passwordStatus.type === 'success'
                      ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-200'
                      : 'bg-red-950/70 border border-red-500/40 text-red-200'
                  }`}
                >
                  {passwordStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <form onSubmit={triggerPasswordChange} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                    New Password (Min 8 Characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-900/60 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-900/60 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914] transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/20 text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Verify Password & Update</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Re-Authentication Modal */}
      <ReauthModal
        isOpen={reauthModalOpen}
        onClose={() => setReauthModalOpen(false)}
        onSuccess={handleReauthConfirmed}
        actionTitle={
          pendingAction === 'change_email'
            ? 'Confirm Email Change'
            : 'Confirm Password Change'
        }
        actionDescription={
          pendingAction === 'change_email'
            ? `Please enter your current password to authorize changing your account email address to ${newEmail}.`
            : 'Please enter your current password to authorize setting a new password.'
        }
      />
    </div>
  );
}

export default ProfilePage;
