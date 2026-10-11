import RoomService from '../services/RoomService.js';
import UserService from '../services/UserService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class RoomController {
  /**
   * POST /api/rooms/create
   * Creates room. Creator automatically becomes Host.
   */
  static async createRoom(req, res, next) {
    try {
      const { roomName, hostId, username, initialVideoId, initialVideoTitle, isPublic } = req.body;

      // Upsert User record
      await UserService.upsertUser({ userId: hostId, username });

      // Create room via service
      const room = await RoomService.createRoom({
        roomName,
        hostId,
        username,
        initialVideoId,
        initialVideoTitle,
        isPublic,
      });

      return sendSuccess(res, 201, 'Room created successfully', room.toRoomState());
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rooms/join
   * Joins existing room. User becomes Participant by default.
   */
  static async joinRoom(req, res, next) {
    try {
      const { roomId, userId, username, role } = req.body;

      // Upsert User record
      await UserService.upsertUser({ userId, username });

      const { room, role: assignedRole } = await RoomService.joinRoom({
        roomId,
        userId,
        username,
        role,
      });

      const responseData = {
        ...room.toRoomState(),
        userRole: assignedRole,
      };

      return sendSuccess(res, 200, 'Joined room successfully', responseData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rooms/:roomId
   * Returns current synchronized room state.
   */
  static async getRoom(req, res, next) {
    try {
      const { roomId } = req.params;
      const room = await RoomService.getRoomById(roomId);

      return sendSuccess(res, 200, 'Room state retrieved successfully', room.toRoomState());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rooms
   * Returns list of public active rooms.
   */
  static async getPublicRooms(_req, res, next) {
    try {
      const rooms = await RoomService.getPublicRooms();
      return sendSuccess(res, 200, 'Public rooms retrieved successfully', rooms);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rooms/:roomId/play
   * Starts or resumes stream (Host only)
   */
  static async playStream(req, res, next) {
    try {
      const { roomId } = req.params;
      const { currentTime, requesterId } = req.body;
      const effectiveRequesterId = requesterId || req.user?.userId || req.headers['x-user-id'];

      const room = await RoomService.playVideo({
        roomId,
        currentTime,
        requesterId: effectiveRequesterId,
      });

      return sendSuccess(res, 200, 'Stream started / resumed successfully', room.toRoomState());
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rooms/:roomId/pause
   * Pauses stream (Host only)
   */
  static async pauseStream(req, res, next) {
    try {
      const { roomId } = req.params;
      const { currentTime, requesterId } = req.body;
      const effectiveRequesterId = requesterId || req.user?.userId || req.headers['x-user-id'];

      const room = await RoomService.pauseVideo({
        roomId,
        currentTime,
        requesterId: effectiveRequesterId,
      });

      return sendSuccess(res, 200, 'Stream paused successfully', room.toRoomState());
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rooms/:roomId/end
   * Ends stream / terminates session (Host only)
   */
  static async endStream(req, res, next) {
    try {
      const { roomId } = req.params;
      const { requesterId } = req.body;
      const effectiveRequesterId = requesterId || req.user?.userId || req.headers['x-user-id'];

      const room = await RoomService.endStream({
        roomId,
        requesterId: effectiveRequesterId,
      });

      return sendSuccess(res, 200, 'Stream ended successfully', room.toRoomState());
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rooms/:roomId/seek
   * Seeks stream timestamp (Host only)
   */
  static async seekStream(req, res, next) {
    try {
      const { roomId } = req.params;
      const { currentTime, requesterId } = req.body;
      const effectiveRequesterId = requesterId || req.user?.userId || req.headers['x-user-id'];

      const room = await RoomService.seekVideo({
        roomId,
        currentTime,
        requesterId: effectiveRequesterId,
      });

      return sendSuccess(res, 200, 'Stream seeked successfully', room.toRoomState());
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rooms/:roomId/change-video
   * Swaps streaming video (Host only)
   */
  static async changeVideo(req, res, next) {
    try {
      const { roomId } = req.params;
      const { videoId, videoTitle, requesterId } = req.body;
      const effectiveRequesterId = requesterId || req.user?.userId || req.headers['x-user-id'];

      const room = await RoomService.changeVideo({
        roomId,
        videoId,
        videoTitle,
        requesterId: effectiveRequesterId,
      });

      return sendSuccess(res, 200, 'Stream video changed successfully', room.toRoomState());
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rooms/:roomId/assign-role
   * Elevates or demotes role (Host only)
   */
  static async assignRole(req, res, next) {
    try {
      const { roomId } = req.params;
      const { targetUserId, newRole, requesterId } = req.body;
      const effectiveRequesterId = requesterId || req.user?.userId || req.headers['x-user-id'];

      const result = await RoomService.assignRole({
        roomId,
        targetUserId,
        newRole,
        requesterId: effectiveRequesterId,
      });

      return sendSuccess(res, 200, 'Role updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rooms/:roomId/transfer-host
   * Transfers stream ownership to participant (Host only)
   */
  static async transferHost(req, res, next) {
    try {
      const { roomId } = req.params;
      const { newHostId, requesterId } = req.body;
      const effectiveRequesterId = requesterId || req.user?.userId || req.headers['x-user-id'];

      const result = await RoomService.transferHost({
        roomId,
        newHostId,
        requesterId: effectiveRequesterId,
      });

      return sendSuccess(res, 200, 'Host ownership transferred successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rooms/:roomId/remove-participant
   * Removes participant from room (Host only)
   */
  static async removeParticipant(req, res, next) {
    try {
      const { roomId } = req.params;
      const { targetUserId, requesterId } = req.body;
      const effectiveRequesterId = requesterId || req.user?.userId || req.headers['x-user-id'];

      const result = await RoomService.removeParticipant({
        roomId,
        targetUserId,
        requesterId: effectiveRequesterId,
      });

      return sendSuccess(res, 200, 'Participant removed successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

export default RoomController;
