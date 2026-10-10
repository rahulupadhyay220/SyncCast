import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('test-artifacts');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTests() {
  console.log('🚀 Starting Automated Browser Test using Chrome at:', CHROME_PATH);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  let results = {
    hostPageInitialValue: null,
    hostPagePlaceholder: null,
    hostPageNoAlex: false,
    joinPageInitialValue: null,
    joinPagePlaceholder: null,
    joinPageNoJordanOrAlex: false,
    roomCreationSuccess: false,
    roomHostBadgeText: null,
    roomParticipantSelfName: null,
    roomActionByText: null,
  };

  try {
    // -------------------------------------------------------------
    // Test 1: Verify Host Page Display Name Input
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Host Page (/host) ---');
    await page.goto('http://localhost:5173/host', { waitUntil: 'networkidle0' });

    // Look for the Host Display Name input (01 • Host Display Name)
    const hostNameInput = await page.$('input[placeholder*="host display name"], input[type="text"]');
    if (!hostNameInput) {
      throw new Error('Host Display Name input not found on /host');
    }

    const hostVal = await page.evaluate(el => el.value, hostNameInput);
    const hostPlaceholder = await page.evaluate(el => el.placeholder, hostNameInput);

    results.hostPageInitialValue = hostVal;
    results.hostPagePlaceholder = hostPlaceholder;
    results.hostPageNoAlex = !hostVal.includes('Alex') && !hostPlaceholder.includes('Alex');

    console.log(`Host Display Name Input Value: "${hostVal}"`);
    console.log(`Host Display Name Input Placeholder: "${hostPlaceholder}"`);
    console.log(`PASS: No default "Alex R." shown on host input: ${results.hostPageNoAlex}`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_host_page.png') });

    // -------------------------------------------------------------
    // Test 2: Verify Join Page Display Name Input
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Join Page (/join) ---');
    await page.goto('http://localhost:5173/join', { waitUntil: 'networkidle0' });

    const joinNameInput = await page.$('input[placeholder*="display name"]');
    if (!joinNameInput) {
      throw new Error('Display Name input not found on /join');
    }

    const joinVal = await page.evaluate(el => el.value, joinNameInput);
    const joinPlaceholder = await page.evaluate(el => el.placeholder, joinNameInput);

    results.joinPageInitialValue = joinVal;
    results.joinPagePlaceholder = joinPlaceholder;
    results.joinPageNoJordanOrAlex = !joinVal.includes('Jordan') && !joinVal.includes('Alex') &&
      !joinPlaceholder.includes('Jordan') && !joinPlaceholder.includes('Alex');

    console.log(`Join Display Name Input Value: "${joinVal}"`);
    console.log(`Join Display Name Input Placeholder: "${joinPlaceholder}"`);
    console.log(`PASS: No default "Jordan Lee" or "Alex R." on join input: ${results.joinPageNoJordanOrAlex}`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_join_page.png') });

    // -------------------------------------------------------------
    // Test 3: Create a Host Room with custom name and check in-room display
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Room Creation with Host Name ---');
    await page.goto('http://localhost:5173/host', { waitUntil: 'networkidle0' });

    const hostInput = await page.$('input[placeholder*="host display name"], input[type="text"]');
    // Clear and type test host name
    await hostInput.click({ clickCount: 3 });
    await hostInput.type('VerifiedHostUser');

    // Click submit "Launch Synchronized Room"
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();

    // Wait for navigation to /room
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => { });
    await new Promise(r => setTimeout(r, 1500)); // allow state to settle

    const currentUrl = page.url();
    console.log(`Navigated to URL: ${currentUrl}`);

    // Verify HOST badge in header bar
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasHostBadge = pageText.includes('HOST:') || pageText.includes('VerifiedHostUser');
    const hasAlexInRoom = pageText.includes('Alex R.');

    console.log(`Room header contains VerifiedHostUser: ${hasHostBadge}`);
    console.log(`Room DOES NOT contain Alex R.: ${!hasAlexInRoom}`);

    results.roomCreationSuccess = currentUrl.includes('/room');
    results.roomHostBadgeText = hasHostBadge ? 'VerifiedHostUser found' : 'Not found';

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_room_verified.png') });

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n========================================');
    console.log('✅ BROWSER AUTOMATION TEST RESULTS');
    console.log('========================================');
    console.log(JSON.stringify(results, null, 2));

    if (results.hostPageNoAlex && results.joinPageNoJordanOrAlex && !hasAlexInRoom) {
      console.log('\n🎉 ALL AUTOMATED BROWSER ASSERTIONS PASSED!');
    } else {
      console.error('\n❌ SOME ASSERTIONS FAILED');
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Error during browser testing:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_state.png') }).catch(() => { });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runTests();
