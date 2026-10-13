import mongoose from 'mongoose';
import { ROLES } from '../config/permissions.js';

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    socketId: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.PARTICIPANT,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

const removedParticipantSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    removedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const blockedParticipantSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    blockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    roomCode: {
      type: String,
      required: true,
      index: true,
      trim: true,
      uppercase: true,
      default: function () {
        return this.roomId;
      },
    },
    roomName: {
      type: String,
      required: true,
      trim: true,
      default: 'SyncCast Watch Theater',
    },
    hostId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    currentHostId: {
      type: String,
      index: true,
      trim: true,
      default: function () {
        return this.hostId;
      },
    },
    streamStatus: {
      type: String,
      enum: ['live', 'paused', 'ended'],
      default: 'paused',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdDate: {
      type: Date,
      default: Date.now,
    },
    currentVideoId: {
      type: String,
      default: 'Y-rmzh0PI3c', // Default YouTube video ID (Blender Studio: Cosmos Laundromat, 100% embeddable)
      trim: true,
    },
    currentVideoTitle: {
      type: String,
      default: 'Blender Studio: Cosmos Laundromat',
      trim: true,
    },
    currentTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    playbackState: {
      type: String,
      enum: ['playing', 'paused'],
      default: 'paused',
    },
    lastActionTimestamp: {
      type: Number,
      default: () => Date.now(),
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    participants: [participantSchema],
    removedParticipants: [removedParticipantSchema],
    blockedParticipants: [blockedParticipantSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

roomSchema.pre('save', function (next) {
  if (!this.roomCode && this.roomId) {
    this.roomCode = this.roomId;
  }
  if (!this.currentHostId && this.hostId) {
    this.currentHostId = this.hostId;
  }
  if (!this.hostId && this.currentHostId) {
    this.hostId = this.currentHostId;
  }
  if (this.playbackState === 'playing' && this.streamStatus !== 'ended') {
    this.streamStatus = 'live';
  } else if (this.playbackState === 'paused' && this.streamStatus !== 'ended') {
    this.streamStatus = 'paused';
  }
  next();
});

/**
 * Calculates current frame-accurate timestamp accounting for time elapsed while playing.
 * 
 * SYNCHRONIZATION LOGIC:
 * When playbackState is 'playing', video is actively progressing.
 * Rather than updating MongoDB every single second via polling/interval,
 * the backend calculates the exact current timestamp dynamically:
 *   syncedTime = savedCurrentTime + (now - lastActionTimestamp) / 1000
 * When pause or seek occurs, currentTime is anchored to the exact seek point
 * and lastActionTimestamp is reset to Date.now().
 */
roomSchema.methods.getSyncedCurrentTime = function () {
  if (this.playbackState === 'playing' && this.lastActionTimestamp) {
    const elapsedSeconds = (Date.now() - this.lastActionTimestamp) / 1000;
    return Math.max(0, parseFloat((this.currentTime + elapsedSeconds).toFixed(2)));
  }
  return parseFloat(this.currentTime.toFixed(2));
};

/**
 * Formats room state for client consumption
 */
roomSchema.methods.toRoomState = function () {
  return {
    roomId: this.roomId,
    roomCode: this.roomCode || this.roomId,
    roomName: this.roomName,
    hostId: this.hostId,
    currentHostId: this.currentHostId || this.hostId,
    streamStatus: this.streamStatus || (this.playbackState === 'playing' ? 'live' : 'paused'),
    createdDate: this.createdDate || this.createdAt,
    currentVideoId: this.currentVideoId,
    currentVideoTitle: this.currentVideoTitle,
    currentTime: this.getSyncedCurrentTime(),
    playbackState: this.playbackState,
    isPublic: this.isPublic,
    participants: this.participants
      .filter((p) => p.isActive)
      .map((p) => ({
        userId: p.userId,
        username: p.username,
        socketId: p.socketId,
        role: p.role,
        joinedAt: p.joinedAt,
      })),
    removedParticipants: (this.removedParticipants || []).map((r) => ({
      userId: r.userId,
      username: r.username,
      removedAt: r.removedAt,
    })),
    blockedParticipants: (this.blockedParticipants || []).map((b) => ({
      userId: b.userId,
      username: b.username,
      blockedAt: b.blockedAt,
    })),
  };
};

export const Room = mongoose.model('Room', roomSchema);
export default Room;
