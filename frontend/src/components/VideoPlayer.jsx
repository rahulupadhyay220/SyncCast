import React, { useRef, useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ThumbsUp,
  Heart,
  Sparkles,
  Lock,
} from 'lucide-react';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === null) return '00:00';
  const sec = Math.floor(seconds);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

export function VideoPlayer({
  videoState,
  setVideoState,
  onTogglePlay,
  onSeek,
  volume,
  setVolume,
  isMuted,
  setIsMuted,
  canControl,
  _simulatedRole,
  reactions,
  onTriggerReaction,
}) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);

  // Keep fullscreen state accurate even if exited via Esc key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleSeekChange = (e) => {
    if (!canControl) return;
    const nextVal = parseFloat(e.target.value);
    setLocalProgress(nextVal);
    setSeeking(true);
  };

  const handleSeekMouseUp = (e) => {
    if (!canControl) return;
    setSeeking(false);
    const targetSeconds = parseFloat(e.target.value);
    if (playerRef.current) {
      playerRef.current.seekTo(targetSeconds, 'seconds');
    }
    onSeek(targetSeconds);
  };

  const handleSkip = (secondsOffset) => {
    if (!canControl || !playerRef.current) return;
    const current = videoState.playedSeconds;
    const max = videoState.duration || 1000;
    const target = Math.max(0, Math.min(max, current + secondsOffset));
    playerRef.current.seekTo(target, 'seconds');
    onSeek(target);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const progressValue = seeking ? localProgress : videoState.playedSeconds || 0;
  const durationValue = videoState.duration || 0;

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Main 16:9 Video Canvas Container */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl group transition-all"
      >
        {/* React Player Embed */}
        <div className="absolute inset-0 w-full h-full pointer-events-none select-none">
          <ReactPlayer
            ref={playerRef}
            url={videoState.url}
            playing={videoState.playing}
            volume={volume}
            muted={isMuted}
            width="100%"
            height="100%"
            controls={false}
            config={{
              youtube: {
                playerVars: {
                  autoplay: 1,
                  modestbranding: 1,
                  rel: 0,
                  playsinline: 1,
                },
              },
            }}
            onDuration={(dur) => setVideoState((prev) => ({ ...prev, duration: dur }))}
            onProgress={({ playedSeconds }) => {
              if (!seeking) {
                setVideoState((prev) => ({ ...prev, playedSeconds }));
              }
            }}
            onBuffer={() => setVideoState((prev) => ({ ...prev, buffering: true }))}
            onBufferEnd={() => setVideoState((prev) => ({ ...prev, buffering: false }))}
            onError={(e) => {
              console.warn('Playback error:', e);
              setVideoState((prev) => ({ ...prev, buffering: false }));
            }}
          />
        </div>

        {/* Floating Signals Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {reactions?.map((r) => (
            <div
              key={r.id}
              style={{ left: `${r.xPos}%` }}
              className="absolute bottom-16 px-2 py-0.5 rounded bg-black/85 border border-white/20 text-zinc-200 font-mono text-[11px] animate-bounce transition-all opacity-90 transform -translate-x-1/2 select-none"
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* Read-Only Status Indicator */}
        {!canControl && (
          <div className="absolute top-3 left-3 z-30 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/[0.1] font-mono text-[10px] text-zinc-300">
            <Lock className="w-3 h-3 text-[#e50914]" />
            <span>Synced • Read-Only Mode</span>
          </div>
        )}

        {/* Buffering Indicator */}
        {videoState.buffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-25 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a0c10] border border-white/[0.1] text-zinc-300 font-mono text-xs">
              <div className="w-3.5 h-3.5 border-2 border-[#e50914] border-t-transparent rounded-sm animate-spin" />
              <span>Calibrating sync...</span>
            </div>
          </div>
        )}

        {/* Center Minimal Play/Pause Click Overlay */}
        {canControl && (
          <button
            type="button"
            onClick={onTogglePlay}
            className={`absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-all z-10 cursor-pointer ${
              isHovered || !videoState.playing ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="w-14 h-14 rounded-xl bg-[#e50914] hover:bg-[#c90812] text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-xl">
              {videoState.playing ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 fill-white ml-0.5" />
              )}
            </div>
          </button>
        )}

        {/* Bottom Minimal HUD Control Bar */}
        <div
          className={`absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-200 z-30 ${
            isHovered || !videoState.playing ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="bg-[#050608]/90 backdrop-blur-md rounded-xl border border-white/[0.08] p-2.5 sm:p-3 text-white">

            {/* Scrub Slider with Monospace Timecodes */}
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-[11px] font-mono text-zinc-300 min-w-[36px]">
                {formatTime(progressValue)}
              </span>

              <div className="relative flex-1 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={durationValue || 100}
                  step={0.5}
                  value={progressValue}
                  onChange={handleSeekChange}
                  onMouseUp={handleSeekMouseUp}
                  onTouchEnd={handleSeekMouseUp}
                  disabled={!canControl}
                  className={`w-full accent-[#e50914] h-1 bg-zinc-800 rounded-lg appearance-none ${
                    !canControl ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                />
              </div>

              <span className="text-[11px] font-mono text-zinc-500 min-w-[36px] text-right">
                {formatTime(durationValue)}
              </span>
            </div>

            {/* Bottom Row Control Buttons */}
            <div className="flex items-center justify-between gap-2">

              {/* Left Controls: Play/Pause, Skips, Volume */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={onTogglePlay}
                  disabled={!canControl}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    canControl
                      ? 'bg-zinc-100 hover:bg-white text-zinc-950 active:scale-95'
                      : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                  }`}
                  title={canControl ? (videoState.playing ? 'Pause' : 'Play') : 'Host control only'}
                >
                  {videoState.playing ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>

                {/* Rewind 10s */}
                <button
                  type="button"
                  onClick={() => handleSkip(-10)}
                  disabled={!canControl}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="Rewind 10s"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Forward 10s */}
                <button
                  type="button"
                  onClick={() => handleSkip(10)}
                  disabled={!canControl}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="Forward 10s"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                {/* Volume & Mute */}
                <div className="flex items-center gap-1.5 pl-1.5 border-l border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-3.5 h-3.5 text-[#e50914]" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      if (isMuted) setIsMuted(false);
                    }}
                    className="w-14 sm:w-18 accent-[#e50914] h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer hidden xs:block"
                  />
                </div>
              </div>

              {/* Right Controls: Signal Triggers & Fullscreen */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="flex items-center gap-0.5 bg-zinc-900/80 p-0.5 rounded-lg border border-white/[0.06]">
                  {[
                    { label: 'Like', icon: ThumbsUp },
                    { label: 'Love', icon: Heart },
                    { label: 'Clap', icon: Sparkles },
                  ].map((sig) => {
                    const Icon = sig.icon;
                    return (
                      <button
                        key={sig.label}
                        type="button"
                        onClick={() => onTriggerReaction(sig.label)}
                        className="p-1 hover:bg-white/[0.06] rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title={`Signal ${sig.label}`}
                      >
                        <Icon className="w-3.5 h-3.5 text-[#e50914]" />
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default VideoPlayer;