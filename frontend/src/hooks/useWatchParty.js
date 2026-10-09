import { useState, useEffect, useRef, useCallback } from 'react';

// Default curated YouTube sample streams / videos
export const SAMPLE_VIDEOS = [
  {
    title: 'Lofi Girl - beats to relax/study to',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    category: 'Live Chill Music',
    badge: 'Trending Live',
  },
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
];

const INITIAL_PARTICIPANTS = [
  {
    id: 'user-host',
    name: 'You (Alex R.)',
    role: 'Host',
    isSelf: true,
    avatarColor: 'bg-[#880808]',
    joinedAt: 'Just now',
    status: 'online',
  },
  {
    id: 'user-mod-1',
    name: 'Elena Rostova',
    role: 'Moderator',
    isSelf: false,
    avatarColor: 'bg-[#990000]',
    joinedAt: '2m ago',
    status: 'online',
  },
  {
    id: 'user-part-1',
    name: 'Marcus Chen',
    role: 'Participant',
    isSelf: false,
    avatarColor: 'bg-slate-400',
    joinedAt: '5m ago',
    status: 'online',
  },
  {
    id: 'user-part-2',
    name: 'Zoe Vance',
    role: 'Participant',
    isSelf: false,
    avatarColor: 'bg-slate-300',
    joinedAt: '8m ago',
    status: 'online',
  },
];

const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    type: 'system',
    text: 'Room created. Real-time synchronization active.',
    timestamp: '12:00 PM',
  },
  {
    id: 'msg-2',
    type: 'chat',
    sender: 'Elena Rostova',
    role: 'Moderator',
    text: 'Welcome everyone! Audio and sync are crisp.',
    timestamp: '12:01 PM',
  },
  {
    id: 'msg-3',
    type: 'chat',
    sender: 'Marcus Chen',
    role: 'Participant',
    text: 'The 4K stream looks gorgeous on my monitor!',
    timestamp: '12:02 PM',
  },
];

