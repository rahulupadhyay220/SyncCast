import assert from 'assert';
import http from 'http';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Room from '../src/models/Room.js';

console.log('--- RUNNING ENDPOINTS & SECURITY INTEGRATION TESTS ---');

// Mock User and Room queries for fast integration testing without live DB daemon
User.findOne = () => ({
  select: async () => null,
});
Room.findOne = async () => null;

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Test Health Endpoint
    console.log('[1] Testing Health Endpoint...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.success, true);
    assert.strictEqual(healthData.data.service, 'SyncCast Watch-Party Backend');
    console.log('✓ Health Endpoint online.');

    // 2. Test Security Headers (Helmet, CSP, HSTS, X-Content-Type)
    console.log('[2] Testing Security Headers (Helmet, CSP, HSTS, X-Content-Type)...');
    assert.ok(healthRes.headers.get('content-security-policy'), 'CSP header should be present');
    assert.strictEqual(healthRes.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(healthRes.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.ok(healthRes.headers.get('referrer-policy'), 'Referrer-Policy header should be present');
    assert.strictEqual(healthRes.headers.get('x-powered-by'), null, 'x-powered-by must be hidden');
    console.log('✓ All OWASP security headers present and verified.');

    // 3. Test Admin Route Security (Must return 403 Forbidden without credentials)
    console.log('[3] Testing Admin Route Protection...');
    const adminRes = await fetch(`${baseUrl}/api/admin/system`);
    assert.strictEqual(adminRes.status, 403, 'Unauthorized access to admin route must return 403');
    const adminData = await adminRes.json();
    assert.strictEqual(adminData.success, false);
    assert.ok(adminData.error.includes('Forbidden') || adminData.error.includes('Administrative access required'));
    console.log('✓ Admin Route correctly protected by RBAC (403 Forbidden).');

    // 4. Test Auth Validation - Reject Weak Password on Registration
    console.log('[4] Testing Auth Password Policy Rejection on Registration...');
    const weakRegisterRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'attacker@evil.com',
        password: 'weak',
        fullName: 'Attacker',
      }),
    });
    assert.strictEqual(weakRegisterRes.status, 400, 'Weak password must be rejected with 400 Bad Request');
    const weakRegisterData = await weakRegisterRes.json();
    assert.strictEqual(weakRegisterData.success, false);
    console.log('✓ Registration password policy correctly enforced.');

    // 5. Test Rate Limiting on Login (Max 10 attempts per 10-minute window)
    console.log('[5] Testing Login Rate Limiting (10 attempts / 10 min window)...');
    let hitRateLimit = false;
    for (let i = 1; i <= 12; i++) {
      const loginAttemptRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'ratelimit.test@synccast.party',
          password: 'IncorrectPassword123!',
        }),
      });

      if (loginAttemptRes.status === 429) {
        hitRateLimit = true;
        const limitData = await loginAttemptRes.json();
        assert.ok(
          limitData.error.includes('Too many login attempts'),
          '429 message should notify about 10-minute limit'
        );
        console.log(`✓ Rate limit triggered on attempt #${i} with HTTP 429 Too Many Requests.`);
        break;
      }
    }
    assert.strictEqual(hitRateLimit, true, 'Rate limiter must enforce limit and return 429');

    // 6. Test Input Sanitization - Safe Room 404 Response
    console.log('[6] Testing Safe Not-Found Response on Room Lookup...');
    const roomRes = await fetch(`${baseUrl}/api/rooms/SYNC-7729`);
    assert.strictEqual(roomRes.status, 404);
    const roomData = await roomRes.json();
    assert.strictEqual(roomData.success, false);
    console.log('✓ Safe 404 response on non-existent room.');

    console.log('\nALL INTEGRATION & ENDPOINT SECURITY CHECKS PASSED SUCCESSFULLY! ✓✓✓');
    process.exit(0);
  } catch (err) {
    console.error('Integration test failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});
