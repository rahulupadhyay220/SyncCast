import React, { useEffect } from 'react';
import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-3 pb-6 border-b border-white/[0.08]">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-[#e50914]" />
            <span>Legal Documentation</span>
            <span>•</span>
            <span>Effective October 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            We are committed to operating a transparent, low-footprint synchronized video platform. We do not require accounts, do not sell user data, and store only ephemeral data necessary for real-time room coordination.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-zinc-300">
          
          <section className="space-y-3 p-6 rounded-xl bg-[#090b10] border border-white/[0.07]">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#e50914]" />
              1. Information We Do Not Collect
            </h2>
            <p>
              We operate under a strict data minimization principle:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li>No user account registration is required (no passwords, emails, or phone numbers collected).</li>
              <li>No credit card, billing, or financial payment information is requested or handled.</li>
              <li>No tracking pixels, third-party advertising cookies, or cross-site tracking scripts are deployed.</li>
              <li>No biometric or audio/video recording from your microphone or webcam is performed.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-[#090b10] border border-white/[0.07]">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#e50914]" />
              2. Ephemeral Data Processed During Active Sessions
            </h2>
            <p>
              When you create or join a synchronized room, our edge relays process minimal operational data strictly to maintain playback alignment:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li><strong className="text-zinc-200">Chosen Display Name:</strong> The temporary pseudonym you supply when joining. Discarded when you leave.</li>
              <li><strong className="text-zinc-200">Room Codes:</strong> Randomly generated alphanumeric identifiers used to route WebSocket packets between clients in the same session.</li>
              <li><strong className="text-zinc-200">Playback Synchronization Data:</strong> Current video timestamp, play/pause state, and drift offsets transmitted to ensure clients stay locked to the host.</li>
              <li><strong className="text-zinc-200">In-Room Chat & Reactions:</strong> Text messages and reaction signals sent within a session are kept in volatile relay memory and permanently wiped once the session terminates.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-[#090b10] border border-white/[0.07]">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#e50914]" />
              3. YouTube API & Third-Party Embeds
            </h2>
            <p>
              All video content is streamed via official embedded players powered by YouTube IFrame API services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li>Video streams are loaded directly from YouTube edge servers to your browser. We never download, store, host, or re-encode copyrighted video files on our infrastructure.</li>
              <li>By using this service, you agree to be bound by the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer" className="text-white underline hover:text-[#e50914]">YouTube Terms of Service</a> and <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-white underline hover:text-[#e50914]">Google Privacy Policy</a>.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-[#090b10] border border-white/[0.07]">
            <h2 className="text-lg font-semibold text-white">4. Local Storage Usage</h2>
            <p>
              We use your browser's standard <code className="text-xs font-mono text-zinc-200 bg-zinc-900 px-1.5 py-0.5 rounded border border-white/10">localStorage</code> exclusively for client-side preferences:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li>Saving your preferred volume level and mute state.</li>
              <li>Remembering your recent display name so you do not have to retype it between rooms.</li>
              <li>No tracking identifiers or marketing data are ever written to your local storage.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-[#090b10] border border-white/[0.07]">
            <h2 className="text-lg font-semibold text-white">5. Security & Infrastructure</h2>
            <p>
              All client-to-server and client-to-relay traffic is encrypted in transit using industry-standard Transport Layer Security (TLS 1.3) and secure WebSocket (WSS) protocols. Room access is restricted to individuals holding the corresponding session identifier.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-[#090b10] border border-white/[0.07]">
            <h2 className="text-lg font-semibold text-white">6. Inquiries and Contact</h2>
            <p>
              If you have any questions or data requests regarding this Privacy Policy, you can reach out via our GitHub repository or contact our compliance desk directly at <span className="font-mono text-xs text-zinc-200">privacy@syncedcinema.org</span>.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}

export default PrivacyPolicyPage;
