import React from 'react';

/* =========================================================================
   Custom Bespoke Sculptural SVG Icons for Workflow Steps
   ========================================================================= */

// Step 01: Cinema Optical Lens & Holographic Play Aperture
export function VideoSelectorIcon({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 28 28" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lensGrad" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e50914" />
          <stop offset="1" stopColor="#80050b" />
        </linearGradient>
      </defs>
      {/* Outer camera / projector body */}
      <rect x="2.5" y="4.5" width="23" height="19" rx="5" className="stroke-white/30" strokeWidth="1.5" />
      {/* Top projector sprocket markers */}
      <circle cx="7" cy="8" r="1" className="fill-white/40" />
      <circle cx="11" cy="8" r="1" className="fill-white/40" />
      <circle cx="15" cy="8" r="1" className="fill-white/40" />
      <circle cx="21" cy="8" r="1.25" className="fill-[#e50914]" />
      {/* Lens ring */}
      <circle cx="14" cy="15" r="5" className="stroke-white/20" strokeWidth="1.5" />
      {/* Center play triangle */}
      <polygon points="12.5,12.5 17,15 12.5,17.5" fill="url(#lensGrad)" />
      {/* Bottom track indicator */}
      <path d="M6 20.5H22" className="stroke-white/10" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  );
}

// Step 02: Cryptographic Room Key & Multi-Node Beam
export function RoomCodeShareIcon({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 28 28" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="keyGrad" x1="8" y1="8" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e50914" />
          <stop offset="1" stopColor="#990000" />
        </linearGradient>
      </defs>
      {/* Interlocking cryptographic vault shield */}
      <rect x="7.5" y="7.5" width="13" height="13" rx="3.5" className="stroke-white/30" strokeWidth="1.5" fill="rgba(255,255,255,0.02)" />
      {/* Keyhole cipher slot */}
      <circle cx="14" cy="12.5" r="2" fill="url(#keyGrad)" />
      <path d="M14 14.5V17" className="stroke-white" strokeWidth="1.5" strokeLinecap="round" />
      {/* Radiating beam nodes */}
      <path d="M3.5 14H7.5M20.5 14H24.5M14 3.5V7.5M14 20.5V24.5" className="stroke-white/25" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="3.5" cy="14" r="1.5" className="fill-white/60" />
      <circle cx="24.5" cy="14" r="1.5" className="fill-[#e50914]" />
      <circle cx="14" cy="3.5" r="1.5" className="fill-white/60" />
      <circle cx="14" cy="24.5" r="1.5" className="fill-white/60" />
    </svg>
  );
}

// Step 03: Frame-Locked Timeline & Quantum Sync Crosshair
export function FrameLockSyncIcon({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 28 28" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="syncGrad" x1="4" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e50914" />
          <stop offset="1" stopColor="#ff4d58" />
        </linearGradient>
      </defs>
      {/* Orbit ring */}
      <circle cx="14" cy="14" r="10" className="stroke-white/20" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* Crosshair axes */}
      <path d="M14 2V6M14 22V26M2 14H6M22 14H26" className="stroke-white/30" strokeWidth="1.5" strokeLinecap="round" />
      {/* Caliper arcs */}
      <path d="M9 14C9 11.2386 11.2386 9 14 9C16.7614 9 19 11.2386 19 14" stroke="url(#syncGrad)" strokeWidth="2" strokeLinecap="round" />
      {/* Center locked anchor */}
      <circle cx="14" cy="14" r="3" className="fill-[#e50914]" />
      <circle cx="14" cy="14" r="1.2" className="fill-white" />
    </svg>
  );
}

/* =========================================================================
   Neomorphic Step Card Component
   ========================================================================= */

export function NeomorphicStepCard({
  step,
  title,
  desc,
  tag,
  icon: IconComponent,
}) {
  return (
    <div className="group relative rounded-2xl bg-[#0c0d12] p-6 border border-white/[0.04] transition-all duration-300 select-none shadow-[10px_10px_22px_#040507,-8px_-8px_20px_rgba(255,255,255,0.02)] hover:shadow-[14px_14px_28px_#030406,-10px_-10px_24px_rgba(255,255,255,0.035)] hover:-translate-y-1 flex flex-col justify-between">
      {/* Neomorphic Ambient Highlight Sheen */}
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      <div>
        {/* Top Header Row: Inset Icon Well + Inset Step Counter */}
        <div className="flex items-center justify-between gap-3 mb-5">
          {/* Neomorphic Concave Icon Well */}
          <div className="w-13 h-13 rounded-2xl bg-[#090a0f] border border-white/[0.03] shadow-[inset_3px_3px_7px_#030406,inset_-3px_-3px_7px_rgba(255,255,255,0.025)] flex items-center justify-center transition-all duration-300 group-hover:shadow-[inset_3px_3px_8px_#020304,inset_-3px_-3px_8px_rgba(229,9,20,0.12)]">
            {IconComponent ? <IconComponent className="w-6 h-6" /> : null}
          </div>

          {/* Neomorphic Concave Step Number Slot */}
          <div className="px-3 py-1 rounded-xl bg-[#08090e] border border-white/[0.03] shadow-[inset_2px_2px_5px_#030406,inset_-2px_-2px_5px_rgba(255,255,255,0.02)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e50914] shadow-[0_0_6px_#e50914]" />
            <span className="font-mono text-xs font-bold text-zinc-300 tracking-wider">
              {step}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-white tracking-tight group-hover:text-zinc-100 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed font-normal">
            {desc}
          </p>
        </div>
      </div>

      {/* Neomorphic Tactile Ridge & Footer Tag */}
      <div className="mt-5 pt-3">
        {/* Inset Groove Divider */}
        <div className="h-[2px] w-full rounded-full bg-[#08090e] shadow-[inset_1px_1px_2px_#020304,inset_-1px_-1px_2px_rgba(255,255,255,0.025)] mb-3" />

        {/* Tactile Tag Pill */}
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span className="px-2 py-0.5 rounded-md bg-[#090a0f] border border-white/[0.03] shadow-[inset_1px_1px_3px_#030406,inset_-1px_-1px_3px_rgba(255,255,255,0.02)] text-zinc-400 font-medium">
            {tag || `Step ${step}`}
          </span>
          <span className="text-[10px] tracking-wider uppercase text-zinc-600 font-semibold group-hover:text-zinc-400 transition-colors">
            Active
          </span>
        </div>
      </div>
    </div>
  );
}

export default NeomorphicStepCard;
