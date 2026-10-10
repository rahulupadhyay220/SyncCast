import config from '../config/environment.js';
import { ApiError } from '../utils/errorResponse.js';
import logger from '../utils/logger.js';

/**
 * Middleware: Restricts access to authorized administrators only.
 * 
 * Verifies either:
 * 1. An authenticated user with role === 'admin' via JWT
 * 2. A valid administrative API key via header 'x-admin-key' or 'Authorization: Bearer <ADMIN_API_KEY>'
 */
export const requireAdmin = (req, _res, next) => {
  try {
    const adminKeyHeader = req.headers['x-admin-key'];
    const authHeader = req.headers.authorization;

    // Check 1: Static Admin API Key check (for machine/CI/automated admin access)
    if (
      config.adminApiKey &&
      (adminKeyHeader === config.adminApiKey ||
        (authHeader && authHeader.replace(/^Bearer\s+/i, '') === config.adminApiKey))
    ) {
      req.isAdmin = true;
      return next();
    }

    // Check 2: Authenticated user role check
    if (req.user && req.user.role === 'admin') {
      req.isAdmin = true;
      return next();
    }

    // Access Denied: Log security warning
    logger.warn(`Unauthorized administrative access attempt on ${req.method} ${req.originalUrl} from IP: ${req.ip} (User: ${req.user?.userId || 'anonymous'})`);
    throw ApiError.forbidden('Forbidden: Administrative access required. Authorized personnel only.');
  } catch (error) {
    next(error);
  }
};

export default requireAdmin;
