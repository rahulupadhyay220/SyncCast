import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Plus,
  LogIn,
  Clock,
  Users,
  ArrowRight,
  Tv,
} from 'lucide-react';

export function DashboardPage({
  isInRoom,
  roomCode,
  userName,
  simulatedRole,
  canControlPlayback,
  videoState,
  togglePlay,
  seekTo,
  changeVideoUrl,
  onOpenCreate,
  onOpenJoin,
  onGoToTheater,
  onStartPreset,
}) {
  const [quickUrl, setQuickUrl] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const formatTime = (secs = 0) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleQuickLaunch = (e) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;
    if (isInRoom && changeVideoUrl) {
      changeVideoUrl(quickUrl.trim(), 'Custom Synced Stream');
    } else if (onStartPreset) {
      onStartPreset({
        title: 'Custom YouTube Room',
        url: quickUrl.trim(),
        category: 'Custom Stream',
        badge: 'Live Sync',
      });
    }
    setQuickUrl('');
  };

  const recentWatchHistory = [
    {
      id: 'hist-1',
      title: 'The Odyssey (2026) - Final Cinema Trailer',
      channel: 'Cinema Studios',
      thumbnail: '/images/odyssey_hero.jpg',
      watchedAt: 'Today, 6:45 PM',
      watchedDuration: '1h 48m',
      totalDuration: '2h 32m',
      percent: 71,
      hostName: 'Alex Rivera',
      viewersCount: 8,
      url: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
      badge: '4K Stream',
    },
    {
      id: 'hist-2',
      title: 'Avatar: Fire and Ash - Extended Teaser',
      channel: '20th Century Studios',
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      watchedAt: 'Yesterday, 9:20 PM',
      watchedDuration: '14m 20s',
      totalDuration: '18m 30s',
      percent: 78,
      hostName: 'Elena Rostova',
      viewersCount: 14,
      url: 'https://www.youtube.com/watch?v=Y-rmzh0PI3c',
      badge: 'IMAX 4K',
    },
    {
      id: 'hist-3',
      title: 'Lofi Girl - 24/7 Synth & Chill Beats',
      channel: 'Lofi Records',
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
      watchedAt: 'Oct 6, 2026',
      watchedDuration: '2h 15m',
      totalDuration: 'Continuous Live',
      percent: 100,
      hostName: 'Alex R. (You)',
      viewersCount: 26,
      url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
      badge: 'Live Lounge',
    },
    {
      id: 'hist-4',
      title: 'Project Hail Mary - First Look Breakdown',
      channel: 'Cinema Pulse',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      watchedAt: 'Oct 5, 2026',
      watchedDuration: '28m 10s',
      totalDuration: '45m 00s',
      percent: 62,
      hostName: 'Jordan Lee',
      viewersCount: 5,
      url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
      badge: 'Premiere',
    },
  ];

  const scheduledShowings = [
    {
      id: 'sched-1',
      title: 'Dune: Prophecy - S1 Premiere Watch Party',
      showTime: 'Tonight @ 9:00 PM EST',
      attendees: 38,
      countdown: 'Starts in 1h 24m',
      thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
      badge: 'Official Premiere',
      host: 'SciFi_Cinema_Club',
      url: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      category: 'Sci-Fi Series',
    },
    {
      id: 'sched-2',
      title: 'Interstellar (10th Anniversary IMAX 4K Re-stream)',
      showTime: 'Tomorrow @ 8:30 PM EST',
      attendees: 84,
      countdown: 'Starts in 23h 40m',
      thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80',
      badge: 'Community Event',
      host: 'CosmosCinema',
      url: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
      category: 'Feature Film',
    },
    {
      id: 'sched-3',
      title: 'The Batman Part II - Detective League Reaction',
      showTime: 'Sunday @ 7:00 PM EST',
      attendees: 52,
      countdown: 'In 3 Days',
      thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
      badge: 'Trailer Discussion',
      host: 'GothamCentral',
      url: 'https://www.youtube.com/watch?v=mqqft2x_Aa4',
      category: 'Deep Dive',
    },
  ];

  const liveRooms = [
    {
      id: 'live-1',
      roomCode: 'SYNC-7729',
      title: 'The Odyssey (2026) - 4K IMAX Premiere',
      host: 'Alex Rivera',
      viewers: 14,
      currentTiming: '01:48:32 / 02:32:00',
      progressPercent: 71,
      status: 'Live',
      url: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    },
    {
      id: 'live-2',
      roomCode: 'SYNC-1044',
      title: 'Lofi Girl - 24/7 Synth & Chill Stream',
      host: 'VibeStation',
      viewers: 28,
      currentTiming: 'Live Broadcast',
      progressPercent: 100,
      status: 'Live',
      url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    },
    {
      id: 'live-3',
      roomCode: 'SYNC-4421',
      title: 'House of the Dragon - S3 Ep 1 Watchalong',
      host: 'Daemon_T',
      viewers: 9,
      currentTiming: '00:34:10 / 01:02:15',
      progressPercent: 55,
      status: 'Live',
      url: 'https://www.youtube.com/watch?v=DotnJ7tTA34',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn select-none">
      {/* 1. Header Strip */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.07]">
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-normal">
            Monitor synchronized playback timing, resume recent group videos, and launch shared theaters.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenJoin}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Enter Code</span>
          </button>
          <button
            onClick={onOpenCreate}
            className="px-4 py-1.5 rounded-lg bg-[#e50914] hover:bg-[#c90812] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Host Room</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* 2. Active Session Card */}
        {isInRoom ? (
          <div className="p-6 rounded-xl bg-[#090b10] border border-white/[0.08] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-sm bg-emerald-400" />
                <span className="text-xs font-mono font-semibold text-zinc-200">Session Active</span>
                <span className="text-zinc-600">|</span>
                <span className="font-mono text-xs text-zinc-400">Code: <strong className="text-white">{roomCode}</strong></span>
                <button
                  onClick={handleCopyCode}
                  className="text-xs font-mono text-zinc-400 hover:text-white cursor-pointer ml-1"
                >
                  {copiedCode ? '[Copied]' : '[Copy]'}
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-xs text-zinc-400 font-mono">
                  Role: <strong className="text-zinc-200 uppercase">{simulatedRole}</strong>
                </span>
                <button
                  onClick={onGoToTheater}
                  className="px-3.5 py-1.5 rounded-lg bg-[#e50914] hover:bg-[#c90812] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Open Theater</span>
                </button>
              </div>
            </div>

            {/* Playback Timing & Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {videoState.title || 'Live Synchronized Video'}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Sync Action: {videoState.lastActionType || 'Active'} by {videoState.lastActionBy || userName}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span className="text-white">{formatTime(videoState.playedSeconds)}</span>
                    <span>{formatTime(videoState.duration)}</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-[#e50914] rounded-sm transition-all duration-300"
                      style={{
                        width: `${
                          videoState.duration > 0
                            ? Math.min(100, (videoState.playedSeconds / videoState.duration) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Scrubber Remote */}
              <div className="lg:col-span-4 p-4 rounded-lg bg-zinc-900/60 border border-white/10 space-y-2 text-center">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                  Playback Controls
                </span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => seekTo?.(Math.max(0, (videoState.playedSeconds || 0) - 10))}
                    disabled={!canControlPlayback}
                    className="p-2 rounded-md bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
                    title="Rewind 10s"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={togglePlay}
                    disabled={!canControlPlayback}
                    className="p-2.5 rounded-lg bg-[#e50914] hover:bg-[#c90812] text-white disabled:opacity-40 transition-colors cursor-pointer"
                    title={videoState.playing ? 'Pause' : 'Resume'}
                  >
                    {videoState.playing ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                  </button>
                  <button
                    onClick={() => seekTo?.((videoState.playedSeconds || 0) + 10)}
                    disabled={!canControlPlayback}
                    className="p-2 rounded-md bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
                    title="Forward 10s"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono block">
                  {canControlPlayback ? 'Host/Mod Control Active' : 'Viewer Mode'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Active State with One-Click Launch */
          <div className="p-6 rounded-xl bg-[#090b10] border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 max-w-xl">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                Instant Launcher
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Start a Synchronized Room
              </h3>
              <p className="text-xs text-zinc-400 font-normal">
                Paste any YouTube URL to launch a room and invite peers instantaneously.
              </p>
            </div>

            <form onSubmit={handleQuickLaunch} className="w-full md:w-auto flex-1 max-w-md flex gap-2">
              <input
                type="url"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-3.5 py-2 rounded-lg bg-zinc-900/60 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#e50914] hover:bg-[#c90812] text-white font-semibold text-xs shrink-0 transition-colors cursor-pointer"
              >
                Launch
              </button>
            </form>
          </div>
        )}

        {/* 3. Upcoming Show Timings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
                Scheduled Premieres
              </h2>
              <p className="text-xs text-zinc-400">
                Group screenings with synchronized countdown timers
              </p>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Live Calendar</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scheduledShowings.map((show) => (
              <div
                key={show.id}
                className="group p-4 rounded-xl bg-[#090b10] border border-white/[0.07] hover:border-white/20 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-3">
                  <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-[#07080c] border border-white/5">
                    <img
                      src={show.thumbnail}
                      alt={show.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-zinc-200 text-[9px] font-mono uppercase tracking-wider border border-white/10">
                        {show.badge}
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-zinc-300 font-mono text-[10px]">
                        {show.countdown}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-1">
                      {show.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1 font-mono">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{show.showTime}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                      {show.attendees} RSVP • Host: {show.host}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">{show.category}</span>
                  <button
                    onClick={() =>
                      onStartPreset?.({
                        title: show.title,
                        url: show.url,
                        category: show.category,
                        badge: show.badge,
                      })
                    }
                    className="px-3 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>RSVP / Join</span>
                    <ArrowRight className="w-3 h-3 text-[#e50914]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Recent Watch History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
                Recent Sessions
              </h2>
              <p className="text-xs text-zinc-400">
                Resume playback at the timestamp where you left off
              </p>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              {recentWatchHistory.length} Sessions
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentWatchHistory.map((item) => (
              <div
                key={item.id}
                className="group p-3.5 rounded-xl bg-[#090b10] border border-white/[0.07] hover:border-white/20 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-[#07080c] border border-white/5">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] font-mono text-zinc-300 border border-white/10">
                        {item.badge}
                      </span>
                    </div>

                    <div className="absolute bottom-1.5 left-2 right-2 space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-300">
                        <span>{item.watchedDuration}</span>
                        <span>{item.percent}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/20 rounded-sm overflow-hidden">
                        <div
                          className="h-full bg-[#e50914] rounded-sm"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-xs line-clamp-1 group-hover:text-[#e50914] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {item.channel}
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Host: {item.hostName}
                  </span>
                  <button
                    onClick={() =>
                      onStartPreset?.({
                        title: item.title,
                        url: item.url,
                        category: 'Resume Session',
                        badge: 'Playback Synced',
                      })
                    }
                    className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Resume</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Active Public Rooms */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
                Public Theaters (Live)
              </h2>
              <p className="text-xs text-zinc-400">
                Join an active broadcast and synchronize frame timing with peers
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-sm bg-emerald-400" />
              <span>3 Rooms Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {liveRooms.map((room) => (
              <div
                key={room.id}
                className="p-4 rounded-xl bg-[#090b10] border border-white/[0.07] hover:border-white/20 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded border border-white/10">
                      {room.roomCode}
                    </span>
                    <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {room.viewers} peers
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-1">
                      {room.title}
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">
                      Host: {room.host}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span>Timeline:</span>
                      <span className="text-zinc-200 font-semibold">{room.currentTiming}</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-sm"
                        style={{ width: `${room.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-sm bg-emerald-400" />
                    {room.status}
                  </span>
                  <button
                    onClick={() =>
                      onStartPreset?.({
                        title: room.title,
                        url: room.url,
                        category: 'Public Room',
                        badge: room.roomCode,
                      })
                    }
                    className="px-3 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Connect</span>
                    <ArrowRight className="w-3 h-3 text-[#e50914]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
