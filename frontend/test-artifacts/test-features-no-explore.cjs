const path = require('path');
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  console.log('Navigating to http://localhost:5173/#features ...');
  await page.goto('http://localhost:5173/#features', { waitUntil: 'networkidle2' });

  // Scroll to features section
  await page.evaluate(() => {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });

  await new Promise(r => setTimeout(r, 800));

  // Check if any "Explore" text or buttons exist in #features
  const exploreButtonsCount = await page.evaluate(() => {
    const section = document.getElementById('features');
    if (!section) return 0;
    const buttons = Array.from(section.querySelectorAll('button'));
    return buttons.filter(b => b.innerText.toLowerCase().includes('explore')).length;
  });
  console.log('Explore buttons found in #features section:', exploreButtonsCount);

  // Capture screenshot of the section
  const featuresSection = await page.$('#features');
  if (featuresSection) {
    await featuresSection.screenshot({
      path: path.resolve('C:/Users/3535/.gemini/antigravity-ide/brain/194496a4-dae0-4ee9-8cfc-86460ecfe1c6/10_features_section_no_explore.png')
    });
  }

  console.log('Screenshot saved!');
  await browser.close();
})();
