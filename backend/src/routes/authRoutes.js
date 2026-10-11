import { Router } from 'express';
import AuthController from '../controllers/AuthController.js';
import validate from '../middleware/validate.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { loginRateLimiter, signupRateLimiter } from '../middleware/rateLimiter.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';

const router = Router();

// POST /api/auth/register - Rate limited to 10 requests / 10 min window
router.post(
  '/register',
  signupRateLimiter,
  validate(registerSchema, 'body'),
  AuthController.register
);

// POST /api/auth/login - Rate limited to 10 attempts / 10 min window
router.post(
  '/login',
  loginRateLimiter,
  validate(loginSchema, 'body'),
  AuthController.login
);

// GET /api/auth/me - Protected by JWT authentication
router.get('/me', requireAuth, AuthController.getCurrentUser);

// POST /api/auth/logout
router.post('/logout', AuthController.logout);

// POST /api/auth/sync - Sync authenticated profile into MongoDB
router.post('/sync', AuthController.syncUser);

export default router;
