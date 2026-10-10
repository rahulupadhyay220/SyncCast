/**
 * Generates human-readable, high-entropy room codes like SYNC-7729
 * 
 * @param {string} prefix 
 * @returns {string}
 */
export const generateRoomCode = (prefix = 'SYNC') => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${suffix}`;
};

/**
 * Normalizes input room ID to consistent uppercase format
 * @param {string} roomId 
 * @returns {string}
 */
export const normalizeRoomId = (roomId) => {
  if (!roomId || typeof roomId !== 'string') return '';
  return roomId.trim().toUpperCase();
};
