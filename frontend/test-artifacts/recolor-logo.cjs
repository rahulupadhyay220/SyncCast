const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  
  const whiteImgPath = path.resolve(__dirname, '../public/logo-syncCast-white.png');
  const origImgPath = path.resolve(__dirname, '../public/logo-syncCast-original.png');
  const whiteB64 = fs.readFileSync(whiteImgPath).toString('base64');
  const origB64 = fs.readFileSync(origImgPath).toString('base64');
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="background: #050608; padding: 40px; font-family: sans-serif;">
        <canvas id="c1"></canvas>
        <canvas id="c2"></canvas>
        <canvas id="c3"></canvas>
        <div id="preview" style="display: flex; flex-direction: column; gap: 30px; margin-top: 30px;">
        </div>
      </body>
    </html>
  `);
  
  const results = await page.evaluate(async ({ whiteB64, origB64 }) => {
    function loadImage(b64) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = 'data:image/png;base64,' + b64;
      });
    }

    const whiteImg = await loadImage(whiteB64);
    const origImg = await loadImage(origB64);

    // Variation 1: White text + Website Theme Red Broadcast Waves (#e50914 / #ff383f)
    const c1 = document.getElementById('c1');
    c1.width = whiteImg.width;
    c1.height = whiteImg.height;
    const ctx1 = c1.getContext('2d');
    ctx1.drawImage(whiteImg, 0, 0);
    const imgData1 = ctx1.getImageData(0, 0, c1.width, c1.height);
    const d1 = imgData1.data;

    for (let i = 0; i < d1.length; i += 4) {
      const r = d1[i], g = d1[i+1], b = d1[i+2], a = d1[i+3];
      if (a > 10) {
        // Teal detection: g > r + 25 and b > r + 15
        if (g > r + 25 && b > r + 15) {
          // Calculate brightness/intensity of the original teal wave pixel
          const maxTeal = Math.max(g, b);
          const intensity = maxTeal / 255;
          
          // Theme Red: #e50914 (primary) with vibrant highlight #ff3b44
          // Target: R=229..255, G=9..40, B=20..50
          const newR = Math.round(255 * Math.min(1, intensity * 1.05));
          const newG = Math.round(15 + (1 - intensity) * 35);
          const newB = Math.round(24 + (1 - intensity) * 35);

          d1[i] = newR;
          d1[i+1] = newG;
          d1[i+2] = newB;
          // Keep smooth alpha
        }
      }
    }
    ctx1.putImageData(imgData1, 0, 0);
    const redWavesDataUrl = c1.toDataURL('image/png');

    // Variation 2: White "sync" + Red "Cast" + Red Waves
    // Let's find boundary where 'C' begins:
    // In 796px wide image, 'C' starts around x = 400..450
    const c2 = document.getElementById('c2');
    c2.width = whiteImg.width;
    c2.height = whiteImg.height;
    const ctx2 = c2.getContext('2d');
    ctx2.drawImage(whiteImg, 0, 0);
    const imgData2 = ctx2.getImageData(0, 0, c2.width, c2.height);
    const d2 = imgData2.data;

    // Detect 'C' position:
    // In syncCast: 's' ~ 50..180, 'y' ~ 180..280, 'n' ~ 280..380, 'c' ~ 380..470, 'C' ~ 470..
    // Let's first apply red waves, then optionally recolor 'Cast'
    for (let y = 0; y < c2.height; y++) {
      for (let x = 0; x < c2.width; x++) {
        const i = (y * c2.width + x) * 4;
        const r = d2[i], g = d2[i+1], b = d2[i+2], a = d2[i+3];
        if (a > 10) {
          if (g > r + 25 && b > r + 15) {
            const intensity = Math.max(g, b) / 255;
            d2[i] = Math.round(255 * Math.min(1, intensity * 1.05));
            d2[i+1] = Math.round(15 + (1 - intensity) * 35);
            d2[i+2] = Math.round(24 + (1 - intensity) * 35);
          } else if (x >= 460 && r > 180 && g > 180 && b > 180) {
            // White letters of "Cast" -> Theme red gradient
            const intensity = (r + g + b) / (3 * 255);
            d2[i] = Math.round(245 * intensity);
            d2[i+1] = Math.round(20 * intensity);
            d2[i+2] = Math.round(30 * intensity);
          }
        }
      }
    }
    ctx2.putImageData(imgData2, 0, 0);
    const redCastDataUrl = c2.toDataURL('image/png');

    // Also recolor original dark text version (for light theme)
    const c3 = document.getElementById('c3');
    c3.width = origImg.width;
    c3.height = origImg.height;
    const ctx3 = c3.getContext('2d');
    ctx3.drawImage(origImg, 0, 0);
    const imgData3 = ctx3.getImageData(0, 0, c3.width, c3.height);
    const d3 = imgData3.data;

    for (let i = 0; i < d3.length; i += 4) {
      const r = d3[i], g = d3[i+1], b = d3[i+2], a = d3[i+3];
      if (a > 10) {
        if (g > r + 25 && b > r + 15) {
          const intensity = Math.max(g, b) / 255;
          d3[i] = Math.round(255 * Math.min(1, intensity * 1.05));
          d3[i+1] = Math.round(15 + (1 - intensity) * 35);
          d3[i+2] = Math.round(24 + (1 - intensity) * 35);
        }
      }
    }
    ctx3.putImageData(imgData3, 0, 0);
    const redOrigDataUrl = c3.toDataURL('image/png');

    return {
      redWaves: redWavesDataUrl,
      redCast: redCastDataUrl,
      redOrig: redOrigDataUrl
    };
  }, { whiteB64, origB64 });

  // Save the generated images
  function saveBase64Png(dataUrl, filepath) {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(filepath, base64Data, 'base64');
  }

  saveBase64Png(results.redWaves, path.resolve(__dirname, '../public/logo-theme-red-waves.png'));
  saveBase64Png(results.redCast, path.resolve(__dirname, '../public/logo-theme-red-cast.png'));
  saveBase64Png(results.redOrig, path.resolve(__dirname, '../public/logo-theme-red-orig.png'));

  // Also create a test preview HTML to take screenshot of both on the actual navbar
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { background: #050608; color: #fff; font-family: -apple-system, sans-serif; padding: 40px; }
          .nav-mock {
            height: 56px;
            background: rgba(5, 6, 8, 0.85);
            border-bottom: 1px solid rgba(255, 255, 255, 0.07);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            margin-bottom: 30px;
            border-radius: 8px;
          }
          .btn-host {
            background: #e50914;
            color: #fff;
            padding: 6px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
          }
          .title { font-size: 14px; color: #888; margin-bottom: 8px; }
          img { height: 34px; width: auto; object-contain: contain; }
        </style>
      </head>
      <body>
        <div class="title">Current (Teal Waves - Unmatched):</div>
        <div class="nav-mock">
          <img src="data:image/png;base64,${whiteB64}" />
          <button class="btn-host">+ Host Room</button>
        </div>

        <div class="title">Variation A: Official White Wordmark + Website Theme Red Cinema Waves (#e50914):</div>
        <div class="nav-mock">
          <img src="${results.redWaves}" />
          <button class="btn-host">+ Host Room</button>
        </div>

        <div class="title">Variation B: White "sync" + Crimson "Cast" + Red Cinema Waves:</div>
        <div class="nav-mock">
          <img src="${results.redCast}" />
          <button class="btn-host">+ Host Room</button>
        </div>
      </body>
    </html>
  `);

  await page.screenshot({ path: path.resolve(__dirname, 'logo-comparison.png'), fullPage: true });
  await page.screenshot({ path: path.resolve('C:/Users/3535/.gemini/antigravity-ide/brain/194496a4-dae0-4ee9-8cfc-86460ecfe1c6/logo_comparison.png'), fullPage: true });

  console.log('Generated variants and comparison screenshot successfully!');
  await browser.close();
})();
