import React from 'react';
import { Play } from 'lucide-react';

export function CtaSection({ onStartParty }) {
  return (
    <section className="py-16 sm:py-24 bg-[#050608] border-t border-white/[0.07] select-none">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-14 rounded-2xl bg-[#090b10] border border-white/[0.08] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
              Instant Access
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Ready to Host Your Next Room?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
              No account creation or software installation. Paste any YouTube video and share the code in seconds.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={onStartParty}
              className="px-6 py-3 rounded-lg bg-[#e50914] hover:bg-[#c90812] active:bg-[#a5070f] text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Room Now</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CtaSection;
