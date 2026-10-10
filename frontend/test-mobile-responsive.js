import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('test-artifacts');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runMobileTests() {
  console.log('📱 Starting Mobile Responsiveness Test with Chrome...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  // Set mobile phone viewport matching modern smartphones (390 x 844, deviceScaleFactor 2)
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  try {
    console.log('\n--- 1. Testing Home Page on Mobile ---');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    
    // Check horizontal scroll
    const homeScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const homeClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    console.log(`Home Page - ScrollWidth: ${homeScrollWidth}, ClientWidth: ${homeClientWidth}`);
    console.log(`PASS: No horizontal scroll overflow on Home: ${homeScrollWidth <= homeClientWidth}`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile_01_home.png'), fullPage: false });

    console.log('\n--- 2. Creating Room to Test In-Theater Mobile UI ---');
    await page.goto('http://localhost:5173/host', { waitUntil: 'networkidle0' });

    const hostInput = await page.$('input[placeholder*="host display name"], input[type="text"]');
    if (hostInput) {
      await hostInput.click({ clickCount: 3 });
      await hostInput.type('Host');
    }

    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 6000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));

    console.log(`Current in-room URL: ${page.url()}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile_02_theater_room.png'), fullPage: true });

    // Check horizontal scroll in theater room
    const roomScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const roomClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    console.log(`Theater Room - ScrollWidth: ${roomScrollWidth}, ClientWidth: ${roomClientWidth}`);
    console.log(`PASS: No horizontal scroll overflow in Theater Room: ${roomScrollWidth <= roomClientWidth}`);

    // Verify Navbar buttons
    const navLeaveButton = await page.$('header button[title="Leave Room"]');
    console.log(`Navbar Leave Room button found: ${!!navLeaveButton}`);

    // Check whether Leave Room button shows icon and hides text on mobile
    const navLeaveTextHidden = await page.evaluate(() => {
      const btn = document.querySelector('header button[title="Leave Room"]');
      if (!btn) return false;
      const textSpan = btn.querySelector('span');
      if (!textSpan) return false;
      const style = window.getComputedStyle(textSpan);
      return style.display === 'none';
    });
    console.log(`Navbar Leave Room text is hidden on mobile (icon only): ${navLeaveTextHidden}`);

    // Check whether Navbar view switcher hides text on mobile (icon only)
    const switcherTextHidden = await page.evaluate(() => {
      const links = document.querySelectorAll('header a[title="Theater"], header a[title="Dashboard"]');
      if (links.length === 0) return false;
      return Array.from(links).every(link => {
        const span = link.querySelector('span');
        if (!span) return false;
        return window.getComputedStyle(span).display === 'none';
      });
    });
    console.log(`Navbar Theater/Dashboard switcher text is hidden on mobile (icons only): ${switcherTextHidden}`);

    // Check status bar Leave Room button
    const sessionLeaveTextHidden = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button[title="Leave Room"]'));
      // The session bar one is inside main content, not header
      const sessionBtn = btns.find(b => !b.closest('header'));
      if (!sessionBtn) return false;
      const span = sessionBtn.querySelector('span');
      if (!span) return false;
      return window.getComputedStyle(span).display === 'none';
    });
    console.log(`Session bar Leave Room text is hidden on mobile (icon only): ${sessionLeaveTextHidden}`);

    // Check PartyChat remote buttons
    const chatControlsExist = await page.evaluate(() => {
      const remoteBar = document.querySelector('[title="Restart video from beginning (0:00)"]');
      return !!remoteBar;
    });
    console.log(`Chat controls exist and accessible: ${chatControlsExist}`);

    console.log('\n🎉 MOBILE RESPONSIVENESS AND ICON CHECKS COMPLETED!');
  } catch (err) {
    console.error('Error during mobile testing:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile_error.png') }).catch(() => {});
  } finally {
    await browser.close();
  }
}

runMobileTests();
