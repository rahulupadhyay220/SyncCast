import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FeatureCard } from './FeatureCard';
import { Zap, Shield, Sparkles, MessageCircle, Globe, Cpu, ChevronLeft, ChevronRight } from 'lucide-react';

export function FeaturesSection() {
  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Mouse drag-to-scroll state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const [isMouseDown, setIsMouseDown] = useState(false);

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
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    },
    {
      category: 'Edge Relay',
      categoryIcon: Globe,
      title: 'Global Multi-Region Network',
      description: 'State payloads broadcast through optimized edge relays, guaranteeing synchronized frames even under variable network conditions.',
      metaText: 'Low-Latency Mesh',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    },
    {
      category: 'State Engine',
      categoryIcon: Cpu,
      title: 'Zero-Drop State Recovery',
      description: 'Automatic heartbeat detection re-syncs disconnected peers within milliseconds upon reconnection without reloading the page.',
      metaText: 'Self-Healing Sync',
      image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const updateScrollState = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

    const firstCard = el.querySelector('[data-slider-card]');
    if (firstCard) {
      const cardWidth = firstCard.offsetWidth + 16;
      const newIndex = Math.min(
        features.length - 1,
        Math.max(0, Math.round(scrollLeft / cardWidth))
      );
      setActiveIndex(newIndex);
    }
  }, [features.length]);

  useEffect(() => {
    updateScrollState();
    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateScrollState]);

  const scrollByCard = (direction) => {
    const el = sliderRef.current;
    if (!el) return;

    const firstCard = el.querySelector('[data-slider-card]');
    const step = firstCard ? firstCard.offsetWidth + 16 : 350;
    el.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    });
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX;
    scrollStartRef.current = sliderRef.current ? sliderRef.current.scrollLeft : 0;
    setIsMouseDown(true);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !sliderRef.current) return;
    const distance = e.pageX - startXRef.current;
    sliderRef.current.scrollLeft = scrollStartRef.current - distance;
  };

  const handleMouseUpOrLeave = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsMouseDown(false);
    }
  };

  return (
    <section id="features" className="py-16 sm:py-24 bg-[#050608] border-t border-white/[0.07]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
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

          {/* Slider navigation buttons */}
          <div className="flex items-center gap-2 self-start sm:self-end">
            <span className="text-xs font-mono text-zinc-500 mr-2 hidden sm:inline-block">
              {String(activeIndex + 1).padStart(2, '0')} / {String(features.length).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => scrollByCard('left')}
              disabled={!canScrollLeft}
              className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                canScrollLeft
                  ? 'bg-zinc-900/90 border-white/10 hover:border-white/25 text-zinc-200 hover:text-white hover:bg-zinc-800'
                  : 'bg-zinc-950/40 border-white/[0.05] text-zinc-600 cursor-not-allowed opacity-40'
              }`}
              title="Slide Left"
              aria-label="Previous architecture feature"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard('right')}
              disabled={!canScrollRight}
              className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                canScrollRight
                  ? 'bg-zinc-900/90 border-white/10 hover:border-white/25 text-zinc-200 hover:text-white hover:bg-zinc-800'
                  : 'bg-zinc-950/40 border-white/[0.05] text-zinc-600 cursor-not-allowed opacity-40'
              }`}
              title="Slide Right"
              aria-label="Next architecture feature"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slider container */}
        <div className="relative group/slider">
          {/* Side shadow fades */}
          {canScrollLeft && (
            <div className="absolute top-0 bottom-4 left-0 w-12 bg-gradient-to-r from-[#050608] via-[#050608]/80 to-transparent z-10 pointer-events-none transition-opacity duration-300" />
          )}
          {canScrollRight && (
            <div className="absolute top-0 bottom-4 right-0 w-12 bg-gradient-to-l from-[#050608] via-[#050608]/80 to-transparent z-10 pointer-events-none transition-opacity duration-300" />
          )}

          {/* Floating previous button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollByCard('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/85 hover:bg-[#e50914] backdrop-blur-md border border-white/15 hover:border-[#e50914] text-white flex items-center justify-center shadow-[0_4px_25px_rgba(0,0,0,0.85)] transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
              aria-label="Slide Left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Floating next button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollByCard('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/85 hover:bg-[#e50914] backdrop-blur-md border border-white/15 hover:border-[#e50914] text-white flex items-center justify-center shadow-[0_4px_25px_rgba(0,0,0,0.85)] transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
              aria-label="Slide Right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Cards track */}
          <div
            ref={sliderRef}
            onScroll={updateScrollState}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none py-2 px-1 ${
              isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y',
            }}
          >
            {features.map((f, idx) => (
              <div
                key={idx}
                data-slider-card
                className="w-[280px] sm:w-[320px] md:w-[350px] lg:w-[370px] shrink-0 snap-start flex flex-col [&>div]:h-full select-none"
              >
                <FeatureCard
                  category={f.category}
                  categoryIcon={f.categoryIcon}
                  title={f.title}
                  description={f.description}
                  metaText={f.metaText}
                  image={f.image}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
