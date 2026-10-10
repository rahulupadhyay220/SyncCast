import mongoose from 'mongoose';
import { sendSuccess } from '../utils/apiResponse.js';

export class HealthController {
  static getHealth(_req, res) {
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    }[dbState] || 'unknown';

    return sendSuccess(res, 200, 'SyncCast Backend API is healthy', {
      service: 'SyncCast Watch-Party Backend',
      status: 'operational',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: dbStatus,
    });
  }
}

export default HealthController;
