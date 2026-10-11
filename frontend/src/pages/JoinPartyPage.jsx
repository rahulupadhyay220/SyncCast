import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Key, Tv, ArrowRight, User, ShieldAlert, Clock, Lock } from 'lucide-react';
import { FEATURED_MOVIES } from '../data/movies';
import { getUserDisplayName } from '../utils/user';
import { isParticipantBlocked, isParticipantRemoved } from '../utils/moderation';

export function JoinPartyPage({
  onJoinParty,
  sendRejoinRequest,
  rejoinStatus,
  setRejoinStatus,
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeParams = useParams();
  const { user, isLoaded, isSignedIn, effectiveSignedIn } = useAuth();
  const signedInName = getUserDisplayName(user);

  const rawRoomCode =
    searchParams.get('room') ||
    searchParams.get('code') ||
    searchParams.get('roomCode') ||
    routeParams?.roomCode ||
    '';

  const [name, setName] = useState(signedInName || 'Guest');
  const [code, setCode] = useState(() => (rawRoomCode ? rawRoomCode.trim().toUpperCase() : 'SYNC-7729'));
  const [waitingForHost, setWaitingForHost] = useState(false);
  const [pendingRejoinData, setPendingRejoinData] = useState(null);

  const attemptJoin = React.useCallback((targetCode, targetName) => {
    const finalCode = (targetCode || '').trim().toUpperCase() || 'SYNC-7729';
    const finalName = (targetName || '').trim() || signedInName || 'Guest';
    // Rule: Anyone joining through invitation code or link enters strictly as a Guest
    const finalRole = 'Participant';

    if (!effectiveSignedIn) {
      sessionStorage.setItem(
        'pendingJoin',
        JSON.stringify({
          name: finalName,
          code: finalCode,
          role: finalRole,
        })
      );
      navigate(`/sign-in?redirect_url=/join?room=${finalCode}`);
      return;
    }

    // Rule 5 & 6: Blocked participants can never rejoin. Priority rule overrides all.
    // Automatically deny and redirect to Home Page immediately without showing confirmation to host.
    if (isParticipantBlocked(finalCode, null, finalName)) {
      sessionStorage.setItem(
        'streamEvictionNotice',
        JSON.stringify({
          action: 'block',
          message: `You are permanently blocked from stream ${finalCode}. Access is completely denied.`,
        })
      );
      navigate('/');
      return;
    }

    // Rule 3: Removed participants require host confirmation
    if (isParticipantRemoved(finalCode, null, finalName)) {
      setWaitingForHost(true);
      setPendingRejoinData({ code: finalCode, name: finalName, role: finalRole });
      if (sendRejoinRequest) {
        sendRejoinRequest({ code: finalCode, name: finalName });
      }
      return;
    }

    if (onJoinParty) {
      const res = onJoinParty({
        name: finalName,
        code: finalCode,
        role: finalRole,
      });
      if (res?.isBlocked) {
        navigate('/');
        return;
      }
      if (res?.isRemoved) {
        setWaitingForHost(true);
        setPendingRejoinData({ code: finalCode, name: finalName, role: finalRole });
        if (sendRejoinRequest) {
          sendRejoinRequest({ code: finalCode, name: finalName });
        }
        return;
      }
      if (res?.success) {
        navigate('/room');
      }
    }
  }, [signedInName, effectiveSignedIn, navigate, sendRejoinRequest, onJoinParty]);

  // Pre-fill room code from URL query parameter or route param if present during render
  const roomFromUrl = rawRoomCode;
  const [prevRoomFromUrl, setPrevRoomFromUrl] = useState(roomFromUrl);
  if (roomFromUrl && roomFromUrl !== prevRoomFromUrl) {
    setPrevRoomFromUrl(roomFromUrl);
    setCode(roomFromUrl.toUpperCase());
  }

  // Keep name synced if user signs in during render
  const [prevSignedInName, setPrevSignedInName] = useState(signedInName);
  if (signedInName && signedInName !== prevSignedInName) {
    setPrevSignedInName(signedInName);
    if (name === 'Guest') {
      setName(signedInName);
    }
  }

  // Handle Host's Rejoin Decision (Rule 4)
  useEffect(() => {
    if (!rejoinStatus || !pendingRejoinData) return;

    if (rejoinStatus === 'approved') {
      const data = pendingRejoinData;
      setTimeout(() => {
        setWaitingForHost(false);
        setPendingRejoinData(null);
        setRejoinStatus?.(null);
        onJoinParty?.({
          name: data.name,
          code: data.code,
          role: data.role || 'Participant',
        });
        navigate('/room');
      }, 0);
    } else if (rejoinStatus === 'rejected') {
      setTimeout(() => {
        setWaitingForHost(false);
        setPendingRejoinData(null);
        setRejoinStatus?.(null);
        sessionStorage.setItem(
          'streamEvictionNotice',
          JSON.stringify({
            action: 'rejected',
            message: 'The host rejected your request to rejoin the stream.',
          })
        );
        navigate('/');
      }, 0);
    }
  }, [rejoinStatus, pendingRejoinData, onJoinParty, navigate, setRejoinStatus]);

  // Automatically resume pending join if returning after login
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const pendingJoinStr = sessionStorage.getItem('pendingJoin');
      if (pendingJoinStr) {
        sessionStorage.removeItem('pendingJoin');
        try {
          const { name: pName, code: pCode, role: pRole } = JSON.parse(pendingJoinStr);
          const finalJoinName = signedInName || pName || 'Guest';
          setTimeout(() => {
            attemptJoin(pCode || 'SYNC-7729', finalJoinName, pRole || 'Participant');
          }, 0);
        } catch {
          // ignore error
        }
      }
    }
  }, [isLoaded, isSignedIn, signedInName, attemptJoin]);

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
    attemptJoin(code, name);
  };

  const handleJoinPreset = (presetRoom) => {
    setCode(presetRoom.code);
    attemptJoin(presetRoom.code, name);
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
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Display Name
                </label>
                {isSignedIn && signedInName && (
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>Signed in as {signedInName}</span>
                  </span>
                )}
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={signedInName || 'e.g. Jordan Lee'}
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

            {/* Join Role Information - All joining participants enter strictly as Guest/Participant */}
            <div className="space-y-2 p-3.5 rounded-lg bg-zinc-900/60 border border-white/10">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-300 font-semibold font-mono uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Joining Role: Guest</span>
                </div>
                <span className="text-[11px] text-amber-400/90 font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Host is creator only</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                You will enter as an Audience Guest with watch, listen, and live chat access. Stream playback controls and room settings are strictly reserved for the Room Host.
              </p>
            </div>

            {/* Unauthenticated notice */}
            {isLoaded && !isSignedIn && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <span>You will be redirected to sign in/up to enter and participate in the room.</span>
              </div>
            )}

            {/* Connect Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-5 rounded-lg font-semibold text-xs sm:text-sm bg-[#e50914] text-white hover:bg-[#c90812] active:bg-[#a5070f] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <Tv className="w-4 h-4" />
                <span>{isLoaded && !isSignedIn ? 'Sign In & Connect to Theater' : 'Connect to Theater'}</span>
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
                  id={`public-room-${room.code}`}
                  data-testid="public-room-card"
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

      {/* Waiting for Host Rejoin Approval Modal (Rule 3) */}
      {waitingForHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full bg-[#090b10] border border-white/15 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 text-center animate-scaleIn">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 mx-auto flex items-center justify-center animate-pulse">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">Rejoin Request Sent</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                You were previously removed from stream{' '}
                <strong className="text-white font-mono">{pendingRejoinData?.code}</strong>.
                A confirmation popup has been sent to the host's screen.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/60 p-2.5 rounded-lg border border-white/5">
              <div className="w-3.5 h-3.5 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin" />
              <span>Waiting for host decision...</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setWaitingForHost(false);
                setPendingRejoinData(null);
                navigate('/');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel & Return Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default JoinPartyPage;
