import React from 'react';
import { UserMinus, Ban, Crown, UserPlus, MicOff } from 'lucide-react';
import { getAvatarColor, getInitials } from '../utils/avatar';

export function ParticipantList({
  participants = [],
  canManageUsers = false,
  onTransferHost,
  onMuteUser,
  onRemove,
  onBlock,
  onOpenShareModal,
}) {
  return (
    <div className="flex flex-col h-full bg-[#090b10] rounded-xl border border-white/[0.08] overflow-hidden text-white">
      {/* Header */}
      <div className="p-3 border-b border-white/[0.06] flex items-center justify-between bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <Crown className="w-3.5 h-3.5 text-[#e50914]" />
          <h3 className="font-mono text-xs uppercase tracking-wider text-zinc-300 font-semibold">
            Peers ({participants.length})
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenShareModal && (
            <button
              onClick={onOpenShareModal}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#e50914] hover:bg-[#c90812] text-white text-[10px] font-mono font-semibold transition-colors cursor-pointer"
              title="Share room link to multiple participants"
            >
              <UserPlus className="w-3 h-3" />
              <span>Invite</span>
            </button>
          )}

          {canManageUsers ? (
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>Host</span>
            </span>
          ) : (
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-white/10 uppercase">
              Guest
            </span>
          )}
        </div>
      </div>

      {/* Participant Roster */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[460px]">
        {participants.map((user) => {
          const isHost = user.role === 'Host';
          const isSelf = user.isSelf;

          return (
            <div
              key={user.id}
              className={`p-2.5 rounded-lg border transition-colors flex items-center justify-between gap-3 ${isSelf
                  ? 'bg-zinc-800/60 border-white/20'
                  : 'bg-zinc-900/40 border-white/[0.06] hover:bg-zinc-900/80 hover:border-white/10'
                }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-[10px] text-white font-mono ${getAvatarColor(
                      user.name
                    )}`}
                  >
                    {getInitials(user.name)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-sm bg-emerald-400 border border-[#090b10]" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-xs text-white truncate">
                      {user.name}
                    </p>
                    {isHost && (
                      <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 rounded flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" />
                        Host
                      </span>
                    )}
                    {!isHost && (
                      <span className="text-[9px] font-mono text-zinc-400 bg-zinc-800/80 px-1 rounded">
                        Guest
                      </span>
                    )}
                    {isSelf && (
                      <span className="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-800 px-1 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Joined {user.joinedAt}
                  </p>
                </div>
              </div>

              {/* Moderation Controls (Host only & not self) */}
              {canManageUsers && !isSelf && (
                <div className="flex items-center gap-1 shrink-0">
                  {/* Transfer Host Ownership */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Transfer host ownership to ${user.name}? You will become a Guest participant.`)) {
                        onTransferHost?.(user.id, user.name);
                      }
                    }}
                    className="p-1 rounded text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 transition-colors cursor-pointer"
                    title="Transfer Host Ownership to this participant"
                  >
                    <Crown className="w-3.5 h-3.5" />
                  </button>

                  {/* Mute Participant */}
                  <button
                    onClick={() => onMuteUser?.(user.id, user.name)}
                    className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Mute participant audio"
                  >
                    <MicOff className="w-3.5 h-3.5" />
                  </button>

                  {/* Remove Participant from stream */}
                  <button
                    onClick={() => onRemove?.(user.id, user.name)}
                    className="p-1 rounded text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 transition-colors cursor-pointer"
                    title="Remove participant from stream"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>

                  {/* Permanently Block Participant */}
                  <button
                    onClick={() => onBlock?.(user.id, user.name)}
                    className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-colors cursor-pointer"
                    title="Permanently block participant"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-white/[0.06] bg-[#07080c] text-[10px] text-zinc-500 font-mono flex items-center justify-between">
        <span>Relay: Connected</span>
        <span className="text-zinc-400">Sub-25ms Sync</span>
      </div>
    </div>
  );
}

export default ParticipantList;
