/**
 * Centralized Role Definitions and Permission Matrix for SyncCast
 * 
 * Enforces role-based access control across all HTTP endpoints and Socket.io events.
 */

export const ROLES = Object.freeze({
  HOST: 'Host',
  GUEST: 'Guest',
  PARTICIPANT: 'Participant',
  MODERATOR: 'Moderator',
  VIEWER: 'Viewer',
});

export const ACTIONS = Object.freeze({
  START_STREAM: 'start_stream',
  PAUSE_STREAM: 'pause_stream',
  RESUME_STREAM: 'resume_stream',
  END_STREAM: 'end_stream',
  PLAY_VIDEO: 'play_video',
  PAUSE_VIDEO: 'pause_video',
  SEEK_VIDEO: 'seek_video',
  CHANGE_VIDEO: 'change_video',
  REMOVE_PARTICIPANT: 'remove_participant',
  BLOCK_PARTICIPANT: 'block_participant',
  MUTE_PARTICIPANT: 'mute_participant',
  MANAGE_CHAT: 'manage_chat',
  DECIDE_REJOIN: 'decide_rejoin',
  ASSIGN_ROLE: 'assign_role',
  TRANSFER_HOST: 'transfer_host',
  TERMINATE_SESSION: 'terminate_session',
});

/**
 * Centralized Permission Matrix
 * Keyed by lowercase role identifiers to allow robust and case-insensitive matching
 */
export const permissions = {
  host: [
    ACTIONS.START_STREAM,
    ACTIONS.PAUSE_STREAM,
    ACTIONS.RESUME_STREAM,
    ACTIONS.END_STREAM,
    ACTIONS.PLAY_VIDEO,
    ACTIONS.PAUSE_VIDEO,
    ACTIONS.SEEK_VIDEO,
    ACTIONS.CHANGE_VIDEO,
    ACTIONS.REMOVE_PARTICIPANT,
    ACTIONS.BLOCK_PARTICIPANT,
    ACTIONS.MUTE_PARTICIPANT,
    ACTIONS.MANAGE_CHAT,
    ACTIONS.DECIDE_REJOIN,
    ACTIONS.ASSIGN_ROLE,
    ACTIONS.TRANSFER_HOST,
    ACTIONS.TERMINATE_SESSION,
  ],
  guest: [],
  participant: [],
  moderator: [],
  viewer: [],
};

export default {
  ROLES,
  ACTIONS,
  permissions,
};
