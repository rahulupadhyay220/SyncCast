const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  
  const imgPath = path.resolve(__dirname, '../public/logo-syncCast-white.png');
  const imgBase64 = fs.readFileSync(imgPath).toString('base64');
  
  await page.setContent('<html><body><canvas id="c"></canvas></body></html>');
  
  const stats = await page.evaluate((b64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.getElementById('c');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const data = imgData.data;
        let tealCount = 0;
        let whiteCount = 0;
        let samples = [];
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
          if (a > 30) {
            if (g > r + 30 && b > r + 20) {
              tealCount++;
              if (samples.length < 5) samples.push({ r, g, b, a });
            } else if (r > 200 && g > 200 && b > 200) {
              whiteCount++;
            }
          }
        }
        resolve({ width: img.width, height: img.height, tealCount, whiteCount, samples });
      };
      img.src = 'data:image/png;base64,' + b64;
    });
  }, imgBase64);
  
  console.log('Image stats:', JSON.stringify(stats, null, 2));
  await browser.close();
})();
