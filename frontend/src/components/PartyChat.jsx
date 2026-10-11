import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  ThumbsUp,
  Heart,
  Users,
  UserMinus,
  Ban,
} from 'lucide-react';
import { getAvatarColor, getInitials } from '../utils/avatar';

export function PartyChat({
  roomCode = 'default',
  messages = [],
  onSendMessage,
  onTriggerReaction,
  participantCount = 1,
  participants = [],
  userName = '',
  simulatedRole = 'Host',
  onRemoveParticipant,
  onBlockParticipant,
}) {
  const [text, setText] = useState('');
  const chatMessagesRef = useRef(null);
  const isFirstChatRender = useRef(true);
  const popupTimeoutRef = useRef(null);

  const likeKey = `synccast_liked_${roomCode}`;
  const loveKey = `synccast_loved_${roomCode}`;

  const [hasLiked, setHasLiked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(likeKey) === 'true';
  });

  const [hasLoved, setHasLoved] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(loveKey) === 'true';
  });

  const [popup, setPopup] = useState(null); // { type: 'like' | 'love', text: string }

  const [prevRoomCode, setPrevRoomCode] = useState(roomCode);
  if (roomCode !== prevRoomCode) {
    setPrevRoomCode(roomCode);
    setHasLiked(typeof window !== 'undefined' ? sessionStorage.getItem(`synccast_liked_${roomCode}`) === 'true' : false);
    setHasLoved(typeof window !== 'undefined' ? sessionStorage.getItem(`synccast_loved_${roomCode}`) === 'true' : false);
  }

  useEffect(() => {
    return () => {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
    };
  }, []);

  const showPopup = (type, message) => {
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
    setPopup({ type, text: message });
    popupTimeoutRef.current = setTimeout(() => {
      setPopup(null);
    }, 2200);
  };

  const handleLike = () => {
    if (hasLiked) {
      showPopup('like', 'Already liked! 👍');
      return;
    }
    setHasLiked(true);
    try {
      sessionStorage.setItem(likeKey, 'true');
    } catch {}
    showPopup('like', 'Liked! 👍');
    onTriggerReaction?.('👍 Like');
  };

  const handleLove = () => {
    if (hasLoved) {
      showPopup('love', 'Already loved! ❤️');
      return;
    }
    setHasLoved(true);
    try {
      sessionStorage.setItem(loveKey, 'true');
    } catch {}
    showPopup('love', 'Loved! ❤️');
    onTriggerReaction?.('❤️ Love');
  };

  // Only show real user chat messages (filter out any host/system action logs)
  const chatMessages = messages.filter(
    (msg) => msg.type === 'chat' || (!msg.type && msg.text && msg.sender)
  );

  // Use actual participants length if available, or participantCount
  const liveViewerCount = Math.max(1, participants.length || participantCount || 1);

  const latestMessageId = chatMessages[chatMessages.length - 1]?.id;

  useEffect(() => {
    const messageList = chatMessagesRef.current;
    if (!messageList) return;

    const distanceFromBottom = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight;
    if (isFirstChatRender.current || distanceFromBottom <= 80) {
      messageList.scrollTop = messageList.scrollHeight;
    }
    isFirstChatRender.current = false;
  }, [latestMessageId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  return (
    <div className="flex flex-col h-full bg-[#090b10] rounded-xl border border-white/[0.08] overflow-hidden text-white shadow-2xl">
      {/* 1. Chat Header with Real Stream Viewer Count */}
      <div className="p-3 border-b border-white/[0.06] flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <h3 className="font-mono text-xs uppercase tracking-wider text-zinc-200 font-bold flex items-center gap-1.5">
            <span>Room Chat</span>
          </h3>
        </div>

        {/* Live People in Stream Badge (Real Count) */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[11px] font-semibold transition-all shadow-xs"
            title={`${liveViewerCount} ${liveViewerCount === 1 ? 'person' : 'people'} currently in this stream`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {liveViewerCount} {liveViewerCount === 1 ? 'person in stream' : 'people in stream'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Chat Messages List - Only host & participant text messages */}
      <div ref={chatMessagesRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[300px] max-h-[500px]">
        {chatMessages.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs font-mono">
            No messages yet. Send a message to the room!
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isHost = msg.role === 'Host';
            const isMod = msg.role === 'Moderator';

            return (
              <div key={msg.id} className="flex items-start gap-2 text-xs animate-fadeIn">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[9px] shrink-0 text-white font-mono ${
                    msg.avatarColor || getAvatarColor(msg.sender)
                  }`}
                >
                  {getInitials(msg.sender)}
                </div>

                <div className="flex-1 min-w-0 bg-zinc-900/50 border border-white/[0.06] rounded-lg p-2">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-white truncate text-[11px]">
                        {msg.sender}
                      </span>
                      {isHost && (
                        <span className="px-1 rounded text-[8px] font-mono font-bold uppercase bg-[#e50914] text-white">
                          Host
                        </span>
                      )}
                      {isMod && (
                        <span className="px-1 rounded text-[8px] font-mono font-bold uppercase bg-zinc-700 text-white">
                          Mod
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {msg.timestamp}
                      </span>
                      {simulatedRole === 'Host' && !isHost && msg.sender !== userName && !msg.sender.includes('(You)') && (
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            type="button"
                            onClick={() => {
                              const found = participants.find((p) => p.name === msg.sender || p.name.includes(msg.sender));
                              const targetId = found?.id || `user-${msg.sender.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                              onRemoveParticipant?.(targetId, msg.sender);
                            }}
                            className="p-0.5 rounded text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                            title={`Remove ${msg.sender} from stream & chat`}
                          >
                            <UserMinus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const found = participants.find((p) => p.name === msg.sender || p.name.includes(msg.sender));
                              const targetId = found?.id || `user-${msg.sender.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                              onBlockParticipant?.(targetId, msg.sender);
                            }}
                            className="p-0.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title={`Permanently block ${msg.sender}`}
                          >
                            <Ban className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-zinc-300 font-normal break-words leading-relaxed text-xs">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Reaction Actions Bar - Like & Love with One-time Click, Active Colors & Micro Popup */}
      <div className="relative px-3 py-2 border-t border-white/[0.06] bg-[#07080c] flex items-center gap-2">
        {/* Micro Pop-up Notification */}
        {popup && (
          <div
            className={`absolute -top-8.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold tracking-wide shadow-xl backdrop-blur-md pointer-events-none animate-popIn ${
              popup.type === 'like'
                ? 'left-3 bg-[#0a1628] border border-blue-500/50 text-blue-200 shadow-blue-500/25'
                : 'left-20 bg-[#240c11] border border-red-500/50 text-red-200 shadow-red-500/25'
            }`}
          >
            <span>{popup.text}</span>
            {/* Downward pointing caret */}
            <div
              className={`absolute -bottom-1 left-4 w-2 h-2 rotate-45 border-r border-b ${
                popup.type === 'like'
                  ? 'bg-[#0a1628] border-blue-500/50'
                  : 'bg-[#240c11] border-red-500/50'
              }`}
            />
          </div>
        )}

        {/* Like Button */}
        <button
          type="button"
          onClick={handleLike}
          className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 group shadow-xs ${
            hasLiked
              ? 'bg-blue-950/60 border-blue-500/60 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
              : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/[0.08] hover:border-blue-500/30 text-zinc-300 hover:text-white'
          }`}
          title={hasLiked ? 'You liked this stream' : 'Like'}
          aria-label="Like"
        >
          <ThumbsUp
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              hasLiked
                ? 'text-blue-400 fill-blue-500 scale-110'
                : 'text-zinc-400 group-hover:text-blue-400 group-hover:scale-110'
            }`}
          />
          <span className={`font-medium ${hasLiked ? 'text-blue-300 font-semibold' : ''}`}>Like</span>
        </button>

        {/* Love Button */}
        <button
          type="button"
          onClick={handleLove}
          className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 group shadow-xs ${
            hasLoved
              ? 'bg-red-950/60 border-red-500/60 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
              : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/[0.08] hover:border-red-500/30 text-zinc-300 hover:text-white'
          }`}
          title={hasLoved ? 'You loved this stream' : 'Love'}
          aria-label="Love"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              hasLoved
                ? 'text-red-500 fill-red-500 scale-110'
                : 'text-zinc-400 group-hover:text-red-400 group-hover:scale-110'
            }`}
          />
          <span className={`font-medium ${hasLoved ? 'text-red-300 font-semibold' : ''}`}>Love</span>
        </button>
      </div>

      {/* 4. Chat Input Bar */}
      <form onSubmit={handleSubmit} className="p-2.5 border-t border-white/[0.06] bg-[#07080c] flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Send a room message..."
          className="flex-1 bg-zinc-900/70 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors font-sans"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2 rounded-lg bg-[#e50914] hover:bg-[#c90812] text-white disabled:opacity-40 transition-colors cursor-pointer"
          title="Send"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

export default PartyChat;
