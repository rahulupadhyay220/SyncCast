import React, { useState } from 'react';
import { X, Plus, Link as LinkIcon } from 'lucide-react';
import { FEATURED_MOVIES } from '../data/movies';

export function CreatePartyView({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('Alex R.');
  const [selectedUrl, setSelectedUrl] = useState(FEATURED_MOVIES[0].url);
  const [customUrl, setCustomUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalUrl = customUrl.trim() || selectedUrl;
    const roomCode = `SYNC-${Math.floor(1000 + Math.random() * 9000)}`;

    onCreate({
      name: name.trim() || 'Alex R.',
      code: roomCode,
      initialUrl: finalUrl,
      role: 'Host',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-[#090b10] rounded-xl border border-white/[0.08] shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto text-white">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1 mb-5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            Host
          </span>
          <h3 className="font-bold text-lg text-white tracking-tight">
            Launch Room
          </h3>
          <p className="text-xs text-zinc-400 font-normal">
            Start a synchronized room with real-time video sync.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
              Host Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex R."
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/60 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
              Select Preset Stream
            </label>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {FEATURED_MOVIES.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() => {
                    setSelectedUrl(vid.url);
                    setCustomUrl('');
                  }}
                  className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors flex items-center justify-between gap-2.5 ${
                    selectedUrl === vid.url
                      ? 'bg-zinc-800/80 border-[#e50914] text-white font-semibold'
                      : 'border-white/10 bg-zinc-900/40 text-zinc-300 hover:border-white/20 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={vid.poster}
                      alt={vid.title}
                      className="w-7 h-10 object-cover rounded shrink-0 border border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white text-xs">{vid.title}</p>
                      <span className="text-[10px] text-zinc-500 font-mono">{vid.tags.join(' • ')}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-300 shrink-0">
                    IMDb {vid.rating}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
              Or Custom YouTube URL
            </label>
            <div className="relative">
              <LinkIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="url"
                value={customUrl}
                onFocus={() => setSelectedUrl('')}
                onClick={() => setSelectedUrl('')}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  if (selectedUrl) setSelectedUrl('');
                }}
                required={!selectedUrl}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900/60 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914] transition-colors"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm bg-[#e50914] text-white hover:bg-[#c90812] active:bg-[#a5070f] transition-colors cursor-pointer"
            >
              Launch Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePartyView;
