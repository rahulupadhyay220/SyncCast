import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/environment.js';
import apiRoutes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import { sanitizeInput } from './middleware/sanitize.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import logger from './utils/logger.js';

const app = express();

// Disable x-powered-by header (defense-in-depth)
app.disable('x-powered-by');

// Trust reverse proxy if in production
if (config.isProduction) {
  app.set('trust proxy', 1);
}

// Security headers (Helmet) - OWASP recommended configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.youtube.com', 'https://s.ytimg.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'ws:', 'wss:', 'https:', 'http:'],
        frameSrc: ["'self'", 'https://www.youtube.com', 'https://www.youtube-nocookie.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: config.isProduction ? [] : null,
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'sameorigin',
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    noSniff: true,
    hidePoweredBy: true,
  })
);

// CORS Configuration - Principle of least privilege
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (config.clientUrls.includes(origin)) {
        return callback(null, true);
      }

      // In non-production, allow localhost dev origins
      if (
        !config.isProduction &&
        (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
    maxAge: 86400, // Cache preflight for 24 hours
  })
);

// Body parsing with strict size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Input sanitization against NoSQL injection and XSS
app.use(sanitizeInput);

// General API Rate Limiting to prevent DoS
app.use('/api', apiRateLimiter);

// Request logging in development
if (!config.isProduction) {
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// API Routes
app.use('/api', apiRoutes);

// Root fallback status endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'SyncCast Watch-Party Backend Service',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Centralized 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
