import React from 'react';
import { FeatureCard } from './FeatureCard';
import { Zap, Shield, Sparkles, MessageCircle } from 'lucide-react';

export function FeaturesSection({ onExplore }) {
  const features = [
    {
      category: 'Frame Sync',
      categoryIcon: Zap,
      title: 'Sub-25ms Drift Correction',
      description: 'Host scrubs, pauses, or resumes the video, and every connected peer reflects the exact timestamp instantaneously across continents.',
      metaText: 'Adaptive Seek Protocol',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    },
    {
      category: 'Access Control',
      categoryIcon: Shield,
      title: 'Host & Moderator Hierarchy',
      description: 'Prevent video hijacking with role permissions. Assign trusted moderators to manage playback while guests watch peacefully.',
      metaText: '3-Tier Matrix',
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    },
    {
      category: 'Theater Lounge',
      categoryIcon: MessageCircle,
      title: 'Real-Time Chat & Live Signals',
      description: 'Exchange instant messages and viewer signals with zero latency alongside automatic playback synchronization events.',
      metaText: 'Zero-Lag WebSocket',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    },
    {
      category: 'Cinema Engine',
      categoryIcon: Sparkles,
      title: 'Instant YouTube Streams & Custom URLs',
      description: 'Switch smoothly between curated 4K sci-fi streams, lofi mixes, documentary premieres, or paste any public YouTube link directly.',
      metaText: 'YouTube Integration',
      image: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 bg-[#050608] border-t border-white/[0.07] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="max-w-2xl space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Engineered for Flawless Shared Viewing
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
            Sub-millisecond synchronization primitives built on binary WebSocket payloads without browser extensions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, idx) => (
            <FeatureCard
              key={idx}
              category={f.category}
              categoryIcon={f.categoryIcon}
              title={f.title}
              description={f.description}
              metaText={f.metaText}
              image={f.image}
              onAction={onExplore}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
