import Room from '../models/Room.js';
import RoomParticipant from '../models/RoomParticipant.js';
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
      roomCode: roomId,
      roomName,
      hostId,
      currentHostId: hostId,
      streamStatus: 'paused',
      createdDate: new Date(),
      currentVideoId: initialVideoId,
      currentVideoTitle: initialVideoTitle,
      currentTime: 0,
      playbackState: 'paused',
      lastActionTimestamp: Date.now(),
      isPublic,
      participants: [hostParticipant],
    });

    await room.save();

    // Persist Host in Room Participants collection in MongoDB
    try {
      await RoomParticipant.findOneAndUpdate(
        { roomId, userId: hostId },
        {
          userId: hostId,
          roomId,
          username,
          role: ROLES.HOST,
          joinTime: new Date(),
          leaveTime: null,
          status: 'active',
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      logger.warn(`Failed to save initial RoomParticipant record: ${err.message}`);
    }

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

    // Check if user is the designated host of this room
    const isRoomHost = (room.hostId === userId || room.currentHostId === userId);

    // Check if participant already exists in room
    const existingIndex = room.participants.findIndex((p) => p.userId === userId);

    let assignedRole = isRoomHost ? ROLES.HOST : ROLES.GUEST;

    if (existingIndex !== -1) {
      // Existing user re-joining or refreshing socket
      const existing = room.participants[existingIndex];
      // Only retain Host role if user is actually the designated host
      if (isRoomHost || (existing.role === ROLES.HOST && (room.hostId === userId || room.currentHostId === userId))) {
        assignedRole = ROLES.HOST;
      } else {
        // Enforce Guest/Participant for all non-hosts
        assignedRole = ROLES.GUEST;
      }
      existing.role = assignedRole;
      existing.username = username;
      existing.socketId = socketId || existing.socketId;
      existing.isActive = true;
    } else {
      // New user joining: If user is the designated hostId, assign Host, else strictly Guest
      assignedRole = isRoomHost ? ROLES.HOST : ROLES.GUEST;

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

    // Persist in RoomParticipant collection in MongoDB
    try {
      await RoomParticipant.findOneAndUpdate(
        { roomId: normalizedId, userId },
        {
          userId,
          roomId: normalizedId,
          username,
          role: assignedRole,
          joinTime: new Date(),
          leaveTime: null,
          status: 'active',
          socketId,
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      logger.warn(`Failed to save RoomParticipant record on join: ${err.message}`);
    }

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
   * Updates playbackState to 'playing', streamStatus to 'live', and resets timestamp anchor.
   * 
   * @param {object} params
   * @param {string} params.roomId
   * @param {number} [params.currentTime]
   * @param {string} [params.requesterId]
   */
  static async playVideo({ roomId, currentTime, requesterId = null }) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });
    if (!room) throw ApiError.notFound('Room not found');

    if (requesterId && room.hostId !== requesterId && room.currentHostId !== requesterId) {
      throw ApiError.forbidden('Only the room Host can control stream playback');
    }

    const anchorTime = typeof currentTime === 'number' && !isNaN(currentTime)
      ? currentTime
      : room.getSyncedCurrentTime();

    room.playbackState = 'playing';
    room.streamStatus = 'live';
    room.currentTime = anchorTime;
    room.lastActionTimestamp = Date.now();

    await room.save();
    logger.info(`[Sync] Room ${normalizedId} PLAY at ${anchorTime}s`);
    return room;
  }

  /**
   * Pauses video stream.
   * Sets playbackState to 'paused', streamStatus to 'paused', and freezes anchor timestamp.
   * 
   * @param {object} params
   * @param {string} params.roomId
   * @param {number} [params.currentTime]
   * @param {string} [params.requesterId]
   */
  static async pauseVideo({ roomId, currentTime, requesterId = null }) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });
    if (!room) throw ApiError.notFound('Room not found');

    if (requesterId && room.hostId !== requesterId && room.currentHostId !== requesterId) {
      throw ApiError.forbidden('Only the room Host can control stream playback');
    }

    const freezeTime = typeof currentTime === 'number' && !isNaN(currentTime)
      ? currentTime
      : room.getSyncedCurrentTime();

    room.playbackState = 'paused';
    room.streamStatus = 'paused';
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
   * @param {string} [params.requesterId]
   */
  static async seekVideo({ roomId, currentTime, requesterId = null }) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });
    if (!room) throw ApiError.notFound('Room not found');

    if (requesterId && room.hostId !== requesterId && room.currentHostId !== requesterId) {
      throw ApiError.forbidden('Only the room Host can control stream playback');
    }

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
   * @param {string} [params.requesterId]
   */
  static async changeVideo({ roomId, videoId, videoTitle, requesterId = null }) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });
    if (!room) throw ApiError.notFound('Room not found');

    if (requesterId && room.hostId !== requesterId && room.currentHostId !== requesterId) {
      throw ApiError.forbidden('Only the room Host can change the video');
    }

    room.currentVideoId = videoId;
    if (videoTitle) {
      room.currentVideoTitle = videoTitle;
    }
    room.currentTime = 0;
    room.playbackState = 'playing';
    room.streamStatus = 'live';
    room.lastActionTimestamp = Date.now();

    await room.save();
    logger.info(`[Sync] Room ${normalizedId} CHANGED VIDEO to ${videoId}`);
    return room;
  }

  /**
   * Ends current stream / terminates session (Host only feature).
   * 
   * @param {object} params
   * @param {string} params.roomId
   * @param {string} params.requesterId
   */
  static async endStream({ roomId, requesterId }) {
    const normalizedId = normalizeRoomId(roomId);
    const room = await Room.findOne({ roomId: normalizedId });
    if (!room) throw ApiError.notFound('Room not found');

    if (room.hostId !== requesterId && room.currentHostId !== requesterId) {
      throw ApiError.forbidden('Only the room Host can end the stream');
    }

    room.playbackState = 'paused';
    room.streamStatus = 'ended';
    room.isActive = false;
    room.lastActionTimestamp = Date.now();

    await room.save();

    try {
      await RoomParticipant.updateMany(
        { roomId: normalizedId, status: 'active' },
        { $set: { status: 'left', leaveTime: new Date() } }
      );
    } catch (err) {
      logger.warn(`Failed to update RoomParticipant records on endStream: ${err.message}`);
    }

    logger.info(`[RBAC] Room ${normalizedId}: Host ended stream / terminated session`);
    return room;
  }

  /**
   * Assigns role to another participant (Host only feature).
   * Promoting to Host automatically invokes transferHost.
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
    if (room.hostId !== requesterId && room.currentHostId !== requesterId) {
      throw ApiError.forbidden('Only the room Host can assign roles');
    }

    // Delegating Host role assignment to host transfer
    if (newRole === ROLES.HOST) {
      return await this.transferHost({ roomId: normalizedId, newHostId: targetUserId, requesterId });
    }

    // Cannot demote or change Host role through assignRole
    if (room.hostId === targetUserId || room.currentHostId === targetUserId) {
      throw ApiError.badRequest('Cannot change host role via assign_role. Use transfer_host instead.');
    }

    const participant = room.participants.find((p) => p.userId === targetUserId && p.isActive);
    if (!participant) {
      throw ApiError.notFound('Target participant not found in active room');
    }

    const previousRole = participant.role;
    participant.role = newRole;

    await room.save();

    try {
      await RoomParticipant.findOneAndUpdate(
        { roomId: normalizedId, userId: targetUserId },
        { role: newRole }
      );
    } catch (err) {
      logger.warn(`Failed to update RoomParticipant role: ${err.message}`);
    }

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

    if (room.hostId !== requesterId && room.currentHostId !== requesterId) {
      throw ApiError.forbidden('Only the room Host can remove participants');
    }

    if (room.hostId === targetUserId || room.currentHostId === targetUserId) {
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

    try {
      await RoomParticipant.findOneAndUpdate(
        { roomId: normalizedId, userId: targetUserId },
        { status: 'removed', leaveTime: new Date() }
      );
    } catch (err) {
      logger.warn(`Failed to update RoomParticipant on removal: ${err.message}`);
    }

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

    if (room.hostId !== requesterId && room.currentHostId !== requesterId) {
      throw ApiError.forbidden('Only the room Host can block participants');
    }

    if (room.hostId === targetUserId || room.currentHostId === targetUserId) {
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

    try {
      await RoomParticipant.findOneAndUpdate(
        { roomId: normalizedId, userId: targetUserId },
        { status: 'blocked', leaveTime: new Date() }
      );
    } catch (err) {
      logger.warn(`Failed to update RoomParticipant on block: ${err.message}`);
    }

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

    if (room.hostId !== requesterId && room.currentHostId !== requesterId) {
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

    if (room.hostId !== requesterId && room.currentHostId !== requesterId) {
      throw ApiError.forbidden('Only the room Host can reject rejoin requests');
    }

    logger.info(`[RBAC] Room ${normalizedId}: Host REJECTED rejoin request for user ${targetUserId}`);
    return { room, targetUserId, approved: false };
  }

  /**
   * Transfers Host ownership to another active participant.
   * 
   * Old host becomes Guest/Participant.
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

    if (room.hostId !== requesterId && room.currentHostId !== requesterId) {
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

    // Demote old host to Guest so they no longer hold exclusive host controls
    const oldHostParticipant = room.participants.find((p) => p.userId === requesterId);
    if (oldHostParticipant) {
      oldHostParticipant.role = ROLES.GUEST;
    }

    // Promote new host
    targetParticipant.role = ROLES.HOST;
    room.hostId = newHostId;
    room.currentHostId = newHostId;

    await room.save();

    // Persist ownership transfer in RoomParticipant collection in MongoDB
    try {
      await RoomParticipant.findOneAndUpdate(
        { roomId: normalizedId, userId: newHostId },
        { role: ROLES.HOST, status: 'active' },
        { upsert: true }
      );
      await RoomParticipant.findOneAndUpdate(
        { roomId: normalizedId, userId: requesterId },
        { role: ROLES.GUEST, status: 'active' },
        { upsert: true }
      );
    } catch (err) {
      logger.warn(`Failed to update RoomParticipant records on transferHost: ${err.message}`);
    }

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
    const wasHost = (room.hostId === disconnectedUser.userId || room.currentHostId === disconnectedUser.userId);

    // Remove or mark inactive
    room.participants.splice(participantIndex, 1);

    // Update RoomParticipant collection in MongoDB
    try {
      await RoomParticipant.findOneAndUpdate(
        { roomId: room.roomId, userId: disconnectedUser.userId },
        { status: 'left', leaveTime: new Date() }
      );
    } catch (err) {
      logger.warn(`Failed to update RoomParticipant on socket disconnect: ${err.message}`);
    }

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
        room.currentHostId = oldest.userId;

        try {
          await RoomParticipant.findOneAndUpdate(
            { roomId: room.roomId, userId: oldest.userId },
            { role: ROLES.HOST, status: 'active' }
          );
        } catch (err) {
          logger.warn(`Failed to promote RoomParticipant to Host on disconnect: ${err.message}`);
        }

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
