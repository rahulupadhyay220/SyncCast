import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env relative to backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  port: parseInt(process.env.PORT, 10) || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/synccast',
  clientUrls: process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((url) => url.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  logLevel: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  // JWT Secret & Expiry
  jwtSecret: process.env.JWT_SECRET || (isProduction
    ? (() => {
        console.error('FATAL CRITICAL SECURITY WARNING: JWT_SECRET must be explicitly configured in production!');
        return 'synccast-prod-fallback-not-secure-change-immediately';
      })()
    : 'synccast-dev-insecure-secret-key-35359929'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Administrative API authorization key
  adminApiKey: process.env.ADMIN_API_KEY || (isProduction ? '' : 'synccast-admin-secret-2026'),

  // Rate Limiting Rules (OWASP requirement: max 10 attempts per 10 minutes)
  authRateLimitWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 10 * 60 * 1000, // 10 minutes
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10, // 10 attempts
};

export default config;
