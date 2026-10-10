import mongoose from 'mongoose';
import config from '../config/environment.js';
import logger from '../utils/logger.js';

let isConnected = false;
let listenersRegistered = false;

/**
 * Connect to MongoDB Database
 */
export const connectDatabase = async () => {
  // Prevent duplicate connections
  if (isConnected) {
    logger.info('Database connection already established.');
    return;
  }

  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    // Log masked URI for security
    const maskedUri = config.mongodbUri.replace(
      /\/\/.*@/,
      '//***@'
    );

    logger.info(
      `Attempting connection to MongoDB at: ${maskedUri}`
    );

    const connection = await mongoose.connect(
      config.mongodbUri,
      options
    );

    isConnected = connection.connections[0].readyState === 1;

    // Equivalent to:
    // console.log("MongoDB Connected Successfully");
    logger.info('MongoDB Connected Successfully');

    /**
     * Connection Event Listeners (registered once)
     */
    if (!listenersRegistered) {
      listenersRegistered = true;

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB Connection Error:', {
          error: err.message,
        });
      });

      mongoose.connection.on('disconnected', () => {
        isConnected = false;

        logger.warn(
          'MongoDB Connection Lost. Waiting for reconnection...'
        );
      });

      mongoose.connection.on('reconnected', () => {
        isConnected = true;

        logger.info(
          'MongoDB Reconnected Successfully'
        );
      });
    }

  } catch (error) {
    // Equivalent to:
    // console.log("MongoDB Connection Failed:", error.message);

    const safeErrorMessage = (error.message || '').replace(/\/\/.*@/, '//***@');
    logger.error('MongoDB Connection Failed:', {
      error: safeErrorMessage,
    });

    isConnected = false;

    // In Production, stop the server
    if (config.isProduction) {
      process.exit(1);
    }

    // In Development, allow app to continue running
    logger.warn(
      'Application will continue running. MongoDB operations will be unavailable until a connection is established.'
    );
  }
};

/**
 * Gracefully Disconnect Database
 */
export const disconnectDatabase = async () => {
  if (!isConnected) {
    logger.info(
      'No active MongoDB connection found.'
    );
    return;
  }

  try {
    await mongoose.disconnect();

    isConnected = false;

    logger.info(
      'MongoDB connection closed gracefully.'
    );
  } catch (error) {
    logger.error(
      'Error during MongoDB disconnect:',
      {
        error: error.message,
      }
    );
  }
};

/**
 * Database Connection Status
 */
export const isDatabaseConnected = () => {
  return isConnected;
};

export default {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
};