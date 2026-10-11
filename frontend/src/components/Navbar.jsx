import React, { useState } from 'react';
import { Plus, LogIn, LogOut, Copy, Check, LayoutDashboard, Tv, Menu, X, UserPlus, Crown, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserMenu } from './UserMenu';
import { Logo } from './Logo';

export function Navbar({
  isInRoom,
  roomCode,
  simulatedRole,
  _isRoomCreator = false,
  _onSwitchRole,
  onLeaveRoom,
}) {
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
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
    { label: 'FAQ', path: '/faq' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#050608]/85 backdrop-blur-md border-b border-white/[0.07] select-none transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* SyncCast Brand Logo */}
        <Link
          to="/"
          onClick={handleLogoClick}
          className="flex text-white items-center shrink-0 cursor-pointer group focus:outline-none"
          title="SyncCast - Synchronized YouTube Cinema"
          id="main-logo"
        >
          <div className="scale-90 sm:scale-100 origin-left">
            <Logo size="md" />
          </div>
        </Link>

        {/* Center Navigation Links */}
        {isInRoom ? (
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* View Switcher: Theater vs Dashboard */}
            <div className="flex items-center bg-zinc-900/80 p-0.5 rounded-lg border border-white/10 text-xs">
              <Link
                to="/room"
                title="Theater"
                aria-label="Theater"
                className={`px-2.5 sm:px-3 py-1 rounded-md font-medium text-xs transition-colors flex items-center gap-1.5 ${isActive('/room')
                  ? 'bg-zinc-800 text-white shadow-xs font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Theater</span>
              </Link>
              <Link
                to="/dashboard"
                title="Dashboard"
                aria-label="Dashboard"
                className={`px-2.5 sm:px-3 py-1 rounded-md font-medium text-xs transition-colors flex items-center gap-1.5 ${isActive('/dashboard')
                  ? 'bg-zinc-800 text-white shadow-xs font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
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

            {/* Authenticated Role Badge */}
            <div className="hidden md:flex items-center px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-white/10 text-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mr-1.5">Role:</span>
              {simulatedRole === 'Host' ? (
                <span className="flex items-center gap-1 font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Room Host</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 font-medium text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded border border-white/10 text-xs">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Guest</span>
                </span>
              )}
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
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isInRoom ? (
            <button
              onClick={onLeaveRoom}
              title="Leave Room"
              aria-label="Leave Room"
              className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-zinc-300 hover:text-red-400 bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 hover:border-red-500/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Leave Room</span>
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
                className="px-3 sm:px-4 py-1.5 text-xs font-semibold text-white bg-[#e50914] hover:bg-[#c90812] active:bg-[#a5070f] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Host Room</span>
                <span className="xs:hidden">Host</span>
              </Link>

              {isLoaded && !isSignedIn && (
                <Link
                  to="/signup"
                  id="navbar-signup-button"
                  className="px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900/90 hover:bg-zinc-800 border border-white/15 hover:border-red-500/50 rounded-lg transition-all flex items-center gap-1.5 shadow-sm group hover:shadow-red-950/30 cursor-pointer"
                  title="Create your SyncCast account"
                >
                  <UserPlus className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" />
                  <span>Sign Up</span>
                </Link>
              )}
              {isLoaded && isSignedIn && (
                <UserMenu />
              )}

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

          <div className="pt-3 border-t border-white/[0.07] grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
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
            {isLoaded && !isSignedIn && (
              <Link
                to="/signup"
                onClick={closeMobile}
                id="mobile-navbar-signup-button"
                className="py-2 text-center font-semibold text-zinc-100 bg-zinc-900/90 border border-red-500/40 rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-red-500" />
                <span>Sign Up</span>
              </Link>
            )}
            {isLoaded && isSignedIn && (
              <div className="flex items-center justify-center">
                <UserMenu />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
