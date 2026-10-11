import RoomService from '../services/RoomService.js';
import { ACTIONS, ROLES } from '../config/permissions.js';
import { hasPermission } from '../utils/permissionMatrix.js';
import {
  socketAssignRoleSchema,
  socketRemoveParticipantSchema,
  socketTransferHostSchema,
  socketBlockParticipantSchema,
  socketRespondRejoinSchema,
} from '../validators/socketValidator.js';
import { normalizeRoomId } from '../utils/roomCodeGenerator.js';
import logger from '../utils/logger.js';

/**
 * Registers Host moderation, RBAC and participant eviction socket events
 * 
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {Map<string, object>} sessions - Active socket session state map
 */
export const registerRoleHandlers = (io, socket, sessions) => {
  /**
   * Helper to validate permissions before executing administrative mutation
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
   * Event: assign_role
   * Host promotes or demotes a participant (e.g. Participant <-> Moderator)
   */
  socket.on('assign_role', async (payload, callback) => {
    try {
      const session = guard(ACTIONS.ASSIGN_ROLE, callback);
      if (!session) return;

      const parsed = socketAssignRoleSchema.safeParse(payload || {});
      if (!parsed.success) {
        const error = {
          success: false,
          error: 'Validation failed',
          details: parsed.error.errors.map((e) => e.message),
        };
        if (typeof callback === 'function') callback(error);
        return;
      }

      const roomId = normalizeRoomId(parsed.data.roomId || session.roomId);
      const { targetUserId, newRole } = parsed.data;

      const { room } = await RoomService.assignRole({
        roomId,
        targetUserId,
        newRole,
        requesterId: session.userId,
      });

      // Update in-memory session of target user if currently connected
      for (const [sId, sess] of sessions.entries()) {
        if (sess.userId === targetUserId && sess.roomId === roomId) {
          sess.role = newRole;
          // Notify target socket directly of role change
          io.to(sId).emit('your_role_updated', { role: newRole });
        }
      }

      const roomState = room.toRoomState();

      // Broadcast role_updated to room
      io.to(roomId).emit('role_updated', {
        userId: targetUserId,
        role: newRole,
        updatedBy: {
          userId: session.userId,
          username: session.username,
        },
      });

      // Distribute full room roster update
      io.to(roomId).emit('room_updated', roomState);

      const successResponse = {
        success: true,
        userId: targetUserId,
        role: newRole,
      };
      if (typeof callback === 'function') callback(successResponse);
      logger.info(`Host ${session.username} assigned role '${newRole}' to ${targetUserId} in room ${roomId}`);
    } catch (err) {
      logger.error(`Error in assign_role: ${err.message}`);
      const errResponse = { success: false, error: err.message };
      if (typeof callback === 'function') callback(errResponse);
      socket.emit('error', errResponse);
    }
  });

  /**
   * Event: remove_participant
   * Host removes a participant from room.
   * Evicts target socket, disconnects from room, notifies all participants.
   */
  socket.on('remove_participant', async (payload, callback) => {
    try {
      const session = guard(ACTIONS.REMOVE_PARTICIPANT, callback);
      if (!session) return;

      const parsed = socketRemoveParticipantSchema.safeParse(payload || {});
      if (!parsed.success) {
        const error = { success: false, error: 'Validation failed: targetUserId required' };
        if (typeof callback === 'function') callback(error);
        return;
      }

      const roomId = normalizeRoomId(parsed.data.roomId || session.roomId);
      const { targetUserId } = parsed.data;

      const { room, removedParticipant } = await RoomService.removeParticipant({
        roomId,
        targetUserId,
        requesterId: session.userId,
      });

      // Find target user socket and evict them from the channel
      for (const [sId, sess] of sessions.entries()) {
        if (sess.userId === targetUserId && sess.roomId === roomId) {
          const targetSocket = io.sockets.sockets.get(sId);
          if (targetSocket) {
            targetSocket.emit('participant_removed', {
              removedUserId: targetUserId,
              message: 'You have been removed from the watch party by the host.',
              isSelf: true,
            });
            targetSocket.leave(roomId);
          }
          sessions.delete(sId);
        }
      }

      const roomState = room.toRoomState();

      // Broadcast participant_removed to remaining participants
      io.to(roomId).emit('participant_removed', {
        removedUserId: targetUserId,
        removedUsername: removedParticipant ? removedParticipant.username : 'User',
        removedBy: {
          userId: session.userId,
          username: session.username,
        },
      });

      // Distribute updated room state
      io.to(roomId).emit('room_updated', roomState);

      const successResponse = {
        success: true,
        removedUserId: targetUserId,
      };
      if (typeof callback === 'function') callback(successResponse);
      logger.info(`Host ${session.username} removed participant ${targetUserId} from room ${roomId}`);
    } catch (err) {
      logger.error(`Error in remove_participant: ${err.message}`);
      const errResponse = { success: false, error: err.message };
      if (typeof callback === 'function') callback(errResponse);
      socket.emit('error', errResponse);
    }
  });

  /**
   * Event: block_participant
   * Host permanently blocks a participant from the stream.
   * Evicts target socket, prevents rejoining, and denies any future join attempts.
   */
  socket.on('block_participant', async (payload, callback) => {
    try {
      const session = guard(ACTIONS.BLOCK_PARTICIPANT, callback);
      if (!session) return;

      const parsed = socketBlockParticipantSchema.safeParse(payload || {});
      if (!parsed.success) {
        const error = { success: false, error: 'Validation failed: targetUserId required' };
        if (typeof callback === 'function') callback(error);
        return;
      }

      const roomId = normalizeRoomId(parsed.data.roomId || session.roomId);
      const { targetUserId } = parsed.data;

      const { room, targetUsername } = await RoomService.blockParticipant({
        roomId,
        targetUserId,
        requesterId: session.userId,
      });

      // Find and evict target socket
      for (const [sId, sess] of sessions.entries()) {
        if (sess.userId === targetUserId && sess.roomId === roomId) {
          const targetSocket = io.sockets.sockets.get(sId);
          if (targetSocket) {
            targetSocket.emit('participant_blocked', {
              blockedUserId: targetUserId,
              message: 'You have been permanently blocked from this stream by the host.',
              isSelf: true,
            });
            targetSocket.leave(roomId);
          }
          sessions.delete(sId);
        }
      }

      const roomState = room.toRoomState();

      // Broadcast participant_blocked to room
      io.to(roomId).emit('participant_blocked', {
        blockedUserId: targetUserId,
        blockedUsername: targetUsername,
        blockedBy: {
          userId: session.userId,
          username: session.username,
        },
      });

      // Broadcast room_updated
      io.to(roomId).emit('room_updated', roomState);

      const successResponse = {
        success: true,
        blockedUserId: targetUserId,
      };
      if (typeof callback === 'function') callback(successResponse);
      logger.info(`Host ${session.username} PERMANENTLY BLOCKED participant ${targetUserId} from room ${roomId}`);
    } catch (err) {
      logger.error(`Error in block_participant: ${err.message}`);
      const errResponse = { success: false, error: err.message };
      if (typeof callback === 'function') callback(errResponse);
      socket.emit('error', errResponse);
    }
  });

  /**
   * Event: respond_rejoin_request
   * Host approves or rejects a rejoin request from a previously removed participant.
   */
  socket.on('respond_rejoin_request', async (payload, callback) => {
    try {
      const session = guard(ACTIONS.DECIDE_REJOIN, callback);
      if (!session) return;

      const parsed = socketRespondRejoinSchema.safeParse(payload || {});
      if (!parsed.success) {
        const error = { success: false, error: 'Validation failed: targetUserId and approved boolean required' };
        if (typeof callback === 'function') callback(error);
        return;
      }

      const roomId = normalizeRoomId(parsed.data.roomId || session.roomId);
      const { targetUserId, targetSocketId, approved } = parsed.data;

      if (approved) {
        const { room } = await RoomService.approveRejoin({
          roomId,
          targetUserId,
          requesterId: session.userId,
        });

        // Notify target socket of approval
        if (targetSocketId) {
          io.to(targetSocketId).emit('rejoin_approved', {
            approved: true,
            roomId,
            message: 'The host approved your request to rejoin the stream.',
          });
        }

        io.to(roomId).emit('room_updated', room.toRoomState());
      } else {
        await RoomService.rejectRejoin({
          roomId,
          targetUserId,
          requesterId: session.userId,
        });

        // Notify target socket of rejection
        if (targetSocketId) {
          io.to(targetSocketId).emit('rejoin_rejected', {
            approved: false,
            roomId,
            message: 'The host rejected your request to rejoin the stream.',
          });
        }
      }

      const resp = { success: true, targetUserId, approved: Boolean(approved) };
      if (typeof callback === 'function') callback(resp);
      logger.info(`Host ${session.username} responded to rejoin request for ${targetUserId}: approved=${approved}`);
    } catch (err) {
      logger.error(`Error in respond_rejoin_request: ${err.message}`);
      const errResponse = { success: false, error: err.message };
      if (typeof callback === 'function') callback(errResponse);
      socket.emit('error', errResponse);
    }
  });

  /**
   * Event: transfer_host
   * Host transfers room ownership to another participant.
   * Old host becomes Moderator. New host receives Host permissions.
   */
  socket.on('transfer_host', async (payload, callback) => {
    try {
      const session = guard(ACTIONS.TRANSFER_HOST, callback);
      if (!session) return;

      const parsed = socketTransferHostSchema.safeParse(payload || {});
      if (!parsed.success) {
        const error = { success: false, error: 'Validation failed: newHostId required' };
        if (typeof callback === 'function') callback(error);
        return;
      }

      const roomId = normalizeRoomId(parsed.data.roomId || session.roomId);
      const { newHostId } = parsed.data;

      const { room, previousHostId } = await RoomService.transferHost({
        roomId,
        newHostId,
        requesterId: session.userId,
      });

      // Update in-memory session roles
      session.role = ROLES.GUEST; // Old host downgraded to Guest
      socket.emit('your_role_updated', { role: ROLES.GUEST });

      for (const [sId, sess] of sessions.entries()) {
        if (sess.userId === newHostId && sess.roomId === roomId) {
          sess.role = ROLES.HOST; // New host upgraded to Host
          io.to(sId).emit('your_role_updated', { role: ROLES.HOST });
        }
      }

      const roomState = room.toRoomState();

      // Broadcast host_transferred to all members
      io.to(roomId).emit('host_transferred', {
        previousHostId,
        newHostId,
        participants: roomState.participants,
      });

      // Distribute updated room state
      io.to(roomId).emit('room_updated', roomState);

      const successResponse = {
        success: true,
        previousHostId,
        newHostId,
      };
      if (typeof callback === 'function') callback(successResponse);
      logger.info(`Host transferred in room ${roomId}: ${previousHostId} -> ${newHostId}`);
    } catch (err) {
      logger.error(`Error in transfer_host: ${err.message}`);
      const errResponse = { success: false, error: err.message };
      if (typeof callback === 'function') callback(errResponse);
      socket.emit('error', errResponse);
    }
  });

  /**
   * Event: mute_participant
   * Host toggles mute on participant
   */
  socket.on('mute_participant', async (payload, callback) => {
    try {
      const session = guard(ACTIONS.MUTE_PARTICIPANT, callback);
      if (!session) return;

      const roomId = normalizeRoomId(payload?.roomId || session.roomId);
      const targetUserId = payload?.targetUserId;
      const isMuted = payload?.isMuted !== false;

      // Broadcast mute event to room and target
      io.to(roomId).emit('participant_muted', {
        targetUserId,
        isMuted,
        mutedBy: {
          userId: session.userId,
          username: session.username,
        },
      });

      if (typeof callback === 'function') callback({ success: true, targetUserId, isMuted });
      logger.info(`Host ${session.username} set mute=${isMuted} for user ${targetUserId} in room ${roomId}`);
    } catch (err) {
      logger.error(`Error in mute_participant: ${err.message}`);
      const errResponse = { success: false, error: err.message };
      if (typeof callback === 'function') callback(errResponse);
      socket.emit('error', errResponse);
    }
  });
};

export default registerRoleHandlers;
