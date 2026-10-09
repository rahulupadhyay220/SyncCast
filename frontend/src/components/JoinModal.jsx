import React, { useState } from 'react';
import { X, LogIn } from 'lucide-react';

export function JoinModal({ isOpen, onClose, onJoin }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [role, setRole] = useState('Participant');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onJoin({
      name: name.trim() || 'Guest Viewer',
      code: code.trim().toUpperCase() || 'SYNC-7729',
      role,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-[#090b10] rounded-xl border border-white/[0.08] shadow-2xl max-w-md w-full p-6 relative text-white">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1 mb-5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            Portal
          </span>
          <h3 className="font-bold text-lg text-white tracking-tight">
            Join Room
          </h3>
          <p className="text-xs text-zinc-400 font-normal">
            Enter room code to connect in real time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan Lee"
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/60 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914] transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
              Room Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SYNC-7729"
              className="w-full font-mono uppercase tracking-widest px-3.5 py-2 rounded-lg bg-zinc-900/60 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914] transition-colors font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
              Perspective
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-900/80 rounded-lg border border-white/10">
              {['Participant', 'Moderator', 'Host'].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    role === r
                      ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {r === 'Participant' ? 'Guest' : r}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm bg-[#e50914] text-white hover:bg-[#c90812] active:bg-[#a5070f] transition-colors cursor-pointer"
            >
              Enter Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JoinModal;
