import React from 'react';
import { UserCheck, UserX, AlertTriangle, Clock } from 'lucide-react';
import { getAvatarColor, getInitials } from '../utils/avatar';

export function RejoinRequestModal({
  request,
  onApprove,
  onReject,
}) {
  if (!request) return null;

  const participantName = request.username || request.name || 'Participant';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="max-w-md w-full bg-[#090b10] border border-white/15 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6 animate-scaleIn">
        {/* Header with Warning Pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-semibold">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>Previously Removed Participant</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight pt-1">
              Rejoin Request
            </h2>
          </div>
        </div>

        {/* Participant Details Card */}
        <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/[0.08] flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white font-mono shrink-0 shadow-inner ${getAvatarColor(
              participantName
            )}`}
          >
            {getInitials(participantName)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm text-white truncate">
              {participantName}
            </h3>
            <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-xs mt-0.5">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span>Requested {request.requestedAt || 'Just now'}</span>
            </div>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <p>
            <strong className="text-white">{participantName}</strong> was previously removed from this stream and is requesting to re-enter using the invite code.
          </p>
          <p className="text-zinc-400 text-xs mt-1.5 font-normal">
            Approving grants them full access back to the synchronized video stream and room chat. Rejecting will deny them entry and redirect them to the Home Page.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Reject Button */}
          <button
            type="button"
            onClick={() => onReject(request)}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 hover:border-red-500/40 text-red-400 hover:text-red-300 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <UserX className="w-4 h-4" />
            <span>Reject</span>
          </button>

          {/* Approve Button */}
          <button
            type="button"
            onClick={() => onApprove(request)}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 active:scale-95"
          >
            <UserCheck className="w-4 h-4" />
            <span>Allow Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RejoinRequestModal;