export function useWatchParty() {
  const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api.syncedcinema.live/ws';
  
  // Room state
  const [isInRoom, setIsInRoom] = useState(false);
  const [roomCode, setRoomCode] = useState('SYNC-7729');
  const [userName, setUserName] = useState('Alex R.');
  
  // Simulated role for demo preview: 'Host' | 'Moderator' | 'Participant'
  const [simulatedRole, setSimulatedRole] = useState('Host');

  // Video state
  const [videoState, setVideoState] = useState({
    url: SAMPLE_VIDEOS[0].url,
    title: SAMPLE_VIDEOS[0].title,
    playing: false,
    playedSeconds: 0,
    duration: 0,
    buffering: false,
    lastActionBy: 'Alex R. (Host)',
    lastActionType: 'Initialized',
  });

  // Volume & local player controls
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  // Participants roster
  const [participants, setParticipants] = useState(INITIAL_PARTICIPANTS);

  // Messages / Chat & Live logs
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  
  // Floating reactions
  const [reactions, setReactions] = useState([]);

  // Connection metadata
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [latency, setLatency] = useState(24);

  const wsRef = useRef(null);

  // Pre-wired WebSocket hook: If actual WebSocket server is accessible, connects cleanly
  useEffect(() => {
    if (!isInRoom || !wsUrl.startsWith('ws')) return;

    let socket;
    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setConnectionStatus('connected');
        socket.send(
          JSON.stringify({
            type: 'join',
            roomCode,
            userName,
            role: simulatedRole,
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'sync_playback') {
            setVideoState((prev) => ({
              ...prev,
              playing: data.playing,
              playedSeconds: data.playedSeconds,
              lastActionBy: data.actionBy,
            }));
          } else if (data.type === 'change_url') {
            setVideoState((prev) => ({
              ...prev,
              url: data.url,
              playing: true,
              playedSeconds: 0,
              lastActionBy: data.actionBy,
            }));
          } else if (data.type === 'chat_message') {
            setMessages((prev) => [...prev, data.message]);
          }
        } catch {
          // invalid json payload
        }
      };

      socket.onerror = () => {
        // Gracefully degrade to client-side simulated state for seamless demo
        setConnectionStatus('simulated');
      };

      socket.onclose = () => {
        setConnectionStatus('simulated');
      };
    } catch {
      setConnectionStatus('simulated');
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [isInRoom, wsUrl, roomCode, userName, simulatedRole]);

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

  // Permissions helper
  const canControlPlayback = simulatedRole === 'Host' || simulatedRole === 'Moderator';
  const canManageUsers = simulatedRole === 'Host';

  // Join party action
  const joinParty = useCallback(({ name, code, initialUrl, title, role = 'Host' }) => {
    const finalName = name.trim() || 'Guest';
    const finalCode = code.trim().toUpperCase() || 'SYNC-7729';
    const finalRole = role;

    setUserName(finalName);
    setRoomCode(finalCode);
    setSimulatedRole(finalRole);
    setIsInRoom(true);

    if (initialUrl && initialUrl.trim()) {
      setVideoState((prev) => ({
        ...prev,
        url: initialUrl.trim(),
        title: title?.trim() || prev.title,
        playing: true,
        playedSeconds: 0,
        lastActionBy: `${finalName} (${finalRole})`,
        lastActionType: 'Loaded initial video',
      }));
    }

    // Update current user in roster
    setParticipants((prev) => {
      const filtered = prev.filter((p) => !p.isSelf);
      return [
        {
          id: 'user-self',
          name: `${finalName} (You)`,
          role: finalRole,
          isSelf: true,
          avatarColor: 'bg-[#880808]',
          joinedAt: 'Just now',
          status: 'online',
        },
        ...filtered,
      ];
    });

    // Add join announcement
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        type: 'system',
        text: `${finalName} joined the room as ${finalRole}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  // Leave party
  const leaveParty = useCallback(() => {
    setIsInRoom(false);
  }, []);

  // Synced play / pause
  const togglePlay = useCallback(() => {
    if (!canControlPlayback) return;
    setVideoState((prev) => {
      const nextPlaying = !prev.playing;
      const actionText = nextPlaying ? 'Resumed playback' : 'Paused playback';
      
      // Post system announcement
      setMessages((m) => [
        ...m,
        {
          id: `sys-${Date.now()}`,
          type: 'system',
          text: `${userName} (${simulatedRole}) ${actionText.toLowerCase()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      return {
        ...prev,
        playing: nextPlaying,
        lastActionBy: `${userName} (${simulatedRole})`,
        lastActionType: actionText,
      };
    });
  }, [canControlPlayback, userName, simulatedRole]);

  // Synced seek
  const seekTo = useCallback(
    (seconds) => {
      if (!canControlPlayback) return;
      const formattedTime = new Date(seconds * 1000).toISOString().slice(14, 19);
      
      setVideoState((prev) => ({
        ...prev,
        playedSeconds: seconds,
        lastActionBy: `${userName} (${simulatedRole})`,
        lastActionType: `Seeked to ${formattedTime}`,
      }));

      setMessages((m) => [
        ...m,
        {
          id: `sys-${Date.now()}`,
          type: 'system',
          text: `${userName} scrubbed to ${formattedTime}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    },
    [canControlPlayback, userName, simulatedRole]
  );

  // Change video URL
  const changeVideoUrl = useCallback(
    (newUrl, newTitle) => {
      if (!canControlPlayback) return;
      if (!newUrl || !newUrl.trim()) return;

      const trimmedUrl = newUrl.trim();
      const matched = SAMPLE_VIDEOS.find((v) => v.url === trimmedUrl);
      const title = newTitle || (matched ? matched.title : 'Custom YouTube Stream');

      setVideoState({
        url: trimmedUrl,
        title,
        playing: true,
        playedSeconds: 0,
        duration: 0,
        buffering: false,
        lastActionBy: `${userName} (${simulatedRole})`,
        lastActionType: 'Switched video track',
      });

      setMessages((m) => [
        ...m,
        {
          id: `sys-${Date.now()}`,
          type: 'system',
          text: `${userName} switched video to "${title}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    },
    [canControlPlayback, userName, simulatedRole]
  );

  // Role moderation actions (Host only)
  const promoteUser = useCallback(
    (userId) => {
      if (!canManageUsers) return;
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.id === userId) {
            setMessages((m) => [
              ...m,
              {
                id: `sys-${Date.now()}`,
                type: 'system',
                text: `${p.name} was promoted to Moderator by ${userName}`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
            return { ...p, role: 'Moderator' };
          }
          return p;
        })
      );
    },
    [canManageUsers, userName]
  );

  const demoteUser = useCallback(
    (userId) => {
      if (!canManageUsers) return;
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.id === userId) {
            setMessages((m) => [
              ...m,
              {
                id: `sys-${Date.now()}`,
                type: 'system',
                text: `${p.name} was returned to Participant role`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
            return { ...p, role: 'Participant' };
          }
          return p;
        })
      );
    },
    [canManageUsers]
  );

  const kickUser = useCallback(
    (userId) => {
      if (!canManageUsers) return;
      setParticipants((prev) => {
        const target = prev.find((p) => p.id === userId);
        if (target) {
          setMessages((m) => [
            ...m,
            {
              id: `sys-${Date.now()}`,
              type: 'system',
              text: `${target.name} was removed from the party`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
        return prev.filter((p) => p.id !== userId);
      });
    },
    [canManageUsers]
  );

  // Live Chat
  const sendChatMessage = useCallback(
    (text) => {
      if (!text || !text.trim()) return;
      const newMsg = {
        id: `msg-${Date.now()}`,
        type: 'chat',
        sender: userName,
        role: simulatedRole,
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, newMsg]);
    },
    [userName, simulatedRole]
  );

  // Reactions
  const triggerReaction = useCallback((emoji) => {
    const id = Date.now() + Math.random();
    const xPos = 20 + Math.random() * 60; // 20% to 80%
    setReactions((prev) => [...prev, { id, emoji, xPos }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2500);
  }, []);

  // Demonstration Role Switcher: toggles simulated perspective to test UI states
  const switchSimulatedRole = useCallback((newRole) => {
    setSimulatedRole(newRole);
    setParticipants((prev) =>
      prev.map((p) => (p.isSelf ? { ...p, role: newRole } : p))
    );
  }, []);

  return {
    // Room info
    isInRoom,
    roomCode,
    userName,
    joinParty,
    leaveParty,

    // Role state
    simulatedRole,
    switchSimulatedRole,
    canControlPlayback,
    canManageUsers,

    // Video playback
    videoState,
    setVideoState,
    togglePlay,
    seekTo,
    changeVideoUrl,
    volume,
    setVolume,
    isMuted,
    setIsMuted,

    // Participants & moderation
    participants,
    promoteUser,
    demoteUser,
    kickUser,

    // Messaging & reactions
    messages,
    sendChatMessage,
    reactions,
    triggerReaction,

    // Connectivity
    connectionStatus,
    latency,
    wsUrl,
  };
}
