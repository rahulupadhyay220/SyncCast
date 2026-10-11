import React from 'react';
import { Check, X, Shield, Info, Crown, User } from 'lucide-react';

export function RoleRestrictionPreview({
  simulatedRole,
}) {
  const isHost = simulatedRole === 'Host';

  const permissions = [
    { name: 'Start & Resume Stream', host: true, guest: false },
    { name: 'Pause Stream', host: true, guest: false },
    { name: 'End Stream & Terminate Session', host: true, guest: false },
    { name: 'Timeline Scrub & Seek', host: true, guest: false },
    { name: 'Change Video Source / URL', host: true, guest: false },
    { name: 'Remove / Evict Participants', host: true, guest: false },
    { name: 'Mute Participants', host: true, guest: false },
    { name: 'Transfer Host Role / Ownership', host: true, guest: false },
    { name: 'Watch Stream & Listen to Audio', host: true, guest: true },
    { name: 'Send Messages in Live Chat', host: true, guest: true },
    { name: 'Send Signal Reactions', host: true, guest: true },
    { name: 'Leave Room Voluntarily', host: true, guest: true },
  ];

  return (
    <div className="bg-[#050608] rounded-xl border border-white/[0.08] p-4 sm:p-5 text-white">
      {/* Header & Authenticated Role Display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#e50914]" />
          <div>
            <h3 className="text-xs font-mono font-medium tracking-wider uppercase text-zinc-200">
              Role Access Control (RBAC)
            </h3>
            <p className="text-[11px] text-zinc-500 font-sans">
              Strict host-exclusive control protocol
            </p>
          </div>
        </div>

        {/* Current Active Role Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-white/10 text-xs">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Your Role:</span>
          {isHost ? (
            <span className="flex items-center gap-1 font-semibold text-amber-300 font-mono text-[11px]">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>Host</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 font-semibold text-zinc-300 font-mono text-[11px]">
              <User className="w-3 h-3 text-zinc-400" />
              <span>Guest</span>
            </span>
          )}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-mono text-[11px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-zinc-500 uppercase text-[10px] tracking-wider">
              <th className="py-2 px-2 font-normal">Stream Capability</th>
              <th className="py-2 px-2 text-center font-semibold text-amber-400">Host</th>
              <th className="py-2 px-2 text-center font-semibold text-zinc-300">Guest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {permissions.map((p) => {
              const userHasPermission = isHost ? p.host : p.guest;

              return (
                <tr
                  key={p.name}
                  className={`transition-colors ${userHasPermission
                      ? 'bg-white/[0.02] hover:bg-white/[0.04]'
                      : 'opacity-60 hover:opacity-90 hover:bg-white/[0.01]'
                    }`}
                >
                  <td className="py-2 px-2 text-zinc-300 font-sans font-normal text-xs flex items-center gap-2">
                    <span className={`w-1 h-1 rounded-sm ${userHasPermission ? 'bg-emerald-400' : 'bg-zinc-700'}`} />
                    <span>{p.name}</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    {p.host ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-zinc-700 mx-auto" />
                    )}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {p.guest ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-zinc-700 mx-auto" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="mt-3.5 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2 text-[10px] font-mono text-zinc-500">
        <div className="flex items-center gap-1.5">
          <Info className="w-3 h-3 text-[#e50914]" />
          <span>
            {isHost
              ? 'You have full host ownership of this room'
              : 'Guests cannot control playback or transfer roles'}
          </span>
        </div>
        <span className="text-zinc-500">ENFORCED_SERVER_SIDE</span>
      </div>
    </div>
  );
}

export default RoleRestrictionPreview;
