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
}

export default RoomController;
