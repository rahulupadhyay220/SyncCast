/**
 * Centralized Role Definitions and Permission Matrix for SyncCast
 * 
 * Enforces role-based access control across all HTTP endpoints and Socket.io events.
 */

export const ROLES = Object.freeze({
  HOST: 'Host',
  MODERATOR: 'Moderator',
  PARTICIPANT: 'Participant',
  VIEWER: 'Viewer',
});

export const ACTIONS = Object.freeze({
  PLAY_VIDEO: 'play_video',
  PAUSE_VIDEO: 'pause_video',
  SEEK_VIDEO: 'seek_video',
  CHANGE_VIDEO: 'change_video',
  ASSIGN_ROLE: 'assign_role',
  REMOVE_PARTICIPANT: 'remove_participant',
  BLOCK_PARTICIPANT: 'block_participant',
  DECIDE_REJOIN: 'decide_rejoin',
  TRANSFER_HOST: 'transfer_host',
});

/**
 * Centralized Permission Matrix
 * Keyed by lowercase role identifiers to allow robust and case-insensitive matching
 */
export const permissions = {
  host: [
    ACTIONS.PLAY_VIDEO,
    ACTIONS.PAUSE_VIDEO,
    ACTIONS.SEEK_VIDEO,
    ACTIONS.CHANGE_VIDEO,
    ACTIONS.ASSIGN_ROLE,
    ACTIONS.REMOVE_PARTICIPANT,
    ACTIONS.BLOCK_PARTICIPANT,
    ACTIONS.DECIDE_REJOIN,
    ACTIONS.TRANSFER_HOST,
  ],
  moderator: [],
  participant: [],
  viewer: [],
};

export default {
  ROLES,
  ACTIONS,
  permissions,
};
