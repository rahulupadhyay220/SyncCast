import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { extractYouTubeVideoId, formatYouTubeUrl } from '../utils/youtube';
import { getUserDisplayName } from '../utils/user';
import {
  isParticipantBlocked,
  isParticipantRemoved,
  addBlockedParticipant,
  addRemovedParticipant,
  removeRemovedParticipant,
} from '../utils/moderation';

// Default curated YouTube sample streams / videos (100% embeddable Creative Commons / open streams)
export const SAMPLE_VIDEOS = [
  {
    title: 'Blender Studio: Cosmos Laundromat',
    url: 'https://www.youtube.com/watch?v=Y-rmzh0PI3c',
    category: '4K Animation',
    badge: 'Staff Pick',
  },
  {
    title: 'Synthwave Chill Radio - Midnight Drive',
    url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
    category: 'Synthwave',
    badge: 'High Bitrate',
  },
  {
    title: 'Dune: Part Two (4K Showcase)',
    url: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    category: 'Cinematic Cinema',
    badge: 'Ultra HD',
  },
  {
    title: 'Big Buck Bunny (Blender Animation)',
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    category: 'Open Movie',
    badge: 'Classic 4K',
  },
];

export function getBackendUrl() {
  const envUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_SOCKET_URL;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // When accessing from mobile on a local LAN IP (e.g. 192.168.x.x),
    // route to the same host IP instead of localhost so mobile connects to backend
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      if (envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
        try {
          const parsed = new URL(envUrl);
          parsed.hostname = host;
          return parsed.origin;
        } catch {
          return `http://${host}:8080`;
        }
      }
    }
  }
  return envUrl || 'http://localhost:8080';
}

const INITIAL_PARTICIPANTS = [
  {
    id: 'user-self',
    name: 'You',
    role: 'Host',
    isSelf: true,
    avatarColor: 'bg-[#880808]',
    joinedAt: 'Just now',
    status: 'online',
  },
];

const INITIAL_MESSAGES = [];

