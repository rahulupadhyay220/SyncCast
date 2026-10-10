import mongoose from 'mongoose';
import Room from '../models/Room.js';
import User from '../models/User.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/errorResponse.js';
import logger from '../utils/logger.js';

export class AdminController {
  /**
   * GET /api/admin/system
   * Detailed system telemetry for authorized administrators
   */
  static async getSystemStatus(_req, res, next) {
    try {
      const dbState = mongoose.connection.readyState;
      const dbStatus = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      }[dbState] || 'unknown';

      let totalRooms = 0;
      let totalUsers = 0;
      if (dbState === 1) {
        [totalRooms, totalUsers] = await Promise.all([
          Room.countDocuments(),
          User.countDocuments(),
        ]);
      }

      const memUsage = process.memoryUsage();

      return sendSuccess(res, 200, 'Admin system status retrieved', {
        server: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development',
          memoryUsageMb: {
            rss: Math.round(memUsage.rss / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          },
        },
        database: {
          status: dbStatus,
          connected: dbState === 1,
        },
        metrics: {
          totalRooms,
          totalUsers,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/rooms
   * Lists all rooms across the system
   */
  static async getAllRooms(req, res, next) {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
      const rooms = await Room.find().sort({ updatedAt: -1 }).limit(limit);

      return sendSuccess(
        res,
        200,
        'Admin rooms list retrieved',
        rooms.map((r) => r.toRoomState())
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/rooms/:roomId
   * Forces deletion/closure of any room by administrator
   */
  static async deleteRoom(req, res, next) {
    try {
      const { roomId } = req.params;
      const room = await Room.findOneAndDelete({ roomId: roomId.toUpperCase().trim() });
      if (!room) {
        throw ApiError.notFound(`Room '${roomId}' not found`);
      }

      logger.warn(`[ADMIN AUDIT] Room '${roomId}' deleted by admin`);
      return sendSuccess(res, 200, `Room '${roomId}' deleted successfully by administrator`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/users
   * Lists registered users with pagination
   */
  static async getAllUsers(req, res, next) {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
      const users = await User.find().sort({ createdAt: -1 }).limit(limit);

      return sendSuccess(
        res,
        200,
        'Admin users list retrieved',
        users.map((u) => u.toClient())
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/users/:userId/role
   * Updates user role (admin / user)
   */
  static async updateUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      const user = await User.findOne({ userId });
      if (!user) {
        throw ApiError.notFound(`User '${userId}' not found`);
      }

      const oldRole = user.role;
      user.role = role;
      await user.save();

      logger.warn(`[ADMIN AUDIT] User role updated for ${userId}: ${oldRole} -> ${role}`);
      return sendSuccess(res, 200, 'User role updated successfully', user.toClient());
    } catch (error) {
      next(error);
    }
  }
}

export default AdminController;
