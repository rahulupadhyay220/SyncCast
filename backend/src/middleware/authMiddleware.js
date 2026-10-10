import jwt from 'jsonwebtoken';
import config from '../config/environment.js';
import User from '../models/User.js';
import { ApiError } from '../utils/errorResponse.js';

/**
 * Generates signed JWT for an authenticated user
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.userId,
      role: user.role || 'user',
      username: user.username,
      email: user.email,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

/**
 * Middleware: Requires a valid Bearer JWT in Authorization header
 */
export const requireAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication required: Missing or malformed Bearer token');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Authentication token missing');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Session expired. Please log in again.');
      }
      throw ApiError.unauthorized('Invalid authentication token');
    }

    const user = await User.findOne({ userId: decoded.userId });
    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists');
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Optional authentication (attaches user if token provided, but doesn't block)
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, config.jwtSecret);
          const user = await User.findOne({ userId: decoded.userId });
          if (user) {
            req.user = user;
            req.tokenPayload = decoded;
          }
        } catch {
          // Ignore invalid token in optional auth
        }
      }
    }
    next();
  } catch {
    next();
  }
};

export default {
  generateToken,
  requireAuth,
  optionalAuth,
};
