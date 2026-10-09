import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export function FaqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [openItems, setOpenItems] = useState({ 0: true, 1: true });

  const categories = ['All', 'General', 'Sync Technology', 'Roles & Moderation', 'Supported Content'];

  const faqData = [
    {
      category: 'General',
      q: 'Do I or my friends need to create an account or sign in?',
      a: 'No. Our platform is 100% account-free and frictionless. You do not need email addresses, passwords, or OAuth logins. Simply launch a room or share your room code (e.g. SYNC-7729) and your friends jump right into the synchronized theater.',
    },
    {
      category: 'General',
      q: 'Is there a limit on how many viewers can join a room?',
      a: 'There is virtually no audience limit. Because our platform uses high-efficiency WebSocket relay broadcasting, hundreds of participants can join a single room without degrading host video stream quality.',
    },
    {
      category: 'Sync Technology',
      q: 'How does YouTube playback synchronization work without extensions?',
      a: 'Our platform uses high-speed WebSocket servers transmitting binary timestamp packets. When the host plays, pauses, or seeks, state events are broadcast to all peers in sub-25ms. Client-side drift compensation adjusts local playback rate imperceptibly to match without jitter.',
    },
    {
      category: 'Sync Technology',
      q: 'What happens if a participant experiences internet buffering or high lag?',
      a: 'Our smart drift compensation engine continuously compares local player time against host timestamps. If a viewer falls behind due to network lag, our engine gently adjusts playback speed (e.g., 1.05x) to catch up smoothly rather than abruptly skipping frames.',
    },
    {
      category: 'Roles & Moderation',
      q: 'Can random viewers disrupt playback, pause the video, or skip ahead?',
      a: 'No. The system enforces a strict 3-tier cryptographic hierarchy: Host, Moderator, and Participant. Regular participants watch in synchronized view-only mode to prevent trolling and disruption.',
    },
    {
      category: 'Roles & Moderation',
      q: 'How do I promote a friend to Moderator or co-host?',
      a: 'If you are the Host, you can open the Participants tab inside the theater room, click the options menu next to any user, and click "Promote to Moderator". Moderators can pause, play, seek, and manage other participants.',
    },
    {
      category: 'Supported Content',
      q: 'Can I paste any YouTube link or custom live stream?',
      a: 'Yes. You can paste any public or unlisted YouTube video, documentary, music mix, premiering movie trailer, or 24/7 livestream into the player URL field. The player automatically loads and synchronizes it across all connected peers.',
    },
    {
      category: 'Supported Content',
      q: 'Does the player support 4K and 60FPS video streams?',
      a: 'Yes, our platform loads official high-bitrate YouTube streams in up to 4K Ultra HD and 60FPS based on each individual viewer\'s display and network capability.',
    },
  ];

  const toggleItem = (idx) => {
    setOpenItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const filteredFaqs = faqData.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 py-12 px-4 sm:px-6 lg:px-8 space-y-10 animate-fadeIn select-none">
      {/* Page Header */}
      <div className="max-w-3xl mx-auto space-y-3 text-center">
        <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
          Support & FAQ
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-normal max-w-lg mx-auto">
          Everything you need to know about hosting, joining, role permissions, and synchronization.
        </p>

        {/* Search Bar */}
        <div className="pt-2 max-w-lg mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions or topics..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-900/60 border border-white/10 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914] transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-1.5 pt-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                activeCategory === cat
                  ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                  : 'bg-zinc-900/60 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="max-w-3xl mx-auto space-y-2.5">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[#090b10] border border-white/10 space-y-2">
            <p className="text-xs text-zinc-400">No questions match "{searchQuery}".</p>
            <button
              onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
              className="px-3.5 py-1.5 rounded-md bg-[#e50914] text-white text-xs font-medium cursor-pointer"
            >
              Clear Filter
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openItems[idx];
            return (
              <div
                key={idx}
                className="rounded-xl bg-[#090b10] border border-white/[0.07] hover:border-white/20 transition-all overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-semibold text-xs sm:text-sm text-white">
                    {faq.q}
                  </span>
                  <div className="text-zinc-500 p-1 rounded bg-zinc-900">
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 pt-1 text-xs text-zinc-300 font-normal leading-relaxed border-t border-white/[0.05] animate-fadeIn space-y-2">
                    <p>{faq.a}</p>
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        Category: {faq.category}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Support CTA */}
      <div className="max-w-3xl mx-auto">
        <div className="p-6 rounded-xl bg-[#090b10] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              Ready to start streaming?
            </h3>
            <p className="text-xs text-zinc-400">
              Launch your synchronized room in under 10 seconds.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/join"
              className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs border border-white/10 transition-colors"
            >
              Enter Code
            </Link>
            <Link
              to="/host"
              className="px-4 py-2 rounded-lg bg-[#e50914] hover:bg-[#c90812] text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Host Room</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FaqPage;
