import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, Key, Tv, ArrowRight, Radio } from 'lucide-react';
import { FEATURED_MOVIES } from '../data/movies';

export function JoinPartyPage({ onJoinParty }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState('Jordan Lee');
  const [code, setCode] = useState('');
  const [role, setRole] = useState('Participant');

  // Pre-fill room code from URL query parameter if present
  useEffect(() => {
    const roomFromUrl = searchParams.get('room');
    if (roomFromUrl) {
      setCode(roomFromUrl.toUpperCase());
    } else if (!code) {
      setCode('SYNC-7729');
    }
  }, [searchParams]);

  const activePublicRooms = [
    {
      code: 'SYNC-7729',
      title: 'The Odyssey - 4K IMAX Premiere',
      host: 'Alex R.',
      viewers: 14,
      poster: FEATURED_MOVIES[0].poster,
    },
    {
      code: 'SYNC-1044',
      title: 'Lofi Girl - Synth & Chill Live',
      host: 'VibeStation',
      viewers: 28,
      poster: FEATURED_MOVIES[7]?.poster || FEATURED_MOVIES[0].poster,
    },
    {
      code: 'SYNC-4421',
      title: 'House of the Dragon - S3 Ep 1',
      host: 'Daemon_T',
      viewers: 9,
      poster: FEATURED_MOVIES[3]?.poster || FEATURED_MOVIES[0].poster,
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalCode = code.trim().toUpperCase() || 'SYNC-7729';

    if (onJoinParty) {
      onJoinParty({
        name: name.trim() || 'Jordan Lee',
        code: finalCode,
        role,
      });
    }
    navigate('/room');
  };

  const handleJoinPreset = (presetRoom) => {
    setCode(presetRoom.code);
    if (onJoinParty) {
      onJoinParty({
        name: name.trim() || 'Jordan Lee',
        code: presetRoom.code,
        role,
      });
    }
    navigate('/room');
  };

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 py-12 px-4 sm:px-6 lg:px-8 space-y-10 animate-fadeIn select-none">
      {/* Page Header */}
      <div className="max-w-4xl mx-auto space-y-2 text-center">
        <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
          Audience Portal
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Join an Active Room
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto font-normal">
          Connect directly using an invite code or select one of the ongoing public broadcast sessions below.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Form (7 Cols) */}
        <div className="md:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-7 rounded-xl bg-[#090b10] border border-white/[0.08] space-y-5"
          >
            {/* Display Name Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Lee"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-900/60 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914] transition-colors"
              />
            </div>

            {/* Room Code Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                Room Code
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SYNC-7729"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-900/60 border border-white/10 text-sm text-white placeholder-zinc-500 font-mono uppercase tracking-widest font-semibold focus:outline-none focus:border-[#e50914] transition-colors"
                />
              </div>
            </div>

            {/* Role Simulation Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono uppercase tracking-wider text-zinc-400">Perspective</span>
                <span className="text-[11px] text-zinc-500 font-mono">Demo permissions</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900/70 rounded-lg border border-white/10">
                {[
                  { id: 'Participant', label: 'Guest', sub: 'View & Chat' },
                  { id: 'Moderator', label: 'Moderator', sub: 'Play & Seek' },
                  { id: 'Host', label: 'Host', sub: 'Full Admin' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setRole(item.id)}
                    className={`py-2 px-2 rounded-md text-center transition-colors cursor-pointer ${
                      role === item.id
                        ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Connect Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-5 rounded-lg font-semibold text-xs sm:text-sm bg-[#e50914] text-white hover:bg-[#c90812] active:bg-[#a5070f] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <Tv className="w-4 h-4" />
                <span>Connect to Theater</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Public Rooms (5 Cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="p-6 rounded-xl bg-[#090b10] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-mono uppercase tracking-wider text-xs font-semibold text-zinc-400">
                Public Theaters
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-sm bg-emerald-400" />
                <span>Live</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {activePublicRooms.map((room) => (
                <div
                  key={room.code}
                  onClick={() => handleJoinPreset(room)}
                  className="p-3 rounded-lg bg-zinc-900/40 hover:bg-zinc-900 border border-white/[0.07] hover:border-white/20 cursor-pointer transition-colors flex items-center gap-3 group"
                >
                  <img
                    src={room.poster}
                    alt={room.title}
                    className="w-9 h-12 object-cover rounded-md border border-white/10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-[#e50914] transition-colors">
                      {room.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                      <span className="text-zinc-300 font-bold">{room.code}</span>
                      <span>•</span>
                      <span>{room.host}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono mt-1">
                      <span>{room.viewers} viewers</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinPartyPage;
