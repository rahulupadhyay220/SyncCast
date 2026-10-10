import React from 'react';
import { Check, X, Shield, Info } from 'lucide-react';

export function RoleRestrictionPreview({
  simulatedRole,
  isRoomCreator = false,
  onSwitchRole,
}) {
  const permissions = [
    { name: 'Play / Pause Stream', id: 'PLAY_PAUSE', host: true, mod: false, part: false },
    { name: 'Timeline Scrub & Seek', id: 'SCRUB_SEEK', host: true, mod: false, part: false },
    { name: 'Change Video Source / URL', id: 'CHANGE_URL', host: true, mod: false, part: false },
    { name: 'Promote / Demote Roster', id: 'MANAGE_ROLES', host: true, mod: false, part: false },
    { name: 'Kick / Evict Viewers', id: 'EVICT_USERS', host: true, mod: false, part: false },
    { name: 'Live Chat & Reactions', id: 'CHAT_REACTIONS', host: true, mod: true, part: true },
  ];

  return (
    <div className="bg-[#050608] rounded-xl border border-white/[0.08] p-4 sm:p-5 text-white">
      {/* Header & Role Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#e50914]" />
          <div>
            <h3 className="text-xs font-mono font-medium tracking-wider uppercase text-zinc-200">
              Access Matrix
            </h3>
            <p className="text-[11px] text-zinc-500 font-sans">
              Dynamic role-based control protocol
            </p>
          </div>
        </div>

        {/* Minimal Segmented Switcher */}
        <div className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex p-0.5 rounded-lg bg-zinc-900/80 border border-white/[0.08]">
          {(isRoomCreator ? ['Host', 'Moderator', 'Participant'] : ['Moderator', 'Participant']).map((role) => {
            const isActive = simulatedRole === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => onSwitchRole?.(role)}
                className={`text-center py-1.5 sm:py-1 px-1 sm:px-2.5 rounded-md text-[10px] sm:text-[11px] font-mono tracking-tight transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-mono text-[11px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-zinc-500 uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-2 font-normal">Capability</th>
              <th className="py-2.5 px-2 text-center font-normal text-zinc-300">Host</th>
              <th className="py-2.5 px-2 text-center font-normal text-zinc-300">Mod</th>
              <th className="py-2.5 px-2 text-center font-normal text-zinc-300">Viewer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {permissions.map((p) => {
              const userHasPermission =
                simulatedRole === 'Host'
                  ? p.host
                  : simulatedRole === 'Moderator'
                  ? p.mod
                  : p.part;

              return (
                <tr
                  key={p.id}
                  className={`transition-colors ${
                    userHasPermission
                      ? 'bg-white/[0.015] hover:bg-white/[0.03]'
                      : 'opacity-70 hover:opacity-100 hover:bg-white/[0.02]'
                  }`}
                >
                  <td className="py-2.5 px-2 text-zinc-300 font-sans font-normal text-xs flex items-center gap-2">
                    <span className="w-1 h-1 rounded-sm bg-zinc-700" />
                    <span>{p.name}</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {p.host ? (
                      <Check className="w-3.5 h-3.5 text-zinc-200 mx-auto" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-zinc-700 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {p.mod ? (
                      <Check className="w-3.5 h-3.5 text-zinc-200 mx-auto" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-zinc-700 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {p.part ? (
                      <Check className="w-3.5 h-3.5 text-zinc-200 mx-auto" />
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

      {/* Minimal Footer */}
      <div className="mt-3.5 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2 text-[10px] font-mono text-zinc-500">
        <div className="flex items-center gap-1.5">
          <Info className="w-3 h-3 text-[#e50914]" />
          <span>Active role preview: <strong className="text-zinc-300 font-medium">{simulatedRole}</strong></span>
        </div>
        <span className="text-zinc-600">STATE_MUTABLE</span>
      </div>
    </div>
  );
}

export default RoleRestrictionPreview;
