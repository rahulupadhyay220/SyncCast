import React from 'react';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import {
  NeomorphicStepCard,
  VideoSelectorIcon,
  RoomCodeShareIcon,
  FrameLockSyncIcon,
} from '../components/NeomorphicStepCard';
import { Link } from 'react-router-dom';

export function HowItWorksPage() {
  const stepsDetail = [
    {
      step: '01',
      title: 'Pick Any YouTube Video',
      desc: 'Browse through our curated 4K cinema library or paste any public or unlisted YouTube video link in seconds.',
      tag: '4K Cinema Preset',
      icon: VideoSelectorIcon,
    },
    {
      step: '02',
      title: 'Share Instant Room Code',
      desc: 'Every room generates a unique invite code (e.g. SYNC-7729). Send it to friends or invite them via link.',
      tag: 'Encrypted Beam',
      icon: RoomCodeShareIcon,
    },
    {
      step: '03',
      title: 'Stream with Frame-Lock',
      desc: 'When you press play, pause, or seek, all viewers stay locked to the exact same millisecond timestamp.',
      tag: 'Sub-25ms WebSocket',
      icon: FrameLockSyncIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 py-10 px-4 sm:px-6 lg:px-8 space-y-10 animate-fadeIn select-none">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.07]">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
              Guide • Architecture
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              How It Works
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-normal">
              Zero software to download, no browser extensions, no user signups.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/join"
              className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-medium text-xs transition-colors"
            >
              Enter Code
            </Link>
            <Link
              to="/host"
              className="px-4 py-2 rounded-lg bg-[#e50914] hover:bg-[#c90812] text-white font-semibold text-xs transition-colors"
            >
              Host Room
            </Link>
          </div>
        </div>
      </div>

      {/* Main Workflow Component */}
      <div className="max-w-7xl mx-auto">
        <HowItWorksSection onOpenJoinModal={() => {}} />
      </div>

      {/* Detailed Workflow Cards */}
      <div className="max-w-7xl mx-auto space-y-6 pt-6 border-t border-white/[0.07]">
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            Steps
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Frictionless 3-Step Experience
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stepsDetail.map((item, idx) => (
            <NeomorphicStepCard
              key={idx}
              step={item.step}
              title={item.title}
              desc={item.desc}
              tag={item.tag}
              icon={item.icon}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default HowItWorksPage;
