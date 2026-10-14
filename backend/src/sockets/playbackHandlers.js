import RoomService from '../services/RoomService.js';
import { ACTIONS } from '../config/permissions.js';
import { hasPermission } from '../utils/permissionMatrix.js';
import {
  socketPlayVideoSchema,
  socketPauseVideoSchema,
  socketSeekVideoSchema,
  socketChangeVideoSchema,
  socketSyncPlaybackSchema,
  socketRequestSyncSchema,
} from '../validators/socketValidator.js';
import { normalizeRoomId } from '../utils/roomCodeGenerator.js';
import logger from '../utils/logger.js';

/**
 * Registers video playback synchronization socket events
 * 
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {Map<string, object>} sessions - Active socket session state map
 */
export const registerPlaybackHandlers = (io, socket, sessions) => {
  /**
   * Helper to validate permissions before executing playback mutation
   */
  const guard = (action, callback) => {
    const session = sessions.get(socket.id);
    if (!session) {
      const error = { success: false, error: 'Unauthorized: Session not active' };
      if (typeof callback === 'function') callback(error);
      socket.emit('error', error);
      return null;
    }

    if (!hasPermission(session.role, action)) {
      const error = { success: false, error: 'Permission denied' };
      if (typeof callback === 'function') callback(error);
      socket.emit('error', error);
      logger.warn(`Permission denied: User '${session.username}' (${session.role}) attempted '${action}' in room ${session.roomId}`);
      return null;
    }

    return session;
  };

  /**
   * Event: play_video
   * Initiates synchronized playback across all room members
   */
  socket.on('play_video', async (payload, callback) => {
    try {
      const session = guard(ACTIONS.PLAY_VIDEO, callback);
      if (!session) return;

      const parsed = socketPlayVideoSchema.safeParse(payload || {});
      if (!parsed.success) {
        const error = { success: false, error: 'Invalid payload format' };
        if (typeof callback === 'function') callback(error);
        return;
      }

      const roomId = normalizeRoomId(parsed.data.roomId || session.roomId);
      const currentTime = parsed.data.currentTime;

      // Update room state in database
      const room = await RoomService.playVideo({ roomId, currentTime });
      const roomState = room.toRoomState();

      const eventPayload = {
        currentTime: roomState.currentTime,
        playbackState: 'playing',
        playedBy: {
          userId: session.userId,
          username: session.username,
          role: session.role,
        },
      };

      // Broadcast video_played event to all room participants
      io.to(roomId).emit('video_played', eventPayload);

      // Distribute full room state sync
      io.to(roomId).emit('room_updated', roomState);

      const successResponse = {
        success: true,
        currentTime: roomState.currentTime,
        playbackState: 'playing',
      };
      if (typeof callback === 'function') callback(successResponse);
    } catch (err) {
      logger.error(`Error in play_video: ${err.message}`);
      const errResponse = { success: false, error: err.message };
      if (typeof callback === 'function') callback(errResponse);
      socket.emit('error', errResponse);
    }
  });

  /**
   * Event: pause_video
   * Pauses playback simultaneously for all room members
   */
  socket.on('pause_video', async (payload, callback) => {
    try {
      const session = guard(ACTIONS.PAUSE_VIDEO, callback);
      if (!session) return;

      const parsed = socketPauseVideoSchema.safeParse(payload || {});
      if (!parsed.success) {
        const error = { success: false, error: 'Invalid payload format' };
        if (typeof callback === 'function') callback(error);
        return;
      }

      const roomId = normalizeRoomId(parsed.data.roomId || session.roomId);
      const currentTime = parsed.data.currentTime;

      const room = await RoomService.pauseVideo({ roomId, currentTime });
      const roomState = room.toRoomState();

      const eventPayload = {
        currentTime: roomState.currentTime,
        playbackState: 'paused',
        pausedBy: {
          userId: session.userId,
          username: session.username,
          role: session.role,
        },
      };

      // Broadcast video_paused event
      io.to(roomId).emit('video_paused', eventPayload);

      // Distribute updated room state
      io.to(roomId).emit('room_updated', roomState);

      const successResponse = {
        success: true,
        currentTime: roomState.currentTime,
        playbackState: 'paused',
      };
      if (typeof callback === 'function') callback(successResponse);
    } catch (err) {
      logger.error(`Error in pause_video: ${err.message}`);
      const errResponse = { success: false, error: err.message };
      if (typeof callback === 'function') callback(errResponse);
      socket.emit('error', errResponse);
    }
  });

  /**
   * Event: seek_video
   * Synchronizes playhead scrubbing across all room participants
   */
  socket.on('seek_video', async (payload, callback) => {
    try {
      const session = guard(ACTIONS.SEEK_VIDEO, callback);
      if (!session) return;

      const parsed = socketSeekVideoSchema.safeParse(payload || {});
      if (!parsed.success) {
        const error = { success: false, error: 'Invalid seek parameters. currentTime required.' };
        if (typeof callback === 'function') callback(error);
        return;
      }

      const roomId = normalizeRoomId(parsed.data.roomId || session.roomId);
      const { currentTime } = parsed.data;

      const room = await RoomService.seekVideo({ roomId, currentTime });
      const roomState = room.toRoomState();

      const eventPayload = {
        currentTime: roomState.currentTime,
        seekedBy: {
          userId: session.userId,
          username: session.username,
          role: session.role,
        },
      };

      // Broadcast video_seeked event
      io.to(roomId).emit('video_seeked', eventPayload);

      // Distribute updated room state
      io.to(roomId).emit('room_updated', roomState);

      const successResponse = {
        success: true,
        currentTime: roomState.currentTime,
      };
      if (typeof callback === 'function') callback(successResponse);
    } catch (err) {
      logger.error(`Error in seek_video: ${err.message}`);
      const errResponse = { success: false, error: err.message };
      if (typeof callback === 'function') callback(errResponse);
      socket.emit('error', errResponse);
    }
  });

  /**
   * Event: change_video
   * Swaps currently streaming video URL / ID, resets playback to 0:00
   */
  socket.on('change_video', async (payload, callback) => {
    try {
      const session = guard(ACTIONS.CHANGE_VIDEO, callback);
      if (!session) return;

      const parsed = socketChangeVideoSchema.safeParse(payload || {});
      if (!parsed.success) {
        const error = { success: false, error: 'Invalid payload: videoId is required' };
        if (typeof callback === 'function') callback(error);
        return;
      }

      const roomId = normalizeRoomId(parsed.data.roomId || session.roomId);
      const { videoId, videoTitle } = parsed.data;

      const room = await RoomService.changeVideo({ roomId, videoId, videoTitle });
      const roomState = room.toRoomState();

      const eventPayload = {
        currentVideoId: roomState.currentVideoId,
        currentVideoTitle: roomState.currentVideoTitle,
        currentTime: 0,
        playbackState: 'playing',
        changedBy: {
          userId: session.userId,
          username: session.username,
          role: session.role,
        },
      };

      // Broadcast video_changed event
      io.to(roomId).emit('video_changed', eventPayload);

      // Distribute updated room state
      io.to(roomId).emit('room_updated', roomState);

      const successResponse = {
        success: true,
        currentVideoId: roomState.currentVideoId,
        currentVideoTitle: roomState.currentVideoTitle,
        currentTime: 0,
      };
      if (typeof callback === 'function') callback(successResponse);
    } catch (err) {
      logger.error(`Error in change_video: ${err.message}`);
      const errResponse = { success: false, error: err.message };
      if (typeof callback === 'function') callback(errResponse);
      socket.emit('error', errResponse);
    }
  });

  /**
   * Event: end_stream / terminate_session
   * Host ends the stream and terminates session for all room members
   */
  const handleEndStream = async (payload, callback) => {
    try {
      const session = guard(ACTIONS.END_STREAM, callback);
      if (!session) return;

      const roomId = normalizeRoomId(payload?.roomId || session.roomId);
      const room = await RoomService.endStream({
        roomId,
        requesterId: session.userId,
      });

      const roomState = room.toRoomState();

      // Broadcast stream_ended to all room members
      io.to(roomId).emit('stream_ended', {
        roomId,
        endedBy: {
          userId: session.userId,
          username: session.username,
          role: session.role,
        },
        message: 'The host has ended this live streaming session.',
      });

      // Distribute final room state
      io.to(roomId).emit('room_updated', roomState);

      const successResponse = { success: true, streamStatus: 'ended' };
      if (typeof callback === 'function') callback(successResponse);
      logger.info(`Host ${session.username} ended stream session in room ${roomId}`);
    } catch (err) {
      logger.error(`Error in end_stream: ${err.message}`);
      const errResponse = { success: false, error: err.message };
      if (typeof callback === 'function') callback(errResponse);
      socket.emit('error', errResponse);
    }
  };

  socket.on('end_stream', handleEndStream);
  socket.on('terminate_session', handleEndStream);

  /**
   * Event: sync_playback
   * Authoritative host playback synchronization heartbeat.
   * Updates backend room time anchor and broadcasts lightweight sync to peers.
   */
  socket.on('sync_playback', async (payload, callback) => {
    try {
      const session = guard(ACTIONS.PLAY_VIDEO, callback);
      if (!session) return;

      const parsed = socketSyncPlaybackSchema.safeParse(payload || {});
      if (!parsed.success) {
        if (typeof callback === 'function') callback({ success: false, error: 'Invalid payload format' });
        return;
      }

      const roomId = normalizeRoomId(parsed.data.roomId || session.roomId);
      const { currentTime, playbackState } = parsed.data;

      const room = await RoomService.syncPlayback({
        roomId,
        currentTime,
        playbackState,
        requesterId: session.userId,
      });

      const roomState = room.toRoomState ? room.toRoomState() : room;

      // Broadcast lightweight sync event to room participants (excluding sender)
      socket.to(roomId).emit('playback_sync', {
        currentTime: roomState.currentTime,
        playbackState: roomState.playbackState,
        timestamp: Date.now(),
      });

      if (typeof callback === 'function') {
        callback({ success: true, currentTime: roomState.currentTime });
      }
    } catch (err) {
      logger.error(`Error in sync_playback: ${err.message}`);
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  /**
   * Event: request_sync
   * Any client (host or guest) can request the latest frame-accurate sync state.
   */
  socket.on('request_sync', async (payload, callback) => {
    try {
      const session = sessions.get(socket.id);
      const parsed = socketRequestSyncSchema.safeParse(payload || {});
      const targetRoomId = normalizeRoomId(parsed.success ? parsed.data.roomId : (session?.roomId || payload?.roomId));
      if (!targetRoomId) {
        if (typeof callback === 'function') callback({ success: false, error: 'roomId required' });
        return;
      }

      const room = await RoomService.getRoomById(targetRoomId);
      const roomState = room.toRoomState ? room.toRoomState() : room;

      const syncData = {
        success: true,
        currentTime: roomState.currentTime,
        playbackState: roomState.playbackState,
        currentVideoId: roomState.currentVideoId,
        currentVideoTitle: roomState.currentVideoTitle,
        timestamp: Date.now(),
      };

      if (typeof callback === 'function') {
        callback(syncData);
      }
      socket.emit('playback_sync', syncData);
    } catch (err) {
      logger.error(`Error in request_sync: ${err.message}`);
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });
};

export default registerPlaybackHandlers;
