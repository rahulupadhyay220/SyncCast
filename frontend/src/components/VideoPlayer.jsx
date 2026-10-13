import React, { useRef, useState, useEffect, useCallback } from 'react';
import YouTube from 'react-youtube';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ThumbsUp,
  Heart,
  Sparkles,
  Lock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { extractYouTubeVideoId } from '../utils/youtube';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === null || seconds < 0) return '00:00';
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
  onRestart,
  onSkip,
  onNextVideo,
  onPrevVideo,
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
  const [playerError, setPlayerError] = useState(null);
  const [userActive, setUserActive] = useState(true);
  const inactivityTimeoutRef = useRef(null);

  // Extract valid 11-char video ID from videoState (fallback to default)
  const currentVideoId =
    videoState.videoId ||
    extractYouTubeVideoId(videoState.url) ||
    'Y-rmzh0PI3c';

  // Clear player error whenever video source changes
  useEffect(() => {
    setPlayerError(null);
  }, [videoState.videoId, videoState.url]);

  // Reset and restart the 3-second mouse inactivity countdown
  const resetInactivityTimer = useCallback(() => {
    setUserActive(true);
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    // Only schedule auto-hide if the video is currently playing/streaming
    if (videoState.playing) {
      inactivityTimeoutRef.current = setTimeout(() => {
        setUserActive(false);
      }, 3000); // 3 seconds of inactivity
    }
  }, [videoState.playing]);

  // Keep controls visible when paused; schedule 3-second auto-hide timer when streaming begins
  useEffect(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    if (videoState.playing) {
      inactivityTimeoutRef.current = setTimeout(() => {
        setUserActive(false);
      }, 3000);
    }
    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [videoState.playing]);

  // Keep fullscreen state accurate even if exited via Esc key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setUserActive(true);
      if (videoState.playing) {
        resetInactivityTimer();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [videoState.playing, resetInactivityTimer]);

  // Global mouse movement & interaction listener when in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleGlobalActivity = () => {
      resetInactivityTimer();
    };

    document.addEventListener('mousemove', handleGlobalActivity, { passive: true });
    document.addEventListener('keydown', handleGlobalActivity, { passive: true });
    document.addEventListener('touchstart', handleGlobalActivity, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleGlobalActivity);
      document.removeEventListener('keydown', handleGlobalActivity);
      document.removeEventListener('touchstart', handleGlobalActivity);
    };
  }, [isFullscreen, resetInactivityTimer]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, []);

  // Compute whether controls, center buttons, and HUD should be visible
  const showControls = (() => {
    // If video is not playing (paused), keep controls visible
    if (!videoState.playing) return true;

    // While user is scrubbing, keep controls visible
    if (seeking) return true;

    // In fullscreen: hide if mouse movement stopped for 3 seconds (userActive is false)
    if (isFullscreen) {
      return userActive;
    }

    // In windowed mode: show when hovered and user is active
    return isHovered && userActive;
  })();

  // Sync volume & mute state with YouTube player instance
  useEffect(() => {
    if (!playerRef.current) return;
    try {
      if (typeof playerRef.current.setVolume === 'function') {
        playerRef.current.setVolume(Math.round(volume * 100));
      }
      if (typeof playerRef.current.mute === 'function') {
        if (isMuted || volume === 0) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
        }
      }
    } catch {
      // player not ready
    }
  }, [volume, isMuted]);

  // Sync play / pause state changes (e.g. from host or remote sync event)
  useEffect(() => {
    if (!playerRef.current) return;
    try {
      const state = playerRef.current.getPlayerState?.();
      // 1 = playing, 2 = paused, 3 = buffering
      if (videoState.playing && state !== 1 && state !== 3) {
        playerRef.current.playVideo?.();
      } else if (!videoState.playing && state === 1) {
        playerRef.current.pauseVideo?.();
      }
    } catch {
      // player not ready
    }
  }, [videoState.playing]);

  // Sync playhead seek if remote drift is detected (> 1.5s difference)
  useEffect(() => {
    if (!playerRef.current || seeking) return;
    try {
      const current = playerRef.current.getCurrentTime?.();
      if (typeof current === 'number' && typeof videoState.playedSeconds === 'number') {
        if (Math.abs(current - videoState.playedSeconds) > 1.5) {
          playerRef.current.seekTo?.(videoState.playedSeconds, true);
        }
      }
    } catch {
      // player not ready
    }
  }, [videoState.playedSeconds, seeking]);

  // Periodic ticker to advance local timecode and range slider smoothly
  useEffect(() => {
    if (!videoState.playing) return;
    const interval = setInterval(() => {
      if (playerRef.current && !seeking) {
        try {
          const cur = playerRef.current.getCurrentTime?.();
          const dur = playerRef.current.getDuration?.();
          if (typeof cur === 'number') {
            setVideoState((prev) => ({
              ...prev,
              playedSeconds: cur,
              duration: dur || prev.duration,
            }));
          }
        } catch {
          // ignore
        }
      }
    }, 400);

    return () => clearInterval(interval);
  }, [videoState.playing, seeking, setVideoState]);

  // YouTube IFrame API Ready Callback
  const handlePlayerReady = useCallback(
    (event) => {
      playerRef.current = event.target;
      setPlayerError(null);

      try {
        const dur = event.target.getDuration();
        setVideoState((prev) => ({
          ...prev,
          duration: dur || prev.duration,
          buffering: false,
        }));

        event.target.setVolume(Math.round(volume * 100));
        if (isMuted || volume === 0) {
          event.target.mute();
        } else {
          event.target.unMute();
        }

        if (videoState.playing) {
          event.target.playVideo();
        } else {
          event.target.pauseVideo();
        }

        if (videoState.playedSeconds > 0) {
          event.target.seekTo(videoState.playedSeconds, true);
        }
      } catch (err) {
        console.warn('YouTube onReady initial calibration error:', err);
      }
    },
    [isMuted, volume, videoState.playing, videoState.playedSeconds, setVideoState]
  );

  // YouTube IFrame State Change
  const handlePlayerStateChange = useCallback(
    (event) => {
      // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: video cued
      if (event.data === 3) {
        setVideoState((prev) => ({ ...prev, buffering: true }));
      } else if (event.data === 1) {
        setVideoState((prev) => ({ ...prev, buffering: false }));
      } else if (event.data === 0) {
        setVideoState((prev) => ({ ...prev, playing: false }));
      }
    },
    [setVideoState]
  );

  // YouTube Error handler
  const handlePlayerError = useCallback(
    (event) => {
      console.warn('YouTube Player Error code:', event.data);
      let errorMsg = 'Unable to play this YouTube video.';
      if (event.data === 150 || event.data === 101) {
        errorMsg = 'Embedding is disabled by the video owner on YouTube.';
      } else if (event.data === 100 || event.data === 2) {
        errorMsg = 'Video not found, private, or invalid YouTube ID.';
      }
      setPlayerError(errorMsg);
      setVideoState((prev) => ({ ...prev, buffering: false }));
    },
    [setVideoState]
  );

  // Range Slider Scrubbing
  const handleSeekChange = (e) => {
    if (!canControl) return;
    const nextVal = parseFloat(e.target.value);
    setLocalProgress(nextVal);
    setSeeking(true);
    resetInactivityTimer();
  };

  const handleSeekMouseUp = (e) => {
    if (!canControl) return;
    setSeeking(false);
    const targetSeconds = parseFloat(e.target.value);
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(targetSeconds, true);
    }
    onSeek(targetSeconds);
    resetInactivityTimer();
  };

  // Host Skip Controls (+10s / -10s)
  const handleSkip = (secondsOffset) => {
    if (!canControl) return;
    resetInactivityTimer();
    let current = videoState.playedSeconds || 0;
    try {
      if (playerRef.current?.getCurrentTime) {
        current = playerRef.current.getCurrentTime();
      }
    } catch { }

    const max = videoState.duration || 1000;
    const target = Math.max(0, Math.min(max, current + secondsOffset));

    try {
      if (playerRef.current?.seekTo) {
        playerRef.current.seekTo(target, true);
      }
    } catch { }

    if (onSkip) {
      onSkip(secondsOffset);
    } else {
      onSeek(target);
    }
  };

  // Host Restart from Beginning (0:00)
  const handleRestart = () => {
    if (!canControl) return;
    resetInactivityTimer();
    try {
      if (playerRef.current?.seekTo) {
        playerRef.current.seekTo(0, true);
      }
      if (playerRef.current?.playVideo) {
        playerRef.current.playVideo();
      }
    } catch { }

    if (onRestart) {
      onRestart();
    } else {
      onSeek(0);
      if (!videoState.playing) onTogglePlay();
    }
  };

  const toggleFullscreen = () => {
    resetInactivityTimer();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  const progressValue = seeking ? localProgress : videoState.playedSeconds || 0;
  const durationValue = videoState.duration || 0;

  // Configuration options for programmatic YouTube IFrame API
  const playerOptions = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0, // Custom synchronized controls
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      enablejsapi: 1,
      disablekb: 1,
      iv_load_policy: 3,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  };

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Main 16:9 Video Canvas Container */}
      <div
        ref={containerRef}
        onMouseEnter={() => {
          setIsHovered(true);
          resetInactivityTimer();
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          if (videoState.playing) {
            setUserActive(false);
          }
        }}
        onMouseMove={resetInactivityTimer}
        onTouchStart={resetInactivityTimer}
        style={{ cursor: isFullscreen && !showControls ? 'none' : undefined }}
        className={`relative w-full ${isFullscreen
          ? 'h-full aspect-auto rounded-none border-0'
          : 'aspect-video rounded-xl border border-white/[0.08]'
          } bg-black overflow-hidden shadow-2xl group transition-all select-none ${isFullscreen && !showControls ? 'cursor-none' : ''
          }`}
      >
        {/* YouTube Embedded Player */}
        <div className="absolute inset-0 w-full h-full select-none overflow-hidden">
          <YouTube
            videoId={currentVideoId}
            opts={playerOptions}
            onReady={handlePlayerReady}
            onStateChange={handlePlayerStateChange}
            onError={handlePlayerError}
            className="w-full h-full absolute inset-0"
            iframeClassName="w-full h-full border-0 absolute inset-0 pointer-events-none"
          />
        </div>

        {/* Floating Signals / Reactions Overlay */}
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

        {/* Read-Only Status Indicator for non-host peers */}
        {!canControl && (
          <div
            className={`absolute top-3 left-3 z-30 pointer-events-none flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/[0.1] font-mono text-[10px] text-zinc-300 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <Lock className="w-3 h-3 text-[#e50914]" />
            <span className="hidden xs:inline">Synced • Read-Only Mode</span>
            <span className="xs:hidden">Synced</span>
          </div>
        )}

        {/* Buffering Indicator */}
        {videoState.buffering && !playerError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-25 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a0c10] border border-white/[0.1] text-zinc-300 font-mono text-xs shadow-lg">
              <div className="w-3.5 h-3.5 border-2 border-[#e50914] border-t-transparent rounded-sm animate-spin" />
              <span>Calibrating sync...</span>
            </div>
          </div>
        )}

        {/* Player Error Overlay */}
        {playerError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm z-30 p-4">
            <div className="max-w-md text-center space-y-2 p-4 rounded-xl bg-[#0b0c10] border border-red-500/30 text-white">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-sm font-semibold text-white">{playerError}</p>
              <p className="text-xs text-zinc-400">
                Please paste another public YouTube video URL in the Host Room Link Bar above.
              </p>
            </div>
          </div>
        )}

        {/* Center Minimal Play/Pause Click Overlay */}
        {canControl && !playerError && (
          <div
            onClick={() => {
              onTogglePlay();
              resetInactivityTimer();
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className={`absolute inset-0 flex items-center justify-center transition-all z-10 ${showControls ? 'cursor-pointer' : isFullscreen ? 'cursor-none' : 'cursor-default'
              }`}
          >
            <div
              className={`w-14 h-14 rounded-xl bg-[#e50914] hover:bg-[#c90812] text-white flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl ${showControls ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'
                }`}
            >
              {videoState.playing ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 fill-white ml-0.5" />
              )}
            </div>
          </div>
        )}

        {/* Bottom Minimal HUD Control Bar */}
        <div
          className={`absolute bottom-0 inset-x-0 p-2 sm:p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-all duration-300 z-30 ${showControls
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-3 pointer-events-none'
            }`}
        >
          <div className="bg-[#050608]/90 backdrop-blur-md rounded-xl border border-white/[0.08] p-2 sm:p-3 text-white">

            {/* Scrub Slider with Monospace Timecodes */}
            <div className="flex items-center gap-2 sm:gap-2.5 mb-2">
              <span className="text-[10px] sm:text-[11px] font-mono text-zinc-300 min-w-[32px] sm:min-w-[36px]">
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
                  className={`w-full accent-[#e50914] h-1 bg-zinc-800 rounded-lg appearance-none ${!canControl ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                />
              </div>

              <span className="text-[10px] sm:text-[11px] font-mono text-zinc-500 min-w-[32px] sm:min-w-[36px] text-right">
                {formatTime(durationValue)}
              </span>
            </div>

            {/* Bottom Row Control Buttons */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-wrap">

              {/* Left Controls: Play/Pause, Restart, Skips (-10s / +10s), Volume */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* 1. Play / Pause */}
                <button
                  type="button"
                  onClick={onTogglePlay}
                  disabled={!canControl}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${canControl
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

                {/* 2. Restart from the beginning (0:00) */}
                <button
                  type="button"
                  onClick={handleRestart}
                  disabled={!canControl}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1"
                  title={canControl ? 'Restart video from beginning (0:00)' : 'Host control only'}
                >
                  <SkipBack className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono hidden md:inline">Restart</span>
                </button>

                {/* 3. Skip Backward 10 seconds */}
                <button
                  type="button"
                  onClick={() => handleSkip(-10)}
                  disabled={!canControl}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-0.5"
                  title={canControl ? 'Skip backward 10 seconds' : 'Host control only'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold">-10s</span>
                </button>

                {/* 4. Skip Forward 10 seconds */}
                <button
                  type="button"
                  onClick={() => handleSkip(10)}
                  disabled={!canControl}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-0.5"
                  title={canControl ? 'Skip forward 10 seconds' : 'Host control only'}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold">+10s</span>
                </button>

                {/* 5. Previous Video Stream */}
                {onPrevVideo && (
                  <button
                    type="button"
                    onClick={onPrevVideo}
                    disabled={!canControl}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-0.5"
                    title={canControl ? 'Previous stream in catalog' : 'Host control only'}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono hidden xl:inline">Prev</span>
                  </button>
                )}

                {/* 6. Next Video Stream */}
                {onNextVideo && (
                  <button
                    type="button"
                    onClick={onNextVideo}
                    disabled={!canControl}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-0.5"
                    title={canControl ? 'Next stream in catalog' : 'Host control only'}
                  >
                    <span className="text-[10px] font-mono hidden xl:inline">Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Volume & Mute */}
                <div className="flex items-center gap-1.5 pl-1.5 border-l border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
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

              {/* Right Controls: Signal Reactions & Fullscreen */}
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