import { Router } from 'express';
import authRoutes from './authRoutes.js';
import roomRoutes from './roomRoutes.js';
import adminRoutes from './adminRoutes.js';
import healthRoutes from './healthRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);

export default router;
