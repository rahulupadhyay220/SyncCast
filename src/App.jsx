import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useWatchParty } from './hooks/useWatchParty';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { MoviesPage } from './pages/MoviesPage';
import { TvShowsPage } from './pages/TvShowsPage';
import { TopRatedPage } from './pages/TopRatedPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { FaqPage } from './pages/FaqPage';
import { HostPartyPage } from './pages/HostPartyPage';
import { JoinPartyPage } from './pages/JoinPartyPage';
import { DashboardPage } from './components/DashboardPage';
import { WatchPartyRoom } from './components/WatchPartyRoom';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { Footer } from './components/Footer';

export default function App() {
  const watchParty = useWatchParty();
  const navigate = useNavigate();
  const location = useLocation();

  // Check URL query parameter for direct room joins (e.g. ?room=SYNC-7729)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !watchParty.isInRoom && location.pathname !== '/join') {
      navigate(`/join?room=${roomParam}`);
    }
  }, [watchParty.isInRoom, location.pathname, navigate]);

  const handleStartPreset = (stream, options = {}) => {
    const generatedCode = `SYNC-${Math.floor(1000 + Math.random() * 9000)}`;
    watchParty.joinParty({
      name: 'Alex R.',
      code: generatedCode,
      initialUrl: stream.url,
      title: stream.title,
      role: 'Host',
    });
    navigate('/room', {
      state: {
        openShareModal: Boolean(options?.openShare),
        movieTitle: stream.title || 'Cinema Premiere',
      },
    });
  };

  const handleLeaveRoom = () => {
    watchParty.leaveParty();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050608] text-zinc-100 font-sans selection:bg-[#e50914] selection:text-white">
      {/* Top Navbar with Dedicated Navigation */}
      <Navbar
        isInRoom={watchParty.isInRoom}
        roomCode={watchParty.roomCode}
        simulatedRole={watchParty.simulatedRole}
        onSwitchRole={watchParty.switchSimulatedRole}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Main Content Area: Each section has its own dedicated route and page */}
      <main className="flex-1">
        <Routes>
          {/* 1. Dedicated Home Spotlight Page */}
          <Route
            path="/"
            element={
              <HomePage
                onStartParty={() => navigate('/host')}
                onJoinParty={() => navigate('/join')}
                onSelectPreset={handleStartPreset}
              />
            }
          />

          {/* 2. Dedicated Movies Catalog Page */}
          <Route
            path="/movies"
            element={
              <MoviesPage
                onSelectPreset={handleStartPreset}
                onStartParty={() => navigate('/host')}
              />
            }
          />

          {/* 3. Dedicated TV Shows & Premieres Page */}
          <Route
            path="/shows"
            element={
              <TvShowsPage
                onSelectPreset={handleStartPreset}
              />
            }
          />

          {/* 4. Dedicated Top Rated Cinema Page */}
          <Route
            path="/top-rated"
            element={
              <TopRatedPage
                onSelectPreset={handleStartPreset}
              />
            }
          />

          {/* Redirect old /features path to homepage features section */}
          <Route path="/features" element={<Navigate to="/#features" replace />} />

          {/* 6. Dedicated How It Works Page */}
          <Route
            path="/how-it-works"
            element={<HowItWorksPage />}
          />

          {/* 7. Dedicated FAQ & Knowledge Base Page */}
          <Route
            path="/faq"
            element={<FaqPage />}
          />

          {/* 9. Dedicated Host Party Page */}
          <Route
            path="/host"
            element={
              <HostPartyPage
                onHostParty={(data) => {
                  watchParty.joinParty(data);
                  navigate('/room');
                }}
              />
            }
          />

          {/* 10. Dedicated Join Party Page */}
          <Route
            path="/join"
            element={
              <JoinPartyPage
                onJoinParty={(data) => {
                  watchParty.joinParty(data);
                  navigate('/room');
                }}
              />
            }
          />

          {/* 11. Dedicated Live Dashboard Page */}
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                isInRoom={watchParty.isInRoom}
                roomCode={watchParty.roomCode}
                userName={watchParty.userName}
                simulatedRole={watchParty.simulatedRole}
                canControlPlayback={watchParty.canControlPlayback}
                videoState={watchParty.videoState}
                togglePlay={watchParty.togglePlay}
                seekTo={watchParty.seekTo}
                changeVideoUrl={watchParty.changeVideoUrl}
                onOpenCreate={() => navigate('/host')}
                onOpenJoin={() => navigate('/join')}
                onGoToTheater={() => navigate('/room')}
                onStartPreset={handleStartPreset}
              />
            }
          />

          {/* 12. Dedicated Live Theater Room */}
          <Route
            path="/room"
            element={
              watchParty.isInRoom ? (
                <WatchPartyRoom
                  roomCode={watchParty.roomCode}
                  userName={watchParty.userName}
                  simulatedRole={watchParty.simulatedRole}
                  switchSimulatedRole={watchParty.switchSimulatedRole}
                  canControlPlayback={watchParty.canControlPlayback}
                  canManageUsers={watchParty.canManageUsers}
                  videoState={watchParty.videoState}
                  setVideoState={watchParty.setVideoState}
                  togglePlay={watchParty.togglePlay}
                  seekTo={watchParty.seekTo}
                  changeVideoUrl={watchParty.changeVideoUrl}
                  volume={watchParty.volume}
                  setVolume={watchParty.setVolume}
                  isMuted={watchParty.isMuted}
                  setIsMuted={watchParty.setIsMuted}
                  participants={watchParty.participants}
                  promoteUser={watchParty.promoteUser}
                  demoteUser={watchParty.demoteUser}
                  kickUser={watchParty.kickUser}
                  messages={watchParty.messages}
                  sendChatMessage={watchParty.sendChatMessage}
                  reactions={watchParty.reactions}
                  triggerReaction={watchParty.triggerReaction}
                  connectionStatus={watchParty.connectionStatus}
                  latency={watchParty.latency}
                  onLeaveRoom={handleLeaveRoom}
                />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* 13. Privacy Policy Page */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />

          {/* 14. Terms & Conditions Page */}
          <Route path="/terms" element={<TermsPage />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
