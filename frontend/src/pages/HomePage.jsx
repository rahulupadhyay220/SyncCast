import React, { useEffect, useState } from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { PlatformModulesSlider } from '../components/landing/PlatformModulesSlider';
import { useNavigate } from 'react-router-dom';
import {
  Film,
  Tv,
  Cpu,
  BookOpen,
  LayoutDashboard,
  Radio,
  AlertTriangle,
  X,
} from 'lucide-react';

export function HomePage({ onSelectPreset }) {
  const navigate = useNavigate();
  const [evictionNotice, setEvictionNotice] = useState(() => {
    if (typeof window === 'undefined') return null;
    const notice = sessionStorage.getItem('streamEvictionNotice');
    if (notice) {
      sessionStorage.removeItem('streamEvictionNotice');
      try {
        return JSON.parse(notice);
      } catch {
        return { message: notice };
      }
    }
    return null;
  });

  useEffect(() => {
    if (window.location.hash === '#features') {
      const el = document.getElementById('features');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  const handleCardClick = (e, route) => {
    if (route.startsWith('#')) {
      e.preventDefault();
      const targetId = route.substring(1);
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', route);
      }
    }
  };

  const handleSelectHeroMovie = (movie) => {
    if (onSelectPreset) {
      onSelectPreset(movie);
    } else {
      navigate('/movies');
    }
  };

  const sectionsPortal = [
    {
      title: 'Movies Catalog',
      desc: 'Browse 4K cinema premieres, action epics, and full library with genre filters.',
      route: '/movies',
      icon: Film,
      badge: 'Cinema',
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'TV Shows',
      desc: 'Episodic series and weekly binge sessions with synchronized frame timeline.',
      route: '/shows',
      icon: Tv,
      badge: 'Series',
      image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Sync Engine',
      desc: 'Explore sub-25ms WebSocket latency architecture and deterministic drift lock.',
      route: '#features',
      icon: Cpu,
      badge: 'Engine',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Knowledge Base',
      desc: 'Instant answers on YouTube synchronization, moderator roles, and troubleshooting.',
      route: '/faq',
      icon: BookOpen,
      badge: 'Support',
      image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Control Center',
      desc: 'Manage room controls, playback timeline, synchronized streaming, and live attendee rosters.',
      route: '/dashboard',
      icon: LayoutDashboard,
      badge: 'Dashboard',
      image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Host Session',
      desc: 'Initialize a custom watch room with YouTube URL presets and moderator governance.',
      route: '/host',
      icon: Radio,
      badge: 'Broadcaster',
      image: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Eviction / Removal / Block Alert Notice */}
      {evictionNotice && (
        <div className="max-w-5xl mx-auto px-4 pt-6 animate-fadeIn">
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-white flex items-center justify-between gap-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">Stream Session Notice</p>
                <p className="text-xs text-red-200 mt-0.5">{evictionNotice.message || 'You have been redirected from the stream session.'}</p>
              </div>
            </div>
            <button
              onClick={() => setEvictionNotice(null)}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Cinematic Spotlight Hero */}
      <HeroSection
        onStartParty={() => navigate('/host')}
        onJoinParty={() => navigate('/join')}
        onSelectMovie={handleSelectHeroMovie}
      />

      {/* 2. Platform Modules Slider */}
      <PlatformModulesSlider
        sections={sectionsPortal}
        onCardClick={handleCardClick}
      />


      {/* 3. Engineered for Flawless Shared Viewing Section */}
      <FeaturesSection />
    </div>
  );
}

export default HomePage;
