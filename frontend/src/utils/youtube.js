/**
 * YouTube URL and Video ID Utility functions
 */

/**
 * Extracts an 11-character YouTube video ID from various YouTube URL formats or a raw ID.
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - Raw 11-character ID
 * 
 * @param {string} input - The YouTube URL or ID to parse
 * @returns {string|null} - The extracted 11-character ID, or null if invalid
 */
export function extractYouTubeVideoId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct 11-character video ID match
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex for all standard YouTube URL variations
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const match = trimmed.match(regex);
  return match ? match[1] : null;
}

/**
 * Checks if a given string is a valid YouTube video URL or ID.
 * 
 * @param {string} input 
 * @returns {boolean}
 */
export function isValidYouTubeUrl(input) {
  return Boolean(extractYouTubeVideoId(input));
}

/**
 * Formats an 11-character video ID into a canonical YouTube watch URL.
 * 
 * @param {string} videoId 
 * @returns {string}
 */
export function formatYouTubeUrl(videoId) {
  const id = extractYouTubeVideoId(videoId);
  return id ? `https://www.youtube.com/watch?v=${id}` : '';
}

/**
 * Returns the URL of the YouTube video thumbnail image.
 * 
 * @param {string} videoIdOrUrl 
 * @param {'default'|'mqdefault'|'hqdefault'|'sddefault'|'maxresdefault'} [quality='hqdefault']
 * @returns {string}
 */
export function getYouTubeThumbnail(videoIdOrUrl, quality = 'hqdefault') {
  const id = extractYouTubeVideoId(videoIdOrUrl);
  return id ? `https://img.youtube.com/vi/${id}/${quality}.jpg` : '';
}
