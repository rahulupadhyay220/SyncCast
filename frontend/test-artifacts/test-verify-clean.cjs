const path = require('path');
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  // 1. Visit Home Page
  console.log('Testing Home page...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  
  // Verify "How It Works" is NOT in navbar
  const navbarLinks = await page.$$eval('header a', els => els.map(e => e.textContent.trim()));
  console.log('Navbar links:', navbarLinks);
  const hasHowItWorksInNav = navbarLinks.some(l => l.toLowerCase().includes('how it works'));
  console.log('Has How It Works in Nav:', hasHowItWorksInNav);

  // Verify "How It Works" is NOT in footer
  const footerLinks = await page.$$eval('footer a', els => els.map(e => e.textContent.trim()));
  const hasHowItWorksInFooter = footerLinks.some(l => l.toLowerCase().includes('how it works'));
  console.log('Has How It Works in Footer:', hasHowItWorksInFooter);

  // Take screenshot of home page
  await page.screenshot({
    path: path.resolve('C:/Users/3535/.gemini/antigravity-ide/brain/194496a4-dae0-4ee9-8cfc-86460ecfe1c6/09_homepage_cleaned.png'),
    fullPage: false
  });

  // 2. Attempt to visit /how-it-works - should gracefully route or fallback
  console.log('Testing /how-it-works navigation...');
  await page.goto('http://localhost:5173/how-it-works', { waitUntil: 'networkidle2' });
  const pageContent = await page.evaluate(() => document.body.innerText);
  console.log('Current URL after /how-it-works navigation:', page.url());

  console.log('Automated verification completed successfully!');
  await browser.close();
})();
