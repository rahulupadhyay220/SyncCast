import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut, ChevronDown, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAvatarColor, getInitials } from '../utils/avatar';

export function UserMenu() {
  const navigate = useNavigate();
  const { user, profile, isSignedIn, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/', { replace: true });
  };

  if (!isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/sign-in"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </Link>
        <Link
          to="/sign-up"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#e50914] hover:bg-[#c90812] active:bg-[#a5070f] text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Sign Up</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button: User Avatar + Name */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-850 border border-white/10 hover:border-white/20 transition-all cursor-pointer group select-none"
        aria-label="User Account Menu"
        aria-expanded={isOpen}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white font-mono shadow-inner ${getAvatarColor(
            displayName
          )}`}
        >
          {getInitials(displayName)}
        </div>
        <span className="text-xs font-medium text-zinc-200 group-hover:text-white truncate max-w-[100px] hidden sm:inline">
          {displayName}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#090b10] border border-white/15 rounded-xl shadow-2xl py-1.5 z-50 text-white animate-fadeIn">
          {/* User Info Header */}
          <div className="px-3.5 py-2.5 border-b border-white/[0.08] space-y-0.5">
            <p className="text-xs font-semibold text-white truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-zinc-400 font-mono truncate">
              {email}
            </p>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-zinc-400" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
              <span>Profile & Security</span>
            </Link>
          </div>

          {/* Divider & Sign Out */}
          <div className="border-t border-white/[0.08] pt-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
