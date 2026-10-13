import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

export function PlatformModulesSlider({ sections, onCardClick }) {
  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Mouse drag-to-scroll state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateScrollState]);

  const scrollByCard = (direction) => {
    const el = sliderRef.current;
    if (!el) return;

    const firstChild = el.querySelector('[data-slider-card]');
    const step = firstChild ? firstChild.offsetWidth + 16 : 330;
    el.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    });
  };

  // Mouse Drag Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only primary mouse button
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX;
    scrollStartRef.current = sliderRef.current ? sliderRef.current.scrollLeft : 0;
    setIsMouseDown(true);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !sliderRef.current) return;
    const distance = e.pageX - startXRef.current;
    if (Math.abs(distance) > 6) {
      hasDraggedRef.current = true;
    }
    sliderRef.current.scrollLeft = scrollStartRef.current - distance;
  };

  const handleMouseUpOrLeave = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsMouseDown(false);
      // Keep hasDraggedRef true momentarily so click event is suppressed
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 50);
    }
  };

  const handleCardLinkClick = (e, route) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onCardClick) {
      onCardClick(e, route);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.07] pb-4">
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            Directory
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Platform Modules
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-normal">
            Direct access to dedicated catalog routes, technical architecture, and room management.
          </p>
        </div>

        {/* Header Action Buttons & Slide Arrows */}
        <div className="flex items-center gap-3">
          {/* Quick links */}
          <Link
            to="/join"
            className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-medium text-xs transition-colors"
          >
            Enter Code
          </Link>
          <Link
            to="/host"
            className="px-3.5 py-2 rounded-lg bg-[#e50914] hover:bg-[#c90812] text-white font-semibold text-xs transition-colors"
          >
            Host Room
          </Link>

          {/* Slider Arrow Controls */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
            <button
              type="button"
              onClick={() => scrollByCard('left')}
              disabled={!canScrollLeft}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                canScrollLeft
                  ? 'bg-zinc-900/90 border-white/10 hover:border-white/25 text-zinc-200 hover:text-white hover:bg-zinc-800'
                  : 'bg-zinc-950/40 border-white/[0.05] text-zinc-600 cursor-not-allowed opacity-40'
              }`}
              title="Slide Left"
              aria-label="Previous platform module"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard('right')}
              disabled={!canScrollRight}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                canScrollRight
                  ? 'bg-zinc-900/90 border-white/10 hover:border-white/25 text-zinc-200 hover:text-white hover:bg-zinc-800'
                  : 'bg-zinc-950/40 border-white/[0.05] text-zinc-600 cursor-not-allowed opacity-40'
              }`}
              title="Slide Right"
              aria-label="Next platform module"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slider Viewport Container */}
      <div className="relative group/slider">
        {/* Subtle Edge Vignettes for Visual Depth */}
        {canScrollLeft && (
          <div className="absolute top-0 bottom-3 left-0 w-12 bg-gradient-to-r from-[#050608] via-[#050608]/70 to-transparent z-10 pointer-events-none transition-opacity duration-300" />
        )}
        {canScrollRight && (
          <div className="absolute top-0 bottom-3 right-0 w-12 bg-gradient-to-l from-[#050608] via-[#050608]/70 to-transparent z-10 pointer-events-none transition-opacity duration-300" />
        )}

        {/* Floating Side Left Nav Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByCard('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/80 hover:bg-[#e50914] backdrop-blur-md border border-white/15 hover:border-[#e50914] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.8)] transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
            aria-label="Slide Left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Floating Side Right Nav Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByCard('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/80 hover:bg-[#e50914] backdrop-blur-md border border-white/15 hover:border-[#e50914] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.8)] transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
            aria-label="Slide Right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Horizontal Slider Track */}
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
          {sections.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <Link
                key={idx}
                to={sec.route}
                data-slider-card
                onClick={(e) => handleCardLinkClick(e, sec.route)}
                className="group/card w-[270px] sm:w-[310px] md:w-[330px] shrink-0 snap-start rounded-xl bg-gradient-to-b from-[#0b0d14] to-[#07080c] border border-white/[0.08] hover:border-red-500/40 hover:shadow-[0_12px_30px_-8px_rgba(229,9,20,0.25)] transition-all duration-300 overflow-hidden flex flex-col justify-between hover:-translate-y-1"
              >
                <div>
                  {/* Contextual Unsplash Image with Dark Vignette */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#07080c] border-b border-white/[0.06]">
                    <img
                      src={sec.image}
                      alt={sec.title}
                      draggable={false}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-105 pointer-events-none"
                      loading="lazy"
                    />
                    {/* Dark Vignette Overlay for Text Legibility and Minimalism */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-black/40 to-transparent pointer-events-none" />

                    {/* Floating Header Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                      <div className="w-7 h-7 rounded-md bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-200 shadow-sm">
                        <Icon className="w-3.5 h-3.5 text-[#e50914]" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10">
                        {sec.badge}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-1.5">
                    <h3 className="text-sm font-bold text-white group-hover/card:text-[#e50914] transition-colors tracking-tight">
                      {sec.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-normal leading-relaxed line-clamp-2">
                      {sec.desc}
                    </p>
                  </div>
                </div>

                {/* Minimalist Footer */}
                <div className="px-4 py-2.5 border-t border-white/[0.05] bg-[#07080c]/80 flex items-center justify-between text-xs text-zinc-400 group-hover/card:text-zinc-200 transition-colors">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 group-hover/card:text-zinc-300">
                    Open Module
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#e50914] group-hover/card:translate-x-1.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default PlatformModulesSlider;
