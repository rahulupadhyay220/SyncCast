import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useWatchParty } from './hooks/useWatchParty';
import { getUserDisplayName } from './utils/user';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { MoviesPage } from './pages/MoviesPage';
import { TvShowsPage } from './pages/TvShowsPage';
import { FaqPage } from './pages/FaqPage';
import { HostPartyPage } from './pages/HostPartyPage';
import { JoinPartyPage } from './pages/JoinPartyPage';
import { DashboardPage } from './components/DashboardPage';
import { WatchPartyRoom } from './components/WatchPartyRoom';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { AuthPage } from './pages/AuthPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Footer } from './components/Footer';

export default function App() {
  const { user, isLoaded, effectiveSignedIn } = useAuth();
  const signedInName = getUserDisplayName(user);
  const watchParty = useWatchParty();
  const navigate = useNavigate();
  const location = useLocation();

  const handleStartPreset = React.useCallback((stream, options = {}) => {
    if (!effectiveSignedIn) {
      sessionStorage.setItem(
        'pendingStream',
        JSON.stringify({
          stream,
          options,
        })
      );
      navigate('/sign-in?redirect_url=/room');
      return;
    }

    const generatedCode = `SYNC-${Math.floor(1000 + Math.random() * 9000)}`;
    const effectiveHostName = signedInName || watchParty.userName || 'Host';
    watchParty.joinParty({
      name: effectiveHostName,
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
  }, [effectiveSignedIn, signedInName, watchParty, navigate]);

  // Check URL query parameter for direct room joins (e.g. ?room=SYNC-7729)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !watchParty.isInRoom && location.pathname !== '/join') {
      navigate(`/join?room=${roomParam}`);
    }
  }, [watchParty.isInRoom, location.pathname, navigate]);

  // Resume pending stream or join when user logs in / signs up
  useEffect(() => {
    if (isLoaded && effectiveSignedIn) {
      const pendingStreamStr = sessionStorage.getItem('pendingStream');
      if (pendingStreamStr) {
        sessionStorage.removeItem('pendingStream');
        try {
          const { stream, options } = JSON.parse(pendingStreamStr);
          handleStartPreset(stream, options);
          return;
        } catch {
          // ignore error
        }
      }

      const pendingJoinStr = sessionStorage.getItem('pendingJoin');
      if (pendingJoinStr) {
        sessionStorage.removeItem('pendingJoin');
        try {
          const { name, code, role } = JSON.parse(pendingJoinStr);
          watchParty.joinParty({
            name: signedInName || name || 'Guest',
            code,
            role: role || 'Participant',
          });
          navigate('/room');
          return;
        } catch {
          // ignore error
        }
      }
    }
  }, [isLoaded, effectiveSignedIn, signedInName, handleStartPreset, watchParty, navigate]);

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
        isRoomCreator={watchParty.isRoomCreator}
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

          {/* Redirect old /features path to homepage features section */}
          <Route path="/features" element={<Navigate to="/#features" replace />} />

          {/* 6. Dedicated FAQ & Knowledge Base Page */}
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
                  watchParty.joinParty({ ...data, role: 'Host', isHost: true });
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
                  const safeRole = data.role === 'Host' ? 'Participant' : (data.role || 'Participant');
                  const res = watchParty.joinParty({ ...data, role: safeRole, isHost: false });
                  if (res?.success) {
                    navigate('/room');
                  }
                  return res;
                }}
                sendRejoinRequest={watchParty.sendRejoinRequest}
                rejoinStatus={watchParty.rejoinStatus}
                setRejoinStatus={watchParty.setRejoinStatus}
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
                restartVideo={watchParty.restartVideo}
                skipVideo={watchParty.skipVideo}
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
              !isLoaded ? (
                <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-zinc-400">Loading session...</p>
                </div>
              ) : !effectiveSignedIn ? (
                <Navigate to="/sign-in?redirect_url=/room" replace />
              ) : watchParty.isInRoom ? (
                <WatchPartyRoom
                  roomCode={watchParty.roomCode}
                  userName={watchParty.userName}
                  simulatedRole={watchParty.simulatedRole}
                  isRoomCreator={watchParty.isRoomCreator}
                  switchSimulatedRole={watchParty.switchSimulatedRole}
                  canControlPlayback={watchParty.canControlPlayback}
                  canManageUsers={watchParty.canManageUsers}
                  videoState={watchParty.videoState}
                  setVideoState={watchParty.setVideoState}
                  togglePlay={watchParty.togglePlay}
                  seekTo={watchParty.seekTo}
                  restartVideo={watchParty.restartVideo}
                  skipVideo={watchParty.skipVideo}
                  playNextVideo={watchParty.playNextVideo}
                  playPreviousVideo={watchParty.playPreviousVideo}
                  changeVideoUrl={watchParty.changeVideoUrl}
                  volume={watchParty.volume}
                  setVolume={watchParty.setVolume}
                  isMuted={watchParty.isMuted}
                  setIsMuted={watchParty.setIsMuted}
                  participants={watchParty.participants}
                  promoteUser={watchParty.promoteUser}
                  demoteUser={watchParty.demoteUser}
                  kickUser={watchParty.kickUser}
                  removeUser={watchParty.removeUser}
                  blockUser={watchParty.blockUser}
                  pendingRejoinRequests={watchParty.pendingRejoinRequests}
                  respondToRejoinRequest={watchParty.respondToRejoinRequest}
                  messages={watchParty.messages}
                  sendChatMessage={watchParty.sendChatMessage}
                  reactions={watchParty.reactions}
                  reactionCounts={watchParty.reactionCounts}
                  triggerReaction={watchParty.triggerReaction}
                  connectionStatus={watchParty.connectionStatus}
                  latency={watchParty.latency}
                  onLeaveRoom={handleLeaveRoom}
                />
              ) : (sessionStorage.getItem('pendingStream') || sessionStorage.getItem('pendingJoin') || sessionStorage.getItem('pendingHost')) ? (
                <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-zinc-400">Entering stream room...</p>
                </div>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* 13. Privacy Policy Page */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />

          {/* 14. Terms & Conditions Page */}
          <Route path="/terms" element={<TermsPage />} />

          {/* Authentication & Authorization Routes (Supabase) */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/sign-in" element={<AuthPage />} />
          <Route path="/sign-in/*" element={<AuthPage />} />
          <Route path="/sign-up" element={<AuthPage />} />
          <Route path="/sign-up/*" element={<AuthPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* User Profile Route (Protected) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Administrative Operations Console (Protected for Admin role only) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
