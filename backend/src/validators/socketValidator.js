import { z } from 'zod';
import { ROLES } from '../config/permissions.js';

export const socketJoinRoomSchema = z.object({
  roomId: z.string().trim().min(1, 'roomId is required'),
  userId: z.string().trim().min(1, 'userId is required'),
  username: z.string().trim().min(1, 'username is required').max(50),
  role: z.string().optional(),
  isHost: z.boolean().optional(),
  initialVideoId: z.string().optional(),
  initialVideoTitle: z.string().optional(),
  currentTime: z.number().optional(),
  playbackState: z.string().optional(),
});

export const socketPlayVideoSchema = z.object({
  roomId: z.string().trim().min(1, 'roomId is required'),
  currentTime: z.number().min(0, 'currentTime must be non-negative').optional(),
});

export const socketPauseVideoSchema = z.object({
  roomId: z.string().trim().min(1, 'roomId is required'),
  currentTime: z.number().min(0, 'currentTime must be non-negative').optional(),
});

export const socketSeekVideoSchema = z.object({
  roomId: z.string().trim().min(1, 'roomId is required'),
  currentTime: z.number().min(0, 'currentTime must be non-negative'),
});

export const socketChangeVideoSchema = z.object({
  roomId: z.string().trim().min(1, 'roomId is required'),
  videoId: z.string().trim().min(1, 'videoId is required').max(50),
  videoTitle: z.string().trim().max(200).optional(),
});

export const socketAssignRoleSchema = z.object({
  roomId: z.string().trim().min(1, 'roomId is required'),
  targetUserId: z.string().trim().min(1, 'targetUserId is required'),
  newRole: z.enum([ROLES.HOST, ROLES.GUEST, ROLES.MODERATOR, ROLES.PARTICIPANT, ROLES.VIEWER], {
    errorMap: () => ({ message: 'Invalid role specified' }),
  }),
});

export const socketRemoveParticipantSchema = z.object({
  roomId: z.string().trim().min(1, 'roomId is required'),
  targetUserId: z.string().trim().min(1, 'targetUserId is required'),
});

export const socketTransferHostSchema = z.object({
  roomId: z.string().trim().min(1, 'roomId is required'),
  newHostId: z.string().trim().min(1, 'newHostId is required'),
});

export const socketBlockParticipantSchema = z.object({
  roomId: z.string().trim().min(1, 'roomId is required'),
  targetUserId: z.string().trim().min(1, 'targetUserId is required'),
});

export const socketRespondRejoinSchema = z.object({
  roomId: z.string().trim().min(1, 'roomId is required'),
  targetUserId: z.string().trim().min(1, 'targetUserId is required'),
  targetSocketId: z.string().trim().optional(),
  approved: z.boolean(),
});

export const socketChatSchema = z.object({
  roomId: z.string().trim().optional(),
  text: z.string().trim().min(1).max(1000).optional(),
  message: z.string().trim().min(1).max(1000).optional(),
  id: z.string().optional(),
});

export const socketReactionSchema = z.object({
  emoji: z.string().trim().min(1).max(30),
});

export default {
  socketJoinRoomSchema,
  socketPlayVideoSchema,
  socketPauseVideoSchema,
  socketSeekVideoSchema,
  socketChangeVideoSchema,
  socketAssignRoleSchema,
  socketRemoveParticipantSchema,
  socketTransferHostSchema,
  socketBlockParticipantSchema,
  socketRespondRejoinSchema,
  socketChatSchema,
  socketReactionSchema,
};
