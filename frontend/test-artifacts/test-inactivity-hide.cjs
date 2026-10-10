const path = require('path');
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  console.log('Navigating to Host page...');
  await page.goto('http://localhost:5173/host', { waitUntil: 'networkidle2' });

  // Fill host display name
  const nameInput = await page.$('input[placeholder="Enter your host display name"]');
  if (nameInput) {
    await nameInput.type('Alex CineHost');
  }

  // Click Launch Synchronized Room
  console.log('Launching room...');
  const launchBtn = await page.waitForSelector('button[type="submit"]');
  await launchBtn.click();

  // Wait for room to mount
  await page.waitForSelector('input[type="range"]', { timeout: 10000 });
  console.log('Room mounted.');

  // Give a moment for player state
  await new Promise(r => setTimeout(r, 2000));

  // Trigger play if not playing
  // Let's click the center play button or HUD play button to ensure videoState.playing is true
  const playButton = await page.$('button[title="Pause"], button[title="Play"]');
  if (playButton) {
    const title = await page.evaluate(el => el.getAttribute('title'), playButton);
    if (title === 'Play') {
      console.log('Clicking play button to start playback...');
      await playButton.click();
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Move mouse over video container to wake up controls
  console.log('Hovering and moving mouse over video player...');
  await page.mouse.move(500, 400);
  await new Promise(r => setTimeout(r, 500));
  await page.mouse.move(520, 420);
  await new Promise(r => setTimeout(r, 200));

  // Capture Screenshot 1: Controls Visible
  const visibleControlsOpacity = await page.evaluate(() => {
    // Check bottom HUD control bar opacity
    const hud = document.querySelector('input[type="range"]')?.closest('div[class*="absolute bottom-0"]');
    return hud ? window.getComputedStyle(hud).opacity : null;
  });
  console.log('Controls opacity while moving mouse:', visibleControlsOpacity);

  await page.screenshot({
    path: path.resolve('C:/Users/3535/.gemini/antigravity-ide/brain/194496a4-dae0-4ee9-8cfc-86460ecfe1c6/06_controls_active.png')
  });

  // Now, do NOT move mouse for 3.5 seconds
  console.log('Waiting 3.5 seconds with zero mouse movement...');
  await new Promise(r => setTimeout(r, 3500));

  // Capture Screenshot 2: Controls Hidden
  const hiddenControlsOpacity = await page.evaluate(() => {
    const hud = document.querySelector('input[type="range"]')?.closest('div[class*="absolute bottom-0"]');
    const centerBtn = document.querySelector('div[class*="w-14 h-14"]');
    return {
      hudOpacity: hud ? window.getComputedStyle(hud).opacity : null,
      centerOpacity: centerBtn ? window.getComputedStyle(centerBtn).opacity : null,
      hudPointerEvents: hud ? window.getComputedStyle(hud).pointerEvents : null
    };
  });
  console.log('Controls state after 3.5s inactivity:', hiddenControlsOpacity);

  await page.screenshot({
    path: path.resolve('C:/Users/3535/.gemini/antigravity-ide/brain/194496a4-dae0-4ee9-8cfc-86460ecfe1c6/07_controls_hidden_after_3s.png')
  });

  // Now move mouse again!
  console.log('Moving mouse again to wake controls up...');
  await page.mouse.move(600, 450);
  await new Promise(r => setTimeout(r, 300));

  // Capture Screenshot 3: Controls Reappeared
  const reappearedControlsOpacity = await page.evaluate(() => {
    const hud = document.querySelector('input[type="range"]')?.closest('div[class*="absolute bottom-0"]');
    const centerBtn = document.querySelector('div[class*="w-14 h-14"]');
    return {
      hudOpacity: hud ? window.getComputedStyle(hud).opacity : null,
      centerOpacity: centerBtn ? window.getComputedStyle(centerBtn).opacity : null
    };
  });
  console.log('Controls state after moving mouse again:', reappearedControlsOpacity);

  await page.screenshot({
    path: path.resolve('C:/Users/3535/.gemini/antigravity-ide/brain/194496a4-dae0-4ee9-8cfc-86460ecfe1c6/08_controls_reappear_on_movement.png')
  });

  console.log('Inactivity auto-hide testing complete!');
  await browser.close();
})();
