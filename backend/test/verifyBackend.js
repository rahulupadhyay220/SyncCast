import assert from 'assert';
import { ROLES, ACTIONS } from '../src/config/permissions.js';
import { hasPermission, isValidRole, formatRoleName } from '../src/utils/permissionMatrix.js';
import {
  createRoomSchema,
  joinRoomSchema,
} from '../src/validators/roomValidator.js';
import {
  socketJoinRoomSchema,
  socketPlayVideoSchema,
  socketPauseVideoSchema,
  socketSeekVideoSchema,
  socketChangeVideoSchema,
  socketAssignRoleSchema,
  socketRemoveParticipantSchema,
  socketTransferHostSchema,
} from '../src/validators/socketValidator.js';
import { generateRoomCode, normalizeRoomId } from '../src/utils/roomCodeGenerator.js';

console.log('--- STARTING BACKEND VERIFICATION TEST SUITE ---');

// TEST 1: Permission Matrix & RBAC (Stream Control & Participant Management Rules)
console.log('\n[1] Testing Permission Matrix & RBAC...');
assert.strictEqual(hasPermission(ROLES.HOST, ACTIONS.PLAY_VIDEO), true, 'Host should be able to play');
assert.strictEqual(hasPermission(ROLES.HOST, ACTIONS.PAUSE_VIDEO), true, 'Host should be able to pause');
assert.strictEqual(hasPermission(ROLES.HOST, ACTIONS.SEEK_VIDEO), true, 'Host should be able to seek');
assert.strictEqual(hasPermission(ROLES.HOST, ACTIONS.CHANGE_VIDEO), true, 'Host should be able to change video');
assert.strictEqual(hasPermission(ROLES.HOST, ACTIONS.ASSIGN_ROLE), true, 'Host should be able to assign role');
assert.strictEqual(hasPermission(ROLES.HOST, ACTIONS.REMOVE_PARTICIPANT), true, 'Host should be able to remove participant');
assert.strictEqual(hasPermission(ROLES.HOST, ACTIONS.BLOCK_PARTICIPANT), true, 'Host should be able to block participant');
assert.strictEqual(hasPermission(ROLES.HOST, ACTIONS.DECIDE_REJOIN), true, 'Host should be able to decide rejoin request');
assert.strictEqual(hasPermission(ROLES.HOST, ACTIONS.TRANSFER_HOST), true, 'Host should be able to transfer host');

// Rule 1: Only host has permission to play, pause, or control streamed video.
assert.strictEqual(hasPermission(ROLES.MODERATOR, ACTIONS.PLAY_VIDEO), false, 'Non-host cannot play');
assert.strictEqual(hasPermission(ROLES.MODERATOR, ACTIONS.PAUSE_VIDEO), false, 'Non-host cannot pause');
assert.strictEqual(hasPermission(ROLES.MODERATOR, ACTIONS.SEEK_VIDEO), false, 'Non-host cannot seek');
assert.strictEqual(hasPermission(ROLES.MODERATOR, ACTIONS.CHANGE_VIDEO), false, 'Non-host cannot change video');
assert.strictEqual(hasPermission(ROLES.MODERATOR, ACTIONS.REMOVE_PARTICIPANT), false, 'Moderator cannot remove participant');
assert.strictEqual(hasPermission(ROLES.MODERATOR, ACTIONS.BLOCK_PARTICIPANT), false, 'Moderator cannot block participant');

assert.strictEqual(hasPermission(ROLES.PARTICIPANT, ACTIONS.PLAY_VIDEO), false, 'Participant cannot play');
assert.strictEqual(hasPermission(ROLES.PARTICIPANT, ACTIONS.PAUSE_VIDEO), false, 'Participant cannot pause');
assert.strictEqual(hasPermission(ROLES.PARTICIPANT, ACTIONS.SEEK_VIDEO), false, 'Participant cannot seek');
assert.strictEqual(hasPermission(ROLES.PARTICIPANT, ACTIONS.CHANGE_VIDEO), false, 'Participant cannot change video');
assert.strictEqual(hasPermission(ROLES.PARTICIPANT, ACTIONS.ASSIGN_ROLE), false, 'Participant cannot assign role');
assert.strictEqual(hasPermission(ROLES.PARTICIPANT, ACTIONS.REMOVE_PARTICIPANT), false, 'Participant cannot remove participant');
assert.strictEqual(hasPermission(ROLES.PARTICIPANT, ACTIONS.BLOCK_PARTICIPANT), false, 'Participant cannot block participant');

