import RoomService from '../services/RoomService.js';
import UserService from '../services/UserService.js';
import { socketJoinRoomSchema } from '../validators/socketValidator.js';
import { normalizeRoomId } from '../utils/roomCodeGenerator.js';
import logger from '../utils/logger.js';

/**
 * Registers Room connection and lifecycle events
 * 
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {Map<string, object>} sessions - Active socket session state map
 */
export const registerRoomHandlers = (io, socket, sessions) => {
  /**
   * Event: join_room
   * Client joins a specific room channel.
   * Immediately delivers latest frame-accurate room state to joiner,
   * announces arrival to peers, and distributes updated participant roster.
   */
  socket.on('join_room', async (payload, callback) => {
    try {
      const parsed = socketJoinRoomSchema.safeParse(payload);
      if (!parsed.success) {
        const error = {
          success: false,
          error: 'Validation failed',
          details: parsed.error.errors.map((e) => e.message),
        };
        if (typeof callback === 'function') callback(error);
        socket.emit('error', error);
        return;
      }

      const {
        roomId,
        userId,
        username,
        role: reqRole,
        isHost,
        initialVideoId,
        initialVideoTitle,
        currentTime,
        playbackState,
      } = parsed.data;
      const normalizedRoomId = normalizeRoomId(roomId);

      // Join DB Room roster & record socket (with in-memory fallback)
      let joinResult;
      try {
        joinResult = await RoomService.joinRoom({
          roomId: normalizedRoomId,
          userId,
          username,
          socketId: socket.id,
          role: reqRole,
          isHost,
          initialVideoId,
          initialVideoTitle,
          currentTime,
          playbackState,
        });
      } catch (dbErr) {
        if (dbErr.isBlocked) throw dbErr;
        logger.warn(`Database join failed, falling back to in-memory room: ${dbErr.message}`);
        joinResult = RoomService.joinRoomInMemory({
          roomId: normalizedRoomId,
          userId,
          username,
          socketId: socket.id,
          role: reqRole,
          isHost,
          initialVideoId,
          initialVideoTitle,
          currentTime,
          playbackState,
        });
      }

      // CASE 1: User was previously removed from room -> requires Host confirmation
      if (joinResult.isRemoved && joinResult.requiresApproval) {
        const pendingResponse = {
          success: false,
          requiresApproval: true,
          message: 'You were previously removed from this stream. Waiting for host approval to rejoin...',
          roomId: normalizedRoomId,
        };

        if (typeof callback === 'function') callback(pendingResponse);
        socket.emit('rejoin_pending', pendingResponse);

        // Find Host socket and deliver Rejoin Confirmation Popup event
        let hostSocketFound = false;
        for (const [sId, sess] of sessions.entries()) {
          if (sess.roomId === normalizedRoomId && sess.role === 'Host') {
            io.to(sId).emit('rejoin_request', {
              participant: {
                userId,
                username,
                socketId: socket.id,
                roomId: normalizedRoomId,
                requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            });
            hostSocketFound = true;
          }
        }
        logger.info(`Rejoin request for user '${username}' sent to host in room ${normalizedRoomId} (Host online: ${hostSocketFound})`);
        return;
      }

      const { room, role } = joinResult;

      // Update User in DB if available
      try {
        await UserService.upsertUser({ userId, username, socketId: socket.id });
      } catch {
        // Non-fatal, continue with real-time sync
      }

      // Join Socket.io room channel
      socket.join(normalizedRoomId);

      // Save socket session state
      sessions.set(socket.id, {
        socketId: socket.id,
        userId,
        username,
        roomId: normalizedRoomId,
        role,
      });

      const roomState = room.toRoomState ? room.toRoomState() : room;

      // NEW USER JOIN FLOW:
      // Backend immediately sends full room state so frontend syncs player instantly
      const joinResponse = {
        success: true,
        currentVideoId: roomState.currentVideoId,
        currentVideoTitle: roomState.currentVideoTitle,
        currentTime: roomState.currentTime,
        playbackState: roomState.playbackState,
        participants: roomState.participants,
        userRole: role,
        roomId: normalizedRoomId,
      };

      if (typeof callback === 'function') {
        callback(joinResponse);
      }

      // Also emit direct initial room state event to joining socket
      socket.emit('initial_room_state', joinResponse);

      // Broadcast participant_joined to all other peers in the room
      socket.to(normalizedRoomId).emit('participant_joined', {
        participant: {
          userId,
          username,
          socketId: socket.id,
          role,
        },
        participants: roomState.participants,
      });

      // Broadcast room_updated to everyone
      io.to(normalizedRoomId).emit('room_updated', roomState);

      logger.info(`Socket [${socket.id}] User '${username}' (${userId}) joined room ${normalizedRoomId} as ${role}`);
    } catch (err) {
      logger.error(`Error in join_room: ${err.message}`);
      const isBlocked = Boolean(err.isBlocked);
      const errorResponse = {
        success: false,
        isBlocked,
        error: err.message || 'Failed to join room',
      };
      if (typeof callback === 'function') callback(errorResponse);
      if (isBlocked) {
        socket.emit('join_denied', errorResponse);
      } else {
        socket.emit('error', errorResponse);
      }
    }
  });
};

export default registerRoomHandlers;
