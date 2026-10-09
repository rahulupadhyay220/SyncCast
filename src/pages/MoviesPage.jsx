import React, { useState } from 'react';
import { MovieCard } from '../components/landing/MovieCard';
import { FEATURED_MOVIES } from '../data/movies';
import { Search } from 'lucide-react';

export function MoviesPage({ onSelectPreset }) {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const genres = ['All', 'Action', 'Sci-Fi', 'Epic', 'Adventure', 'History'];

  const filteredMovies = FEATURED_MOVIES.filter((movie) => {
    const matchesGenre = selectedGenre === 'All' || movie.tags?.includes(selectedGenre);
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn select-none">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.07]">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
              Catalog • Movies
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Cinematic Movies
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-normal">
              Select any title to launch an instant synchronized room with frame-accurate playback.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900/60 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914] transition-colors"
            />
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                selectedGenre === genre
                  ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                  : 'bg-zinc-900/60 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Movie Cards */}
      <div className="max-w-7xl mx-auto">
        {filteredMovies.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-[#090b10] border border-white/10 space-y-2">
            <p className="text-xs text-zinc-400">No movies found matching "{searchQuery}".</p>
            <button
              onClick={() => { setSelectedGenre('All'); setSearchQuery(''); }}
              className="px-3.5 py-1.5 rounded-md bg-[#e50914] text-white text-xs font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onSelect={onSelectPreset}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MoviesPage;
