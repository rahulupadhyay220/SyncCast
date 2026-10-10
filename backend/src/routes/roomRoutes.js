import { Router } from 'express';
import RoomController from '../controllers/RoomController.js';
import validate from '../middleware/validate.js';
import {
  createRoomSchema,
  joinRoomSchema,
  getRoomSchema,
} from '../validators/roomValidator.js';

const router = Router();

// POST /api/rooms/create - Create room, creator becomes Host
router.post('/create', validate(createRoomSchema, 'body'), RoomController.createRoom);

// POST /api/rooms/join - Join room, user becomes Participant by default
router.post('/join', validate(joinRoomSchema, 'body'), RoomController.joinRoom);

// GET /api/rooms - List active public rooms
router.get('/', RoomController.getPublicRooms);

// GET /api/rooms/:roomId - Retrieve room state
router.get('/:roomId', validate(getRoomSchema, 'params'), RoomController.getRoom);

export default router;
