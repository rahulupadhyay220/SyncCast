import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import config from '../config/environment.js';

/**
 * Custom handler for rate-limit breaches returning standard JSON error response
 */
const rateLimitHandler = (message) => (req, res, _next, options) => {
  res.status(options.statusCode).json({
    success: false,
    error: message,
    retryAfterSeconds: Math.ceil(options.windowMs / 1000),
  });
};

/**
 * Login Rate Limiter:
 * Maximum 10 login attempts per user/IP within a 10-minute window.
 */
export const loginRateLimiter = rateLimit({
  windowMs: config.authRateLimitWindowMs, // 10 minutes (600,000ms)
  max: config.authRateLimitMax, // 10 attempts
  standardHeaders: true, // Return standard RateLimit headers in responses
  legacyHeaders: false,
  message: 'Too many login attempts from this IP/device. Please try again after 10 minutes.',
  handler: rateLimitHandler('Too many login attempts from this IP/device. Please try again after 10 minutes.'),
  keyGenerator: (req) => {
    // Normalizes IPv6/IPv4 and appends lowercased email if present to throttle per account AND per IP
    const clientIp = ipKeyGenerator(req);
    const emailKey = req.body?.email ? `:${req.body.email.trim().toLowerCase()}` : '';
    return `${clientIp}${emailKey}`;
  },
});

/**
 * Signup Rate Limiter:
 * Maximum 10 signup requests per user/IP within a 10-minute window.
 */
export const signupRateLimiter = rateLimit({
  windowMs: config.authRateLimitWindowMs, // 10 minutes (600,000ms)
  max: config.authRateLimitMax, // 10 requests
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many account creation requests from this IP. Please try again after 10 minutes.',
  handler: rateLimitHandler('Too many account creation requests from this IP. Please try again after 10 minutes.'),
  keyGenerator: (req) => ipKeyGenerator(req),
});

/**
 * General API Endpoint Rate Limiter:
 * Prevents automated DDoS or resource exhaustion on public endpoints.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many requests. Please slow down.'),
  keyGenerator: (req) => ipKeyGenerator(req),
});

export default {
  loginRateLimiter,
  signupRateLimiter,
  apiRateLimiter,
};
