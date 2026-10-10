/**
 * User identification and display name utilities for Supabase Auth
 */

/**
 * Extracts a friendly display name from a Supabase user or profile object.
 * Returns the signed-in user's full_name, display_name, or email prefix.
 * If user is not signed in, returns an empty string.
 *
 * @param {object|null|undefined} user - The Supabase user or profile object
 * @returns {string}
 */
export function getUserDisplayName(user) {
  if (!user) return '';

  // Check direct profile fields
  if (typeof user.displayName === 'string' && user.displayName.trim()) {
    return user.displayName.trim();
  }
  if (typeof user.fullName === 'string' && user.fullName.trim()) {
    return user.fullName.trim();
  }

  // Check Supabase user_metadata
  const meta = user.user_metadata;
  if (meta) {
    if (typeof meta.full_name === 'string' && meta.full_name.trim()) {
      return meta.full_name.trim();
    }
    if (typeof meta.display_name === 'string' && meta.display_name.trim()) {
      return meta.display_name.trim();
    }
    if (typeof meta.name === 'string' && meta.name.trim()) {
      return meta.name.trim();
    }
  }

  // Fallback to email prefix with capitalization
  if (typeof user.email === 'string' && user.email.includes('@')) {
    const prefix = user.email.split('@')[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }

  return '';
}

// Alias for Supabase user display name
export const getSupabaseUserDisplayName = getUserDisplayName;

export default getUserDisplayName;