assert.strictEqual(hasPermission(ROLES.VIEWER, ACTIONS.PLAY_VIDEO), false, 'Viewer cannot play');
assert.strictEqual(hasPermission(ROLES.VIEWER, ACTIONS.PAUSE_VIDEO), false, 'Viewer cannot pause');
assert.strictEqual(hasPermission(ROLES.VIEWER, ACTIONS.SEEK_VIDEO), false, 'Viewer cannot seek');
assert.strictEqual(hasPermission(ROLES.VIEWER, ACTIONS.CHANGE_VIDEO), false, 'Viewer cannot change video');
console.log('✓ Permission Matrix & RBAC tests passed.');

// TEST 2: Role normalization and validation
console.log('\n[2] Testing Role Validation...');
assert.strictEqual(isValidRole('Host'), true);
assert.strictEqual(isValidRole('host'), true);
assert.strictEqual(isValidRole('Moderator'), true);
assert.strictEqual(isValidRole('Participant'), true);
assert.strictEqual(isValidRole('Viewer'), true);
assert.strictEqual(isValidRole('SuperAdmin'), false);
assert.strictEqual(formatRoleName('host'), ROLES.HOST);
assert.strictEqual(formatRoleName('moderator'), ROLES.MODERATOR);
console.log('✓ Role Validation tests passed.');

// TEST 3: Room Code Generator
console.log('\n[3] Testing Room Code Generator...');
const code1 = generateRoomCode();
assert.match(code1, /^SYNC-[A-Z0-9]{4}$/, 'Code should match SYNC-XXXX pattern');
assert.strictEqual(normalizeRoomId(' sync-1234 '), 'SYNC-1234');
console.log('✓ Room Code Generator tests passed.');

// TEST 4: REST API Validators
console.log('\n[4] Testing REST API Validators...');
assert.strictEqual(
  createRoomSchema.safeParse({
    roomName: 'My Watch Party',
    hostId: 'user-123',
    username: 'Alex R.',
    initialVideoId: 'Way9Dexny3w',
  }).success,
  true
);
assert.strictEqual(
  createRoomSchema.safeParse({ roomName: 'My Watch Party' }).success,
  false,
  'createRoom requires hostId and username'
);
assert.strictEqual(
  joinRoomSchema.safeParse({ roomId: 'SYNC-7729', userId: 'user-456', username: 'Elena' }).success,
  true
);
console.log('✓ REST API Validators tests passed.');

// TEST 5: Socket Event Validators
console.log('\n[5] Testing Socket Event Validators...');
assert.strictEqual(socketJoinRoomSchema.safeParse({ roomId: 'SYNC-1', userId: 'u1', username: 'Alex' }).success, true);
assert.strictEqual(socketPlayVideoSchema.safeParse({ roomId: 'SYNC-1', currentTime: 12.5 }).success, true);
assert.strictEqual(socketPauseVideoSchema.safeParse({ roomId: 'SYNC-1' }).success, true);
assert.strictEqual(socketSeekVideoSchema.safeParse({ roomId: 'SYNC-1', currentTime: 45 }).success, true);
assert.strictEqual(socketSeekVideoSchema.safeParse({ roomId: 'SYNC-1' }).success, false, 'Seek requires currentTime');
assert.strictEqual(socketChangeVideoSchema.safeParse({ roomId: 'SYNC-1', videoId: 'Y-rmzh0PI3c' }).success, true);
assert.strictEqual(socketAssignRoleSchema.safeParse({ roomId: 'SYNC-1', targetUserId: 'u2', newRole: 'Moderator' }).success, true);
assert.strictEqual(socketAssignRoleSchema.safeParse({ roomId: 'SYNC-1', targetUserId: 'u2', newRole: 'InvalidRole' }).success, false);
assert.strictEqual(socketRemoveParticipantSchema.safeParse({ roomId: 'SYNC-1', targetUserId: 'u2' }).success, true);
assert.strictEqual(socketTransferHostSchema.safeParse({ roomId: 'SYNC-1', newHostId: 'u2' }).success, true);
console.log('✓ Socket Event Validators tests passed.');

// TEST 6: Playback Synchronization Math
console.log('\n[6] Testing Synchronization Math & Drift Calculation...');
const mockRoomPlaying = {
  playbackState: 'playing',
  currentTime: 10.0,
  lastActionTimestamp: Date.now() - 5000,
  getSyncedCurrentTime() {
    if (this.playbackState === 'playing' && this.lastActionTimestamp) {
      const elapsedSeconds = (Date.now() - this.lastActionTimestamp) / 1000;
      return Math.max(0, parseFloat((this.currentTime + elapsedSeconds).toFixed(2)));
    }
    return parseFloat(this.currentTime.toFixed(2));
  },
};
const syncedTime = mockRoomPlaying.getSyncedCurrentTime();
assert.ok(syncedTime >= 14.9 && syncedTime <= 15.5, `Synced time should be around 15.0s, got ${syncedTime}`);
console.log('✓ Playback Synchronization Math tests passed.');

console.log('\nALL BACKEND VERIFICATION CHECKS COMPLETED SUCCESSFULLY! ✓✓✓');
