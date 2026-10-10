import { z } from 'zod';
import { ROLES } from '../config/permissions.js';

export const createRoomSchema = z.object({
  roomName: z.string().trim().min(1, 'Room name cannot be empty').max(100).optional(),
  hostId: z.string().trim().min(1, 'hostId is required'),
  username: z.string().trim().min(1, 'username is required'),
  initialVideoId: z.string().trim().optional(),
  initialVideoTitle: z.string().trim().optional(),
  isPublic: z.boolean().optional(),
});

export const joinRoomSchema = z.object({
  roomId: z.string().trim().min(1, 'roomId is required'),
  userId: z.string().trim().min(1, 'userId is required'),
  username: z.string().trim().min(1, 'username is required'),
  role: z.enum([ROLES.HOST, ROLES.MODERATOR, ROLES.PARTICIPANT, ROLES.VIEWER]).optional(),
});

export const getRoomSchema = z.object({
  roomId: z.string().trim().min(1, 'roomId is required'),
});
