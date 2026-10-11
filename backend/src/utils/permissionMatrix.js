import { permissions, ROLES } from '../config/permissions.js';

/**
 * Normalizes role string to canonical lowercase format.
 * @param {string} role 
 * @returns {string}
 */
export const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') return '';
  return role.trim().toLowerCase();
};

/**
 * Checks whether a given role has permission to execute an action.
 * 
 * @param {string} role - The role of the user ('Host', 'Moderator', 'Participant', 'Viewer')
 * @param {string} action - The action identifier (e.g. 'play_video', 'assign_role')
 * @returns {boolean}
 */
export const hasPermission = (role, action) => {
  const normalizedRole = normalizeRole(role);
  const normalizedAction = (action || '').trim().toLowerCase();

  const rolePermissions = permissions[normalizedRole];
  if (!Array.isArray(rolePermissions)) {
    return false;
  }

  return rolePermissions.includes(normalizedAction);
};

/**
 * Verifies if a role name is valid.
 * @param {string} role 
 * @returns {boolean}
 */
export const isValidRole = (role) => {
  if (!role) return false;
  const canonicalRoles = Object.values(ROLES).map((r) => r.toLowerCase());
  return canonicalRoles.includes(normalizeRole(role));
};

/**
 * Returns formatted role display name (e.g. 'Host', 'Moderator')
 * @param {string} role 
 * @returns {string}
 */
export const formatRoleName = (role) => {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case 'host':
      return ROLES.HOST;
    case 'guest':
      return ROLES.GUEST;
    case 'moderator':
      return ROLES.MODERATOR;
    case 'viewer':
      return ROLES.VIEWER;
    case 'participant':
    default:
      return ROLES.PARTICIPANT;
  }
};
