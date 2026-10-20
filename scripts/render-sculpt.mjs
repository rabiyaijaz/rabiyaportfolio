// Renders stills of the white sculpt for the PDF portfolio into scripts/pdf-assets/sculpt-<name>.png (transparent).
// Needs the dev server running (npm run dev, port 5181) and Google Chrome.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(app, 'scripts/pdf-assets');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
// Same camera language as About's scroll scene: az = orbit angle, el = height, dist, look = target height
const SHOTS = {
  hero: { az: 0.3, el: 0.05, dist: 2.35, look: 0.0 },      // full figure, for the cover
  close: { az: 0.25, el: 0.04, dist: 1.05, look: 0.36 },   // head and shoulders
  left: { az: -0.95, el: 0.12, dist: 2.2, look: 0.02 },    // three-quarter, turned away
  right: { az: 1.0, el: -0.06, dist: 2.2, look: 0.02 },    // three-quarter, the other way
  back: { az: 2.6, el: 0.1, dist: 2.3, look: 0.02 },       // over the shoulder
  forward: { az: -0.45, el: 0.05, dist: 2.35, look: 0.0 }, // facing forward, turned a little to the right (closing page)
};

fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const only = process.argv.slice(2); // e.g. `node scripts/render-sculpt.mjs forward` renders just that one
  for (const [name, s] of Object.entries(SHOTS).filter(([k]) => !only.length || only.includes(k))) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });
    await page.goto(`http://localhost:5181/tools/sculpt.html?az=${s.az}&el=${s.el}&dist=${s.dist}&look=${s.look}&w=1200&h=1600`);
    await page.waitForFunction('window.__done === true', { timeout: 60000 });
    const data = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/png'));
    fs.writeFileSync(path.join(OUT, `sculpt-${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
    console.log('rendered', name);
    await page.close();
  }
} finally { await browser.close(); }
