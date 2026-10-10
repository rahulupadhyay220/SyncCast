import User from '../models/User.js';

export class UserService {
  /**
   * Upserts user profile with latest socketId and active timestamp
   * 
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.username
   * @param {string} [params.socketId]
   */
  static async upsertUser({ userId, username, socketId = null }) {
    return await User.findOneAndUpdate(
      { userId },
      {
        $set: {
          username,
          ...(socketId ? { socketId } : {}),
          lastActiveAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  /**
   * Finds user by userId
   * @param {string} userId 
   */
  static async getUserById(userId) {
    return await User.findOne({ userId });
  }

  /**
   * Clears socketId on disconnect
   * @param {string} socketId 
   */
  static async clearSocketId(socketId) {
    return await User.updateMany({ socketId }, { $set: { socketId: null } });
  }
}

export default UserService;
