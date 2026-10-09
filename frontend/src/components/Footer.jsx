import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.07] bg-[#050608] text-zinc-400 pt-12 pb-8 px-4 sm:px-6 lg:px-8 mt-auto select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 items-start">
          {/* Logo & Description */}
          <div className="col-span-2 space-y-3">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-block hover:opacity-90 transition-opacity group"
              title="SyncCast Home"
            >
              <Logo size="md" />
            </Link>

            <p className="text-xs text-zinc-400 font-normal leading-relaxed max-w-sm">
              Real-time synchronized YouTube player. Sub-frame synchronization, host permissions, and live room chat without accounts or browser extensions.
            </p>
          </div>

          {/* Column 1: Platform */}
          <div className="text-xs space-y-2.5">
            <h4 className="font-mono uppercase tracking-wider text-[11px] text-zinc-500 font-semibold">
              Platform
            </h4>
            <ul className="space-y-1.5 text-zinc-400 font-mono text-[11px]">
              <li><Link to="/movies" className="hover:text-white transition-colors">Catalog</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Control Center</Link></li>
              <li><Link to="/#features" className="hover:text-white transition-colors">Sync Engine</Link></li>
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
            </ul>
          </div>

          {/* Column 2: Rooms */}
          <div className="text-xs space-y-2.5">
            <h4 className="font-mono uppercase tracking-wider text-[11px] text-zinc-500 font-semibold">
              Sessions
            </h4>
            <ul className="space-y-1.5 text-zinc-400 font-mono text-[11px]">
              <li><Link to="/host" className="hover:text-white transition-colors">Host Session</Link></li>
              <li><Link to="/join" className="hover:text-white transition-colors">Join With Code</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">Knowledge Base</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal & Compliance */}
          <div className="text-xs space-y-2.5">
            <h4 className="font-mono uppercase tracking-wider text-[11px] text-zinc-500 font-semibold">
              Legal
            </h4>
            <ul className="space-y-1.5 text-zinc-400 font-mono text-[11px]">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li>
                <a
                  href="https://www.youtube.com/t/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  YouTube TOS
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Minimal Bottom Strip */}
        <div className="pt-6 border-t border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span>© {CURRENT_YEAR} Cinema Systems.</span>
            <span className="text-zinc-700">•</span>
            <Link to="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <span className="text-zinc-700">•</span>
            <Link to="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <span>WebSocket Relay</span>
            <span className="text-zinc-700">•</span>
            <span>Zero Third-Party Tracking</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
