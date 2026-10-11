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

// Stream control & RBAC endpoints (Host only validation enforced)
router.post('/:roomId/play', RoomController.playStream);
router.post('/:roomId/pause', RoomController.pauseStream);
router.post('/:roomId/end', RoomController.endStream);
router.post('/:roomId/seek', RoomController.seekStream);
router.post('/:roomId/change-video', RoomController.changeVideo);
router.post('/:roomId/assign-role', RoomController.assignRole);
router.post('/:roomId/transfer-host', RoomController.transferHost);
router.post('/:roomId/remove-participant', RoomController.removeParticipant);

export default router;
