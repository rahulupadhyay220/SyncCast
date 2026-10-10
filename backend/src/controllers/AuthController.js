import User from '../models/User.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/errorResponse.js';
import logger from '../utils/logger.js';

export class AuthController {
  /**
   * POST /api/auth/register
   * Creates a new user with strong bcrypt password hashing
   */
  static async register(req, res, next) {
    try {
      const { email, password, fullName, username } = req.body;
      const cleanEmail = email.toLowerCase().trim();

      // Check for duplicate account
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        throw ApiError.conflict('An account with this email address already exists.');
      }

      const generatedUserId = `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      const effectiveUsername = username?.trim() || fullName?.trim().replace(/\s+/g, '_') || cleanEmail.split('@')[0];

      // Create new user (password is automatically hashed via pre-save hook)
      const user = new User({
        userId: generatedUserId,
        username: effectiveUsername,
        email: cleanEmail,
        fullName: fullName.trim(),
        passwordHash: password,
        role: 'user',
        isVerified: true, // Mark verified for demo / internal auth
        lastActiveAt: new Date(),
      });

      await user.save();

      const token = generateToken(user);
      logger.info(`User registered successfully: ${user.username} (${user.userId}) from IP: ${req.ip}`);

      return sendSuccess(res, 201, 'Account created successfully', {
        user: user.toClient(),
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Authenticates user against bcrypt hash and issues JWT
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const cleanEmail = email.toLowerCase().trim();

      // Query user and explicitly select passwordHash
      const user = await User.findOne({ email: cleanEmail }).select('+passwordHash');
      if (!user) {
        // Uniform error message to prevent user enumeration attacks
        throw ApiError.unauthorized('Invalid email or password.');
      }

      // Constant-time bcrypt comparison
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        logger.warn(`Failed login attempt for email: ${cleanEmail} from IP: ${req.ip}`);
        throw ApiError.unauthorized('Invalid email or password.');
      }

      // Update activity timestamp
      user.lastActiveAt = new Date();
      await user.save();

      const token = generateToken(user);
      logger.info(`User authenticated: ${user.username} (${user.userId}) from IP: ${req.ip}`);

      return sendSuccess(res, 200, 'Signed in successfully', {
        user: user.toClient(),
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Retrieves currently authenticated user profile
   */
  static async getCurrentUser(req, res, next) {
    try {
      return sendSuccess(res, 200, 'Profile retrieved', {
        user: req.user.toClient(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(req, res, next) {
    try {
      return sendSuccess(res, 200, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
