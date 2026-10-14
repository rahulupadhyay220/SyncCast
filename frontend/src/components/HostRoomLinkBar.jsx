import React, { useState } from 'react';
import { ArrowRight, Clipboard, AlertCircle, Check, Video } from 'lucide-react';
import { extractYouTubeVideoId } from '../utils/youtube';

export function YouTubeIcon({ className = 'w-4 h-4' }) {
  return <Video className={className} />;
}

// Input bar for hosts/mods to switch the current YouTube stream via URL or raw video ID.
export function HostRoomLinkBar({
  currentVideoId,
  onLoadVideo,
  canControl = true,
  disabledReason = 'Host or Moderator permissions required to change video stream',
}) {
  const [inputUrl, setInputUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!canControl) return;

    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setError('Please paste or enter a YouTube video URL.');
      return;
    }

    const videoId = extractYouTubeVideoId(trimmed);
    if (!videoId) {
      setError('Invalid YouTube link. Please enter a valid URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...).');
      setSuccess(false);
      return;
    }

    setError('');
    setSuccess(true);
    onLoadVideo(trimmed, videoId);

    // Reset success animation after 2.5s
    setTimeout(() => {
      setSuccess(false);
    }, 2500);
  };

  const handlePasteClipboard = async () => {
    if (!canControl) return;
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputUrl(text);
          setError('');
          const videoId = extractYouTubeVideoId(text);
          if (videoId) {
            setError('');
          } else {
            setError('Clipboard does not contain a valid YouTube link.');
          }
        }
      }
    } catch {
      // Clipboard permissions denied by browser
      setError('Clipboard access denied. Please paste manually into the input.');
    }
  };

  return (
    <div className="w-full bg-[#090b10] border border-white/[0.08] rounded-xl p-3.5 sm:p-4 shadow-xl transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#e50914]/15 border border-[#e50914]/30 flex items-center justify-center text-[#e50914]">
            <YouTubeIcon className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
              <span>Host Room Link Bar</span>
              {currentVideoId && (
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-300 max-w-[180px] truncate">
                  ID: {currentVideoId}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-zinc-400">
              Paste any public YouTube link to synchronize playback for everyone in this room.
            </p>
          </div>
        </div>

        {!canControl && (
          <span className="text-[10px] sm:text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 self-start sm:self-auto">
            {disabledReason}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
              <YouTubeIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inputUrl}
              disabled={!canControl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (error) setError('');
              }}
              placeholder="Paste YouTube video link (e.g. https://www.youtube.com/watch?v=...)"
              className={`w-full pl-9 pr-16 sm:pr-20 py-2 sm:py-2.5 rounded-lg bg-[#14151b] border text-xs sm:text-sm text-white placeholder:text-zinc-500 transition-colors focus:outline-none ${
                error
                  ? 'border-red-500/80 focus:border-red-500'
                  : 'border-white/10 hover:border-white/20 focus:border-[#e50914]'
              } ${!canControl ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {canControl && (
              <button
                type="button"
                onClick={handlePasteClipboard}
                title="Paste from clipboard"
                aria-label="Paste from clipboard"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Clipboard className="w-3 h-3" />
                <span className="hidden xs:inline">Paste</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!canControl || !inputUrl.trim()}
            className={`w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm text-white flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer ${
              canControl && inputUrl.trim()
                ? 'bg-[#e50914] hover:bg-[#c90812] active:scale-98 shadow-red-950/40'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
            }`}
          >
            {success ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Loaded!</span>
              </>
            ) : (
              <>
                <span>Load Stream</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Validation Error Feedback */}
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/40 border border-red-500/30 px-3 py-1.5 rounded-lg animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Confirmation Feedback */}
        {success && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg animate-fadeIn">
            <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span>YouTube video loaded and synchronized across all room participants!</span>
          </div>
        )}
      </form>
    </div>
  );
}
export default HostRoomLinkBar;
