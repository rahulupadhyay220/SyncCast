import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Link as LinkIcon, Radio, Check, Film, ArrowRight } from 'lucide-react';
import { FEATURED_MOVIES } from '../data/movies';

export function HostPartyPage({ onHostParty }) {
  const navigate = useNavigate();
  const [name, setName] = useState('Alex R.');
  const [selectedMovie, setSelectedMovie] = useState(FEATURED_MOVIES[0]);
  const [customUrl, setCustomUrl] = useState('');
  const [allowChat, setAllowChat] = useState(true);
  const [allowReactions, setAllowReactions] = useState(true);
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalUrl = customUrl.trim() || selectedMovie?.url;
    if (!finalUrl) return;
    const roomCode = `SYNC-${Math.floor(1000 + Math.random() * 9000)}`;

    if (onHostParty) {
      onHostParty({
        name: name.trim() || 'Alex R.',
        code: roomCode,
        initialUrl: finalUrl,
        title: selectedMovie ? selectedMovie.title : 'Custom YouTube Stream',
        role: 'Host',
        isPublic,
      });
    }
    navigate('/room');
  };

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 py-12 px-4 sm:px-6 lg:px-8 space-y-10 animate-fadeIn select-none">
      {/* Page Header */}
      <div className="max-w-4xl mx-auto space-y-2 text-center">
        <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
          Host Portal
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Host a Synchronized Room
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto font-normal">
          Start a private or public theater with frame-locked playback and granular host controls.
        </p>
      </div>

      {/* Main Host Form Container */}
      <div className="max-w-4xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 rounded-xl bg-[#090b10] border border-white/[0.08] space-y-6"
        >
          {/* Step 1: Host Name */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
              01 • Host Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex R."
              required
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-900/60 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914] transition-colors"
            />
          </div>

          {/* Step 2: Select Initial Video or Custom Link */}
          <div className="space-y-3 pt-2 border-t border-white/[0.06]">
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
              02 • Video Stream Source
            </label>

            {/* Custom URL Input */}
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="url"
                value={customUrl}
                onFocus={() => setSelectedMovie(null)}
                onClick={() => setSelectedMovie(null)}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  if (selectedMovie) setSelectedMovie(null);
                }}
                required={!selectedMovie}
                placeholder="Paste any YouTube URL (e.g. https://www.youtube.com/watch?v=...)"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-900/60 border border-white/10 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914] transition-colors"
              />
            </div>

            {/* Cinema Presets Selector */}
            <div className="space-y-2 pt-1">
              <p className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-[#e50914]" />
                <span>Or select a preset from catalog:</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {FEATURED_MOVIES.slice(0, 6).map((movie) => {
                  const isSelected = selectedMovie?.id === movie.id;
                  return (
                    <div
                      key={movie.id}
                      onClick={() => {
                        setSelectedMovie(movie);
                        setCustomUrl('');
                      }}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors flex items-center gap-3 relative overflow-hidden ${
                        isSelected
                          ? 'bg-zinc-800/80 border-[#e50914] text-white font-semibold'
                          : 'border-white/10 bg-zinc-900/40 text-zinc-300 hover:border-white/20 hover:bg-zinc-900'
                      }`}
                    >
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-9 h-12 object-cover rounded-md shrink-0 border border-white/10"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white text-xs">{movie.title}</p>
                        <p className="text-[10px] text-zinc-500 truncate font-mono">{movie.tags.join(' • ')}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono">
                          <span className="text-zinc-300">IMDb {movie.rating}</span>
                          <span className="text-zinc-400">{movie.quality}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-md bg-[#e50914] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 3: Room Preferences & Permissions */}
          <div className="space-y-3 pt-2 border-t border-white/[0.06]">
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
              03 • Room Settings
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div
                onClick={() => setIsPublic(!isPublic)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  isPublic ? 'bg-zinc-800/60 border-white/20 text-white' : 'bg-zinc-900/40 border-white/10 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">Public Directory</span>
                  <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${isPublic ? 'border-emerald-400 bg-emerald-400/20 text-emerald-400' : 'border-zinc-600'}`}>
                    {isPublic && <Check className="w-2 h-2 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 font-normal">List room on the public theater dashboard.</p>
              </div>

              <div
                onClick={() => setAllowChat(!allowChat)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  allowChat ? 'bg-zinc-800/60 border-white/20 text-white' : 'bg-zinc-900/40 border-white/10 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">Audience Chat</span>
                  <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${allowChat ? 'border-emerald-400 bg-emerald-400/20 text-emerald-400' : 'border-zinc-600'}`}>
                    {allowChat && <Check className="w-2 h-2 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 font-normal">Enable real-time messaging for viewers.</p>
              </div>

              <div
                onClick={() => setAllowReactions(!allowReactions)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  allowReactions ? 'bg-zinc-800/60 border-white/20 text-white' : 'bg-zinc-900/40 border-white/10 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">Live Signals</span>
                  <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${allowReactions ? 'border-emerald-400 bg-emerald-400/20 text-emerald-400' : 'border-zinc-600'}`}>
                    {allowReactions && <Check className="w-2 h-2 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 font-normal">Allow viewer signal pulses on video canvas.</p>
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-5 rounded-lg font-semibold text-xs sm:text-sm bg-[#e50914] text-white hover:bg-[#c90812] active:bg-[#a5070f] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Radio className="w-4 h-4" />
              <span>Launch Synchronized Room</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
            <p className="text-center text-[11px] text-zinc-500 mt-2 font-mono">
              You will enter as Host with exclusive playback controls and moderation tools.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HostPartyPage;
