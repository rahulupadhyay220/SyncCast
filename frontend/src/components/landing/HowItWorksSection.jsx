import React from 'react';
import { WorkflowCard } from './WorkflowCard';

export function HowItWorksSection({ onOpenJoinModal }) {
  const steps = [
    {
      step: '01',
      stepBadge: '01 • Select Stream',
      name: 'Curator',
      subtitle: 'Public & Unlisted YouTube',
      title: 'Pick Any 4K YouTube Video',
      description: 'Choose a movie trailer, full premiere stream, or paste any custom YouTube link into the theater launcher.',
      progressPercent: '33%',
      videoThumbnail: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    },
    {
      step: '02',
      stepBadge: '02 • Share Code',
      name: 'Host Room',
      subtitle: 'Instant Room Code',
      title: 'Share the Unique Room Code',
      description: 'Your room generates an instantaneous 8-character invite code. Friends paste it and connect without creating accounts.',
      progressPercent: '66%',
      videoThumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    },
    {
      step: '03',
      stepBadge: '03 • Synchronize',
      name: 'Audience Sync',
      subtitle: 'Sub-25ms Precision',
      title: 'Stream Frame-Locked Together',
      description: 'Press play or seek anywhere in the video. High-speed WebSocket relays synchronize all viewers in real time.',
      progressPercent: '100%',
      videoThumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-[#050608] border-t border-white/[0.07] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="max-w-2xl space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            Workflow
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
            Zero accounts or extensions needed. Join or host in 3 straightforward steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((st, idx) => (
            <WorkflowCard
              key={idx}
              step={st.step}
              stepBadge={st.stepBadge}
              name={st.name}
              subtitle={st.subtitle}
              title={st.title}
              description={st.description}
              progressPercent={st.progressPercent}
              videoThumbnail={st.videoThumbnail}
              avatar={st.avatar}
              onPlay={onOpenJoinModal}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
