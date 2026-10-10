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
  messages = [],
  onSendMessage,
  onTriggerReaction,
  reactionCounts = { Like: 0, Love: 0 },
  participantCount = 1,
  participants = [],
  userName = '',
  simulatedRole = 'Host',
  onRemoveParticipant,
  onBlockParticipant,
}) {
  const [text, setText] = useState('');
  const [userClicks, setUserClicks] = useState({ Like: 0, Love: 0 });
  const chatMessagesRef = useRef(null);
  const isFirstChatRender = useRef(true);

  const displayLikes = (reactionCounts?.Like || 0) + userClicks.Like;
  const displayLoves = (reactionCounts?.Love || 0) + userClicks.Love;

  const handleReactionClick = (type) => {
    setUserClicks((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) + 1,
    }));
    const reactionLabel = type === 'Like' ? '👍 Like' : '❤️ Love';
    onTriggerReaction?.(reactionLabel);
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

      {/* 3. Reaction Actions Bar - Only Like and Love with live count badges */}
      <div className="px-3 py-2 border-t border-white/[0.06] bg-[#07080c] flex items-center gap-2">
        {/* Like Button */}
        <button
          type="button"
          onClick={() => handleReactionClick('Like')}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] hover:border-blue-500/30 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono cursor-pointer active:scale-95 group shadow-xs"
          title="Like"
          aria-label="Like"
        >
          <ThumbsUp className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Like</span>
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-bold">
            {displayLikes}
          </span>
        </button>

        {/* Love Button */}
        <button
          type="button"
          onClick={() => handleReactionClick('Love')}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] hover:border-rose-500/30 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono cursor-pointer active:scale-95 group shadow-xs"
          title="Love"
          aria-label="Love"
        >
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Love</span>
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold">
            {displayLoves}
          </span>
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
