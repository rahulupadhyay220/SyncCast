import http from "http";
import dotenv from "dotenv";

import app from "./app.js";
import config from "./config/environment.js";
import logger from "./utils/logger.js";
import { connectDatabase, disconnectDatabase } from "./database/connection.js";
import { initializeSockets } from "./sockets/socketHandler.js";

dotenv.config();

// Boot up the database, attach Socket.io to the HTTP instance, and start listening.
const startServer = async () => {
  try {
    await connectDatabase();

    const httpServer = http.createServer(app);
    const io = initializeSockets(httpServer);

    const port = config.port || 5000;
    const server = httpServer.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Health check available at http://localhost:${port}/api/health`);
    });

    // Clean teardown on SIGINT/SIGTERM: finish in-flight requests, drain sockets, and drop DB connection
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received - starting graceful shutdown`);

      io.close(() => {
        logger.info("Socket.io connections closed.");
      });

      server.close(async () => {
        logger.info("HTTP server closed.");
        await disconnectDatabase();
        logger.info("MongoDB disconnected.");
        process.exit(0);
      });

      // Force kill if graceful cleanup hangs for more than 10 seconds
      setTimeout(() => {
        logger.error("Forced shutdown - teardown timed out.");
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