// Capture the five process artboards at 2x. Usage: node process.cjs <outDir>
const puppeteer = require('puppeteer-core');
const path = require('path');
const [out, ...only] = process.argv.slice(2); // optional: just these board ids
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage();
  p.on('pageerror', (e) => console.log('error:', e.message));
  await p.setViewport({ width: 1300, height: 900, deviceScaleFactor: 2 });
  await p.goto('http://localhost:5181/tools/process.html', { waitUntil: 'networkidle0' });
  await p.waitForFunction('window.ready === true', { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 500));
  for (const id of only.length ? only : ['listen', 'synthesis', 'blueprint', 'wireframes', 'ship']) {
    await (await p.$('#' + id)).screenshot({ path: path.join(out, id + '.png'), omitBackground: true });
  }
  console.log('done');
  await b.close();
})();
