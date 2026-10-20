// Builds the downloadable portfolio: public/cv/Rabiya-Ijaz-Portfolio.pdf (A4 landscape).
// Minimal and loud: a few big words per page, one image at most. Dusk-sky pages (with the white sculpt) open the
// book and each project; paper pages carry the HCI beats: question & method, finding → decision, outcome & reflection.
// Words come from scripts/portfolio-story.mjs; names, meta and HCI lenses from the site's own content files.
// Usage: npm run portfolio:pdf   (needs Google Chrome; set CHROME_PATH if it's elsewhere)
//        PDF_PREVIEW=<folder> also saves a PNG per page for checking the layout.
// Note: no GitHub links anywhere, as some applications (e.g. Siegen HCI) don't allow them in portfolios.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import { PROJECTS, PROFILE } from '../src/content/projects.js';
import { CASE_STUDIES } from '../src/content/caseStudies.js';
import { STORY } from './portfolio-story.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://rabiyaijaz.vercel.app';
const SITE_SHORT = SITE.replace('https://', '');
const OUT = path.join(app, 'public/cv/Rabiya-Ijaz-Portfolio.pdf');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const font = (p) => pathToFileURL(path.join(app, 'node_modules', p)).href;

// Images are embedded at print size: screens as JPEG, the sculpt as PNG (it needs its transparency)
const images = new Map();
const img = (p, kind = 'jpg') => { const k = `${kind}:${p}`; if (!images.has(k)) images.set(k, `__IMG_${images.size}__`); return images.get(k); };
async function inline(text) {
  for (const [k, token] of images) {
    const [kind, p] = [k.slice(0, 3), k.slice(4)];
    const file = p.startsWith('sculpt-') ? path.join(app, 'scripts/pdf-assets', `${p}.png`) : path.join(app, 'public', p);
    const s = sharp(file);
    const buf = kind === 'png'
      ? await s.trim({ threshold: 1 }).resize({ height: 1300, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer()
      : await s.flatten({ background: '#ffffff' }).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    text = text.split(token).join(`data:image/${kind === 'png' ? 'png' : 'jpeg'};base64,${buf.toString('base64')}`);
  }
  return text;
}

const open = PROJECTS.filter((p) => !p.wip && STORY[p.id]);
const SCULPTS = ['left', 'right', 'back', 'close'];
const n2 = (i) => String(i).padStart(2, '0');
const run = (p, i, page, total) => `<div class="run"><span>Rabiya Ijaz</span><span>${n2(i)} — ${esc(p.name)}</span><span>${page}/${total}</span></div>`;

// Highlights pages: captions come from the case study wherever the image is used there; tall images
// (phones, posters, cards) are shown whole on a tinted panel instead of being cropped.
const captions = new Map(Object.values(CASE_STUDIES).flatMap((cs) => (cs.sections || []).flatMap((s) => [...(s.images || []), ...(s.iterations || [])]))
  .map((im) => [im.src, im.caption || im.name || '']));
const aspect = new Map();
for (const s of Object.values(STORY)) for (const pg of s.gallery || []) for (const it of pg.items) {
  const src = typeof it === 'string' ? it : it.src;
  const m = await sharp(path.join(app, 'public', src)).metadata();
  aspect.set(src, m.width / m.height);
}
function highlights(p, i, pg, page, total) {
  const items = pg.items.map((it) => (typeof it === 'string' ? { src: it } : it))
    .map((it) => ({ ...it, caption: it.caption ?? captions.get(it.src) ?? '', tall: aspect.get(it.src) < 0.95 }));
  return `
  <section class="page light hl hl--${pg.layout} hl--n${items.length}">
    ${run(p, i, page, total)}
    <p class="label green">Highlights</p>
    <div class="hl__grid">
      ${items.map((it) => `<figure class="${it.tall ? 'is-tall' : ''}"><div class="hl__img"><img src="${img(it.src)}" alt=""></div>${it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : ''}</figure>`).join('')}
    </div>
  </section>`;
}

function project(p, i) {
  const s = STORY[p.id];
  const total = 4 + (s.gallery?.length || 0);
  const cs = CASE_STUDIES[p.id] || {};
  const play = p.live ? { href: p.live.href, label: 'Try the live app' } : cs.play ? { href: `${SITE}/work/${p.id}#play`, label: 'Play it live' } : null;
  const meta = Object.entries(p.meta).filter(([k]) => k !== 'Status').map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  return `
  <!-- ${p.name} · opener -->
  <section class="page dark opener">
    <div class="opener__num">${n2(i)}</div>
    <div class="opener__text">
      <p class="label">${esc(p.name)} · ${esc(p.type)} · ${esc(p.year)}</p>
      <h2 class="mega">${esc(s.statement)}</h2>
    </div>
    <figure class="opener__shot"><img src="${img(p.hero || p.cover)}" alt=""></figure>
    <img class="opener__sculpt" src="${img(`sculpt-${SCULPTS[(i - 1) % SCULPTS.length]}`, 'png')}" alt="">
    <dl class="opener__meta">${meta}</dl>
  </section>

  <!-- ${p.name} · question & method -->
  <section class="page light qm">
    ${run(p, i, 2, total)}
    <p class="label green">The question</p>
    <h3 class="question">${esc(s.question)}</h3>
    <div class="qm__foot">
      <div>
        <p class="label">Method</p>
        <ol class="method">${s.method.map((m, k) => `<li><span>${n2(k + 1)}</span>${esc(m)}</li>`).join('')}</ol>
      </div>
      <div class="stat"><b>${esc(s.stat.value)}</b><span>${esc(s.stat.label)}</span></div>
    </div>
  </section>

  <!-- ${p.name} · finding → decision -->
  <section class="page light fd">
    ${run(p, i, 3, total)}
    <div class="fd__text">
      <p class="label">${esc(s.findingLabel || 'Finding')}</p>
      <p class="finding">${esc(s.finding)}</p>
      <p class="label green">So I decided</p>
      <h3 class="decision">${esc(s.decision)}</h3>
    </div>
    <figure class="fd__shot${s.image.fit === 'contain' ? ' is-contain' : ''}"><img src="${img(s.image.src)}" alt=""></figure>
  </section>

  <!-- ${p.name} · outcome & reflection -->
  <section class="page light or">
    ${run(p, i, 4, total)}
    <p class="label">Outcome</p>
    <h3 class="outcome">${esc(s.outcome)}</h3>
    <div class="or__foot">
      <div>
        <p class="label green">Next time</p>
        <p class="next">${esc(s.next)}</p>
      </div>
      <div>
        ${p.hci ? `<p class="label">HCI lens</p><p class="lens">${p.hci.map((h) => `<i>${esc(h)}</i>`).join('')}</p>` : ''}
        ${play ? `<p class="play"><span>▶</span>${play.label}: <a href="${play.href}">${esc(play.href.replace('https://', '').replace(/\/$/, ''))}</a></p>` : ''}
        <p class="more">Full case study → <a href="${SITE}/work/${p.id}">${SITE_SHORT}/work/${p.id}</a></p>
      </div>
    </div>
  </section>
  ${(s.gallery || []).map((pg, k) => highlights(p, i, pg, 5 + k, total)).join('')}`;
}

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Rabiya Ijaz · Portfolio</title>
<style>
@font-face { font-family: Newsreader; src: url(${font('@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2')}) format('woff2'); font-weight: 200 800; }
@font-face { font-family: Newsreader; font-style: italic; src: url(${font('@fontsource-variable/newsreader/files/newsreader-latin-wght-italic.woff2')}) format('woff2'); font-weight: 200 800; }
@font-face { font-family: Geist; src: url(${font('@fontsource-variable/geist/files/geist-latin-wght-normal.woff2')}) format('woff2'); font-weight: 100 900; }
@page { size: A4 landscape; margin: 0; }
:root {
  --paper: #f3f0e8; --ink: #111114; --muted: #6b6a70; --green: #1c9a4b; --mint: #6fe39a;
  --dusk: radial-gradient(130% 60% at 50% 112%, rgba(255, 138, 72, .30), transparent 70%), linear-gradient(180deg, #161a3e 0%, #221f4c 32%, #36244f 58%, #4c2742 80%, #5c2a22 100%);
}
* { box-sizing: border-box; }
html, body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font: 400 11pt/1.45 Geist, system-ui, sans-serif; color: var(--ink); }
a { color: inherit; }
.page { position: relative; width: 297mm; height: 210mm; padding: 16mm 18mm; overflow: hidden; page-break-after: always; }
.dark { background: var(--dusk); color: #fbf3ee; }
/* a few stars in the dusk sky */
.dark::before { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .7;
  background-image: radial-gradient(1.2px 1.2px at 12% 18%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 34% 9%, #fff 50%, transparent 51%), radial-gradient(1.4px 1.4px at 61% 22%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 82% 12%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 47% 38%, #fff 50%, transparent 51%), radial-gradient(1.2px 1.2px at 91% 41%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 22% 46%, #fff 50%, transparent 51%); }
.light { background: var(--paper); }
.label { margin: 0 0 3mm; font-size: 8.5pt; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }
.dark .label { color: rgba(251, 243, 238, .7); }
.label.green { color: var(--green); }
.dark .label.green { color: var(--mint); }
.plumbob { display: inline-block; width: 11px; height: 18px; background: var(--mint); clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); filter: drop-shadow(0 0 6px var(--mint)); }
.mega { margin: 0; font: 800 50pt/.95 Geist, sans-serif; letter-spacing: -.035em; text-transform: uppercase; }
.run { position: absolute; left: 18mm; right: 18mm; top: 9mm; display: flex; justify-content: space-between; padding-bottom: 2.2mm; border-bottom: 2px solid var(--ink); font-size: 7.5pt; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
.light .label:first-of-type { margin-top: 10mm; }

/* ---------- cover ---------- */
.cover .name { position: absolute; left: 18mm; bottom: 34mm; margin: 0; font: 800 108pt/.82 Geist, sans-serif; letter-spacing: -.05em; text-transform: uppercase; z-index: 2; }
.cover .role { position: absolute; left: 18mm; top: 18mm; margin: 0; font: 300 italic 22pt/1.15 Newsreader, serif; max-width: 120mm; }
.cover .role b { font-style: normal; font-weight: 400; color: var(--mint); }
.cover .sculpt { position: absolute; right: 22mm; bottom: 8mm; height: 178mm; z-index: 1; filter: drop-shadow(0 18px 40px rgba(0, 0, 0, .45)); }
.cover .foot { position: absolute; left: 18mm; right: 18mm; bottom: 12mm; display: flex; gap: 10mm; font-size: 9pt; letter-spacing: .04em; z-index: 2; }

/* ---------- intro + contents ---------- */
.intro { display: grid; grid-template-columns: 1.15fr .85fr; gap: 14mm; }
.intro h1 { margin: 10mm 0 0; font: 300 58pt/1 Newsreader, serif; letter-spacing: -.025em; }
.intro h1 em { font-style: italic; color: var(--green); }
.intro .read { margin-top: 12mm; font-size: 10pt; color: var(--muted); max-width: 120mm; }
.intro .read b { color: var(--ink); }
.contents { margin: 10mm 0 0; padding: 0; list-style: none; }
.contents li { display: grid; grid-template-columns: 12mm 1fr auto; align-items: baseline; padding: 2.6mm 0; border-top: 2px solid var(--ink); font: 700 17pt/1 Geist, sans-serif; letter-spacing: -.02em; text-transform: uppercase; }
.contents li:last-child { border-bottom: 2px solid var(--ink); }
.contents span { font-size: 9pt; letter-spacing: .1em; }
.contents small { font: 400 8.5pt Geist, sans-serif; letter-spacing: .04em; text-transform: none; color: var(--muted); }

/* ---------- project opener (dark) ---------- */
.opener__num { position: absolute; left: 14mm; top: -2mm; font: 800 150pt/1 Geist, sans-serif; letter-spacing: -.06em; color: transparent; -webkit-text-stroke: 1.2px rgba(251, 243, 238, .35); }
.opener__text { position: absolute; left: 18mm; bottom: 40mm; width: 132mm; z-index: 3; }
.opener__shot { position: absolute; right: 30mm; top: 22mm; width: 118mm; margin: 0; border-radius: 4mm; overflow: hidden; transform: rotate(2.2deg); box-shadow: 0 24px 50px -16px rgba(0, 0, 0, .65); border: 1px solid rgba(255, 255, 255, .18); }
.opener__shot img { display: block; width: 100%; aspect-ratio: 16 / 10.5; object-fit: cover; object-position: top; }
/* the sculpt stands in front of the screenshot's lower corner, clear of the words */
.opener__sculpt { position: absolute; right: 12mm; bottom: 8mm; height: 104mm; z-index: 2; filter: drop-shadow(0 14px 30px rgba(0, 0, 0, .5)); }
.opener__meta { position: absolute; left: 18mm; width: 150mm; bottom: 12mm; display: flex; gap: 12mm; margin: 0; padding-top: 3mm; border-top: 1px solid rgba(251, 243, 238, .3); z-index: 3; }
.opener__meta dt { font-size: 7pt; letter-spacing: .14em; text-transform: uppercase; color: rgba(251, 243, 238, .6); }
.opener__meta dd { margin: 0; font-size: 9.5pt; font-weight: 600; }

/* ---------- question & method ---------- */
.question { margin: 0; max-width: 245mm; font: 300 56pt/1.02 Newsreader, serif; letter-spacing: -.025em; }
.qm__foot { position: absolute; left: 18mm; right: 18mm; bottom: 16mm; display: grid; grid-template-columns: 1fr 70mm; gap: 14mm; align-items: end; }
.method { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(48mm, 1fr)); gap: 6mm; }
.method li { padding-top: 3mm; border-top: 2px solid var(--ink); font-size: 10.5pt; line-height: 1.35; font-weight: 500; }
.method span { display: block; margin-bottom: 1.5mm; font-size: 8pt; font-weight: 700; color: var(--green); }
.stat { display: grid; padding: 5mm 6mm; background: var(--ink); color: var(--paper); border-radius: 3mm; }
.stat b { font: 800 64pt/.9 Geist, sans-serif; letter-spacing: -.05em; color: var(--mint); }
.stat span { margin-top: 2mm; font-size: 9.5pt; line-height: 1.3; }

/* ---------- finding → decision ---------- */
.fd { display: grid; grid-template-columns: 1fr 1.05fr; gap: 12mm; align-items: center; }
.fd__text { align-self: end; padding-bottom: 6mm; }
.finding { margin: 0 0 10mm; padding-left: 4mm; border-left: 3px solid var(--ink); font: 400 italic 16pt/1.3 Newsreader, serif; color: #2c2c32; }
.decision { margin: 0; font: 800 34pt/1 Geist, sans-serif; letter-spacing: -.03em; text-transform: uppercase; }
.fd__shot { margin: 8mm 0 0; border-radius: 4mm; overflow: hidden; border: 2px solid var(--ink); background: #fff; box-shadow: 8px 8px 0 var(--ink); }
.fd__shot img { display: block; width: 100%; max-height: 150mm; object-fit: cover; object-position: top; }
.fd__shot.is-contain { background: #2b2b9c; padding: 6mm; }
.fd__shot.is-contain img { height: 150mm; object-fit: contain; }

/* ---------- outcome & reflection ---------- */
.outcome { margin: 0; max-width: 250mm; font: 800 58pt/.95 Geist, sans-serif; letter-spacing: -.04em; text-transform: uppercase; }
.or__foot { position: absolute; left: 18mm; right: 18mm; bottom: 16mm; display: grid; grid-template-columns: 1fr 1fr; gap: 16mm; padding-top: 5mm; border-top: 2px solid var(--ink); }
.next { margin: 0; font: 300 italic 19pt/1.25 Newsreader, serif; }
.lens { display: flex; flex-wrap: wrap; gap: 2mm; margin: 0 0 4mm; }
.lens i { font-style: normal; font-size: 9pt; font-weight: 600; padding: 1.2mm 3mm; border: 1.5px solid var(--ink); border-radius: 99px; }
.play { display: inline-flex; align-items: center; gap: 2.5mm; margin: 0 0 3mm; padding: 2mm 4mm 2mm 2mm; border-radius: 99px; background: var(--ink); color: var(--paper); font-size: 9pt; font-weight: 600; }
.play span { display: grid; place-items: center; width: 6mm; height: 6mm; border-radius: 50%; background: var(--mint); color: var(--ink); font-size: 6.5pt; }
.play a { color: var(--mint); text-decoration: none; }
.more { margin: 0; font-size: 9pt; color: var(--muted); }
.more a { color: var(--green); text-decoration: none; font-weight: 600; }

/* ---------- highlights (the project's key screens, for context) ---------- */
.hl__grid { position: absolute; left: 18mm; right: 18mm; top: 34mm; bottom: 14mm; display: grid; gap: 7mm; }
.hl--bento .hl__grid { grid-template-columns: 1.55fr 1fr; grid-template-rows: 1fr 1fr; }
.hl--bento figure:first-child { grid-row: 1 / 3; }
.hl--row .hl__grid { grid-auto-flow: column; grid-auto-columns: 1fr; }
.hl--grid .hl__grid { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
.hl figure { display: flex; flex-direction: column; min-height: 0; margin: 0; }
.hl__img { flex: 1; min-height: 0; border-radius: 3mm; overflow: hidden; border: 2px solid var(--ink); background: #fff; box-shadow: 5px 5px 0 var(--ink); }
/* every highlight is shown whole: nothing about the screen is cropped away */
.hl__img { position: relative; }
.hl__img img { position: absolute; inset: 3mm; width: calc(100% - 6mm); height: calc(100% - 6mm); object-fit: contain; }
.hl figure.is-tall .hl__img { background: #e6e1d6; }
.hl figcaption { margin-top: 3mm; font-size: 9pt; line-height: 1.35; color: #3a3a40; }

/* ---------- closing ---------- */
.close h2 { position: absolute; left: 18mm; top: 22mm; margin: 0; width: 170mm; font: 800 64pt/.92 Geist, sans-serif; letter-spacing: -.045em; text-transform: uppercase; z-index: 2; }
.close h2 em { font: 300 italic 64pt/.92 Newsreader, serif; text-transform: none; letter-spacing: -.02em; color: var(--mint); }
.close .sculpt { position: absolute; right: 30mm; bottom: 8mm; height: 170mm; filter: drop-shadow(0 18px 40px rgba(0, 0, 0, .45)); }
.close .contact { position: absolute; left: 18mm; bottom: 16mm; margin: 0; font-size: 12pt; line-height: 1.9; z-index: 2; }
.close .contact b { display: block; margin-bottom: 1mm; font-size: 8.5pt; letter-spacing: .16em; text-transform: uppercase; color: rgba(251, 243, 238, .7); }
.close .contact a { color: var(--mint); text-decoration: none; }
</style></head><body>

<section class="page dark cover">
  <p class="role">Product designer for <b>human–AI collaboration.</b></p>
  <img class="sculpt" src="${img('sculpt-hero', 'png')}" alt="">
  <h1 class="name">Rabiya<br>Ijaz</h1>
  <div class="foot"><span class="plumbob"></span><span>Portfolio ${new Date().getFullYear()}</span><span>${SITE_SHORT}</span></div>
</section>

<section class="page light intro">
  <div>
    <p class="label green" style="margin-top:0">Hello</p>
    <h1>I make complicated systems <em>feel human.</em></h1>
    <p class="read">4+ years across recruitment, finance, healthcare and AI, from Peshawar.<br><br>
      Every project reads in the same order: <b>the question → the method → what I found → what I decided → where it stands.</b></p>
  </div>
  <div>
    <p class="label" style="margin-top:0">Contents</p>
    <ol class="contents">${open.map((p, i) => `<li><span>${n2(i + 1)}</span>${esc(p.name)}<small>${esc(p.type)}</small></li>`).join('')}</ol>
  </div>
</section>

${open.map((p, i) => project(p, i + 1)).join('')}

<section class="page dark close">
  <h2>Let’s build something people <em>actually use.</em></h2>
  <img class="sculpt" src="${img('sculpt-forward', 'png')}" alt="">
  <p class="contact"><b>Say hello</b>${esc(PROFILE.email)}<br><a href="${SITE}">${SITE_SHORT}</a> · <a href="${PROFILE.linkedin}">LinkedIn</a><br>Open to remote, hybrid or on-site work.</p>
</section>
</body></html>`;

const tmp = path.join(app, 'scripts', '.portfolio-print.html');
fs.writeFileSync(tmp, await inline(html), 'utf8');
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files'] });
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await page.pdf({ path: OUT, landscape: true, format: 'A4', printBackground: true, preferCSSPageSize: true });
  if (process.env.PDF_PREVIEW) {
    fs.mkdirSync(process.env.PDF_PREVIEW, { recursive: true });
    for (const f of fs.readdirSync(process.env.PDF_PREVIEW)) if (f.startsWith('page-')) fs.rmSync(path.join(process.env.PDF_PREVIEW, f));
    await page.setViewport({ width: 1123, height: 794 });
    const pages = await page.$$('.page');
    for (const [i, el] of pages.entries()) await el.screenshot({ path: path.join(process.env.PDF_PREVIEW, `page-${String(i + 1).padStart(2, '0')}.png`) });
  }
  const count = (await page.$$('.page')).length;
  console.log(`${path.relative(app, OUT)}: ${count} pages, ${open.length} case studies, ${(fs.statSync(OUT).size / 1024 / 1024).toFixed(1)} MB`);
} finally {
  await browser.close();
  fs.rmSync(tmp, { force: true });
}
