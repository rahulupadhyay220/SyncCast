import React, { useState } from 'react';
import { Plus, LogIn, Copy, Check, LayoutDashboard, Tv, Menu, X, UserPlus } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

export function Navbar({
  isInRoom,
  roomCode,
  simulatedRole,
  onSwitchRole,
  onLeaveRoom,
}) {
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isActive = (path) => location.pathname === path;
  const closeMobile = () => setMobileMenuOpen(false);

  const handleLogoClick = (e) => {
    e.preventDefault();
    closeMobile();
    if (isInRoom && onLeaveRoom) {
      onLeaveRoom();
    }
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Movies', path: '/movies' },
    { label: 'TV Shows', path: '/shows' },
    { label: 'Top Rated', path: '/top-rated' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'FAQ', path: '/faq' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#050608]/85 backdrop-blur-md border-b border-white/[0.07] select-none transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* SyncCast Brand Logo */}
        <Link
          to="/"
          onClick={handleLogoClick}
          className="flex text-white items-center shrink-0 cursor-pointer group focus:outline-none"
          title="SyncCast - Synchronized YouTube Cinema"
          id="main-logo"
        >
          <Logo size="md" />
        </Link>

        {/* Center Navigation Links */}
        {isInRoom ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Switcher: Theater vs Dashboard */}
            <div className="flex items-center bg-zinc-900/80 p-0.5 rounded-lg border border-white/10 text-xs">
              <Link
                to="/room"
                className={`px-3 py-1 rounded-md font-medium text-xs transition-colors flex items-center gap-1.5 ${isActive('/room')
                  ? 'bg-zinc-800 text-white shadow-xs font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Theater</span>
              </Link>
              <Link
                to="/dashboard"
                className={`px-3 py-1 rounded-md font-medium text-xs transition-colors flex items-center gap-1.5 ${isActive('/dashboard')
                  ? 'bg-zinc-800 text-white shadow-xs font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            </div>

            {/* Room Code Monospace Pill */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-white/10 text-xs">
              <span className="w-1.5 h-1.5 rounded-sm bg-emerald-400" />
              <span className="text-zinc-400 font-mono text-[11px]">CODE:</span>
              <span className="font-mono font-bold text-white tracking-wider text-xs">{roomCode}</span>
              <button
                onClick={handleCopyCode}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer ml-0.5"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Role Switcher Pill */}
            <div className="hidden md:flex items-center bg-zinc-900/60 p-0.5 rounded-lg border border-white/10 text-xs">
              <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">Role</span>
              {['Host', 'Moderator', 'Participant'].map((role) => (
                <button
                  key={role}
                  onClick={() => onSwitchRole?.(role)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${simulatedRole === role
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <nav className="hidden xl:flex items-center gap-6 text-[13px] font-medium text-zinc-400">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`py-1 transition-colors relative ${isActive(item.path)
                  ? 'text-white font-semibold after:absolute after:-bottom-[17px] after:left-0 after:right-0 after:h-[2px] after:bg-[#e50914]'
                  : 'hover:text-zinc-200'
                  }`}
              >
                {item.label}
              </Link>
            ))}

            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs transition-colors font-medium ${isActive('/dashboard')
                ? 'bg-zinc-800 text-white border-zinc-700'
                : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isInRoom ? (
            <button
              onClick={onLeaveRoom}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 hover:border-white/20 rounded-lg transition-colors cursor-pointer"
            >
              Leave Room
            </button>
          ) : (
            <>
              <Link
                to="/join"
                className={`hidden sm:inline-flex px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors items-center gap-1.5 ${isActive('/join')
                  ? 'bg-zinc-800 text-white border-zinc-700'
                  : 'text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border-white/10 hover:border-white/20'
                  }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Enter Code</span>
              </Link>

              <Link
                to="/host"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#e50914] hover:bg-[#c90812] active:bg-[#a5070f] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Host Room</span>
              </Link>

              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-white/10 hover:border-white/20 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-zinc-400" />
                <span>Sign Up</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-1.5 rounded-lg bg-zinc-900/80 text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                title="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && !isInRoom && (
        <div className="xl:hidden bg-[#07080c] border-b border-white/[0.07] px-4 py-4 space-y-3 animate-fadeIn">
          <div className="grid grid-cols-1 gap-1 text-xs">
            <Link
              to="/"
              onClick={closeMobile}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${isActive('/') ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
            >
              Home Spotlight
            </Link>

            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${isActive(item.path) ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
              >
                {item.label}
              </Link>
            ))}

            <Link
              to="/dashboard"
              onClick={closeMobile}
              className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isActive('/dashboard') ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </div>

          <div className="pt-3 border-t border-white/[0.07] grid grid-cols-3 gap-2 text-xs">
            <Link
              to="/join"
              onClick={closeMobile}
              className="py-2 text-center font-medium text-zinc-300 bg-zinc-900 border border-white/10 rounded-lg hover:text-white"
            >
              Enter Code
            </Link>
            <Link
              to="/host"
              onClick={closeMobile}
              className="py-2 text-center font-semibold text-white bg-[#e50914] rounded-lg hover:bg-[#c90812]"
            >
              Host Room
            </Link>
            <button
              type="button"
              className="py-2 text-center font-semibold text-zinc-200 bg-zinc-900 border border-white/10 rounded-lg hover:text-white cursor-pointer flex items-center justify-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5 text-zinc-400" />
              <span>Sign Up</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
