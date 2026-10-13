import React from 'react';
import { MovieCard } from '../components/landing/MovieCard';
import { FEATURED_MOVIES } from '../data/movies';
import { Play, Share2 } from 'lucide-react';

export function TvShowsPage({ onSelectPreset }) {
  const tvSeries = [
    FEATURED_MOVIES.find((m) => m.id === 'house_of_dragon') || FEATURED_MOVIES[3],
    FEATURED_MOVIES.find((m) => m.id === 'the_boys') || FEATURED_MOVIES[4],
    FEATURED_MOVIES.find((m) => m.id === 'daredevil') || FEATURED_MOVIES[6],
    FEATURED_MOVIES.find((m) => m.id === 'lofi_chill') || FEATURED_MOVIES[7],
  ];

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 py-8 sm:py-10 px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto space-y-2 pb-4 border-b border-white/[0.07]">
        <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
          Catalog • Series
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          TV Shows & Series
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-normal">
          Binge serialized episodes with friends with real-time frame lock.
        </p>
      </div>

      {/* Featured Spotlight Card */}
      <div className="max-w-7xl mx-auto">
        <div className="p-4 sm:p-8 rounded-xl bg-[#090b10] border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <span className="px-2 py-0.5 rounded bg-[#e50914] text-white text-[10px] font-mono uppercase tracking-wider font-bold">
              Featured Premiere
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              House of the Dragon (Season 3)
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
              The catastrophic Dance of Dragons reaches a fever pitch. Watch every new episode together with live synchronized timeline and group chat.
            </p>
            <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
              <span className="text-zinc-300">IMDb 8.9</span>
              <span className="text-zinc-600">•</span>
              <span>10 Episodes</span>
              <span className="text-zinc-600">•</span>
              <span>4K Ultra HD</span>
            </div>
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onSelectPreset?.(tvSeries[0])}
                className="px-5 py-2.5 rounded-lg bg-[#e50914] hover:bg-[#c90812] text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Watch Premiere</span>
              </button>

              <button
                onClick={() => onSelectPreset?.(tvSeries[0], { openShare: true })}
                className="px-4 py-2.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs border border-white/10 transition-colors cursor-pointer flex items-center gap-2"
                title="Launch room and share link with multiple participants"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </button>
            </div>
          </div>

          <div className="w-full md:w-56 aspect-[2/3] rounded-lg overflow-hidden border border-white/10 shrink-0 bg-[#07080c]">
            <img
              src={tvSeries[0].poster}
              alt="House of the Dragon"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Grid of TV Show Cards */}
      <div className="max-w-7xl mx-auto space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
          Available Series
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {tvSeries.map((show) => (
            <MovieCard
              key={show.id}
              movie={show}
              onSelect={onSelectPreset}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TvShowsPage;
