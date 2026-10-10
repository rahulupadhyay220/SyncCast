import Room from '../models/Room.js';
import { ROLES } from '../config/permissions.js';
import { ApiError } from '../utils/errorResponse.js';
import { generateRoomCode, normalizeRoomId } from '../utils/roomCodeGenerator.js';
import logger from '../utils/logger.js';

export class RoomService {
  /**
   * Creates a new Watch-Party room.
   * Creator automatically becomes the Host.
   * 
   * @param {object} params
   * @param {string} [params.roomName]
   * @param {string} params.hostId
   * @param {string} params.username
   * @param {string} [params.initialVideoId]
   * @param {string} [params.initialVideoTitle]
   * @param {boolean} [params.isPublic]
   */
  static async createRoom({
    roomName = 'SyncCast Watch Theater',
    hostId,
    username,
    initialVideoId = 'jfKfPfyJRdk',
    initialVideoTitle = 'Lofi Girl - beats to relax/study to',
    isPublic = true,
  }) {
    // Generate unique room code (e.g. SYNC-7729)
    let roomId = generateRoomCode();
    let collision = await Room.findOne({ roomId });
    let attempts = 0;
    while (collision && attempts < 5) {
      roomId = generateRoomCode();
      collision = await Room.findOne({ roomId });
      attempts++;
    }

    const hostParticipant = {
      userId: hostId,
      username,
      socketId: null,
      role: ROLES.HOST,
      joinedAt: new Date(),
      isActive: true,
    };

    const room = new Room({
      roomId,
      roomName,
      hostId,
      currentVideoId: initialVideoId,
      currentVideoTitle: initialVideoTitle,
      currentTime: 0,
      playbackState: 'paused',
      lastActionTimestamp: Date.now(),
      isPublic,
      participants: [hostParticipant],
    });

    await room.save();
    logger.info(`Room created: ${roomId} by host: ${username} (${hostId})`);
    return room;
  }

