const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/get-url', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    const urls = new Set();

    page.on('request', req => {
      const u = req.url();
      if (u.includes('oolcaykarael')) urls.add(u);
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
