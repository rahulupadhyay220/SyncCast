import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { VideoPlayer } from './VideoPlayer';
import { PartyChat } from './PartyChat';
import { ParticipantList } from './ParticipantList';
import { RoleRestrictionPreview } from './RoleRestrictionPreview';
import { ShareRoomModal } from './ShareRoomModal';
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
} from 'lucide-react';

export function WatchPartyRoom({
  roomCode,
  userName,
  simulatedRole,
  switchSimulatedRole,
  canControlPlayback,
  canManageUsers,
  videoState,
  setVideoState,
  togglePlay,
  seekTo,
  changeVideoUrl,
  volume,
  setVolume,
  isMuted,
  setIsMuted,
  participants,
  promoteUser,
  demoteUser,
  kickUser,
  messages,
  sendChatMessage,
  reactions,
  triggerReaction,
  _connectionStatus,
  latency,
  onLeaveRoom,
}) {
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn select-none">
      {/* Top Session Status Bar */}
      <div className="p-3.5 rounded-xl bg-[#090b10] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-white">
        {/* Room & Connectivity */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-sm bg-emerald-400" />
            <span className="text-xs font-mono text-zinc-400 font-semibold uppercase">
              Live Session
            </span>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/60 px-2.5 py-1 rounded-md border border-white/10">
            <span className="text-xs font-mono text-zinc-500">CODE:</span>
            <span className="font-mono font-bold text-white text-xs tracking-wider">
              {roomCode}
            </span>
            <button
              onClick={handleCopyLink}
              className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              title="Copy shareable link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#e50914] hover:bg-[#c90812] text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
            title="Share room link to multiple participants"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Invite Friends</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 bg-zinc-900/60 px-2.5 py-1 rounded-md border border-white/10">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>{latency}ms RTT</span>
          </div>
        </div>

        {/* User Identity & Role Perspective */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-zinc-500">ROLE:</span>
            <span className="font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10 text-[11px] uppercase">
              {simulatedRole}
            </span>
          </div>

          <button
            onClick={onLeaveRoom}
            className="px-3 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-md transition-colors cursor-pointer"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Main Content Grid: Video + Controls (Left 8 cols), Sidebar (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Player + Metadata Card */}
        <div className="lg:col-span-8 space-y-4">
          <VideoPlayer
            videoState={videoState}
            setVideoState={setVideoState}
            onTogglePlay={togglePlay}
            onSeek={seekTo}
            volume={volume}
            setVolume={setVolume}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            canControl={canControlPlayback}
            simulatedRole={simulatedRole}
            reactions={reactions}
            onTriggerReaction={triggerReaction}
          />

          {/* Video Metadata Card */}
          <div className="p-4 rounded-xl bg-[#090b10] border border-white/[0.07] space-y-3 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono uppercase text-[#e50914] font-semibold">
                  <Film className="w-3 h-3" />
                  <span>Now Streaming</span>
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  {streamTitle}
                </h2>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Action: {videoState.lastActionType || 'Active'} by {videoState.lastActionBy || userName}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md border border-white/10 bg-zinc-900 text-zinc-300">
                  {canControlPlayback ? (
                    <>
                      <Unlock className="w-3 h-3 text-emerald-400" />
                      <span>Unlocked</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Locked</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sidebar Tabs */}
        <div className="lg:col-span-4 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 bg-zinc-900/80 p-0.5 rounded-lg border border-white/10">
              <TabsTrigger value="chat" count={messages.length} className="justify-center text-xs">
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
                messages={messages}
                onSendMessage={sendChatMessage}
                onTriggerReaction={triggerReaction}
              />
            </TabsContent>

            <TabsContent value="users">
              <ParticipantList
                participants={participants}
                canManageUsers={canManageUsers}
                onPromote={promoteUser}
                onDemote={demoteUser}
                onKick={kickUser}
                onOpenShareModal={() => setIsShareModalOpen(true)}
              />
            </TabsContent>

            <TabsContent value="roles">
              <RoleRestrictionPreview
                simulatedRole={simulatedRole}
                onSwitchRole={switchSimulatedRole}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Shareable Link Modal for Multiple Participants */}
      <ShareRoomModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomCode={roomCode}
        movieTitle={streamTitle}
        userName={userName}
      />
    </div>
  );
}

export default WatchPartyRoom;
