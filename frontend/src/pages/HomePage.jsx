import React, { useEffect } from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { Link, useNavigate } from 'react-router-dom';
import {
  Film,
  Tv,
  Award,
  Cpu,
  Workflow,
  BookOpen,
  LayoutDashboard,
  Radio,
  ArrowRight,
} from 'lucide-react';

export function HomePage({ onStartParty, onJoinParty, onSelectPreset }) {
  const navigate = useNavigate();

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
      title: 'Top Rated',
      desc: 'Curated leaderboard of community-ranked titles streaming with frame-locked precision.',
      route: '/top-rated',
      icon: Award,
      badge: '8.5+ IMDb',
      image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
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
      title: 'How It Works',
      desc: 'Workflow overview: zero extensions, zero accounts, instant link and room code sharing.',
      route: '/how-it-works',
      icon: Workflow,
      badge: 'Workflow',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
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
      desc: 'Manage room controls, playback timeline, public theaters, and live attendee rosters.',
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
    <div className="space-y-16 pb-20 select-none">
      {/* 1. Cinematic Spotlight Hero */}
      <HeroSection
        onStartParty={() => navigate('/host')}
        onJoinParty={() => navigate('/join')}
        onSelectMovie={handleSelectHeroMovie}
      />

      {/* 2. Directory Hub */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.07] pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
              Directory
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Platform Modules
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-normal">
              Direct access to dedicated catalog routes, technical architecture, and room management.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/join"
              className="px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-medium text-xs transition-colors"
            >
              Enter Code
            </Link>
            <Link
              to="/host"
              className="px-4 py-2 rounded-lg bg-[#e50914] hover:bg-[#c90812] text-white font-semibold text-xs transition-colors"
            >
              Host Room
            </Link>
          </div>
        </div>

        {/* Section Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sectionsPortal.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <Link
                key={idx}
                to={sec.route}
                onClick={(e) => handleCardClick(e, sec.route)}
                className="group rounded-xl bg-[#090b10] border border-white/[0.08] hover:border-white/20 transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Contextual Unsplash Image with Dark Vignette */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#07080c] border-b border-white/[0.06]">
                    <img
                      src={sec.image}
                      alt={sec.title}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Dark Vignette Overlay for Text Legibility and Minimalism */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-black/40 to-transparent pointer-events-none" />

                    {/* Floating Header Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                      <div className="w-7 h-7 rounded-md bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-200">
                        <Icon className="w-3.5 h-3.5 text-[#e50914]" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10">
                        {sec.badge}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#e50914] transition-colors tracking-tight">
                      {sec.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-normal leading-relaxed line-clamp-2">
                      {sec.desc}
                    </p>
                  </div>
                </div>

                {/* Minimalist Footer */}
                <div className="px-4 py-2.5 border-t border-white/[0.05] bg-[#07080c]/60 flex items-center justify-between text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300">
                    Open Module
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#e50914] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Engineered for Flawless Shared Viewing Section */}
      <FeaturesSection onExplore={() => navigate('/host')} />
    </div>
  );
}

export default HomePage;
