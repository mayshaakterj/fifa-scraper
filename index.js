const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Find Chrome executable automatically
function findChrome() {
  const basePath = '/opt/render/.cache/puppeteer/chrome';
  try {
    if (!fs.existsSync(basePath)) return null;
    const versions = fs.readdirSync(basePath);
    for (const ver of versions) {
      const chromePath = path.join(basePath, ver, 'chrome-linux64', 'chrome');
      if (fs.existsSync(chromePath)) return chromePath;
    }
  } catch(e) {}
  return null;
}

app.get('/chrome-path', (req, res) => {
  const p = findChrome();
  const basePath = '/opt/render/.cache/puppeteer/chrome';
  let dirs = [];
  try { dirs = fs.readdirSync(basePath); } catch(e) {}
  res.json({ found: p, dirs, basePath });
});

app.get('/get-url', async (req, res) => {
  try {
    const chromePath = findChrome();
    if (!chromePath) {
      return res.json({ success: false, message: 'Chrome not found', dirs: (() => { try { return fs.readdirSync('/opt/render/.cache/puppeteer/chrome'); } catch(e) { return []; } })() });
    }

    const browser = await puppeteer.launch({
      executablePath: chromePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ],
      headless: true
    });

    const page = await browser.newPage();
    const urls = new Set();

    page.on('request', req => {
      const u = req.url();
      if (u.includes('oolcaykarael')) urls.add(u);
    });

    await page.goto('https://fifalive.site/', { waitUntil: 'networkidle2', timeout: 30000 });

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button, a, div');
      for (const btn of btns) {
        if (btn.textContent.trim() === 'Server 2') { btn.click(); break; }
      }
    });

    await new Promise(r => setTimeout(r, 5000));
    await browser.close();

    const result = [...urls];
    if (result.length > 0) {
      res.json({ success: true, urls: result });
    } else {
      res.json({ success: false, message: 'কোনো URL পাওয়া যায়নি' });
    }
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

app.get('/', (req, res) => res.send('FIFA Scraper Running!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
