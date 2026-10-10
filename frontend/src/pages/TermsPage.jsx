import React, { useEffect } from 'react';
import { Scale, CheckCircle2, AlertTriangle, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-300 py-8 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        
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
            <Scale className="w-4 h-4 text-[#e50914]" />
            <span>Terms of Service</span>
            <span>•</span>
            <span>Updated October 2026</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            Please read these Terms carefully before utilizing our real-time video synchronization service. By accessing or connecting to any room, you agree to these legally binding terms.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 sm:space-y-8 text-sm leading-relaxed text-zinc-300">
          
          <section className="space-y-3 p-4 sm:p-6 rounded-xl bg-[#090b10] border border-white/[0.07]">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#e50914]" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing the website, joining an active watch room, or hosting a session, you confirm that you have read, understood, and agreed to be bound by these Terms & Conditions. If you do not agree to these terms, you must discontinue use of the platform immediately.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-[#090b10] border border-white/[0.07]">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#e50914]" />
              2. Service Description & YouTube Integration
            </h2>
            <p>
              Our platform provides a browser-based synchronization utility that allows multiple remote participants to view publicly available YouTube videos at identical playback timestamps.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li>We do not host, store, copy, download, rip, or re-transmit media files. All streams originate directly from YouTube servers via the YouTube Embedded Player.</li>
              <li>Users must adhere strictly to the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer" className="text-white underline hover:text-[#e50914]">YouTube Terms of Service</a>.</li>
              <li>Any video availability is subject entirely to the source uploader's settings, geographic availability, and YouTube platform policies.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-[#090b10] border border-white/[0.07]">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#e50914]" />
              3. Acceptable Use Policy
            </h2>
            <p>
              You agree not to engage in any prohibited conduct when interacting with our rooms or network:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li>Posting unlawful, abusive, harassing, threatening, sexually explicit, or defamatory messages in room chats.</li>
              <li>Attempting to bypass role permissions, forge host authority, or flood WebSocket relays with malicious packets.</li>
              <li>Automated scraping, crawling, or denial-of-service (DoS) attempts against our network infrastructure.</li>
              <li>Transmitting links to malicious software, trojans, phishing sites, or pirated materials.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-[#090b10] border border-white/[0.07]">
            <h2 className="text-lg font-semibold text-white">4. Room Governance & Moderator Rights</h2>
            <p>
              Sessions operate on a decentralized hierarchy. The room creator (Host) possesses technical authority over the room:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li>Hosts may designate co-moderators or restrict playback controls from participants.</li>
              <li>Hosts and Moderators possess the autonomous discretion to mute, demote, or kick disruptive participants from active sessions.</li>
              <li>Room codes are public within your discretion; sharing a room link allows recipients to join subject to room capacity.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-[#090b10] border border-white/[0.07]">
            <h2 className="text-lg font-semibold text-white">5. Disclaimer of Warranties</h2>
            <p>
              The platform is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. We do not warrant that service operations will be uninterrupted, bug-free, or compatible with every browser environment or third-party ad-blocker configuration.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-[#090b10] border border-white/[0.07]">
            <h2 className="text-lg font-semibold text-white">6. Limitation of Liability</h2>
            <p>
              Under no circumstances shall the platform operators, maintainers, or contributors be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your access to, use of, or inability to use the service.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-[#090b10] border border-white/[0.07]">
            <h2 className="text-lg font-semibold text-white">7. Governing Law & Contact</h2>
            <p>
              These Terms shall be governed and construed in accordance with standard international internet regulations. For any legal inquiries or DMCA notifications related to embedded content, please reach out to <span className="font-mono text-xs text-zinc-200">legal@syncedcinema.org</span>.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}

export default TermsPage;
