import React, { useState, useRef, useEffect } from 'react';
import { Send, Info, ThumbsUp, Heart, Sparkles, Flag, Volume2 } from 'lucide-react';
import { getAvatarColor, getInitials } from '../utils/avatar';

const QUICK_SIGNALS = [
  { id: 'like', label: 'Like', icon: ThumbsUp },
  { id: 'heart', label: 'Love', icon: Heart },
  { id: 'clap', label: 'Applause', icon: Sparkles },
  { id: 'audio', label: 'Audio OK', icon: Volume2 },
  { id: 'flag', label: 'Issue', icon: Flag },
];

export function PartyChat({ messages = [], onSendMessage, onTriggerReaction }) {
  const [text, setText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  return (
    <div className="flex flex-col h-full bg-[#090b10] rounded-xl border border-white/[0.08] overflow-hidden text-white">
      {/* Chat Header */}
      <div className="p-3 border-b border-white/[0.06] flex items-center justify-between bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-sm bg-emerald-400" />
          <h3 className="font-mono text-xs uppercase tracking-wider text-zinc-300 font-semibold">
            Room Log
          </h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          {messages.length} msgs
        </span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[280px] max-h-[460px]">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs font-mono">
            No session messages. Send a message to the room.
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.type === 'system') {
              return (
                <div
                  key={msg.id}
                  className="flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-md bg-zinc-900/60 border border-white/[0.05] text-[11px] text-zinc-400 font-mono"
                >
                  <Info className="w-3 h-3 text-zinc-500 shrink-0" />
                  <span>{msg.text}</span>
                  <span className="text-[10px] text-zinc-600 ml-1">({msg.timestamp})</span>
                </div>
              );
            }

            const isHost = msg.role === 'Host';
            const isMod = msg.role === 'Moderator';

            return (
              <div key={msg.id} className="flex items-start gap-2 text-xs">
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
                    <span className="text-[10px] text-zinc-500 font-mono shrink-0">{msg.timestamp}</span>
                  </div>
                  <p className="text-zinc-300 font-normal break-words leading-relaxed text-xs">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Signal Action Bar (No Emojis) */}
      <div className="px-3 py-1.5 border-t border-white/[0.06] bg-[#07080c] flex items-center justify-between gap-1">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider shrink-0">
          Signals:
        </span>
        <div className="flex items-center gap-1">
          {QUICK_SIGNALS.map((sig) => {
            const Icon = sig.icon;
            return (
              <button
                key={sig.id}
                type="button"
                onClick={() => onTriggerReaction?.(sig.label)}
                className="px-2 py-1 rounded-md bg-zinc-900/60 hover:bg-zinc-800 border border-white/[0.06] hover:border-white/20 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-mono cursor-pointer"
                title={`Send ${sig.label} signal`}
              >
                <Icon className="w-3 h-3 text-[#e50914]" />
                <span className="hidden sm:inline">{sig.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Bar */}
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
