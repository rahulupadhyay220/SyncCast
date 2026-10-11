import assert from 'assert';
import Room from '../src/models/Room.js';
import RoomParticipant from '../src/models/RoomParticipant.js';
import RoomService from '../src/services/RoomService.js';
import { connectDatabase, disconnectDatabase } from '../src/database/connection.js';

async function runHostExitLifecycleTest() {
  console.log('--- STARTING HOST EXIT & SESSION TERMINATION TEST SUITE ---');

  await connectDatabase();
  console.log('✓ Connected to MongoDB Atlas');

  const hostId = `host-user-${Date.now()}`;
  const guest1Id = `guest-user-1-${Date.now()}`;
  const guest2Id = `guest-user-2-${Date.now()}`;
  let testRoomCode;

  try {
    // 1. Host creates room
    const created = await RoomService.createRoom({
      roomName: 'Host Exit Test Cinema',
      hostId,
      username: 'TestHost',
      initialVideoId: 'zSWdZVtXT7E',
      initialVideoTitle: 'The Odyssey',
    });
    testRoomCode = created.roomId;
    console.log(`✓ Room ${testRoomCode} created by Host (${hostId})`);

    // 2. Guest 1 and Guest 2 join
    const guest1 = await RoomService.joinRoom({
      roomId: testRoomCode,
      userId: guest1Id,
      username: 'GuestBob',
      role: 'guest',
    });
    const guest2 = await RoomService.joinRoom({
      roomId: testRoomCode,
      userId: guest2Id,
      username: 'GuestCharlie',
      role: 'guest',
    });
    console.log(`✓ Guest 1 and Guest 2 joined as role: ${guest1.role}, ${guest2.role}`);

    // Verify room is currently active
    const activeRoom = await Room.findOne({ roomId: testRoomCode });
    assert.strictEqual(activeRoom.isActive, true, 'Room should be active upon creation');
    assert.ok(activeRoom.streamStatus !== 'ended', 'Room status should not be ended');
    console.log('✓ Room verified active upon creation');

    // 3. Verify non-host cannot terminate room
    try {
      await RoomService.endStream({ roomId: testRoomCode, requesterId: guest1Id });
      assert.fail('Non-host should NOT be allowed to end room stream');
    } catch (err) {
      if (err.statusCode === 403) {
        console.log('✓ Security verified: Guest cannot end room stream (403 Forbidden)');
      } else {
        throw err;
      }
    }

    // 4. Host ends room / leaves
    const ended = await RoomService.endStream({ roomId: testRoomCode, requesterId: hostId });
    console.log(`✓ Host ended room stream. Status: ${ended.streamStatus}`);

    // Verify room in database is now marked inactive & ended
    const terminatedRoom = await Room.findOne({ roomId: testRoomCode });
    assert.strictEqual(terminatedRoom.isActive, false, 'Room should be marked isActive=false');
    assert.strictEqual(terminatedRoom.streamStatus, 'ended', 'Room status should be "ended"');
    console.log('✓ Database verified: Room is isActive=false and streamStatus="ended"');

    // 5. Verify room lookup reflects ended status
    const retrieved = await RoomService.getRoomById(testRoomCode);
    assert.strictEqual(retrieved.streamStatus, 'ended');
    assert.strictEqual(retrieved.isActive, false);
    console.log('✓ Room lookup reflects terminated session status');

    console.log('\nALL HOST EXIT & SESSION TERMINATION CHECKS PASSED! ✓✓✓\n');
  } finally {
    // Cleanup test artifacts
    if (testRoomCode) {
      await Room.deleteMany({ roomId: testRoomCode });
      await RoomParticipant.deleteMany({ roomId: testRoomCode });
    }
    await disconnectDatabase();
  }
}

runHostExitLifecycleTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
