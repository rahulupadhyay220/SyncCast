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
   * Syncs authenticated user into MongoDB
   * 
   * @param {object} params
   * @param {string} params.userId
   * @param {string} [params.email]
   * @param {string} [params.fullName]
   * @param {string} [params.username]
   */
  static async syncAuthenticatedUser({ userId, email, fullName, username }) {
    const cleanEmail = email ? email.toLowerCase().trim() : undefined;
    const effectiveUserId = userId || `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const effectiveName = fullName?.trim() || username?.trim() || cleanEmail?.split('@')[0] || 'User';
    const effectiveUsername = username?.trim() || effectiveName.replace(/\s+/g, '_');

    let user = null;
    if (cleanEmail) {
      user = await User.findOne({ email: cleanEmail });
    }
    if (!user && userId) {
      user = await User.findOne({ userId });
    }

    if (user) {
      user.name = effectiveName;
      user.fullName = effectiveName;
      user.username = effectiveUsername;
      if (cleanEmail) user.email = cleanEmail;
      user.canHost = true;
      user.lastActiveAt = new Date();
      await user.save();
      return user;
    }

    user = new User({
      userId: effectiveUserId,
      username: effectiveUsername,
      name: effectiveName,
      fullName: effectiveName,
      email: cleanEmail,
      canHost: true,
      role: 'user',
      isVerified: true,
      lastActiveAt: new Date(),
    });
    await user.save();
    return user;
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
