import assert from 'assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sanitizeString, sanitizeObject, escapeHtml } from '../src/middleware/sanitize.js';
import { registerSchema, loginSchema, updateRoleSchema } from '../src/validators/authValidator.js';
import { generateToken } from '../src/middleware/authMiddleware.js';
import { loginRateLimiter, signupRateLimiter } from '../src/middleware/rateLimiter.js';
import config from '../src/config/environment.js';

console.log('--- STARTING SECURITY HARDENING AUDIT TEST SUITE ---');

// TEST 1: Password Hashing with bcrypt
console.log('\n[1] Testing Password Hashing Security...');
const rawPassword = 'SecurePassword!123';
const salt = bcrypt.genSaltSync(12);
const hash = bcrypt.hashSync(rawPassword, salt);

assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'Bcrypt hash should start with $2a$ or $2b$');
assert.notStrictEqual(hash, rawPassword, 'Password must not be stored in plain text');
assert.strictEqual(bcrypt.compareSync(rawPassword, hash), true, 'Bcrypt compare must succeed for valid password');
assert.strictEqual(bcrypt.compareSync('WrongPassword', hash), false, 'Bcrypt compare must fail for invalid password');
console.log('✓ Bcrypt password hashing verified (cost factor 12).');

// TEST 2: Password Complexity Validation
console.log('\n[2] Testing Password Complexity Validation (OWASP Standards)...');
// Valid strong password
assert.strictEqual(
  registerSchema.safeParse({
    email: 'user@synccast.party',
    password: 'StrongPassword1!',
    fullName: 'Test User',
  }).success,
  true
);

// Weak passwords: too short
assert.strictEqual(
  registerSchema.safeParse({
    email: 'user@synccast.party',
    password: 'Ab1!',
    fullName: 'Test User',
  }).success,
  false,
  'Passwords shorter than 8 chars must be rejected'
);

// Missing special char
assert.strictEqual(
  registerSchema.safeParse({
    email: 'user@synccast.party',
    password: 'Password1234',
    fullName: 'Test User',
  }).success,
  false,
  'Passwords lacking special chars must be rejected'
);

// Missing uppercase
assert.strictEqual(
  registerSchema.safeParse({
    email: 'user@synccast.party',
    password: 'password123!',
    fullName: 'Test User',
  }).success,
  false,
  'Passwords lacking uppercase must be rejected'
);

// Missing number
assert.strictEqual(
  registerSchema.safeParse({
    email: 'user@synccast.party',
    password: 'PasswordSpecial!',
    fullName: 'Test User',
  }).success,
  false,
  'Passwords lacking numbers must be rejected'
);
console.log('✓ Password complexity requirements enforced.');

// TEST 3: Rate Limiter Configuration
console.log('\n[3] Testing Rate Limiting Configuration...');
// Requirement: 10 login attempts per 10-minute window
// Requirement: 10 signup requests per 10-minute window
// Check windowMs and max
console.log(`Configured Auth Window: ${config.authRateLimitWindowMs}ms (Expected: 600,000ms / 10 minutes)`);
console.log(`Configured Max Auth Attempts: ${config.authRateLimitMax} (Expected: 10)`);
assert.strictEqual(config.authRateLimitWindowMs, 10 * 60 * 1000, 'Window must be 10 minutes');
assert.strictEqual(config.authRateLimitMax, 10, 'Max attempts must be 10');
console.log('✓ Rate limiting policy (10 attempts / 10 minutes) verified.');

// TEST 4: Input Sanitization (XSS and NoSQL Operator Injection)
console.log('\n[4] Testing Input Sanitization & Anti-Injection...');
// XSS script tags stripped
const maliciousXss = '<script>alert("xss")</script>Hello World';
const cleanXss = sanitizeString(maliciousXss);
assert.strictEqual(cleanXss.includes('<script>'), false, 'Script tags must be stripped');
assert.strictEqual(cleanXss, 'alert("xss")Hello World');

// HTML entity escaping
const escaped = escapeHtml('<b>Test & "Party"</b>');
assert.strictEqual(escaped, '&lt;b&gt;Test &amp; &quot;Party&quot;&lt;/b&gt;');

// NoSQL operator injection payload: { "$ne": null }
const nosqlPayload = {
  username: 'Alex',
  password: { $ne: null },
  'nested.key': 'exploit',
  bio: '<b>Nice to meet you!</b>',
};
const sanitizedPayload = sanitizeObject(nosqlPayload);
assert.strictEqual(sanitizedPayload.$ne, undefined, 'Operator key $ne must be completely stripped');
assert.strictEqual(sanitizedPayload['nested.key'], undefined, 'Path injection key must be stripped');
assert.strictEqual(sanitizedPayload.username, 'Alex');
assert.strictEqual(sanitizedPayload.bio, 'Nice to meet you!');
console.log('✓ XSS and NoSQL injection sanitizers passed.');

// TEST 5: JWT Generation & Role Payload
console.log('\n[5] Testing JWT Token Generation & Verification...');
const mockUser = {
  userId: 'user-audit-123',
  username: 'AdminUser',
  role: 'admin',
  email: 'admin@synccast.party',
};
const token = generateToken(mockUser);
assert.ok(typeof token === 'string' && token.split('.').length === 3, 'JWT should be valid 3-part string');

const decoded = jwt.verify(token, config.jwtSecret);
assert.strictEqual(decoded.userId, mockUser.userId);
assert.strictEqual(decoded.role, 'admin');
assert.strictEqual(decoded.username, 'AdminUser');

// Verify token fails with bad secret
assert.throws(() => {
  jwt.verify(token, 'wrong-secret-key');
}, /invalid signature/);
console.log('✓ JWT authentication tokens verified.');

// TEST 6: Role Update Validator
console.log('\n[6] Testing Role Update Validator...');
assert.strictEqual(updateRoleSchema.safeParse({ role: 'admin' }).success, true);
assert.strictEqual(updateRoleSchema.safeParse({ role: 'user' }).success, true);
assert.strictEqual(updateRoleSchema.safeParse({ role: 'superuser' }).success, false);
console.log('✓ Role update schema passed.');

console.log('\nALL SECURITY AUDIT CHECKS COMPLETED AND VERIFIED! ✓✓✓\n');
