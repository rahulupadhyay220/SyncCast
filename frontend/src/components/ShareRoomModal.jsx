import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Play,
  UserPlus,
  Radio,
} from 'lucide-react';

/* =========================================================================
   Custom Minimalist Brand & Designer SVG Vectors
   ========================================================================= */

const XLogo = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const WhatsAppLogo = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
  </svg>
);

const TelegramLogo = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.919z" />
  </svg>
);

const AirDropLogo = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round shrink-0" aria-hidden="true">
    <path d="M12 19a7 7 0 0 0 7-7c0-2.2-.95-4.18-2.47-5.54M12 19a7 7 0 0 1-7-7c0-2.2.95-4.18 2.47-5.54" />
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    <path d="M12 3v3" />
  </svg>
);

const MailLogo = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round shrink-0" aria-hidden="true">
    <rect width="20" height="15" x="2" y="4.5" rx="2.5" />
    <path d="m22 7.5-9.17 5.73a1.6 1.6 0 0 1-1.66 0L2 7.5" />
  </svg>
);

const CinemaApertureLogo = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="m14.31 8 5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16 3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94" />
  </svg>
);

/* =========================================================================
   ShareRoomModal Component (Minimalist Art Style & Designer Theme)
   ========================================================================= */

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#08090d]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-4 sm:p-7 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] ring-1 ring-white/[0.04] text-zinc-100 relative space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Designer Ambient Flare */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-28 bg-[#e50914]/15 blur-3xl pointer-events-none rounded-full" />

        {/* Modal Top Header */}
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

        {/* Architectural Movie Context Card */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-[#e50914] shrink-0 shadow-inner">
              <CinemaApertureLogo />
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

        {/* Primary Shareable Link Section */}
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

        {/* Room Passcode Banner */}
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

        {/* Multi-Channel Broadcast with Custom Brand Logos */}
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
                  <AirDropLogo />
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
                <WhatsAppLogo />
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
                <TelegramLogo />
              </span>
              <span className="text-[11px]">Telegram</span>
            </a>

            <a
              href={emailUrl}
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-amber-500/10 border border-white/[0.06] hover:border-amber-500/30 transition-all flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-amber-400 cursor-pointer group"
            >
              <span className="text-zinc-400 group-hover:text-amber-400 transition-colors">
                <MailLogo />
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
                <XLogo />
              </span>
              <span className="text-[11px]">Post to X</span>
            </a>
          </div>
        </div>

        {/* Direct Participant Invites Form */}
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

            {/* Quick Contact Chips */}
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

          {/* Invites Confirmation Alert */}
          {inviteSuccessMsg && (
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-mono animate-fadeIn">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{inviteSuccessMsg}</span>
            </div>
          )}

          {/* List of Sent Invites */}
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

        {/* Modal Bottom Actions */}
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
