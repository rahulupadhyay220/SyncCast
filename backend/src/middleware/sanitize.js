/**
 * Input sanitization middleware for SyncCast
 * 
 * Protects against:
 * - NoSQL Operator Injection ($ne, $gt, $where, etc.)
 * - Cross-Site Scripting (XSS via raw HTML tags / script tags)
 * - Object key injection attacks
 */

/**
 * Strips HTML tags and escapes dangerous script characters
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>]/g, '') // Strip stray brackets
    .trim();
};

/**
 * Escapes characters for HTML output safely
 */
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Recursively sanitizes objects to neutralize NoSQL injection and XSS
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    // Strip keys starting with $ or containing . (MongoDB operator/path injection vectors)
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    // Don't strip characters from passwords - passwords should only be guarded against NoSQL operator objects
    if (key.toLowerCase().includes('password') && typeof value === 'string') {
      clean[key] = value;
    } else {
      clean[key] = sanitizeObject(value);
    }
  }
  return clean;
};

/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 */
export const sanitizeInput = (req, _res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

export default sanitizeInput;
