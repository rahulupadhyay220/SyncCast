import React from 'react';
import { MovieCard } from '../components/landing/MovieCard';
import { FEATURED_MOVIES } from '../data/movies';
import { Check } from 'lucide-react';

export function TopRatedPage({ onSelectPreset }) {
  const topRated = [...FEATURED_MOVIES].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn select-none">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.07]">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
              Catalog • Leaderboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Top Rated Premieres
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-normal">
              Community-ranked titles rated 8.4+ streaming with sub-25ms synchronization.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 bg-zinc-900/60 px-3 py-1 rounded-md border border-white/10">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Curated List</span>
          </div>
        </div>
      </div>

      {/* Grid of Top Rated Cards */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {topRated.map((movie, idx) => (
            <div key={movie.id} className="relative">
              <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded bg-black/85 border border-white/10 text-white font-mono font-bold text-[10px]">
                #{idx + 1}
              </div>
              <MovieCard
                movie={movie}
                onSelect={onSelectPreset}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TopRatedPage;
