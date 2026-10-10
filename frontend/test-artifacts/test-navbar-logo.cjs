const path = require('path');
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  // Test 1: Host Page
  console.log('Navigating to http://localhost:5173/host ...');
  await page.goto('http://localhost:5173/host', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#main-logo');
  
  // Take screenshot of navbar specifically and full page
  const navbarElement = await page.$('header');
  if (navbarElement) {
    await navbarElement.screenshot({
      path: path.resolve('C:/Users/3535/.gemini/antigravity-ide/brain/194496a4-dae0-4ee9-8cfc-86460ecfe1c6/navbar_host_page.png')
    });
  }
  await page.screenshot({
    path: path.resolve('C:/Users/3535/.gemini/antigravity-ide/brain/194496a4-dae0-4ee9-8cfc-86460ecfe1c6/full_host_page_with_new_logo.png')
  });

  // Test 2: Home Page
  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  const homeNavbar = await page.$('header');
  if (homeNavbar) {
    await homeNavbar.screenshot({
      path: path.resolve('C:/Users/3535/.gemini/antigravity-ide/brain/194496a4-dae0-4ee9-8cfc-86460ecfe1c6/navbar_home_page.png')
    });
  }

  console.log('Captured navbar screenshots successfully!');
  await browser.close();
})();
