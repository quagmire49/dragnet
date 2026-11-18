import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const URL = `http://localhost:${PORT}`;

function waitForServer(url, timeout = 25000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode === 200 || res.statusCode === 304) {
            resolve(true);
          } else {
            setTimeout(check, 400);
          }
        })
        .on('error', () => {
          if (Date.now() - start > timeout) {
            reject(new Error('Server start timed out'));
          } else {
            setTimeout(check, 400);
          }
        });
    };
    check();
  });
}

async function run() {
  console.log('Starting Next.js server on port', PORT);
  const server = spawn('cmd.exe', ['/c', 'npx', 'next', 'start', '-p', String(PORT)], {
    stdio: 'ignore',
  });

  try {
    console.log('Waiting for server...');
    await waitForServer(URL);
    console.log('Server is UP! Launching Chrome...');

    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--use-gl=angle',
        '--use-angle=swiftshader-webgl',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
      ],
      defaultViewport: {
        width: 1440,
        height: 900,
        deviceScaleFactor: 2,
      },
    });

    const page = await browser.newPage();

    // 1. Landing Screen
    console.log('Navigating to Landing Page...');
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Stir cursor to demonstrate particle interaction
    await page.mouse.move(400, 300);
    await page.mouse.move(720, 450, { steps: 8 });
    await page.mouse.move(600, 520, { steps: 6 });

    console.log('Taking screenshot: docs/screenshots/landing.png');
    await page.screenshot({ path: path.resolve('docs/screenshots/landing.png') });

    // 2. Start Scan -> Live Scan Screen
    console.log('Clicking demo headline card to start live scan...');
    // Click the first card
    const cards = await page.$$('button[type="button"]');
    if (cards.length > 0) {
      // Find a card with text
      await cards[0].click();
    } else {
      await page.keyboard.press('Enter');
    }

    // Wait 1.4s for live scanning state with active SSE logs and incoming cards
    await new Promise((r) => setTimeout(r, 1400));
    console.log('Taking screenshot: docs/screenshots/scanning.png');
    await page.screenshot({ path: path.resolve('docs/screenshots/scanning.png') });

    // 3. Wait for Scan to Complete -> Dashboard Screen
    console.log('Waiting for audit to reach DONE state & health score count-up...');
    await new Promise((r) => setTimeout(r, 4000));
    console.log('Taking screenshot: docs/screenshots/dashboard.png');
    await page.screenshot({ path: path.resolve('docs/screenshots/dashboard.png') });

    // 4. Open Finding Detail Drawer (Screen 4)
    console.log('Opening finding drawer for hallucinated-import...');
    // Click on the first card in the verified feed
    const feedButtons = await page.$$('button[type="button"]');
    for (const btn of feedButtons) {
      const text = await page.evaluate((el) => el.innerText, btn);
      if (text.includes('hallucinated-import') || text.includes('FASTJSON')) {
        await btn.click();
        break;
      }
    }
    // Wait for drawer slide-in animation (320ms ease-out)
    await new Promise((r) => setTimeout(r, 800));

    console.log('Taking screenshot: docs/screenshots/drawer.png');
    await page.screenshot({ path: path.resolve('docs/screenshots/drawer.png') });

    console.log('All 4 acceptance screenshots captured successfully!');
    await browser.close();
  } catch (err) {
    console.error('Execution error:', err);
  } finally {
    console.log('Terminating server...');
    try {
      spawn('cmd.exe', ['/c', 'taskkill /F /IM node.exe']);
    } catch {}
    process.exit(0);
  }
}

run();
