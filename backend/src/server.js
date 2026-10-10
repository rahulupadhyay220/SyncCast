import http from "http";
import dotenv from "dotenv";

import app from "./app.js";
import config from "./config/environment.js";
import logger from "./utils/logger.js";
import { connectDatabase, disconnectDatabase } from "./database/connection.js";
import { initializeSockets } from "./sockets/socketHandler.js";

dotenv.config();

/**
 * Bootstrap and launch server
 */
const startServer = async () => {
  try {
    // Connect MongoDB
    await connectDatabase();

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.io
    const io = initializeSockets(httpServer);

    // Start server
    const server = httpServer.listen(config.port || 5000, () => {
      logger.info(`Server running on port ${config.port || 5000}`);
      logger.info(
        `Health Check: http://localhost:${config.port || 5000}/api/health`
      );
    });

    /**
     * Graceful Shutdown
     */
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down server...`);

      io.close(() => {
        logger.info("Socket.io connections closed.");
      });

      server.close(async () => {
        logger.info("HTTP server closed.");

        await disconnectDatabase();

        logger.info("MongoDB disconnected.");
        process.exit(0);
      });

      setTimeout(() => {
        logger.error("Forced shutdown.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

    process.on("uncaughtException", (err) => {
      logger.error("Uncaught Exception", {
        message: err.message,
        stack: err.stack,
      });
    });

    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection", { reason });
    });
  } catch (error) {
    logger.error("Server startup failed", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

startServer();