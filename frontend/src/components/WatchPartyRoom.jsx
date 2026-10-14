import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { VideoPlayer } from './VideoPlayer';
import { HostRoomLinkBar } from './HostRoomLinkBar';
import { PartyChat } from './PartyChat';
import { ParticipantList } from './ParticipantList';
import { RoleRestrictionPreview } from './RoleRestrictionPreview';
import { ShareRoomModal } from './ShareRoomModal';
import { RejoinRequestModal } from './RejoinRequestModal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import {
  Copy,
  Check,
  Wifi,
  Shield,
  Film,
  Users,
  MessageSquare,
  Lock,
  Unlock,
  Share2,
  LogOut,
  Power,
  Crown,
  User,
} from 'lucide-react';

export function WatchPartyRoom({
  roomCode,
  userName,
  simulatedRole,
  canControlPlayback,
  canManageUsers,
  videoState,
  setVideoState,
  togglePlay,
  seekTo,
  restartVideo,
  skipVideo,
  playNextVideo,
  playPreviousVideo,
  changeVideoUrl,
  volume,
  setVolume,
  isMuted,
  setIsMuted,
  participants,
  transferHost,
  muteUser,
  endStream,
  promoteUser,
  demoteUser,
  kickUser,
  removeUser,
  blockUser,
  pendingRejoinRequests = [],
  respondToRejoinRequest,
  messages,
  sendChatMessage,
  reactions,
  reactionCounts = { Like: 0, Love: 0 },
  triggerReaction,
  _connectionStatus,
  latency,
  onLeaveRoom,
  sessionEndedNotice,
}) {
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(
    Boolean(location.state?.openShareModal)
  );

  const streamTitle = location.state?.movieTitle || videoState.title;

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/join?room=${roomCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Top Session Status Bar */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-[#090b10] border border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 text-white">
        {/* Room & Connectivity */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between sm:justify-start">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-sm bg-emerald-400 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-mono text-zinc-400 font-semibold uppercase">
              Live Session
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900/60 px-2 sm:px-2.5 py-1 rounded-md border border-white/10">
            <span className="text-[11px] sm:text-xs font-mono text-zinc-500">CODE:</span>
            <span className="font-mono font-bold text-white text-[11px] sm:text-xs tracking-wider">
              {roomCode}
            </span>
            <button
              onClick={handleCopyLink}
              className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              title="Copy shareable link"
              aria-label="Copy shareable link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-zinc-400 bg-zinc-900/60 px-2 sm:px-2.5 py-1 rounded-md border border-white/10">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>{latency}ms RTT</span>
          </div>
        </div>

        {/* User Identity, Role & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
          <div className="flex items-center gap-2">
            {userName && (
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono bg-zinc-900/60 px-2 sm:px-2.5 py-1 rounded-md border border-white/10 max-w-[120px] xs:max-w-none">
                <span className="text-zinc-500 hidden xs:inline">{simulatedRole === 'Host' ? 'HOST:' : 'NAME:'}</span>
                <span className="font-semibold text-white truncate">{userName}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono">
              <span className="text-zinc-500 hidden xs:inline">ROLE:</span>
              <span className={`font-semibold px-2 py-0.5 rounded border text-[10px] sm:text-[11px] uppercase flex items-center gap-1 ${simulatedRole === 'Host'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-zinc-800 text-zinc-300 border-white/10'
                }`}>
                {simulatedRole === 'Host' ? <Crown className="w-3 h-3 text-amber-400" /> : <User className="w-3 h-3 text-zinc-400" />}
                <span>{simulatedRole}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md bg-[#e50914] hover:bg-[#c90812] text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
              title="Invite Friends"
              aria-label="Invite Friends"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invite Friends</span>
              <span className="sm:hidden text-[11px]">Invite</span>
            </button>

            {simulatedRole === 'Host' && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to terminate this stream for all participants?')) {
                    endStream?.();
                  }
                }}
                className="p-1.5 sm:px-3 sm:py-1 text-xs font-semibold text-red-300 hover:text-white bg-red-950/60 hover:bg-red-900 border border-red-500/40 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="End Stream Session"
              >
                <Power className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">End Stream</span>
              </button>
            )}

            <button
              onClick={onLeaveRoom}
              className="p-1.5 sm:px-3 sm:py-1 text-xs font-medium text-zinc-300 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 bg-zinc-900 border border-white/10 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
              title="Leave Room"
              aria-label="Leave Room"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Leave Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Video + Controls (Left 8 or 12 cols in theater), Sidebar (Right 4 or 12 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left: Host Room Link Bar + Player + Metadata Card */}
        <div className={`${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-4`}>
          {/* Host Room Link Bar */}
          <HostRoomLinkBar
            currentVideoId={videoState.videoId}
            onLoadVideo={(url, videoId) => changeVideoUrl(url, `YouTube Video (${videoId})`)}
            canControl={canControlPlayback}
            disabledReason="Host or Moderator permissions required to paste and stream YouTube links"
          />

          <VideoPlayer
            videoState={videoState}
            setVideoState={setVideoState}
            onTogglePlay={togglePlay}
            onSeek={seekTo}
            onRestart={restartVideo}
            onSkip={skipVideo}
            onNextVideo={playNextVideo}
            onPrevVideo={playPreviousVideo}
            volume={volume}
            setVolume={setVolume}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            canControl={canControlPlayback}
            simulatedRole={simulatedRole}
            reactions={reactions}
            reactionCounts={reactionCounts}
            onTriggerReaction={triggerReaction}
            isTheater={isTheaterMode}
            onToggleTheater={() => setIsTheaterMode((prev) => !prev)}
          />

          {/* Video Metadata Card */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#090b10] border border-white/[0.07] space-y-3 text-white">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0 w-full sm:flex-1">
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono uppercase text-[#e50914] font-semibold">
                  <Film className="w-3 h-3" />
                  <span>Now Streaming</span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight break-words">
                  {streamTitle}
                </h2>
                <p className="text-[11px] sm:text-xs text-zinc-400 font-mono mt-0.5 break-words">
                  Action: {videoState.lastActionType || 'Active'} by {videoState.lastActionBy || userName}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-mono px-2 sm:px-2.5 py-1 rounded-md border border-white/10 bg-zinc-900 text-zinc-300">
                  {canControlPlayback ? (
                    <>
                      <Unlock className="w-3 h-3 text-emerald-400" />
                      <span>Host Controls</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Host Controlled</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sidebar Tabs */}
        <div className={`${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-4'} space-y-4`}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 bg-zinc-900/80 p-0.5 rounded-lg border border-white/10">
              <TabsTrigger value="chat" className="justify-center text-xs">
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="users" count={participants.length} className="justify-center text-xs">
                <Users className="w-3.5 h-3.5 mr-1" />
                Peers
              </TabsTrigger>
              <TabsTrigger value="roles" className="justify-center text-xs">
                <Shield className="w-3.5 h-3.5 mr-1" />
                Roles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat">
              <PartyChat
                roomCode={roomCode}
                messages={messages}
                onSendMessage={sendChatMessage}
                onTriggerReaction={triggerReaction}
                reactionCounts={reactionCounts}
                participantCount={participants.length}
                participants={participants}
                userName={userName}
                simulatedRole={simulatedRole}
                onRemoveParticipant={removeUser}
                onBlockParticipant={blockUser}
              />
            </TabsContent>

            <TabsContent value="users">
              <ParticipantList
                participants={participants}
                canManageUsers={canManageUsers}
                onTransferHost={transferHost}
                onMuteUser={muteUser}
                onPromote={promoteUser}
                onDemote={demoteUser}
                onKick={kickUser}
                onRemove={removeUser}
                onBlock={blockUser}
                onOpenShareModal={() => setIsShareModalOpen(true)}
              />
            </TabsContent>

            <TabsContent value="roles">
              <RoleRestrictionPreview
                simulatedRole={simulatedRole}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Rejoin Request Confirmation Modal for Host (Rule 3 & 4) */}
      {simulatedRole === 'Host' && pendingRejoinRequests && pendingRejoinRequests.length > 0 && (
        <RejoinRequestModal
          request={pendingRejoinRequests[0]}
          onApprove={(req) => respondToRejoinRequest(req.userId || req.id || req.username, true)}
          onReject={(req) => respondToRejoinRequest(req.userId || req.id || req.username, false)}
        />
      )}

      {/* Shareable Link Modal for Multiple Participants */}
      <ShareRoomModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomCode={roomCode}
        movieTitle={streamTitle}
        userName={userName}
      />

      {/* Session Termination Notice Overlay (Eviction modal) */}
      {sessionEndedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-[#0a0c10] border border-red-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
              <Power className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Stream Session Ended</h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {sessionEndedNotice}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-zinc-400">
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <span>Redirecting you to Home Page...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WatchPartyRoom;
