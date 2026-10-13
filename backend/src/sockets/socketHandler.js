import { Server } from 'socket.io';
import config from '../config/environment.js';
import logger from '../utils/logger.js';
import registerRoomHandlers from './roomHandlers.js';
import registerPlaybackHandlers from './playbackHandlers.js';
import registerRoleHandlers from './roleHandlers.js';
import RoomService from '../services/RoomService.js';
import UserService from '../services/UserService.js';
import { ROLES } from '../config/permissions.js';
import { socketChatSchema, socketReactionSchema } from '../validators/socketValidator.js';
import { escapeHtml } from '../middleware/sanitize.js';

/**
 * Initializes and configures Socket.io server
 * 
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
export const initializeSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (config.clientUrls.includes(origin)) return callback(null, true);
        // Allow local LAN IPs (192.168.*, 10.*, 172.*), localhost dev origins, and preview domains
        if (
          !config.isProduction ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('https://localhost:') ||
          origin.startsWith('http://192.168.') ||
          origin.startsWith('http://10.') ||
          origin.startsWith('http://172.') ||
          origin.includes('.vercel.app') ||
          origin.includes('.onrender.com')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // In-memory mapping of active socket sessions:
  // Key: socket.id -> Value: { socketId, userId, username, roomId, role }
  const activeSessions = new Map();

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} from ${socket.handshake.address}`);

    // Register modular event handlers
    registerRoomHandlers(io, socket, activeSessions);
    registerPlaybackHandlers(io, socket, activeSessions);
    registerRoleHandlers(io, socket, activeSessions);

    // Sanitized & validated chat message handling (XSS protected)
    const handleChatMessage = (payload) => {
      const session = activeSessions.get(socket.id);
      const parsed = socketChatSchema.safeParse(payload || {});
      if (!parsed.success) return;

      const rawText = parsed.data.text || parsed.data.message || '';
      if (!rawText.trim()) return;

      const targetRoomId = session?.roomId || parsed.data.roomId;
      if (!targetRoomId) return;

      const senderName = session?.username || 'Guest';
      const senderRole = session?.role || 'Participant';
      const sanitizedText = escapeHtml(rawText.trim());

      const messageObj = {
        id: parsed.data.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: senderName,
        role: senderRole,
        text: sanitizedText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      io.to(targetRoomId).emit('chat_message', { message: messageObj });
    };

    socket.on('chat_message', handleChatMessage);
    socket.on('send_chat', handleChatMessage);

    // Sanitized & validated reaction handling
    socket.on('send_reaction', (payload) => {
      const session = activeSessions.get(socket.id);
      const parsed = socketReactionSchema.safeParse(payload || {});
      if (!parsed.success) return;

      const targetRoomId = session?.roomId || payload?.roomId;
      if (!targetRoomId) return;

      const sanitizedEmoji = escapeHtml(parsed.data.emoji.trim());

      io.to(targetRoomId).emit('reaction_received', {
        emoji: sanitizedEmoji,
        sender: session?.username || 'Peer',
      });
    });

    /**
     * DISCONNECT HANDLING
     * Automatically cleans up session and triggers Host failover if necessary
     */
    socket.on('disconnect', async (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (Reason: ${reason})`);

      try {
        const disconnectResult = await RoomService.handleSocketDisconnect(socket.id);
        await UserService.clearSocketId(socket.id);

        if (disconnectResult && disconnectResult.room) {
          const { room, roomId, disconnectedUser, wasHost, hostPromotion } = disconnectResult;
          const roomState = room.toRoomState();

          // 1. Notify peers that participant left
          io.to(roomId).emit('participant_left', {
            userId: disconnectedUser.userId,
            username: disconnectedUser.username,
            socketId: socket.id,
            wasHost,
          });

          // 2. If disconnected user was Host, handle automated failover promotion
          if (wasHost && hostPromotion) {
            // Update in-memory session role of the promoted peer
            for (const [, sess] of activeSessions.entries()) {
              if (sess.userId === hostPromotion.newHostId && sess.roomId === roomId) {
                sess.role = ROLES.HOST;
                io.to(sess.socketId).emit('your_role_updated', { role: ROLES.HOST });
              }
            }

            // Broadcast host_transferred to all room members
            io.to(roomId).emit('host_transferred', {
              previousHostId: hostPromotion.previousHostId,
              newHostId: hostPromotion.newHostId,
              promotedUser: {
                userId: hostPromotion.promotedUser.userId,
                username: hostPromotion.promotedUser.username,
                role: ROLES.HOST,
              },
              participants: roomState.participants,
            });

            logger.info(`[Host Failover Broadcast] Room ${roomId}: Host transferred automatically to ${hostPromotion.promotedUser.username}`);
          }

          // 3. Broadcast updated room state
          io.to(roomId).emit('room_updated', roomState);
        }
      } catch (err) {
        logger.error(`Error during socket disconnect cleanup: ${err.message}`);
      } finally {
        activeSessions.delete(socket.id);
      }
    });
  });

  return io;
};

export default initializeSockets;
