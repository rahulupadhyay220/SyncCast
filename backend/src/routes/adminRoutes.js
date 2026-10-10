import { Router } from 'express';
import AdminController from '../controllers/AdminController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import validate from '../middleware/validate.js';
import { updateRoleSchema } from '../validators/authValidator.js';

const router = Router();

// Apply administrative authentication guard across all /api/admin routes
router.use(optionalAuth, requireAdmin);

// GET /api/admin/system - Telemetry and status
router.get('/system', AdminController.getSystemStatus);

// GET /api/admin/rooms - Full rooms listing
router.get('/rooms', AdminController.getAllRooms);

// DELETE /api/admin/rooms/:roomId - Force delete room
router.delete('/rooms/:roomId', AdminController.deleteRoom);

// GET /api/admin/users - Users listing
router.get('/users', AdminController.getAllUsers);

// PATCH /api/admin/users/:userId/role - Update user role
router.patch('/users/:userId/role', validate(updateRoleSchema, 'body'), AdminController.updateUserRole);

export default router;
