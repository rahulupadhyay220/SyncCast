import mongoose from 'mongoose';
import { ROLES } from '../config/permissions.js';

const roomParticipantSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    roomId: {
      type: String,
      required: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    username: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.GUEST,
      required: true,
      index: true,
    },
    joinTime: {
      type: Date,
      default: Date.now,
    },
    leaveTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'left', 'removed', 'blocked'],
      default: 'active',
      index: true,
    },
    socketId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index to guarantee fast lookups for specific user within a room
roomParticipantSchema.index({ roomId: 1, userId: 1 });

/**
 * Returns sanitized participant object for client responses
 */
roomParticipantSchema.methods.toClient = function () {
  return {
    userId: this.userId,
    roomId: this.roomId,
    username: this.username,
    role: this.role,
    joinTime: this.joinTime,
    leaveTime: this.leaveTime,
    status: this.status,
    socketId: this.socketId,
  };
};

export const RoomParticipant = mongoose.model('RoomParticipant', roomParticipantSchema);
export default RoomParticipant;
