import assert from 'assert';
import http from 'http';
import app from '../src/app.js';
import RoomService from '../src/services/RoomService.js';
import UserService from '../src/services/UserService.js';
import Room from '../src/models/Room.js';
import RoomParticipant from '../src/models/RoomParticipant.js';
import User from '../src/models/User.js';
import { ROLES, ACTIONS } from '../src/config/permissions.js';
import { hasPermission } from '../src/utils/permissionMatrix.js';

import { connectDatabase, disconnectDatabase } from '../src/database/connection.js';

console.log('--- STARTING RBAC & ACCESS CONTROL INTEGRATION TEST SUITE ---');

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await connectDatabase();
    // 1. User Authentication & Host Default
    console.log('\n[1] Testing User Authentication & Default Host Capability...');
    const hostUser = await UserService.syncAuthenticatedUser({
      userId: 'usr_host_1',
      username: 'HostAlice',
      fullName: 'Alice Walker',
      email: 'alice@synccast.party',
    });
    assert.strictEqual(hostUser.userId, 'usr_host_1');
    assert.strictEqual(hostUser.canHost, true, 'Authenticated users must have Host capability for their rooms');

    const guestUser = await UserService.syncAuthenticatedUser({
      userId: 'usr_guest_2',
      username: 'GuestBob',
      fullName: 'Bob Smith',
      email: 'bob@synccast.party',
    });
    assert.strictEqual(guestUser.canHost, true, 'GuestBob can also host his own streams when he creates one');
    console.log('✓ User Authentication & Host defaults verified in MongoDB User collection.');

    // 2. Host Creates Streaming Room
    console.log('\n[2] Testing Host Room Creation...');
    const createRes = await fetch(`${baseUrl}/api/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: 'Alice Cinema',
        hostId: 'usr_host_1',
        username: 'HostAlice',
        initialVideoId: 'Way9Dexny3w',
      }),
    });
    assert.strictEqual(createRes.status, 201);
    const createData = await createRes.json();
    const roomId = createData.data.roomId;
    assert.strictEqual(createData.data.hostId, 'usr_host_1');
    assert.strictEqual(createData.data.currentHostId, 'usr_host_1');
    assert.strictEqual(createData.data.roomCode, roomId);
    assert.ok(createData.data.createdDate);

    // Verify in MongoDB Room and RoomParticipant
    const roomInDb = await Room.findOne({ roomId });
    assert.strictEqual(roomInDb.hostId, 'usr_host_1');
    assert.strictEqual(roomInDb.currentHostId, 'usr_host_1');

    const hostParticipantInDb = await RoomParticipant.findOne({ roomId, userId: 'usr_host_1' });
    assert.ok(hostParticipantInDb, 'Host record must exist in RoomParticipant collection');
    assert.strictEqual(hostParticipantInDb.role, ROLES.HOST);
    assert.strictEqual(hostParticipantInDb.status, 'active');
    console.log('✓ Host Room Creation & RoomParticipant persistence verified.');

    // 3. Guest Joining Logic (MUST join as Guest/Participant even if client asks for Moderator or Host)
    console.log('\n[3] Testing Guest Joining Logic & Role Restriction...');
    const joinRes = await fetch(`${baseUrl}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId,
        userId: 'usr_guest_2',
        username: 'GuestBob',
        role: 'Host', // Attempt to claim Host role maliciously
      }),
    });
    assert.strictEqual(joinRes.status, 200);
    const joinData = await joinRes.json();
    assert.strictEqual(joinData.data.userRole, ROLES.GUEST, 'Joiner must NEVER be granted Host upon joining');

    const guestParticipantInDb = await RoomParticipant.findOne({ roomId, userId: 'usr_guest_2' });
    assert.ok(guestParticipantInDb, 'Guest record must exist in RoomParticipant collection');
    assert.strictEqual(guestParticipantInDb.role, ROLES.GUEST, 'Participant role in DB must be Guest');
    assert.strictEqual(guestParticipantInDb.status, 'active');
    console.log('✓ Guest Joining Logic verified: Joiner is strictly Guest in DB.');

    // 4. Real-time Security Validation: Guest Attempts Host Actions
    console.log('\n[4] Testing Backend Security Rejection for Guest Action Attempts...');
    
    // Guest tries to pause stream
    const guestPauseRes = await fetch(`${baseUrl}/api/rooms/${roomId}/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId: 'usr_guest_2' }),
    });
    assert.strictEqual(guestPauseRes.status, 403, 'Guest attempt to pause stream must be rejected with 403');
    const guestPauseData = await guestPauseRes.json();
    assert.strictEqual(guestPauseData.success, false);
    assert.ok(guestPauseData.error.includes('Only the room Host can control stream playback'));

    // Guest tries to end stream
    const guestEndRes = await fetch(`${baseUrl}/api/rooms/${roomId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId: 'usr_guest_2' }),
    });
    assert.strictEqual(guestEndRes.status, 403, 'Guest attempt to end stream must be rejected with 403');

    // Guest tries to assign roles
    const guestAssignRes = await fetch(`${baseUrl}/api/rooms/${roomId}/assign-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUserId: 'usr_guest_2',
        newRole: ROLES.HOST,
        requesterId: 'usr_guest_2',
      }),
    });
    assert.strictEqual(guestAssignRes.status, 403, 'Guest attempt to assign roles must be rejected with 403');
    console.log('✓ Backend RBAC security verified: Guest actions strictly rejected with 403 Forbidden.');

    // 5. Host Stream Playback Control
    console.log('\n[5] Testing Authorized Host Playback Controls...');
    const hostPlayRes = await fetch(`${baseUrl}/api/rooms/${roomId}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId: 'usr_host_1', currentTime: 42 }),
    });
    assert.strictEqual(hostPlayRes.status, 200);
    const hostPlayData = await hostPlayRes.json();
    assert.strictEqual(hostPlayData.data.playbackState, 'playing');
    assert.strictEqual(hostPlayData.data.streamStatus, 'live');
    console.log('✓ Host Playback Controls authorized and operational.');

    // 6. Host Transfer Logic
    console.log('\n[6] Testing Host Role & Ownership Transfer...');
    const transferRes = await fetch(`${baseUrl}/api/rooms/${roomId}/transfer-host`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newHostId: 'usr_guest_2',
        requesterId: 'usr_host_1',
      }),
    });
    assert.strictEqual(transferRes.status, 200);
    const transferData = await transferRes.json();
    assert.strictEqual(transferData.data.newHostId, 'usr_guest_2');
    assert.strictEqual(transferData.data.previousHostId, 'usr_host_1');

    // Verify DB states after transfer
    const roomAfterTransfer = await Room.findOne({ roomId });
    assert.strictEqual(roomAfterTransfer.hostId, 'usr_guest_2');
    assert.strictEqual(roomAfterTransfer.currentHostId, 'usr_guest_2');

    const bobInDb = await RoomParticipant.findOne({ roomId, userId: 'usr_guest_2' });
    assert.strictEqual(bobInDb.role, ROLES.HOST, 'Bob must be Host in RoomParticipant collection');

    const aliceInDb = await RoomParticipant.findOne({ roomId, userId: 'usr_host_1' });
    assert.strictEqual(aliceInDb.role, ROLES.GUEST, 'Alice must now be Guest in RoomParticipant collection');

    // Bob can now control the stream as new Host
    const bobPauseRes = await fetch(`${baseUrl}/api/rooms/${roomId}/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId: 'usr_guest_2' }),
    });
    assert.strictEqual(bobPauseRes.status, 200, 'New Host Bob can control stream');

    // Alice is now Guest and can NO LONGER control stream
    const aliceBlockedRes = await fetch(`${baseUrl}/api/rooms/${roomId}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId: 'usr_host_1' }),
    });
    assert.strictEqual(aliceBlockedRes.status, 403, 'Demoted host can no longer control stream');
    console.log('✓ Host Transfer & Permission handoff verified in DB and API.');

    // 7. Participant Removal Logic
    console.log('\n[7] Testing Participant Removal Logic...');
    const removeRes = await fetch(`${baseUrl}/api/rooms/${roomId}/remove-participant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUserId: 'usr_host_1',
        requesterId: 'usr_guest_2',
      }),
    });
    assert.strictEqual(removeRes.status, 200);

    const aliceAfterRemoval = await RoomParticipant.findOne({ roomId, userId: 'usr_host_1' });
    assert.strictEqual(aliceAfterRemoval.status, 'removed', 'Participant status in DB must be removed');
    assert.ok(aliceAfterRemoval.leaveTime, 'Leave time must be recorded upon removal');
    console.log('✓ Participant Removal Logic verified in DB.');

    // 8. End Stream Logic
    console.log('\n[8] Testing End Stream Termination...');
    const endRes = await fetch(`${baseUrl}/api/rooms/${roomId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId: 'usr_guest_2' }),
    });
    assert.strictEqual(endRes.status, 200);
    const endData = await endRes.json();
    assert.strictEqual(endData.data.streamStatus, 'ended');
    console.log('✓ End Stream Termination verified.');

    console.log('\nALL RBAC INTEGRATION TESTS PASSED SUCCESSFULLY! ✓✓✓');
    process.exit(0);
  } catch (err) {
    console.error('RBAC Integration test failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});
