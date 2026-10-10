import React, { useState, useRef } from 'react';
import { Play, ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { FEATURED_MOVIES } from '../../data/movies';

export function HeroSection({ onStartParty, onJoinParty, onSelectMovie }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const carouselRef = useRef(null);

  const active = FEATURED_MOVIES[selectedIndex] || FEATURED_MOVIES[0];

  const handleNext = () => {
    const nextIdx = (selectedIndex + 1) % FEATURED_MOVIES.length;
    setSelectedIndex(nextIdx);
    scrollToIndex(nextIdx);
  };

  const handlePrev = () => {
    const prevIdx = (selectedIndex - 1 + FEATURED_MOVIES.length) % FEATURED_MOVIES.length;
    setSelectedIndex(prevIdx);
    scrollToIndex(prevIdx);
  };

  const scrollToIndex = (idx) => {
    if (carouselRef.current) {
      const cardWidth = 160;
      carouselRef.current.scrollTo({
        left: Math.max(0, (idx - 1) * cardWidth),
        behavior: 'smooth',
      });
    }
  };

  const handleCardClick = (idx) => {
    setSelectedIndex(idx);
    scrollToIndex(idx);
  };

  const handleWatchNow = () => {
    if (onSelectMovie) {
      onSelectMovie({
        title: active.title,
        url: active.url,
        category: active.tags[0] || 'Cinema',
        badge: active.badge || '4K Stream',
      });
    } else if (onStartParty) {
      onStartParty();
    }
  };

  return (
    <section className="relative min-h-[620px] sm:min-h-[720px] lg:min-h-[780px] w-full flex flex-col justify-end overflow-hidden pb-10 sm:pb-14 select-none">
      {/* Background Hero Backdrop Image */}
      <div className="absolute inset-0 z-0">
        <img
          key={active.id}
          src={active.backdrop}
          alt={active.title}
          className="w-full h-full object-cover object-top sm:object-center transition-opacity duration-500 animate-fadeIn"
        />

        {/* Minimalist Multi-directional Dark Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050608] via-[#050608]/90 via-45% to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#050608]/75 via-40% to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050608]/90 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full pt-12 sm:pt-24 space-y-6 sm:space-y-8">
        <div className="max-w-2xl space-y-3 sm:space-y-4 animate-fadeIn">
          {/* Minimalist Status Badge */}
          <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-lg bg-zinc-900/80 backdrop-blur-md border border-white/10 text-xs font-mono text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-sm bg-[#e50914]" />
            <span className="uppercase tracking-wider text-[10px] sm:text-[11px] font-semibold text-zinc-300">Cinema Premiere</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400 font-normal text-[11px]">{active.badge}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            {active.title}
          </h1>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-zinc-300 font-normal leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-3">
            {active.tagline}
          </p>

          {/* Meta Info Bar (IMDb, Year, Runtime, 4K) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-zinc-400 font-mono pt-1">
            <div className="flex items-center gap-1.5 text-zinc-200">
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-zinc-200 font-mono text-[10px]">
                IMDb
              </span>
              <span className="font-bold text-white">{active.rating}</span>
            </div>

            <span className="text-zinc-700">•</span>
            <span>{active.year}</span>
            <span className="text-zinc-700">•</span>
            <span>{active.duration}</span>
            <span className="text-zinc-700">•</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-300 text-[10px] font-bold">
              {active.quality}
            </span>
          </div>

          {/* Minimalist Genre Tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {active.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 sm:px-2.5 py-0.5 rounded-md bg-zinc-900/80 border border-white/10 text-zinc-400 text-[10px] sm:text-[11px] font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Minimalist CTA Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3 pt-2 flex-wrap">
            <button
              onClick={handleWatchNow}
              className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-[#e50914] hover:bg-[#c90812] active:bg-[#a5070f] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Watch Now</span>
            </button>

            <button
              onClick={onJoinParty}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white font-medium text-xs sm:text-sm border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
            >
              <span>Join Room</span>
            </button>
          </div>
        </div>

        {/* Carousel Track */}
        <div className="pt-4 relative">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
              <Film className="w-3.5 h-3.5 text-[#e50914]" />
              Featured Premieres
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                className="w-7 h-7 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Previous title"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-7 h-7 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Next title"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cards Track */}
          <div
            ref={carouselRef}
            className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth px-0.5"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {FEATURED_MOVIES.map((movie, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={movie.id}
                  onClick={() => handleCardClick(idx)}
                  className={`relative flex-shrink-0 w-28 sm:w-36 md:w-40 aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 select-none border ${
                    isSelected
                      ? 'border-[#e50914] shadow-md z-20'
                      : 'border-white/10 opacity-75 hover:opacity-100 hover:border-white/25 z-10'
                  }`}
                >
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Gradient shadow on card bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                  {/* Card Title & Year */}
                  <div className="absolute bottom-2 left-2 right-2 p-0.5 text-left pointer-events-none">
                    <p className="text-[11px] sm:text-xs font-bold text-white leading-tight truncate">
                      {movie.title}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-0.5 font-mono">
                      <span>{movie.year}</span>
                      <span className="text-zinc-300 font-mono">IMDb {movie.rating}</span>
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[#e50914] text-white text-[9px] font-mono uppercase tracking-wider font-bold">
                      Active
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