  /**
   * Joins an existing room.
   * User becomes Participant by default (unless user is already the host).
   * 
   * @param {object} params
   * @param {string} params.roomId
   * @param {string} params.userId
   * @param {string} params.username
   * @param {string} [params.socketId]
   * @param {string} [params.role]
   */
  static async joinRoom({ roomId, userId, username, socketId = null, role = null }) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });

    if (!room) {
      throw ApiError.notFound(`Room with code '${roomId}' was not found`);
    }

    // 1. Check if user is blocked from this room (Blocked overrides all)
    const isBlocked = (room.blockedParticipants || []).some(
      (b) => b.userId === userId || (b.username && username && b.username.toLowerCase() === username.toLowerCase())
    );
    if (isBlocked) {
      const blockedErr = ApiError.forbidden('You are permanently blocked from this stream.');
      blockedErr.isBlocked = true;
      throw blockedErr;
    }

    // 2. Check if user was previously removed from this room (Requires Host Approval)
    const isRemoved = (room.removedParticipants || []).some(
      (r) => r.userId === userId || (r.username && username && r.username.toLowerCase() === username.toLowerCase())
    );
    if (isRemoved) {
      logger.info(`User ${username} (${userId}) was previously removed from room ${normalizedId} - requires host rejoin approval`);
      return { room, role: null, isRemoved: true, requiresApproval: true };
    }

    // Check if participant already exists in room
    const existingIndex = room.participants.findIndex((p) => p.userId === userId);

    let assignedRole = role || ROLES.PARTICIPANT;

    if (existingIndex !== -1) {
      // Existing user re-joining or refreshing socket
      const existing = room.participants[existingIndex];
      // Retain existing role (especially if user is Host or Moderator)
      assignedRole = existing.role;
      existing.username = username;
      existing.socketId = socketId || existing.socketId;
      existing.isActive = true;
    } else {
      // New user joining: If user is the designated hostId, assign Host, else Participant
      if (room.hostId === userId) {
        assignedRole = ROLES.HOST;
      } else {
        assignedRole = ROLES.PARTICIPANT;
      }

      room.participants.push({
        userId,
        username,
        socketId,
        role: assignedRole,
        joinedAt: new Date(),
        isActive: true,
      });
    }

    await room.save();
    logger.info(`User ${username} (${userId}) joined room ${normalizedId} as ${assignedRole}`);
    return { room, role: assignedRole, isRemoved: false, requiresApproval: false };
  }

  /**
   * Retrieves current room state with frame-accurate timestamp.
   * 
   * @param {string} roomId 
   */
  static async getRoomById(roomId) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });

    if (!room) {
      throw ApiError.notFound(`Room with code '${roomId}' was not found`);
    }

    return room;
  }

  /**
   * Plays video stream.
   * Updates playbackState to 'playing' and resets timestamp anchor.
   * 
   * SYNCHRONIZATION LOGIC:
   * When video resumes play, we anchor currentTime to the provided playhead point
   * (or calculated current time) and set lastActionTimestamp to Date.now().
   * Any client polling or newly joining will add the elapsed wall-clock time
   * from lastActionTimestamp to this anchor point, ensuring perfect playback lock.
   * 
   * @param {object} params
   * @param {string} params.roomId
   * @param {number} [params.currentTime]
   */
  static async playVideo({ roomId, currentTime }) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });
    if (!room) throw ApiError.notFound('Room not found');

    const anchorTime = typeof currentTime === 'number' && !isNaN(currentTime)
      ? currentTime
      : room.getSyncedCurrentTime();

    room.playbackState = 'playing';
    room.currentTime = anchorTime;
    room.lastActionTimestamp = Date.now();

    await room.save();
    logger.info(`[Sync] Room ${normalizedId} PLAY at ${anchorTime}s`);
    return room;
  }

  /**
   * Pauses video stream.
   * Sets playbackState to 'paused' and freezes anchor timestamp.
   * 
   * @param {object} params
   * @param {string} params.roomId
   * @param {number} [params.currentTime]
   */
  static async pauseVideo({ roomId, currentTime }) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });
    if (!room) throw ApiError.notFound('Room not found');

    const freezeTime = typeof currentTime === 'number' && !isNaN(currentTime)
      ? currentTime
      : room.getSyncedCurrentTime();

    room.playbackState = 'paused';
    room.currentTime = freezeTime;
    room.lastActionTimestamp = Date.now();

    await room.save();
    logger.info(`[Sync] Room ${normalizedId} PAUSE at ${freezeTime}s`);
    return room;
  }

  /**
   * Seeks video to specified timestamp.
   * 
   * @param {object} params
   * @param {string} params.roomId
   * @param {number} params.currentTime
   */
  static async seekVideo({ roomId, currentTime }) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });
    if (!room) throw ApiError.notFound('Room not found');

    room.currentTime = Math.max(0, currentTime);
    room.lastActionTimestamp = Date.now();

    await room.save();
    logger.info(`[Sync] Room ${normalizedId} SEEK to ${currentTime}s`);
    return room;
  }

  /**
   * Changes current video stream.
   * Resets playback timestamp to 0.
   * 
   * @param {object} params
   * @param {string} params.roomId
   * @param {string} params.videoId
   * @param {string} [params.videoTitle]
   */
  static async changeVideo({ roomId, videoId, videoTitle }) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });
    if (!room) throw ApiError.notFound('Room not found');

    room.currentVideoId = videoId;
    if (videoTitle) {
      room.currentVideoTitle = videoTitle;
    }
    room.currentTime = 0;
    room.playbackState = 'playing';
    room.lastActionTimestamp = Date.now();

    await room.save();
    logger.info(`[Sync] Room ${normalizedId} CHANGED VIDEO to ${videoId}`);
    return room;
  }

  /**
   * Assigns role to another participant (Host only feature).
   * 
   * @param {object} params
   * @param {string} params.roomId
   * @param {string} params.targetUserId
   * @param {string} params.newRole
   * @param {string} params.requesterId
   */
  static async assignRole({ roomId, targetUserId, newRole, requesterId }) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });
    if (!room) throw ApiError.notFound('Room not found');

    // Host check
    if (room.hostId !== requesterId) {
      throw ApiError.forbidden('Only the room Host can assign roles');
    }

    // Cannot demote or change Host role through assignRole (use transferHost instead)
    if (room.hostId === targetUserId) {
      throw ApiError.badRequest('Cannot change host role via assign_role. Use transfer_host instead.');
    }

    if (newRole === ROLES.HOST) {
      throw ApiError.badRequest('To make another user Host, use transfer_host.');
    }

    const participant = room.participants.find((p) => p.userId === targetUserId && p.isActive);
    if (!participant) {
      throw ApiError.notFound('Target participant not found in active room');
    }

    const previousRole = participant.role;
    participant.role = newRole;

    await room.save();
    logger.info(`[RBAC] Room ${normalizedId}: User ${targetUserId} role updated ${previousRole} -> ${newRole}`);
    return { room, targetUserId, newRole, previousRole };
  }

  /**
   * Removes participant from room (Host only feature).
   * 
   * @param {object} params
   * @param {string} params.roomId
   * @param {string} params.targetUserId
   * @param {string} params.requesterId
   */
  static async removeParticipant({ roomId, targetUserId, requesterId }) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });
    if (!room) throw ApiError.notFound('Room not found');

    if (room.hostId !== requesterId) {
      throw ApiError.forbidden('Only the room Host can remove participants');
    }

    if (room.hostId === targetUserId) {
      throw ApiError.badRequest('Host cannot remove themselves from room');
    }

    const participantIndex = room.participants.findIndex(
      (p) => p.userId === targetUserId && p.isActive
    );

    if (participantIndex === -1) {
      throw ApiError.notFound('Participant not found in room roster');
    }

    const removedParticipant = room.participants[participantIndex];
    // Remove from active participants
    room.participants.splice(participantIndex, 1);

    // Track in removedParticipants list for rejoin approval requirement
    if (!room.removedParticipants) room.removedParticipants = [];
    if (!room.removedParticipants.some((r) => r.userId === targetUserId)) {
      room.removedParticipants.push({
        userId: targetUserId,
        username: removedParticipant ? removedParticipant.username : 'User',
        removedAt: new Date(),
      });
    }

    await room.save();
    logger.info(`[RBAC] Room ${normalizedId}: Participant ${targetUserId} (${removedParticipant?.username}) removed by Host`);
    return { room, removedParticipant };
  }

  /**
   * Permanently blocks a participant from the stream (Host only).
   * Blocked participants cannot rejoin, cannot send rejoin requests, and have all access denied.
   * 
   * @param {object} params
   * @param {string} params.roomId
   * @param {string} params.targetUserId
   * @param {string} params.requesterId
   */
  static async blockParticipant({ roomId, targetUserId, requesterId }) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });
    if (!room) throw ApiError.notFound('Room not found');

    if (room.hostId !== requesterId) {
      throw ApiError.forbidden('Only the room Host can block participants');
    }

    if (room.hostId === targetUserId) {
      throw ApiError.badRequest('Host cannot block themselves from room');
    }

    if (!room.blockedParticipants) room.blockedParticipants = [];
    if (!room.removedParticipants) room.removedParticipants = [];

    // Find participant details if currently in participants or removed
    let targetUsername = 'User';
    const participantIndex = room.participants.findIndex((p) => p.userId === targetUserId);
    if (participantIndex !== -1) {
      targetUsername = room.participants[participantIndex].username;
      room.participants.splice(participantIndex, 1);
    } else {
      const remIndex = room.removedParticipants.findIndex((r) => r.userId === targetUserId);
      if (remIndex !== -1) {
        targetUsername = room.removedParticipants[remIndex].username;
      }
    }

    // Remove from removedParticipants (Blocked status overrides all)
    room.removedParticipants = room.removedParticipants.filter((r) => r.userId !== targetUserId);

    // Add to blockedParticipants if not already present
    if (!room.blockedParticipants.some((b) => b.userId === targetUserId)) {
      room.blockedParticipants.push({
        userId: targetUserId,
        username: targetUsername,
        blockedAt: new Date(),
      });
    }

    await room.save();
    logger.info(`[RBAC] Room ${normalizedId}: Participant ${targetUserId} (${targetUsername}) PERMANENTLY BLOCKED by Host`);
    return { room, blockedUserId: targetUserId, targetUsername };
  }

  /**
   * Approves a rejoin request from a previously removed participant.
   * 
   * @param {object} params
   * @param {string} params.roomId
   * @param {string} params.targetUserId
   * @param {string} params.requesterId
   */
  static async approveRejoin({ roomId, targetUserId, requesterId }) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });
    if (!room) throw ApiError.notFound('Room not found');

    if (room.hostId !== requesterId) {
      throw ApiError.forbidden('Only the room Host can approve rejoin requests');
    }

    // Remove user from removedParticipants so they can re-enter
    room.removedParticipants = (room.removedParticipants || []).filter((r) => r.userId !== targetUserId);

    await room.save();
    logger.info(`[RBAC] Room ${normalizedId}: Host APPROVED rejoin request for user ${targetUserId}`);
    return { room, targetUserId, approved: true };
  }

  /**
   * Rejects a rejoin request from a previously removed participant.
   * 
   * @param {object} params
   * @param {string} params.roomId
   * @param {string} params.targetUserId
   * @param {string} params.requesterId
   */
  static async rejectRejoin({ roomId, targetUserId, requesterId }) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });
    if (!room) throw ApiError.notFound('Room not found');

    if (room.hostId !== requesterId) {
      throw ApiError.forbidden('Only the room Host can reject rejoin requests');
    }

    logger.info(`[RBAC] Room ${normalizedId}: Host REJECTED rejoin request for user ${targetUserId}`);
    return { room, targetUserId, approved: false };
  }

  /**
   * Transfers Host ownership to another active participant.
   * 
   * Old host becomes Moderator or Participant.
   * New host receives Host permissions and hostId is updated.
   * 
   * @param {object} params
   * @param {string} params.roomId
   * @param {string} params.newHostId
   * @param {string} params.requesterId
   */
  static async transferHost({ roomId, newHostId, requesterId }) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });
    if (!room) throw ApiError.notFound('Room not found');

    if (room.hostId !== requesterId) {
      throw ApiError.forbidden('Only the current Host can transfer host ownership');
    }

    if (requesterId === newHostId) {
      throw ApiError.badRequest('User is already the Host');
    }

    const targetParticipant = room.participants.find(
      (p) => p.userId === newHostId && p.isActive
    );

    if (!targetParticipant) {
      throw ApiError.notFound('Designated new host is not an active participant in this room');
    }

    // Demote old host to Moderator so they retain co-management playback rights
    const oldHostParticipant = room.participants.find((p) => p.userId === requesterId);
    if (oldHostParticipant) {
      oldHostParticipant.role = ROLES.MODERATOR;
    }

    // Promote new host
    targetParticipant.role = ROLES.HOST;
    room.hostId = newHostId;

    await room.save();
    logger.info(`[RBAC] Room ${normalizedId}: Host transferred ${requesterId} -> ${newHostId}`);
    return {
      room,
      previousHostId: requesterId,
      newHostId,
      newHostParticipant: targetParticipant,
    };
  }

  /**
   * Handles user disconnection from socket.
   * 
   * DISCONNECT HANDLING SPECIFICATION:
   * - If Participant disconnects:
   *   Remove socket mapping, broadcast participant_left.
   * - If Host disconnects:
   *   Automatically promote oldest active participant.
   *   Update hostId, role, permissions, and broadcast host_transferred.
   * 
   * @param {string} socketId 
   */
  static async handleSocketDisconnect(socketId) {
    if (!socketId) return null;

    // Find room where this socket is active
    const room = await Room.findOne({ 'participants.socketId': socketId });
    if (!room) return null;

    const participantIndex = room.participants.findIndex((p) => p.socketId === socketId);
    if (participantIndex === -1) return null;

    const disconnectedUser = room.participants[participantIndex];
    const wasHost = room.hostId === disconnectedUser.userId;

    // Remove or mark inactive
    room.participants.splice(participantIndex, 1);

    let hostPromotion = null;

    if (wasHost) {
      // Find oldest active participant
      const remainingActive = room.participants
        .filter((p) => p.isActive)
        .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

      if (remainingActive.length > 0) {
        const oldest = remainingActive[0];
        oldest.role = ROLES.HOST;
        room.hostId = oldest.userId;

        hostPromotion = {
          previousHostId: disconnectedUser.userId,
          newHostId: oldest.userId,
          promotedUser: oldest,
        };

        logger.info(`[Failover] Host ${disconnectedUser.username} disconnected. Auto-promoted oldest peer ${oldest.username} (${oldest.userId}) as new Host.`);
      } else {
        logger.info(`[Cleanup] Room ${room.roomId} is now empty after host disconnected.`);
      }
    }

    await room.save();

    return {
      room,
      roomId: room.roomId,
      disconnectedUser,
      wasHost,
      hostPromotion,
    };
  }

  /**
   * Lists public active rooms for discovery
   */
  static async getPublicRooms() {
    const rooms = await Room.find({ isPublic: true })
      .sort({ updatedAt: -1 })
      .limit(20);

    return rooms.map((r) => r.toRoomState());
  }
}

export default RoomService;
