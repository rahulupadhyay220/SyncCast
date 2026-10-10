/**
 * Moderation storage and permission utility for SyncCast
 * Tracks removed and blocked participants per room in local / session storage
 * ensuring persistent enforcement across tabs and sessions.
 */

const BLOCKED_PREFIX = 'synccast_blocked_';
const REMOVED_PREFIX = 'synccast_removed_';

export function getBlockedParticipants(roomCode) {
  if (!roomCode) return [];
  try {
    const raw = localStorage.getItem(`${BLOCKED_PREFIX}${roomCode.toUpperCase()}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isParticipantBlocked(roomCode, userId, username) {
  if (!roomCode) return false;
  const blocked = getBlockedParticipants(roomCode);
  return blocked.some((b) => {
    if (userId && b.userId && b.userId === userId) return true;
    if (username && b.username && b.username.toLowerCase() === username.toLowerCase()) return true;
    return false;
  });
}

export function addBlockedParticipant(roomCode, { userId, username }) {
  if (!roomCode) return;
  const blocked = getBlockedParticipants(roomCode);
  const exists = blocked.some(
    (b) => (userId && b.userId === userId) || (username && b.username.toLowerCase() === username.toLowerCase())
  );
  if (!exists) {
    blocked.push({
      userId,
      username,
      blockedAt: new Date().toISOString(),
    });
    localStorage.setItem(`${BLOCKED_PREFIX}${roomCode.toUpperCase()}`, JSON.stringify(blocked));
  }
  // Blocking permanently overrides removed status
  removeRemovedParticipant(roomCode, userId, username);
}

export function getRemovedParticipants(roomCode) {
  if (!roomCode) return [];
  try {
    const raw = localStorage.getItem(`${REMOVED_PREFIX}${roomCode.toUpperCase()}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isParticipantRemoved(roomCode, userId, username) {
  if (!roomCode) return false;
  // If permanently blocked, blocked status overrides
  if (isParticipantBlocked(roomCode, userId, username)) return false;

  const removed = getRemovedParticipants(roomCode);
  return removed.some((r) => {
    if (userId && r.userId && r.userId === userId) return true;
    if (username && r.username && r.username.toLowerCase() === username.toLowerCase()) return true;
    return false;
  });
}

export function addRemovedParticipant(roomCode, { userId, username }) {
  if (!roomCode) return;
  // If already blocked, blocked status overrides
  if (isParticipantBlocked(roomCode, userId, username)) return;

  const removed = getRemovedParticipants(roomCode);
  const exists = removed.some(
    (r) => (userId && r.userId === userId) || (username && r.username.toLowerCase() === username.toLowerCase())
  );
  if (!exists) {
    removed.push({
      userId,
      username,
      removedAt: new Date().toISOString(),
    });
    localStorage.setItem(`${REMOVED_PREFIX}${roomCode.toUpperCase()}`, JSON.stringify(removed));
  }
}

export function removeRemovedParticipant(roomCode, userId, username) {
  if (!roomCode) return;
  let removed = getRemovedParticipants(roomCode);
  removed = removed.filter((r) => {
    if (userId && r.userId === userId) return false;
    if (username && r.username && r.username.toLowerCase() === username.toLowerCase()) return false;
    return true;
  });
  localStorage.setItem(`${REMOVED_PREFIX}${roomCode.toUpperCase()}`, JSON.stringify(removed));
}
