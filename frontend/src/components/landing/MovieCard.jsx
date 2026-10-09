import React from 'react';
import { Play, Share2 } from 'lucide-react';

export function MovieCard({ movie, onSelect }) {
  return (
    <div
      onClick={() => onSelect?.(movie)}
      className="group relative rounded-xl overflow-hidden bg-[#090b10] border border-white/[0.07] hover:border-white/25 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#07080c]">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Minimal Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-white/10 text-[10px] font-mono font-medium text-zinc-300">
            IMDb {movie.rating}
          </span>
          {movie.badge && (
            <span className="px-1.5 py-0.5 rounded bg-[#e50914] text-white text-[9px] font-mono font-bold uppercase tracking-wider">
              {movie.badge}
            </span>
          )}
        </div>

        {/* Minimal Play & Share Hover Overlay */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
          <div className="space-y-2">
            <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">
              {movie.tagline}
            </p>
            <div className="flex items-center gap-1.5 w-full">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(movie);
                }}
                className="flex-1 py-1.5 px-3 rounded-lg bg-[#e50914] hover:bg-[#c90812] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play Now</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(movie, { openShare: true });
                }}
                title="Share link with multiple participants"
                className="py-1.5 px-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer flex items-center justify-center"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card Info Footer */}
      <div className="p-3 bg-[#090b10] border-t border-white/[0.06]">
        <h4 className="font-semibold text-zinc-200 text-xs truncate group-hover:text-white transition-colors">
          {movie.title}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1 font-mono">
          <span>{movie.year}</span>
          <span>{movie.duration}</span>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;
