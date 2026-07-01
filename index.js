const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

let cachedUrls = [];
let lastFetch = 0;
const CACHE_TTL = 60 * 1000;

async function scrapeUrls() {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 
      '/opt/render/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome',
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
  try {
    const page = await browser.newPage();
    const urls = new Set();

    page.on('request', req => {
      const u = req.url();
      if (u.includes('oolcaykarael') && u.includes('/')) {
        urls.add(u);
      }
    });

    await page.goto('https://fifalive.site/', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button, a, div');
      for (const btn of btns) {
        if (btn.textContent.trim() === 'Server 2') {
          btn.click();
          break;
        }
      }
    });

    await new Promise(r => setTimeout(r, 5000));

    return [...urls];
  } finally {
    await browser.close();
  }
}

app.get('/get-url', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedUrls.length > 0 && now - lastFetch < CACHE_TTL) {
      return res.json({ success: true, urls: cachedUrls });
    }

    const urls = await scrapeUrls();
    if (urls.length > 0) {
      cachedUrls = urls;
      lastFetch = now;
      res.json({ success: true, urls });
    } else {
      res.json({ success: false, message: 'কোনো URL পাওয়া যায়নি' });
    }
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

app.get('/', (req, res) => res.send('FIFA Scraper Running!'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
