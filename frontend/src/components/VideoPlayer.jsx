import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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
  Film,
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
  isTheater = false,
  onToggleTheater,
}) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [localDisplayTime, setLocalDisplayTime] = useState(videoState.playedSeconds || 0);
  const isSeekingRef = useRef(false);
  const seekLockTimeoutRef = useRef(null);
  const currentRateRef = useRef(1.0);
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

  // Robust multi-vendor toggle fullscreen (Maximize / Minimize)
  const toggleFullscreen = useCallback(() => {
    resetInactivityTimer();
    const elem = containerRef.current;
    if (!elem) return;

    const isCurrentlyFullscreen = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    if (!isCurrentlyFullscreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }, [resetInactivityTimer]);

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

  // Keep fullscreen state accurate even if exited via Esc key or system gesture
  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(activeFs);
      setUserActive(true);
      if (videoState.playing) {
        resetInactivityTimer();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [videoState.playing, resetInactivityTimer]);

  // Keyboard shortcut listener ('f' / 'F' to maximize/minimize full screen, 'm' / 'M' to mute)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable) {
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen, setIsMuted]);

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

  // Calculate expected playback time accounting for elapsed time since sync
  const getExpectedPlaybackTime = useCallback(() => {
    const elapsedSinceSync = videoState.syncTimestamp && videoState.playing && !canControl
      ? (Date.now() - videoState.syncTimestamp) / 1000
      : 0;
    const baseTime = videoState.authoritativeTime ?? videoState.playedSeconds ?? 0;
    return Math.max(0, baseTime + elapsedSinceSync);
  }, [videoState.authoritativeTime, videoState.playedSeconds, videoState.syncTimestamp, videoState.playing, canControl]);

  // Sync play / pause state changes (e.g. from host or remote sync event)
  useEffect(() => {
    if (!playerRef.current) return;
    try {
      const state = playerRef.current.getPlayerState?.();
      // 1 = playing, 2 = paused, 3 = buffering
      if (videoState.playing && state !== 1 && state !== 3 && !isSeekingRef.current) {
        playerRef.current.playVideo?.();
      } else if (!videoState.playing && state === 1) {
        playerRef.current.pauseVideo?.();
      }
    } catch {
      // player not ready
    }
  }, [videoState.playing]);

  // Single coordinated Master Sync & Drift Monitoring Loop (runs every 400ms)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!playerRef.current || seeking) return;

      try {
        const player = playerRef.current;
        const cur = player.getCurrentTime?.();
        const dur = player.getDuration?.();
        const playerState = player.getPlayerState?.();

        if (typeof cur !== 'number' || isNaN(cur)) return;

        // Keep local display timestamp updated for smooth slider progression
        setLocalDisplayTime(cur);

        // HOST role: updates authoritative state directly from player
        if (canControl) {
          setVideoState((prev) => ({
            ...prev,
            playedSeconds: cur,
            authoritativeTime: cur,
            duration: dur || prev.duration,
          }));
          return;
        }

        // GUEST role: evaluate drift against authoritative host stream clock
        const expectedTime = getExpectedPlaybackTime();

        // Update duration if received
        if (dur && dur !== videoState.duration) {
          setVideoState((prev) => ({ ...prev, duration: dur }));
        }

        // If stream is paused remotely, keep player paused and calibrated
        if (!videoState.playing) {
          if (currentRateRef.current !== 1.0) {
            player.setPlaybackRate?.(1.0);
            currentRateRef.current = 1.0;
          }
          if (playerState === 1) {
            player.pauseVideo?.();
          }
          if (Math.abs(cur - expectedTime) > 0.8 && !isSeekingRef.current) {
            isSeekingRef.current = true;
            player.seekTo?.(expectedTime, true);
            setTimeout(() => {
              isSeekingRef.current = false;
            }, 800);
          }
          return;
        }

        // Stream is playing remotely:
        if (playerState !== 1 && playerState !== 3 && !isSeekingRef.current) {
          player.playVideo?.();
        }

        // Do not issue seeks or rate modifications while the player is buffering or in seek cooldown
        if (playerState === 3 || isSeekingRef.current) {
          return;
        }

        // Drift = local time - expected host time (positive = ahead, negative = behind)
        const drift = cur - expectedTime;
        const absDrift = Math.abs(drift);

        // TIER 1: In Sync (within 0.35s) -> Perfect synchronization
        if (absDrift <= 0.35) {
          if (currentRateRef.current !== 1.0) {
            player.setPlaybackRate?.(1.0);
            currentRateRef.current = 1.0;
          }
        }
        // TIER 2: Minor drift (0.35s to 1.8s) -> Smooth micro-rate adjustment (NO BUFFERING, NO RELOADS!)
        else if (absDrift <= 1.8) {
          if (drift < -0.35) {
            // Guest is slightly behind host -> glide forward smoothly
            if (currentRateRef.current !== 1.08) {
              player.setPlaybackRate?.(1.08);
              currentRateRef.current = 1.08;
            }
          } else if (drift > 0.35) {
            // Guest is slightly ahead of host -> glide backward smoothly
            if (currentRateRef.current !== 0.92) {
              player.setPlaybackRate?.(0.92);
              currentRateRef.current = 0.92;
            }
          }
        }
        // TIER 3: Major drift (> 1.8s) -> Direct Seek with Lock
        else {
          if (currentRateRef.current !== 1.0) {
            player.setPlaybackRate?.(1.0);
            currentRateRef.current = 1.0;
          }
          isSeekingRef.current = true;
          player.seekTo?.(expectedTime, true);
          if (seekLockTimeoutRef.current) clearTimeout(seekLockTimeoutRef.current);
          seekLockTimeoutRef.current = setTimeout(() => {
            isSeekingRef.current = false;
          }, 1200);
        }
      } catch {
        // Player not ready
      }
    }, 400);

    return () => clearInterval(interval);
  }, [
    canControl,
    seeking,
    videoState.playing,
    videoState.duration,
    getExpectedPlaybackTime,
    setVideoState,
  ]);

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

        const targetTime = getExpectedPlaybackTime();
        if (targetTime > 0.5) {
          event.target.seekTo(targetTime, true);
          setLocalDisplayTime(targetTime);
        }

        if (videoState.playing) {
          try {
            event.target.playVideo();
          } catch {
            // Autoplay blocked by browser policy -> mute and retry play
            try {
              event.target.mute();
              setIsMuted(true);
              event.target.playVideo();
            } catch { }
          }
        } else {
          event.target.pauseVideo();
        }
      } catch (err) {
        console.warn('YouTube onReady initial calibration error:', err);
      }
    },
    [isMuted, volume, videoState.playing, getExpectedPlaybackTime, setIsMuted, setVideoState]
  );

  // YouTube IFrame State Change
  const handlePlayerStateChange = useCallback(
    (event) => {
      // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: video cued
      if (event.data === 3) {
        setVideoState((prev) => ({ ...prev, buffering: true }));
      } else if (event.data === 1) {
        setVideoState((prev) => ({ ...prev, buffering: false }));
        // Player has resumed playing -> release seek lock
        isSeekingRef.current = false;
        if (seekLockTimeoutRef.current) {
          clearTimeout(seekLockTimeoutRef.current);
          seekLockTimeoutRef.current = null;
        }
      } else if (event.data === 0) {
        setVideoState((prev) => ({ ...prev, playing: false }));
        isSeekingRef.current = false;
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

  const progressValue = seeking
    ? localProgress
    : canControl
    ? (videoState.playedSeconds || 0)
    : (localDisplayTime || videoState.playedSeconds || 0);
  const durationValue = videoState.duration || 0;

  // Memoized initial start time so the YouTube iframe natively mounts at host timestamp
  const initialStartTime = useMemo(() => {
    return Math.max(0, Math.floor(getExpectedPlaybackTime()));
  }, [currentVideoId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Configuration options for programmatic YouTube IFrame API
  // Memoized by currentVideoId to avoid unneeded iframe recreation on re-renders
  const playerOptions = useMemo(
    () => ({
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
        start: initialStartTime > 0 ? initialStartTime : undefined,
        origin: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    }),
    [currentVideoId, initialStartTime]
  );

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
          } bg-black overflow-hidden shadow-2xl group transition-all ${isFullscreen && !showControls ? 'cursor-none' : ''
          }`}
      >
        {/* YouTube Embedded Player */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
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
              className="absolute bottom-16 px-2 py-0.5 rounded bg-black/85 border border-white/20 text-zinc-200 font-mono text-[11px] animate-bounce transition-all opacity-90 transform -translate-x-1/2"
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* Status Indicator for guest/non-host peers */}
        {!canControl && (
          <div
            className={`absolute top-3 left-3 z-30 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/85 backdrop-blur-md border border-white/[0.12] font-mono text-[10px] text-zinc-200 transition-opacity duration-300 shadow-md ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-400 hidden xs:inline">Audience Guest:</span>
            <span className="text-white font-medium">Synced</span>
            <span className="hidden md:inline text-zinc-500">• Full Screen Permitted</span>
          </div>
        )}

        {/* Top-Right Quick Screen Controls: Theater & Fullscreen (Available to all users including Guests) */}
        <div
          className={`absolute top-3 right-3 z-30 flex items-center gap-1.5 transition-opacity duration-300 ${
            showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {onToggleTheater && !isFullscreen && (
            <button
              type="button"
              onClick={onToggleTheater}
              id="theater-mode-toggle"
              className={`px-2.5 py-1 rounded-md backdrop-blur-md border transition-all cursor-pointer flex items-center gap-1.5 font-mono text-[10px] shadow-lg ${
                isTheater
                  ? 'bg-[#e50914] border-[#e50914] text-white'
                  : 'bg-black/80 hover:bg-zinc-800 border-white/10 text-zinc-300 hover:text-white'
              }`}
              title={isTheater ? 'Minimize Theater (Standard Layout)' : 'Maximize Theater (Full Width Stage)'}
              aria-label={isTheater ? 'Minimize Theater Mode' : 'Maximize Theater Mode'}
            >
              <Film className="w-3 h-3 text-red-400" />
              <span className="hidden xs:inline">{isTheater ? 'Minimize Stage' : 'Theater Stage'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            id="quick-fullscreen-toggle"
            className={`px-2.5 py-1 rounded-md backdrop-blur-md border transition-all cursor-pointer flex items-center gap-1.5 font-mono text-[10px] shadow-lg group ${
              isFullscreen
                ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-200'
                : 'bg-black/85 hover:bg-[#e50914] border-white/15 hover:border-[#e50914] text-zinc-200 hover:text-white'
            }`}
            title={isFullscreen ? 'Minimize Screen (Exit Full Screen)' : 'Maximize Screen (Make Full Screen)'}
            aria-label={isFullscreen ? 'Minimize Screen' : 'Maximize Screen'}
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Minimize Screen</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Maximize Screen</span>
              </>
            )}
          </button>
        </div>

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

        {/* Interactive Video Overlay (Double-click to Maximize/Minimize Full Screen for both Host and Guests) */}
        {!playerError && (
          <div
            onClick={() => {
              resetInactivityTimer();
              if (canControl) {
                onTogglePlay();
              }
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className={`absolute inset-0 flex items-center justify-center transition-all z-10 ${
              showControls
                ? 'cursor-pointer'
                : isFullscreen
                ? 'cursor-none'
                : 'cursor-default'
            }`}
            title={
              canControl
                ? videoState.playing
                  ? 'Click to Pause • Double-click to Maximize/Minimize'
                  : 'Click to Play • Double-click to Maximize/Minimize'
                : isFullscreen
                ? 'Double-click to Minimize Screen (Exit Full Screen)'
                : 'Double-click to Maximize Screen (Full Screen)'
            }
          >
            {/* Center Play/Pause Indicator for Host */}
            {canControl ? (
              <div
                className={`w-14 h-14 rounded-xl bg-[#e50914] hover:bg-[#c90812] text-white flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl ${
                  showControls
                    ? 'opacity-100 scale-100 pointer-events-auto'
                    : 'opacity-0 scale-90 pointer-events-none'
                }`}
              >
                {videoState.playing ? (
                  <Pause className="w-6 h-6 fill-white" />
                ) : (
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                )}
              </div>
            ) : (
              /* Center Quick Maximize / Minimize button for Guest (appears on hover) */
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className={`px-4 py-2 rounded-xl bg-black/80 hover:bg-[#e50914] backdrop-blur-md border border-white/20 text-white flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl cursor-pointer ${
                  showControls && isHovered
                    ? 'opacity-85 hover:opacity-100 pointer-events-auto'
                    : 'opacity-0 pointer-events-none'
                }`}
                title={isFullscreen ? 'Minimize Screen (Exit Full Screen)' : 'Maximize Screen (Make Full Screen)'}
              >
                {isFullscreen ? (
                  <>
                    <Minimize className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono font-medium">Minimize Screen</span>
                  </>
                ) : (
                  <>
                    <Maximize className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-medium">Maximize Full Screen</span>
                  </>
                )}
              </div>
            )}
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
                  id="bottom-fullscreen-toggle"
                  className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 font-mono text-xs ${
                    isFullscreen
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-zinc-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                  }`}
                  title={isFullscreen ? 'Minimize Screen (Exit Full Screen)' : 'Maximize Screen (Make Full Screen)'}
                  aria-label={isFullscreen ? 'Minimize Screen' : 'Maximize Screen'}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-semibold hidden md:inline">Minimize</span>
                    </>
                  ) : (
                    <>
                      <Maximize className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-semibold hidden md:inline">Maximize</span>
                    </>
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