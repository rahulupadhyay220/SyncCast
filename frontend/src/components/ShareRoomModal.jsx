import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Play,
  UserPlus,
  Radio,
  MessageCircle,
  Send,
  Share2,
  Mail,
  Aperture,
  Hash,
} from 'lucide-react';

// Modal for inviting friends via direct link, room code, social apps, or email.
export function ShareRoomModal({
  isOpen,
  onClose,
  roomCode,
  movieTitle,
  userName = '',
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [invitedList, setInvitedList] = useState([]);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const shareUrl = `${origin}/join?room=${roomCode}`;
  const displayTitle = movieTitle || 'Cinema Premiere';

  const fullInviteText = `Join my synchronized cinema room for "${displayTitle}"! Watch together in real time: ${shareUrl} (Room Code: ${roomCode})`;

  // Copy helper with textarea fallback if navigator.clipboard is unavailable
  const copyToClipboard = async (text, type) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else if (type === 'invite') {
        setCopiedInvite(true);
        setTimeout(() => setCopiedInvite(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Watch ${displayTitle} with ${userName}`,
          text: `Join our synchronized watch session for "${displayTitle}".`,
          url: shareUrl,
        });
      } catch (err) {
        if (err && err.name !== 'AbortError') {
          copyToClipboard(shareUrl, 'link');
        }
      }
    } else {
      copyToClipboard(shareUrl, 'link');
    }
  };

  const handleSendInvites = (e) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;

    const newInvitees = inviteInput
      .split(/[,;\n]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (newInvitees.length === 0) return;

    setInvitedList((prev) => [...prev, ...newInvitees]);
    setInviteSuccessMsg(`Dispatched to ${newInvitees.length} guest${newInvitees.length > 1 ? 's' : ''}`);
    setInviteInput('');
    setTimeout(() => setInviteSuccessMsg(''), 3500);
  };

  const addPresetInvitee = (name) => {
    if (!invitedList.includes(name)) {
      setInvitedList((prev) => [...prev, name]);
      setInviteSuccessMsg(`Added ${name}`);
      setTimeout(() => setInviteSuccessMsg(''), 2500);
    }
  };

  const encodedInvite = encodeURIComponent(fullInviteText);
  const whatsAppUrl = `https://api.whatsapp.com/send?text=${encodedInvite}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Join our synchronized watch room for "${displayTitle}"`)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(`Watch "${displayTitle}" with me`)}&body=${encodedInvite}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedInvite}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#08090d]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-4 sm:p-7 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] ring-1 ring-white/[0.04] text-zinc-100 relative space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-28 bg-[#e50914]/15 blur-3xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-zinc-400 font-semibold">
                Live Session Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Invite to Room
            </h2>
            <p className="text-xs text-zinc-400 font-normal leading-relaxed">
              Sub-25ms frame-accurate synchronization with zero extensions required.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors cursor-pointer flex items-center justify-center shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stream info */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-[#e50914] shrink-0 shadow-inner">
              <Aperture className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white tracking-tight truncate">
                {displayTitle}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5">
                <span>Host: <strong className="text-zinc-200 font-medium">{userName}</strong></span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-500">Lock: Frame-Accurate</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-mono text-[10px]">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            <span>SYNCED</span>
          </div>
        </div>

        {/* Direct join link */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="uppercase tracking-[0.2em] text-zinc-400 font-semibold">
              Direct Join Link
            </span>
            <span className="text-zinc-500 text-[10px]">Auto-fills credentials</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-zinc-200 select-all focus:outline-none focus:border-white/30 transition-colors tracking-tight"
              />
            </div>
            <button
              onClick={() => copyToClipboard(shareUrl, 'link')}
              className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${copiedLink
                  ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                  : 'bg-[#e50914] hover:bg-[#c90812] text-white shadow-[0_0_15px_rgba(229,9,20,0.25)] active:scale-95'
                }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Copied</span>
                  <span className="xs:hidden">Done</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Copy Link</span>
                  <span className="xs:hidden">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Room passcode */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-zinc-400 text-[11px] tracking-[0.18em] uppercase">Passcode</span>
            <span className="font-mono font-bold text-white tracking-widest text-sm bg-black/80 px-2.5 py-0.5 rounded-md border border-white/10">
              {roomCode}
            </span>
          </div>

          <button
            onClick={() => copyToClipboard(roomCode, 'code')}
            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition-colors cursor-pointer px-2 py-1 rounded hover:bg-white/[0.05]"
          >
            {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedCode ? 'Copied' : 'Copy Passcode'}</span>
          </button>
        </div>

        {/* Social share shortcuts */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 font-semibold block">
            Broadcast Via Channels
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.18] transition-all flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white cursor-pointer group"
                title="Device AirDrop & Apps"
              >
                <span className="text-zinc-400 group-hover:text-white transition-colors">
                  <Share2 className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11px]">AirDrop</span>
              </button>
            )}

            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-emerald-500/10 border border-white/[0.06] hover:border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-emerald-400 cursor-pointer group"
            >
              <span className="text-zinc-400 group-hover:text-emerald-400 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11px]">WhatsApp</span>
            </a>

            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-sky-500/10 border border-white/[0.06] hover:border-sky-500/30 transition-all flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-sky-400 cursor-pointer group"
            >
              <span className="text-zinc-400 group-hover:text-sky-400 transition-colors">
                <Send className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11px]">Telegram</span>
            </a>

            <a
              href={emailUrl}
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-amber-500/10 border border-white/[0.06] hover:border-amber-500/30 transition-all flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-amber-400 cursor-pointer group"
            >
              <span className="text-zinc-400 group-hover:text-amber-400 transition-colors">
                <Mail className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11px]">Email</span>
            </a>

            <a
              href={twitterUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.22] transition-all flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white cursor-pointer group col-span-2 sm:col-span-1"
            >
              <span className="text-zinc-400 group-hover:text-white transition-colors">
                <Hash className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11px]">Post to X</span>
            </a>
          </div>
        </div>

        {/* Direct email invites */}
        <div className="space-y-2 pt-1 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 font-semibold">
              Direct Invites
            </span>
            <span className="text-zinc-500 font-mono text-[10px]">
              Comma-separated emails
            </span>
          </div>

          <form onSubmit={handleSendInvites} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="sarah@cinema.tv, marcus@film.org"
                className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
              />
              <button
                type="submit"
                disabled={!inviteInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-white/[0.08]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
            </div>

            {/* Quick-add demo contacts */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-zinc-500 font-mono text-[10px]">Quick:</span>
              {['Sarah C.', 'Marcus K.', 'Elena R.', 'Movie Club'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => addPresetInvitee(preset)}
                  className="px-2 py-0.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 text-[10px] font-mono transition-colors cursor-pointer"
                >
                  +{preset}
                </button>
              ))}
            </div>
          </form>

          {/* Feedback banner */}
          {inviteSuccessMsg && (
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-mono animate-fadeIn">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{inviteSuccessMsg}</span>
            </div>
          )}

          {/* Sent invites chip list */}
          {invitedList.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-mono text-zinc-500">Invited:</span>
              {invitedList.map((person, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-[10px] font-mono flex items-center gap-1"
                >
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  {person}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Modal actions */}
        <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => copyToClipboard(fullInviteText, 'invite')}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedInvite ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied Full Invite!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Invite Text</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#e50914] hover:bg-[#c90812] active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(229,9,20,0.3)]"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Enter Theater & Watch</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareRoomModal;
