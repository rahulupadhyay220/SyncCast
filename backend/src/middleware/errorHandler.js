import logger from '../utils/logger.js';
import { ApiError } from '../utils/errorResponse.js';
import config from '../config/environment.js';

/**
 * Centralized Global Error Handler Middleware
 * 
 * In production:
 * - Completely suppresses stack traces
 * - Masks internal 500 error messages to prevent information disclosure
 * - Cleanly maps CORS and validation errors to standard status codes
 */
export const errorHandler = (err, req, res, _next) => {
  let statusCode = 500;
  let message = 'An unexpected internal error occurred.';
  let details = null;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.message && err.message.includes('CORS')) {
    statusCode = 403;
    message = 'Cross-Origin Request blocked by security policy.';
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Database validation error';
    details = Object.values(err.errors).map((e) => e.message);
  } else if (err.name === 'CastError') {
    // Mongoose CastError
    statusCode = 400;
    message = `Invalid format for field: ${err.path}`;
  } else if (err.code === 11000) {
    // MongoDB duplicate key
    statusCode = 409;
    message = 'Resource conflict: Duplicate entry already exists.';
  } else if (!config.isProduction && err.message) {
    message = err.message;
  }

  // Safe logging with Winston (mask sensitive body fields like passwords)
  const safeBody = { ...(req.body || {}) };
  if (safeBody.password) safeBody.password = '[REDACTED]';
  if (safeBody.passwordHash) safeBody.passwordHash = '[REDACTED]';

  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`, {
      stack: err.stack,
      body: safeBody,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${statusCode} ${message}`, {
      details,
    });
  }

  const responsePayload = {
    success: false,
    error: message,
  };

  if (details && (!config.isProduction || statusCode < 500)) {
    responsePayload.details = details;
  }

  // Strictly suppress stack traces in production
  if (!config.isProduction && statusCode >= 500 && err.stack) {
    responsePayload.stack = err.stack;
  }

  return res.status(statusCode).json(responsePayload);
};

export default errorHandler;
