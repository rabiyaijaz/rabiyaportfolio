// Like pages.cjs, but each shot can pick a theme first: "route|stop|phase" (phase: day/dusk/night via the switch)
const puppeteer = require('puppeteer-core');
const sharp = require('C:/Users/Rabiya/Downloads/portfolio/app/node_modules/sharp');
const [out, w, h, ...shots] = process.argv.slice(2);
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage();
  p.on('pageerror', (e) => console.log('pageerror:', e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) console.log('console:', m.text()); });
  await p.setViewport({ width: +w, height: +h });
  const bufs = [];
  let route = null;
  for (const s of shots) {
    const [r, stop, phase] = s.split('|');
    if (r !== route) { route = r; await p.goto('http://localhost:5181' + r, { waitUntil: 'networkidle0' }); await new Promise((x) => setTimeout(x, 1200)); }
    if (phase) await p.evaluate((ph) => { const i = { day: 0, dusk: 1, night: 2 }[ph]; document.querySelectorAll('.phase-switch button')[i]?.click(); }, phase);
    await p.evaluate((stop) => {
      let y = 0;
      if (stop?.startsWith('sel:')) { const [, sel, f] = stop.split(':'); const el = document.querySelector(sel); y = el ? el.getBoundingClientRect().top + scrollY + innerHeight * +f : 0; }
      else y = +(stop || 0);
      scrollTo(0, y);
    }, stop);
    await new Promise((x) => setTimeout(x, 1500));
    bufs.push(await sharp(await p.screenshot()).resize(720).toBuffer());
  }
  const rows = Math.ceil(bufs.length / 2), th = Math.round(720 * h / w);
  const sheet = await sharp({ create: { width: 1440, height: rows * th, channels: 3, background: '#fff' } })
    .composite(bufs.map((input, i) => ({ input, left: (i % 2) * 720, top: Math.floor(i / 2) * th }))).png().toBuffer();
  await sharp(sheet).toFile(out);
  await b.close();
})();