export function useWatchParty() {
  const socketUrl = getBackendUrl();
  const { user } = useAuth();
  const signedInName = getUserDisplayName(user);

  // Room state
  const [isInRoom, setIsInRoom] = useState(false);
  const [roomCode, setRoomCode] = useState('SYNC-7729');
  const [userName, setUserName] = useState(signedInName || '');

  // Moderation & Rejoin states
  const [pendingRejoinRequests, setPendingRejoinRequests] = useState([]);
  const [rejoinStatus, setRejoinStatus] = useState(null); // null | 'pending' | 'approved' | 'rejected'
  const [sessionEndedNotice, setSessionEndedNotice] = useState(null);

  // Simulated role for demo preview: 'Host' | 'Moderator' | 'Participant'
  const [simulatedRole, setSimulatedRole] = useState('Host');
  const [isRoomCreator, setIsRoomCreator] = useState(false);

  // Volume & local player controls
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  // Participants roster
  const [participants, setParticipants] = useState(() =>
    INITIAL_PARTICIPANTS.map((p) =>
      p.isSelf && signedInName ? { ...p, name: `${signedInName} (You)` } : p
    )
  );

  // Messages / Chat & Live logs
  const [messages, setMessages] = useState(INITIAL_MESSAGES);

  // Floating reactions & counts
  const [reactions, setReactions] = useState([]);
  const [reactionCounts, setReactionCounts] = useState({ Like: 0, Love: 0 });

  // Connection metadata
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [latency, setLatency] = useState(24);

  const socketRef = useRef(null);
  const broadcastRef = useRef(null);

  // Video state
  const initialVideoId = extractYouTubeVideoId(SAMPLE_VIDEOS[0].url) || 'Y-rmzh0PI3c';
  const [videoState, setVideoState] = useState({
    url: SAMPLE_VIDEOS[0].url,
    videoId: initialVideoId,
    title: SAMPLE_VIDEOS[0].title,
    playing: false,
    playedSeconds: 0,
    duration: 0,
    buffering: false,
    lastActionBy: signedInName ? `${signedInName} (Host)` : 'Host',
    lastActionType: 'Initialized',
  });

  // Keep host name and self-participant name in sync with signed-in Supabase account during render
  const [prevSignedInName, setPrevSignedInName] = useState(signedInName);
  if (signedInName && signedInName !== prevSignedInName) {
    setPrevSignedInName(signedInName);
    setUserName((prev) => {
      if (!prev || prev === 'Host' || prev === 'Alex R.' || prev === 'Guest') {
        return signedInName;
      }
      return prev;
    });

    setParticipants((prev) =>
      prev.map((p) => {
        if (p.isSelf && (!p.name || p.name === 'You' || p.name.includes('Alex R.') || p.name === 'Host (You)')) {
          return {
            ...p,
            name: `${signedInName} (You)`,
          };
        }
        return p;
      })
    );

    setVideoState((prev) => {
      if (!prev.lastActionBy || prev.lastActionBy.includes('Alex R.')) {
        return {
          ...prev,
          lastActionBy: `${signedInName} (Host)`,
        };
      }
      return prev;
    });
  }

  // Floating reaction helper
  const triggerLocalReaction = useCallback((emoji) => {
    const id = Date.now() + Math.random();
    const xPos = 20 + Math.random() * 60; // 20% to 80%
    setReactions((prev) => [...prev, { id, emoji, xPos }]);

    if (emoji) {
      const lower = emoji.toLowerCase();
      if (lower.includes('like') || lower.includes('👍')) {
        setReactionCounts((prev) => ({ ...prev, Like: prev.Like + 1 }));
      } else if (lower.includes('love') || lower.includes('❤️') || lower.includes('heart')) {
        setReactionCounts((prev) => ({ ...prev, Love: prev.Love + 1 }));
      }
    }

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2500);
  }, []);

  // Session termination eviction helper (Requirement 10)
  const triggerSessionEnded = useCallback((customMessage) => {
    const noticeMsg =
      customMessage ||
      'This watch session has ended because the Host left the room. Redirecting you to the Home Page.';
    setSessionEndedNotice(noticeMsg);
    setVideoState((prev) => ({ ...prev, playing: false }));
    sessionStorage.setItem(
      'streamEvictionNotice',
      JSON.stringify({
        action: 'stream_ended',
        message: noticeMsg,
      })
    );
    setTimeout(() => {
      setIsInRoom(false);
      window.location.href = '/';
    }, 1800);
  }, []);

  // Real-time synchronization layer: Socket.io (network) + BroadcastChannel (multi-tab local)
  useEffect(() => {
    if (!isInRoom) return;

    // 1. BroadcastChannel for local instant cross-tab synchronization
    let channel;
    const generatedUserId = `user-${userName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'peer'}-${Date.now().toString(36)}`;

    try {
      channel = new BroadcastChannel(`synccast_room_${roomCode}`);
      broadcastRef.current = channel;

      // Broadcast our presence to existing tabs
      channel.postMessage({
        type: 'peer_join',
        peer: {
          id: generatedUserId,
          name: userName,
          role: simulatedRole,
        },
      });

      channel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === 'peer_join' && data.peer) {
          // New peer joined from another tab
          setParticipants((prev) => {
            if (prev.some((p) => p.name === data.peer.name || p.id === data.peer.id)) return prev;
            return [
              ...prev,
              {
                id: data.peer.id,
                name: data.peer.name,
                role: data.peer.role || 'Participant',
                isSelf: false,
                avatarColor: data.peer.role === 'Host' ? 'bg-[#880808]' : 'bg-slate-500',
                joinedAt: 'Just now',
                status: 'online',
              },
            ];
          });
          // Reply with our presence so the joiner discovers us
          channel.postMessage({
            type: 'peer_present',
            peer: {
              id: generatedUserId,
              name: userName,
              role: simulatedRole,
            },
          });
        } else if (data.type === 'peer_present' && data.peer) {
          // Existing peer responding to our announcement
          setParticipants((prev) => {
            if (prev.some((p) => p.name === data.peer.name || p.id === data.peer.id)) return prev;
            return [
              ...prev,
              {
                id: data.peer.id,
                name: data.peer.name,
                role: data.peer.role || 'Participant',
                isSelf: false,
                avatarColor: data.peer.role === 'Host' ? 'bg-[#880808]' : 'bg-slate-500',
                joinedAt: 'Just now',
                status: 'online',
              },
            ];
          });
        } else if (data.type === 'peer_leave') {
          setParticipants((prev) => prev.filter((p) => p.name !== data.name && p.id !== data.id));
        } else if (data.type === 'play') {
          setVideoState((prev) => ({
            ...prev,
            playing: true,
            playedSeconds: typeof data.currentTime === 'number' ? data.currentTime : prev.playedSeconds,
            lastActionBy: data.sender || prev.lastActionBy,
            lastActionType: 'Resumed playback',
          }));
        } else if (data.type === 'pause') {
          setVideoState((prev) => ({
            ...prev,
            playing: false,
            playedSeconds: typeof data.currentTime === 'number' ? data.currentTime : prev.playedSeconds,
            lastActionBy: data.sender || prev.lastActionBy,
            lastActionType: 'Paused playback',
          }));
        } else if (data.type === 'seek') {
          const timeStr = new Date((data.currentTime || 0) * 1000).toISOString().slice(14, 19);
          setVideoState((prev) => ({
            ...prev,
            playedSeconds: data.currentTime,
            lastActionBy: data.sender || prev.lastActionBy,
            lastActionType: `Scrubbed to ${timeStr}`,
          }));
        } else if (data.type === 'change_url') {
          setVideoState((prev) => ({
            ...prev,
            url: data.url,
            videoId: data.videoId,
            title: data.title,
            playing: true,
            playedSeconds: 0,
            lastActionBy: data.sender || prev.lastActionBy,
            lastActionType: 'Loaded new video',
          }));
        } else if (data.type === 'chat') {
          setMessages((prev) => [...prev, data.message]);
        } else if (data.type === 'reaction') {
          triggerLocalReaction(data.emoji);
        } else if (data.type === 'peer_evicted') {
          console.log('[peer_evicted received] ' + JSON.stringify({
            data,
            currentUserName: userName,
            generatedUserId
          }));
          const isMatch =
            (data.targetUserId && (data.targetUserId === generatedUserId || data.targetUserId === 'user-self')) ||
            (data.targetUsername && userName && data.targetUsername.toLowerCase() === userName.toLowerCase()) ||
            (data.targetUsername && userName && userName.toLowerCase().includes(data.targetUsername.toLowerCase())) ||
            (data.targetUsername && userName && data.targetUsername.toLowerCase().includes(userName.toLowerCase()));
          if (isMatch) {
            console.log('[peer_evicted] MATCH! Evicting to /');
            setIsInRoom(false);
            sessionStorage.setItem(
              'streamEvictionNotice',
              JSON.stringify({ action: data.action, message: data.reason })
            );
            window.location.href = '/';
            return;
          } else {
            setParticipants((prev) =>
              prev.filter((p) => p.id !== data.targetUserId && p.name !== data.targetUsername)
            );
          }
        } else if (data.type === 'request_rejoin' && data.participant) {
          if (simulatedRole === 'Host') {
            setPendingRejoinRequests((prev) => {
              if (
                prev.some(
                  (r) =>
                    r.username === data.participant.username ||
                    (r.userId && r.userId === data.participant.userId)
                )
              ) {
                return prev;
              }
              return [...prev, data.participant];
            });
          }
        } else if (data.type === 'rejoin_decision') {
          const isMatch =
            (data.targetUserId && (data.targetUserId === generatedUserId || data.targetUserId === 'user-self')) ||
            (data.targetUsername && userName && data.targetUsername.toLowerCase() === userName.toLowerCase());
          if (isMatch) {
            if (data.approved) {
              setRejoinStatus('approved');
            } else {
              setRejoinStatus('rejected');
              sessionStorage.setItem(
                'streamEvictionNotice',
                JSON.stringify({
                  action: 'rejected',
                  message: 'The host rejected your request to rejoin the stream.',
                })
              );
              window.location.href = '/';
            }
          }
        } else if (data.type === 'host_transferred') {
          const isSelfNewHost =
            (data.newHostId && (data.newHostId === generatedUserId || data.newHostId === 'user-self')) ||
            (data.newHostUsername && userName && data.newHostUsername.toLowerCase() === userName.toLowerCase());
          if (isSelfNewHost) {
            setSimulatedRole('Host');
            setIsRoomCreator(true);
          } else {
            setSimulatedRole('Participant');
            setIsRoomCreator(false);
          }
          setParticipants((prev) =>
            prev.map((p) => {
              const isTarget =
                p.id === data.newHostId ||
                (data.newHostUsername && (p.name === data.newHostUsername || p.name === `${data.newHostUsername} (You)`));
              const isOldHost =
                p.id === data.oldHostId ||
                (data.oldHostUsername && (p.name === data.oldHostUsername || p.name === `${data.oldHostUsername} (You)`));
              if (isTarget) {
                return { ...p, role: 'Host', avatarColor: 'bg-[#880808]' };
              }
              if (isOldHost) {
                return { ...p, role: 'Participant', avatarColor: 'bg-slate-500' };
              }
              return p;
            })
          );
        } else if (data.type === 'role_updated') {
          const isMatch =
            (data.targetUserId && (data.targetUserId === generatedUserId || data.targetUserId === 'user-self')) ||
            (data.targetUsername && userName && data.targetUsername.toLowerCase() === userName.toLowerCase());
          if (isMatch) {
            setSimulatedRole(data.newRole);
          }
          setParticipants((prev) =>
            prev.map((p) => {
              const match =
                p.id === data.targetUserId ||
                (data.targetUsername && (p.name === data.targetUsername || p.name === `${data.targetUsername} (You)`));
              if (match) {
                return {
                  ...p,
                  role: data.newRole,
                  avatarColor:
                    data.newRole === 'Host'
                      ? 'bg-[#880808]'
                      : data.newRole === 'Moderator'
                        ? 'bg-indigo-600'
                        : 'bg-slate-500',
                };
              }
              return p;
            })
          );
        } else if (data.type === 'stream_ended') {
          triggerSessionEnded(data.message);
        } else if (data.type === 'mute_participant') {
          const isMatch =
            (data.targetUserId && (data.targetUserId === generatedUserId || data.targetUserId === 'user-self')) ||
            (data.targetUsername && userName && data.targetUsername.toLowerCase() === userName.toLowerCase());
          if (isMatch) {
            setIsMuted(true);
          }
        }
      };
    } catch {
      // BroadcastChannel not available
    }

    // Unload cleanup for tab departure
    const handleBeforeUnload = () => {
      try {
        if (simulatedRole === 'Host' || isRoomCreator) {
          channel?.postMessage({
            type: 'stream_ended',
            message: 'This watch session has ended because the Host left the room. Redirecting you to the Home Page.',
          });
        } else {
          channel?.postMessage({
            type: 'peer_leave',
            id: generatedUserId,
            name: userName,
          });
        }
      } catch { }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2. Socket.io Client for multi-device network room synchronization
    let socket;
    try {
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnectionAttempts: 5,
        timeout: 4000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnectionStatus('connected');
        // Join backend room with room context
        socket.emit('join_room', {
          roomId: roomCode,
          userId: generatedUserId,
          username: userName,
          role: simulatedRole,
          isHost: isRoomCreator || simulatedRole === 'Host',
          initialVideoId: videoState.videoId,
          initialVideoTitle: videoState.title,
          currentTime: videoState.playedSeconds || 0,
          playbackState: videoState.playing ? 'playing' : 'paused',
        });
      });

      // Initial state received on join
      socket.on('initial_room_state', (data) => {
        if (data.currentVideoId) {
          const formatted = formatYouTubeUrl(data.currentVideoId) || data.currentVideoId;
          setVideoState((prev) => ({
            ...prev,
            videoId: data.currentVideoId,
            url: formatted,
            title: data.currentVideoTitle || prev.title,
            playing: data.playbackState === 'playing',
            playedSeconds: typeof data.currentTime === 'number' ? data.currentTime : (prev.playedSeconds || 0),
          }));
        }
        if (Array.isArray(data.participants) && data.participants.length > 0) {
          setParticipants(
            data.participants.map((p) => ({
              id: p.userId || p.socketId,
              name: p.username === userName ? `${p.username} (You)` : p.username,
              role: p.role || 'Participant',
              isSelf: p.username === userName,
              avatarColor: p.role === 'Host' ? 'bg-[#880808]' : (p.role === 'Moderator' ? 'bg-indigo-600' : 'bg-slate-500'),
              joinedAt: 'Joined',
              status: 'online',
            }))
          );
        }
      });

      // Peer joined network room
      socket.on('participant_joined', (data) => {
        if (data?.participant) {
          setParticipants((prev) => {
            if (prev.some((p) => p.name === data.participant.username || p.id === data.participant.userId)) return prev;
            return [
              ...prev,
              {
                id: data.participant.userId || data.participant.socketId,
                name: data.participant.username,
                role: data.participant.role || 'Participant',
                isSelf: data.participant.username === userName,
                avatarColor: data.participant.role === 'Host' ? 'bg-[#880808]' : (data.participant.role === 'Moderator' ? 'bg-indigo-600' : 'bg-slate-500'),
                joinedAt: 'Just now',
                status: 'online',
              },
            ];
          });
          const joinNotice = {
            id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'system',
            sender: 'System',
            text: `${data.participant.username} joined the stream.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, joinNotice]);
        }
      });

      // Peer departed network room
      socket.on('participant_left', (data) => {
        setParticipants((prev) => prev.filter((p) => p.name !== data?.username && p.id !== data?.userId));
      });

      // Participant removed event (Rule 2)
      socket.on('participant_removed', (data) => {
        if (data?.isSelf || data?.removedUserId === generatedUserId) {
          setIsInRoom(false);
          sessionStorage.setItem(
            'streamEvictionNotice',
            JSON.stringify({
              action: 'remove',
              message: data?.message || 'You have been removed from the stream session by the host.',
            })
          );
          window.location.href = '/';
        } else if (data?.removedUserId) {
          setParticipants((prev) =>
            prev.filter((p) => p.id !== data.removedUserId && p.name !== data.removedUsername)
          );
        }
      });

      // Participant blocked event (Rule 5)
      socket.on('participant_blocked', (data) => {
        if (data?.isSelf || data?.blockedUserId === generatedUserId) {
          setIsInRoom(false);
          sessionStorage.setItem(
            'streamEvictionNotice',
            JSON.stringify({
              action: 'block',
              message: data?.message || 'You have been permanently blocked from this stream.',
            })
          );
          window.location.href = '/';
        } else if (data?.blockedUserId) {
          setParticipants((prev) =>
            prev.filter((p) => p.id !== data.blockedUserId && p.name !== data.blockedUsername)
          );
        }
      });

      // Rejoin request received by Host (Rule 3)
      socket.on('rejoin_request', (data) => {
        if (data?.participant && simulatedRole === 'Host') {
          setPendingRejoinRequests((prev) => {
            if (
              prev.some(
                (r) =>
                  r.username === data.participant.username ||
                  (r.userId && r.userId === data.participant.userId)
              )
            ) {
              return prev;
            }
            return [...prev, data.participant];
          });
        }
      });

      // Rejoin approved event
      socket.on('rejoin_approved', () => {
        setRejoinStatus('approved');
      });

      // Rejoin rejected event (Rule 4)
      socket.on('rejoin_rejected', (data) => {
        setRejoinStatus('rejected');
        sessionStorage.setItem(
          'streamEvictionNotice',
          JSON.stringify({
            action: 'rejected',
            message: data?.message || 'The host rejected your request to rejoin the stream.',
          })
        );
        window.location.href = '/';
      });

      // Denied join attempt (e.g. permanently blocked)
      socket.on('join_denied', (data) => {
        setIsInRoom(false);
        sessionStorage.setItem(
          'streamEvictionNotice',
          JSON.stringify({
            action: 'block',
            message: data?.error || 'You are permanently blocked from this stream.',
          })
        );
        window.location.href = '/';
      });

      // Full room updated from backend
      socket.on('room_updated', (data) => {
        if (Array.isArray(data?.participants) && data.participants.length > 0) {
          setParticipants(
            data.participants.map((p) => ({
              id: p.userId || p.socketId,
              name: p.username === userName ? `${p.username} (You)` : p.username,
              role: p.role || 'Participant',
              isSelf: p.username === userName,
              avatarColor: p.role === 'Host' ? 'bg-[#880808]' : (p.role === 'Moderator' ? 'bg-indigo-600' : 'bg-slate-500'),
              joinedAt: 'Joined',
              status: 'online',
            }))
          );
        }
        if (data?.currentVideoId && !canControlPlayback) {
          const formatted = formatYouTubeUrl(data.currentVideoId) || data.currentVideoId;
          setVideoState((prev) => ({
            ...prev,
            videoId: data.currentVideoId,
            url: formatted,
            title: data.currentVideoTitle || prev.title,
            playing: data.playbackState === 'playing',
            playedSeconds: typeof data.currentTime === 'number' ? data.currentTime : prev.playedSeconds,
          }));
        }
      });

      // Video playback events from backend
      socket.on('video_played', (payload) => {
        const actor = payload.playedBy?.username || 'Host';
        setVideoState((prev) => ({
          ...prev,
          playing: true,
          playedSeconds: typeof payload.currentTime === 'number' ? payload.currentTime : prev.playedSeconds,
          lastActionBy: `${actor} (${payload.playedBy?.role || 'Host'})`,
          lastActionType: 'Resumed playback',
        }));
      });

      socket.on('video_paused', (payload) => {
        const actor = payload.pausedBy?.username || 'Host';
        setVideoState((prev) => ({
          ...prev,
          playing: false,
          playedSeconds: typeof payload.currentTime === 'number' ? payload.currentTime : prev.playedSeconds,
          lastActionBy: `${actor} (${payload.pausedBy?.role || 'Host'})`,
          lastActionType: 'Paused playback',
        }));
      });

      socket.on('video_seeked', (payload) => {
        const actor = payload.seekedBy?.username || 'Host';
        const timeStr = new Date((payload.currentTime || 0) * 1000).toISOString().slice(14, 19);
        setVideoState((prev) => ({
          ...prev,
          playedSeconds: typeof payload.currentTime === 'number' ? payload.currentTime : prev.playedSeconds,
          lastActionBy: `${actor} (${payload.seekedBy?.role || 'Host'})`,
          lastActionType: `Seeked to ${timeStr}`,
        }));
      });

      socket.on('video_changed', (payload) => {
        const vId = payload.currentVideoId;
        const vUrl = formatYouTubeUrl(vId) || vId;
        const actor = payload.changedBy?.username || 'Host';
        setVideoState((prev) => ({
          ...prev,
          videoId: vId,
          url: vUrl,
          title: payload.currentVideoTitle || 'YouTube Video',
          playing: true,
          playedSeconds: 0,
          lastActionBy: `${actor} (${payload.changedBy?.role || 'Host'})`,
          lastActionType: 'Loaded new YouTube video',
        }));
      });

      socket.on('chat_message', (payload) => {
        if (payload?.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.message.id)) return prev;
            // Deduplicate if recent message with same sender and text
            const duplicateRecent = prev.some(
              (m) =>
                m.sender === payload.message.sender &&
                m.text === payload.message.text &&
                Math.abs(Date.now() - (parseInt(m.id?.split('-')?.[1], 10) || 0)) < 3000
            );
            if (duplicateRecent) return prev;
            return [...prev, payload.message];
          });
        }
      });

      socket.on('reaction_received', (payload) => {
        if (payload.emoji) {
          triggerLocalReaction(payload.emoji);
        }
      });

      socket.on('host_transferred', (data) => {
        const isSelfNewHost =
          (data?.newHostId && (data.newHostId === generatedUserId || data.newHostId === user?.id)) ||
          (data?.newHostUsername && userName && data.newHostUsername.toLowerCase() === userName.toLowerCase());
        if (isSelfNewHost) {
          setSimulatedRole('Host');
          setIsRoomCreator(true);
        } else {
          setSimulatedRole('Participant');
          setIsRoomCreator(false);
        }
        setParticipants((prev) =>
          prev.map((p) => {
            if (p.id === data?.newHostId || (data?.newHostUsername && p.name.includes(data.newHostUsername))) {
              return { ...p, role: 'Host', avatarColor: 'bg-[#880808]' };
            }
            if (p.id === data?.oldHostId || (data?.oldHostUsername && p.name.includes(data.oldHostUsername))) {
              return { ...p, role: 'Participant', avatarColor: 'bg-slate-500' };
            }
            return p;
          })
        );
      });

      socket.on('stream_ended', (data) => {
        triggerSessionEnded(data?.message);
      });

      socket.on('participant_muted', (data) => {
        if (
          data?.targetUserId === generatedUserId ||
          data?.targetUserId === user?.id ||
          (data?.targetUsername && data.targetUsername.toLowerCase() === userName.toLowerCase())
        ) {
          setIsMuted(true);
        }
      });

      socket.on('role_updated', (data) => {
        const normRole =
          data?.role === 'host' ? 'Host' : data?.role === 'moderator' ? 'Moderator' : 'Participant';
        if (data?.userId === generatedUserId || (user?.id && data?.userId === user.id)) {
          setSimulatedRole(normRole);
        }
        setParticipants((prev) =>
          prev.map((p) => {
            if (p.id === data?.userId) {
              return {
                ...p,
                role: normRole,
                avatarColor:
                  normRole === 'Host'
                    ? 'bg-[#880808]'
                    : normRole === 'Moderator'
                      ? 'bg-indigo-600'
                      : 'bg-slate-500',
              };
            }
            return p;
          })
        );
      });

      socket.on('your_role_updated', (data) => {
        const newRole = data?.role === 'host' ? 'Host' : data?.role === 'moderator' ? 'Moderator' : 'Participant';
        setSimulatedRole(newRole);
        setIsRoomCreator(newRole === 'Host');
        setParticipants((prev) => prev.map((p) => (p.isSelf ? { ...p, role: newRole } : p)));
      });

      socket.on('connect_error', () => {
        setConnectionStatus('simulated');
      });

      socket.on('disconnect', () => {
        setConnectionStatus('simulated');
      });
    } catch {
      setTimeout(() => {
        setConnectionStatus('simulated');
      }, 0);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
      if (channel) {
        channel.close();
        broadcastRef.current = null;
      }
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [isInRoom, socketUrl, roomCode, userName, simulatedRole, isRoomCreator, triggerLocalReaction, triggerSessionEnded, user?.id]);

  // Ping jitter simulation for realistic SaaS feel
  useEffect(() => {
    if (!isInRoom) return;
    const interval = setInterval(() => {
      setLatency((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(16, Math.min(38, prev + delta));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isInRoom]);

  // Permissions helper - Rule 1: Only the host has permission to play, pause, or control the streamed video.
  const canControlPlayback = simulatedRole === 'Host';
  const canManageUsers = simulatedRole === 'Host';

  // Join party action
  const joinParty = useCallback(({ name, code, initialUrl, title, role = 'Participant', isHost = false }) => {
    // When a user starts a stream or hosts, they become the Host.
    // When joining an existing room via invite link/code, isHost is false and role is 'Participant'.
    const isHostRole = Boolean(isHost || role === 'Host');
    const finalRole = isHostRole ? 'Host' : (role === 'Moderator' ? 'Moderator' : 'Participant');
    const finalName = name?.trim() || signedInName || (finalRole === 'Host' ? 'Host' : 'Participant');
    const finalCode = code?.trim().toUpperCase() || 'SYNC-7729';

    setIsRoomCreator(isHostRole);

    // Rule 5 & 6: Blocked participants may never rejoin. Priority rule overrides all.
    if (finalRole !== 'Host' && isParticipantBlocked(finalCode, null, finalName)) {
      sessionStorage.setItem(
        'streamEvictionNotice',
        JSON.stringify({
          action: 'block',
          message: `You are permanently blocked from stream ${finalCode}. Rejoin attempts are strictly denied.`,
        })
      );
      window.location.href = '/';
      return { isBlocked: true, blocked: true };
    }

    // Rule 3: Removed participants require host approval before re-entering
    if (finalRole !== 'Host' && isParticipantRemoved(finalCode, null, finalName)) {
      return { isRemoved: true, requiresApproval: true, code: finalCode, name: finalName };
    }

    setUserName(finalName);
    setRoomCode(finalCode);
    setSimulatedRole(finalRole);
    setIsInRoom(true);

    if (initialUrl && initialUrl.trim()) {
      const trimmed = initialUrl.trim();
      const extractedId = extractYouTubeVideoId(trimmed);
      const formatted = extractedId ? formatYouTubeUrl(extractedId) : trimmed;

      setVideoState((prev) => ({
        ...prev,
        url: formatted,
        videoId: extractedId || prev.videoId,
        title: title?.trim() || prev.title,
        playing: true,
        playedSeconds: 0,
        lastActionBy: `${finalName} (${finalRole})`,
        lastActionType: 'Loaded initial video',
      }));
    }

    // Set current user as the only participant initially (real count = 1)
    setParticipants([
      {
        id: 'user-self',
        name: `${finalName} (You)`,
        role: finalRole,
        isSelf: true,
        avatarColor: finalRole === 'Host' ? 'bg-[#880808]' : finalRole === 'Moderator' ? 'bg-indigo-600' : 'bg-slate-500',
        joinedAt: 'Just now',
        status: 'online',
      },
    ]);

    setMessages([]);

    if (isHostRole) {
      const vidId = initialUrl ? extractYouTubeVideoId(initialUrl) : 'Y-rmzh0PI3c';
      fetch(`${socketUrl}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: `${finalName}'s Watch Stream`,
          hostId: user?.id || `host-${Date.now()}`,
          username: finalName,
          initialVideoId: vidId || 'Y-rmzh0PI3c',
          initialVideoTitle: title || 'Blender Studio: Cosmos Laundromat',
          isPublic: true,
          roomId: finalCode,
        }),
      }).catch(() => { });
    }

    return { success: true };
  }, [signedInName, socketUrl, user?.id]);

  // Synced play / pause
  const togglePlay = useCallback(() => {
    if (!canControlPlayback) return;
    const nextPlaying = !videoState.playing;
    const curTime = videoState.playedSeconds || 0;

    setVideoState((prev) => ({
      ...prev,
      playing: nextPlaying,
      lastActionBy: `${userName} (${simulatedRole})`,
      lastActionType: nextPlaying ? 'Resumed playback' : 'Paused playback',
    }));

    // Socket.io sync
    if (socketRef.current?.connected) {
      socketRef.current.emit(nextPlaying ? 'play_video' : 'pause_video', {
        roomId: roomCode,
        currentTime: curTime,
      });
    }

    // BroadcastChannel sync
    broadcastRef.current?.postMessage({
      type: nextPlaying ? 'play' : 'pause',
      currentTime: curTime,
      sender: `${userName} (${simulatedRole})`,
    });
  }, [canControlPlayback, videoState.playing, videoState.playedSeconds, userName, simulatedRole, roomCode]);

  // Synced seek
  const seekTo = useCallback(
    (seconds) => {
      if (!canControlPlayback) return;
      const targetSeconds = Math.max(0, seconds);
      const formattedTime = new Date(targetSeconds * 1000).toISOString().slice(14, 19);

      setVideoState((prev) => ({
        ...prev,
        playedSeconds: targetSeconds,
        lastActionBy: `${userName} (${simulatedRole})`,
        lastActionType: `Seeked to ${formattedTime}`,
      }));

      // Socket.io sync
      if (socketRef.current?.connected) {
        socketRef.current.emit('seek_video', {
          roomId: roomCode,
          currentTime: targetSeconds,
        });
      }

      // BroadcastChannel sync
      broadcastRef.current?.postMessage({
        type: 'seek',
        currentTime: targetSeconds,
        sender: `${userName} (${simulatedRole})`,
      });
    },
    [canControlPlayback, userName, simulatedRole, roomCode]
  );

  // Restart video from beginning (0:00)
  const restartVideo = useCallback(() => {
    if (!canControlPlayback) return;

    setVideoState((prev) => ({
      ...prev,
      playedSeconds: 0,
      playing: true,
      lastActionBy: `${userName} (${simulatedRole})`,
      lastActionType: 'Restarted video from 0:00',
    }));

    // Socket.io sync: seek to 0 and play
    if (socketRef.current?.connected) {
      socketRef.current.emit('seek_video', {
        roomId: roomCode,
        currentTime: 0,
      });
      socketRef.current.emit('play_video', {
        roomId: roomCode,
        currentTime: 0,
      });
    }

    // BroadcastChannel sync
    broadcastRef.current?.postMessage({
      type: 'seek',
      currentTime: 0,
      sender: `${userName} (${simulatedRole})`,
    });
    broadcastRef.current?.postMessage({
      type: 'play',
      currentTime: 0,
      sender: `${userName} (${simulatedRole})`,
    });
  }, [canControlPlayback, userName, simulatedRole, roomCode]);

  // Skip forward (+10s / Next) or backward (-10s / Previous)
  const skipVideo = useCallback(
    (offsetSeconds) => {
      if (!canControlPlayback) return;
      const cur = videoState.playedSeconds || 0;
      const max = videoState.duration || 3600;
      const target = Math.max(0, Math.min(max, cur + offsetSeconds));
      const isForward = offsetSeconds > 0;
      const actionLabel = isForward
        ? `Skipped forward ${Math.abs(offsetSeconds)}s (Next)`
        : `Skipped backward ${Math.abs(offsetSeconds)}s (Previous)`;

      setVideoState((prev) => ({
        ...prev,
        playedSeconds: target,
        lastActionBy: `${userName} (${simulatedRole})`,
        lastActionType: actionLabel,
      }));

      // Socket.io sync
      if (socketRef.current?.connected) {
        socketRef.current.emit('seek_video', {
          roomId: roomCode,
          currentTime: target,
        });
      }

      // BroadcastChannel sync
      broadcastRef.current?.postMessage({
        type: 'seek',
        actionType: isForward ? 'skip_forward' : 'skip_backward',
        currentTime: target,
        sender: `${userName} (${simulatedRole})`,
      });
    },
    [canControlPlayback, videoState.playedSeconds, videoState.duration, userName, simulatedRole, roomCode]
  );

  // Change video URL and broadcast across room
  const changeVideoUrl = useCallback(
    (newUrl, newTitle) => {
      if (!canControlPlayback) return;
      if (!newUrl || !newUrl.trim()) return;

      const trimmedUrl = newUrl.trim();
      const videoId = extractYouTubeVideoId(trimmedUrl);
      const formatted = videoId ? formatYouTubeUrl(videoId) : trimmedUrl;
      const matched = SAMPLE_VIDEOS.find(
        (v) => v.url === trimmedUrl || (videoId && extractYouTubeVideoId(v.url) === videoId)
      );
      const title = newTitle || (matched ? matched.title : `YouTube Video (${videoId || 'Stream'})`);

      setVideoState({
        url: formatted,
        videoId: videoId || trimmedUrl,
        title,
        playing: true,
        playedSeconds: 0,
        duration: 0,
        buffering: false,
        lastActionBy: `${userName} (${simulatedRole})`,
        lastActionType: 'Loaded new YouTube video',
      });

      // Socket.io sync
      if (socketRef.current?.connected) {
        socketRef.current.emit('change_video', {
          roomId: roomCode,
          videoId: videoId || trimmedUrl,
          videoTitle: title,
        });
      }

      // BroadcastChannel sync
      broadcastRef.current?.postMessage({
        type: 'change_url',
        url: formatted,
        videoId: videoId || trimmedUrl,
        title,
        sender: `${userName} (${simulatedRole})`,
      });
    },
    [canControlPlayback, userName, simulatedRole, roomCode]
  );

  // Play Next Video in stream queue
  const playNextVideo = useCallback(() => {
    if (!canControlPlayback) return;
    const currentIndex = SAMPLE_VIDEOS.findIndex(
      (v) => v.url === videoState.url || (videoState.videoId && extractYouTubeVideoId(v.url) === videoState.videoId)
    );
    const nextIndex = (currentIndex + 1) % SAMPLE_VIDEOS.length;
    const nextVideo = SAMPLE_VIDEOS[nextIndex];
    changeVideoUrl(nextVideo.url, nextVideo.title);
  }, [canControlPlayback, videoState.url, videoState.videoId, changeVideoUrl]);

  // Play Previous Video in stream queue
  const playPreviousVideo = useCallback(() => {
    if (!canControlPlayback) return;
    const currentIndex = SAMPLE_VIDEOS.findIndex(
      (v) => v.url === videoState.url || (videoState.videoId && extractYouTubeVideoId(v.url) === videoState.videoId)
    );
    const prevIndex = currentIndex <= 0 ? SAMPLE_VIDEOS.length - 1 : currentIndex - 1;
    const prevVideo = SAMPLE_VIDEOS[prevIndex];
    changeVideoUrl(prevVideo.url, prevVideo.title);
  }, [canControlPlayback, videoState.url, videoState.videoId, changeVideoUrl]);

  // Host Transfer Ownership Logic (RBAC Section 5)
  const transferHost = useCallback(
    (targetUserId, targetUsername) => {
      if (!canManageUsers) return;
      const tUser = targetUsername || participants.find((p) => p.id === targetUserId)?.name?.replace(' (You)', '');

      // Local state update: demote self to Guest, promote target to Host
      setSimulatedRole('Participant');
      setIsRoomCreator(false);
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.isSelf) {
            return { ...p, role: 'Participant', avatarColor: 'bg-slate-500' };
          }
          if (p.id === targetUserId || p.name === tUser || p.name === `${tUser} (You)`) {
            return { ...p, role: 'Host', avatarColor: 'bg-[#880808]' };
          }
          return p;
        })
      );

      // 1. BroadcastChannel across all local tabs
      broadcastRef.current?.postMessage({
        type: 'host_transferred',
        oldHostId: 'user-self',
        oldHostUsername: userName,
        newHostId: targetUserId,
        newHostUsername: tUser,
      });

      // 2. Socket.io event to real-time room
      if (socketRef.current?.connected) {
        socketRef.current.emit('transfer_host', {
          roomId: roomCode,
          newHostId: targetUserId,
        });
      }

      // 3. REST API to persist in MongoDB Room & RoomParticipant collections
      fetch(`${socketUrl}/api/rooms/${roomCode}/transfer-host`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newHostId: targetUserId,
          requesterId: user?.id || 'user-self',
        }),
      }).catch(() => { });
    },
    [canManageUsers, participants, userName, roomCode, socketUrl, user?.id]
  );

  // Mute Participant (RBAC Section 4)
  const muteUser = useCallback(
    (targetUserId, targetUsername) => {
      if (!canManageUsers) return;
      const tUser = targetUsername || participants.find((p) => p.id === targetUserId)?.name?.replace(' (You)', '');

      // 1. BroadcastChannel
      broadcastRef.current?.postMessage({
        type: 'mute_participant',
        targetUserId,
        targetUsername: tUser,
      });

      // 2. Socket.io
      if (socketRef.current?.connected) {
        socketRef.current.emit('mute_participant', {
          roomId: roomCode,
          targetUserId,
        });
      }
    },
    [canManageUsers, participants, roomCode]
  );

  // End Stream / Terminate Session (Requirement 10)
  const endStream = useCallback(() => {
    if (!canManageUsers) return;

    const terminationMessage =
      'This watch session has ended because the Host left the room. Redirecting you to the Home Page.';

    // 1. BroadcastChannel across all local tabs
    broadcastRef.current?.postMessage({
      type: 'stream_ended',
      message: terminationMessage,
    });

    // 2. Socket.io
    if (socketRef.current?.connected) {
      socketRef.current.emit('end_stream', {
        roomId: roomCode,
      });
    }

    // 3. REST API to update MongoDB Room (streamStatus = ended) and RoomParticipants
    fetch(`${socketUrl}/api/rooms/${roomCode}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requesterId: user?.id || 'user-self',
      }),
    }).catch(() => { });

    setIsInRoom(false);
    sessionStorage.setItem(
      'streamEvictionNotice',
      JSON.stringify({
        action: 'stream_ended',
        message: 'You have ended the watch party session.',
      })
    );
    window.location.href = '/';
  }, [canManageUsers, roomCode, socketUrl, user?.id]);

  // Leave Party (Requirement 10: If Host leaves or ends session, room terminates for all participants)
  const leaveParty = useCallback(() => {
    if (simulatedRole === 'Host' || isRoomCreator) {
      endStream();
    } else {
      if (socketRef.current?.connected) {
        socketRef.current.emit('leave_room', {
          roomId: roomCode,
          userId: user?.id || 'user-self',
          username: userName,
        });
      }
      broadcastRef.current?.postMessage({
        type: 'peer_leave',
        id: user?.id || 'user-self',
        name: userName,
      });
      setIsInRoom(false);
    }
  }, [simulatedRole, isRoomCreator, endStream, roomCode, user?.id, userName]);

  // Promote participant to Moderator (Host only - Requirement 7)
  const promoteToModerator = useCallback(
    (userId, targetUsername) => {
      if (!canManageUsers) return;
      const tUser = targetUsername || participants.find((p) => p.id === userId)?.name?.replace(' (You)', '');

      setParticipants((prev) =>
        prev.map((p) => {
          if (p.id === userId || p.name === tUser || p.name === `${tUser} (You)`) {
            return { ...p, role: 'Moderator', avatarColor: 'bg-indigo-600' };
          }
          return p;
        })
      );

      broadcastRef.current?.postMessage({
        type: 'role_updated',
        targetUserId: userId,
        targetUsername: tUser,
        newRole: 'Moderator',
      });

      if (socketRef.current?.connected) {
        socketRef.current.emit('assign_role', {
          roomId: roomCode,
          targetUserId: userId,
          newRole: 'moderator',
        });
      }

      fetch(`${socketUrl}/api/rooms/${roomCode}/assign-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomCode,
          targetUserId: userId,
          newRole: 'moderator',
          requesterId: user?.id || 'user-self',
        }),
      }).catch(() => { });
    },
    [canManageUsers, participants, roomCode, socketUrl, user?.id]
  );

  // Demote Moderator back to Guest (Host only)
  const demoteToGuest = useCallback(
    (userId, targetUsername) => {
      if (!canManageUsers) return;
      const tUser = targetUsername || participants.find((p) => p.id === userId)?.name?.replace(' (You)', '');

      setParticipants((prev) =>
        prev.map((p) => {
          if (p.id === userId || p.name === tUser || p.name === `${tUser} (You)`) {
            return { ...p, role: 'Participant', avatarColor: 'bg-slate-500' };
          }
          return p;
        })
      );

      broadcastRef.current?.postMessage({
        type: 'role_updated',
        targetUserId: userId,
        targetUsername: tUser,
        newRole: 'Participant',
      });

      if (socketRef.current?.connected) {
        socketRef.current.emit('assign_role', {
          roomId: roomCode,
          targetUserId: userId,
          newRole: 'guest',
        });
      }

      fetch(`${socketUrl}/api/rooms/${roomCode}/assign-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomCode,
          targetUserId: userId,
          newRole: 'guest',
          requesterId: user?.id || 'user-self',
        }),
      }).catch(() => { });
    },
    [canManageUsers, participants, roomCode, socketUrl, user?.id]
  );

  const promoteUser = promoteToModerator;
  const demoteUser = demoteToGuest;

  // Moderation: Remove participant (Rule 2)
  const removeUser = useCallback(
    (userId, targetUsername) => {
      if (!canManageUsers) return;
      const tUser = targetUsername || participants.find((p) => p.id === userId)?.name?.replace(' (You)', '');
      // 1. Save in local moderation storage
      addRemovedParticipant(roomCode, { userId, username: tUser });

      // 2. Broadcast immediately to tabs via BroadcastChannel
      broadcastRef.current?.postMessage({
        type: 'peer_evicted',
        action: 'remove',
        reason: 'You have been removed from the stream session by the host.',
        targetUserId: userId,
        targetUsername: tUser,
      });

      // 3. Socket event to backend
      if (socketRef.current?.connected) {
        socketRef.current.emit('remove_participant', {
          roomId: roomCode,
          targetUserId: userId,
        });
      }

      // 4. Update local roster
      setParticipants((prev) =>
        prev.filter((p) => p.id !== userId && p.name !== tUser && !p.name.startsWith(tUser + ' '))
      );
    },
    [canManageUsers, roomCode, participants, setParticipants]
  );

  const kickUser = useCallback(
    (userId) => {
      if (!canManageUsers) return;
      const target = participants.find((p) => p.id === userId);
      removeUser(userId, target?.name);
    },
    [canManageUsers, participants, removeUser]
  );

  // Moderation: Permanently block participant (Rule 5)
  const blockUser = useCallback(
    (userId, targetUsername) => {
      if (!canManageUsers) return;
      const tUser = targetUsername || participants.find((p) => p.id === userId)?.name?.replace(' (You)', '');
      // 1. Save in permanent blocklist storage
      addBlockedParticipant(roomCode, { userId, username: tUser });

      // 2. Broadcast immediately to tabs via BroadcastChannel
      broadcastRef.current?.postMessage({
        type: 'peer_evicted',
        action: 'block',
        reason: 'You have been permanently blocked from this stream by the host.',
        targetUserId: userId,
        targetUsername: tUser,
      });

      // 3. Socket event to backend
      if (socketRef.current?.connected) {
        socketRef.current.emit('block_participant', {
          roomId: roomCode,
          targetUserId: userId,
        });
      }

      // 4. Update local roster
      setParticipants((prev) =>
        prev.filter((p) => p.id !== userId && p.name !== tUser && !p.name.startsWith(tUser + ' '))
      );
    },
    [canManageUsers, roomCode, participants, setParticipants]
  );

  // Host: Approve or reject rejoin request (Rule 3 & 4)
  const respondToRejoinRequest = useCallback(
    (requestId, approved) => {
      if (!canManageUsers) return;
      const req = pendingRejoinRequests.find(
        (r) => r.id === requestId || r.userId === requestId || r.username === requestId
      );
      if (!req) return;

      const targetUserId = req.userId;
      const targetUsername = req.username;

      if (approved) {
        removeRemovedParticipant(roomCode, targetUserId, targetUsername);
      }

      // Broadcast decision
      broadcastRef.current?.postMessage({
        type: 'rejoin_decision',
        approved: Boolean(approved),
        targetUserId,
        targetUsername,
      });

      // Socket emit to backend
      if (socketRef.current?.connected) {
        socketRef.current.emit('respond_rejoin_request', {
          roomId: roomCode,
          targetUserId,
          targetSocketId: req.socketId,
          approved: Boolean(approved),
        });
      }

      // Clear pending modal request
      setPendingRejoinRequests((prev) =>
        prev.filter((r) => r.id !== requestId && r.userId !== requestId && r.username !== requestId)
      );
    },
    [canManageUsers, pendingRejoinRequests, roomCode]
  );

  // Participant: Send request to rejoin stream (Rule 3)
  const sendRejoinRequest = useCallback(
    ({ code, name }) => {
      const targetCode = code?.trim().toUpperCase() || roomCode;
      const targetName = name?.trim() || userName;
      const generatedUserId = `user-${targetName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'peer'}-${Date.now().toString(36)}`;

      setRejoinStatus('pending');

      const participantPayload = {
        userId: generatedUserId,
        username: targetName,
        requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        roomId: targetCode,
      };

      // BroadcastChannel to host tab and listen for decision
      try {
        const bc = new BroadcastChannel(`synccast_room_${targetCode}`);
        bc.postMessage({
          type: 'request_rejoin',
          participant: participantPayload,
        });

        bc.onmessage = (event) => {
          const data = event.data;
          if (data?.type === 'rejoin_decision') {
            const isMatch =
              (data.targetUserId && data.targetUserId === generatedUserId) ||
              (data.targetUsername &&
                targetName &&
                (data.targetUsername.toLowerCase() === targetName.toLowerCase() ||
                  targetName.toLowerCase().includes(data.targetUsername.toLowerCase()) ||
                  data.targetUsername.toLowerCase().includes(targetName.toLowerCase())));
            if (isMatch) {
              if (data.approved) {
                setRejoinStatus('approved');
              } else {
                setRejoinStatus('rejected');
              }
              try {
                bc.close();
              } catch { }
            }
          }
        };
      } catch {
        // ignore
      }

      // Storage event listener in case host removes user from synccast_removed list
      const handleStorageChange = (e) => {
        if (e.key === `synccast_removed_${targetCode}`) {
          try {
            const list = JSON.parse(e.newValue || '[]');
            const stillRemoved = list.some(
              (p) => p.username?.toLowerCase() === targetName.toLowerCase()
            );
            if (!stillRemoved) {
              setRejoinStatus('approved');
              window.removeEventListener('storage', handleStorageChange);
            }
          } catch { }
        }
      };
      window.addEventListener('storage', handleStorageChange);

      // Socket emit
      if (socketRef.current?.connected) {
        socketRef.current.emit('join_room', {
          roomId: targetCode,
          userId: generatedUserId,
          username: targetName,
        });
      }
    },
    [roomCode, userName]
  );

  // Live Chat
  const sendChatMessage = useCallback(
    (text) => {
      if (!text || !text.trim()) return;
      const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newMsg = {
        id: msgId,
        type: 'chat',
        sender: userName,
        role: simulatedRole,
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, newMsg]);

      // Socket.io sync
      if (socketRef.current?.connected) {
        socketRef.current.emit('send_chat', {
          roomId: roomCode,
          message: text.trim(),
          id: msgId,
        });
      }

      // BroadcastChannel sync
      broadcastRef.current?.postMessage({
        type: 'chat',
        message: newMsg,
      });
    },
    [userName, simulatedRole, roomCode]
  );

  // Reactions
  const triggerReaction = useCallback(
    (emoji) => {
      triggerLocalReaction(emoji);
      if (socketRef.current?.connected) {
        socketRef.current.emit('send_reaction', { emoji });
      }
      if (broadcastRef.current) {
        try {
          broadcastRef.current.postMessage({ type: 'reaction', emoji });
        } catch {
          // ignore channel error
        }
      }
    },
    [triggerLocalReaction]
  );

  // Role Switcher for previewing perspectives
  const switchSimulatedRole = useCallback((newRole) => {
    if (newRole === 'Host' && !isRoomCreator) {
      console.warn('Cannot switch to Host: user joined via invitation code.');
      return;
    }
    setSimulatedRole(newRole);
    setParticipants((prev) =>
      prev.map((p) => (p.isSelf ? { ...p, role: newRole } : p))
    );
  }, [isRoomCreator, setParticipants]);

  return {
    // Room info
    isInRoom,
    roomCode,
    userName,
    joinParty,
    leaveParty,
    sessionEndedNotice,

    // Role state
    simulatedRole,
    isRoomCreator,
    switchSimulatedRole,
    canControlPlayback,
    canManageUsers,

    // Video playback
    videoState,
    setVideoState,
    togglePlay,
    seekTo,
    restartVideo,
    skipVideo,
    playNextVideo,
    playPreviousVideo,
    changeVideoUrl,
    volume,
    setVolume,
    isMuted,
    setIsMuted,

    // Participants & moderation
    participants,
    transferHost,
    muteUser,
    endStream,
    promoteToModerator,
    demoteToGuest,
    promoteUser,
    demoteUser,
    kickUser,
    removeUser,
    blockUser,
    pendingRejoinRequests,
    setPendingRejoinRequests,
    respondToRejoinRequest,
    sendRejoinRequest,
    rejoinStatus,
    setRejoinStatus,

    // Messaging & reactions
    messages,
    sendChatMessage,
    reactions,
    reactionCounts,
    triggerReaction,

    // Connectivity
    connectionStatus,
    latency,
    socketUrl,
    wsUrl: socketUrl,
  };
}
