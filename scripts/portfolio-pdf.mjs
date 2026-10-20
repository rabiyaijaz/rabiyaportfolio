// Builds the downloadable portfolio: public/cv/Rabiya-Ijaz-Portfolio.pdf (A4 landscape).
// Everything comes from the site's own content files, so re-running it keeps the PDF in step with the site:
// a cover, one page per case study (work-in-progress projects are left out), and an about + contact page.
// Usage: npm run portfolio:pdf   (needs Google Chrome installed; set CHROME_PATH if it's somewhere else)
// Note: no GitHub link anywhere, as some applications (e.g. Siegen HCI) don't allow them in portfolios.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { PROJECTS, PROFILE, titleOf } from '../src/content/projects.js';
import { CASE_STUDIES } from '../src/content/caseStudies.js';
import { EXPERIENCE, COMMUNITY, EDUCATION } from '../src/content/career.js';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://rabiyaijaz.vercel.app';
const OUT = path.join(app, 'public/cv/Rabiya-Ijaz-Portfolio.pdf');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// Images go in at print size (1400 px wide JPEG), which keeps the PDF small enough to upload or email
import sharp from 'sharp';
const shrunk = new Map();
const pub = (p) => {
  if (!p) return '';
  if (!shrunk.has(p)) shrunk.set(p, `__IMG_${shrunk.size}__`);
  return shrunk.get(p);
};
async function inlineImages(text) {
  for (const [p, token] of shrunk) {
    const buf = await sharp(path.join(app, 'public', p)).flatten({ background: '#ffffff' }).resize({ width: 1400, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
    text = text.split(token).join(`data:image/jpeg;base64,${buf.toString('base64')}`);
  }
  return text;
}
const font = (p) => pathToFileURL(path.join(app, 'node_modules', p)).href;
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const first = (text) => esc(text.split(/(?<=\.)\s/)[0]); // the first sentence of a paragraph

// Up to three images for a case study: prefer wide screens with captions, skip phone shots
function pickImages(cs, p) {
  const all = (cs?.sections || []).flatMap((s) => (s.images || []).filter((i) => !i.phone && i.src !== (p.hero || p.cover)));
  return all.filter((i) => i.caption).slice(0, 3).concat(all.filter((i) => !i.caption)).slice(0, 3);
}

function casePage(p, n) {
  const cs = CASE_STUDIES[p.id] || {};
  const imgs = pickImages(cs, p);
  // On paper, "play it above" points to the link instead
  const paper = (t) => t.replace(/;?\s*you can play it above\.?/i, '. You can play it in the browser at the link below.');
  const play = p.live ? { href: p.live.href, label: 'Try the live app' } : cs.play ? { href: `${SITE}/work/${p.id}#play`, label: 'Play it live' } : null;
  const beats = (cs.sections || []).slice(0, 4); // four beats keep every page clear of the footer
  return `
  <section class="page case">
    <div class="case__left">
      <p class="kicker">${String(n).padStart(2, '0')} · ${esc(p.type)} · ${esc(p.year)}</p>
      <h2><strong>${esc(p.name)}:</strong> ${esc(titleOf(p).slice(p.name.length + 2))}</h2>
      <dl class="meta">${Object.entries(p.meta).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      ${p.hci ? `<p class="hci"><span>HCI lens</span>${p.hci.map((c) => `<i>${esc(c)}</i>`).join('')}</p>` : ''}
      ${(cs.intro || []).slice(0, 1).map((t) => `<p class="intro">${esc(paper(t))}</p>`).join('')}
      ${beats.length ? `<ol class="beats">${beats.map((s) => `<li><b>${esc(s.label)}</b>${esc(s.headline)}</li>`).join('')}</ol>` : ''}
      ${play ? `<p class="play"><span>▶</span><b>${play.label}:</b> <a href="${play.href}">${esc(play.href.replace('https://', '').replace(/\/$/, ''))}</a></p>` : ''}
      <p class="more">Full case study: <a href="${SITE}/work/${p.id}">${SITE.replace('https://', '')}/work/${p.id}</a></p>
    </div>
    <div class="case__right">
      <figure class="hero"><img src="${pub(p.hero || p.cover)}" alt=""></figure>
      ${imgs.length ? `<div class="shots">${imgs.slice(0, 2).map((i) => `<figure><img src="${pub(i.src)}" alt=""><figcaption>${esc(i.caption || '')}</figcaption></figure>`).join('')}</div>` : ''}
    </div>
  </section>`;
}

const roleRow = (x) => `<li><p><b>${esc(x.role)}</b>, ${esc(x.org)}</p><span>${esc(x.when)}</span></li>`;
const roles = [...EXPERIENCE, ...COMMUNITY].map(roleRow).join('');
const open = PROJECTS.filter((p) => !p.wip);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Rabiya Ijaz · Portfolio</title>
<style>
@font-face { font-family: Newsreader; src: url(${font('@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2')}) format('woff2'); font-weight: 200 800; }
@font-face { font-family: Newsreader; font-style: italic; src: url(${font('@fontsource-variable/newsreader/files/newsreader-latin-wght-italic.woff2')}) format('woff2'); font-weight: 200 800; }
@font-face { font-family: Geist; src: url(${font('@fontsource-variable/geist/files/geist-latin-wght-normal.woff2')}) format('woff2'); font-weight: 100 900; }
@page { size: A4 landscape; margin: 0; }
:root { --ink: #15161c; --muted: #61646e; --line: #e4e1da; --accent: #2f9a4a; --paper: #f7f5f0; }
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--paper); color: var(--ink); font: 400 10.5pt/1.5 Geist, system-ui, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
a { color: var(--accent); text-decoration: none; }
.page { width: 297mm; height: 210mm; padding: 16mm 18mm; overflow: hidden; page-break-after: always; position: relative; }
.page::after { content: 'Rabiya Ijaz · Product designer'; position: absolute; left: 18mm; bottom: 8mm; font-size: 8pt; color: var(--muted); }
.kicker { margin: 0 0 4mm; font-size: 8.5pt; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
h1, h2 { font-family: Newsreader, serif; font-weight: 300; letter-spacing: -.01em; margin: 0; }
h2 strong { font-weight: 500; }
.plumbob { display: inline-block; width: 10px; height: 16px; background: var(--accent); clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); vertical-align: -2px; margin-right: 8px; }

/* Cover */
.cover { display: grid; grid-template-columns: 1.05fr .95fr; gap: 14mm; align-items: center; }
.cover h1 { font-size: 46pt; line-height: 1.02; margin: 2mm 0 6mm; }
.cover h1 em { font-style: italic; }
.cover .lede { font-size: 13pt; color: var(--muted); max-width: 120mm; margin: 0 0 8mm; }
.cover .contact { font-size: 10pt; line-height: 1.8; }
.cover .portrait { justify-self: center; width: 92mm; height: 120mm; border-radius: 10mm; overflow: hidden; background: #e9e5dc; }
.cover .portrait img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 15%; }
.index { margin: 8mm 0 0; padding: 0; list-style: none; columns: 2; column-gap: 8mm; font-size: 9.5pt; }
.index li { margin-bottom: 2mm; break-inside: avoid; } .index b { font-weight: 600; }

/* Case study */
.case { display: grid; grid-template-columns: 1fr 1.08fr; gap: 10mm; }
.case h2 { font-size: 22pt; line-height: 1.12; margin-bottom: 5mm; }
.meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2mm 6mm; margin: 0 0 4mm; padding: 3mm 0 0; border-top: 1px solid var(--line); }
.meta dt { font-size: 7.5pt; color: var(--muted); } .meta dd { margin: 0; font-size: 9pt; font-weight: 600; }
.hci { display: flex; flex-wrap: wrap; align-items: center; gap: 1.5mm; margin: 0 0 4mm; font-size: 8pt; }
.hci span { color: var(--muted); margin-right: 1mm; }
.hci i { font-style: normal; font-weight: 600; padding: 1mm 2.5mm; border-radius: 99px; background: #e2f2e6; border: 1px solid #b9dfc3; }
.intro { margin: 0 0 4mm; font-size: 9.5pt; }
.beats { margin: 0 0 4mm; padding: 0; list-style: none; counter-reset: b; }
.beats li { display: grid; grid-template-columns: 22mm 1fr; gap: 3mm; padding: 1.6mm 0; border-top: 1px solid var(--line); font-family: Newsreader, serif; font-size: 10.5pt; line-height: 1.3; }
.beats b { font-family: Geist, sans-serif; font-size: 7.5pt; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); padding-top: .6mm; }
.more { font-size: 8.5pt; color: var(--muted); margin: 0; }
.play { display: inline-flex; align-items: center; gap: 2mm; margin: 0 0 3mm; padding: 1.8mm 4mm 1.8mm 2mm; border-radius: 99px; background: #e2f2e6; border: 1px solid #b9dfc3; font-size: 9pt; }
.play span { display: grid; place-items: center; width: 6mm; height: 6mm; border-radius: 50%; background: var(--accent); color: #fff; font-size: 6.5pt; }
.case__right { display: grid; grid-template-rows: auto 1fr; gap: 4mm; min-height: 0; }
.case figure { margin: 0; }
.hero { border-radius: 4mm; overflow: hidden; border: 1px solid var(--line); background: #fff; max-height: 92mm; }
.hero img { display: block; width: 100%; height: 100%; max-height: 92mm; object-fit: cover; object-position: top; }
.shots { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; align-content: start; }
.shots img { display: block; width: 100%; height: 44mm; object-fit: cover; object-position: top; border-radius: 3mm; border: 1px solid var(--line); background: #fff; }
.shots figcaption { margin-top: 1.5mm; font-size: 7.5pt; color: var(--muted); line-height: 1.35; }

/* About */
.about { display: grid; grid-template-columns: 1.1fr .9fr; gap: 14mm; }
.about h2 { font-size: 30pt; margin-bottom: 6mm; }
.about p { font-size: 11pt; margin: 0 0 4mm; }
.about ul { margin: 0; padding: 0; list-style: none; }
.about li { display: flex; justify-content: space-between; gap: 6mm; padding: 2mm 0; border-top: 1px solid var(--line); font-size: 9.5pt; }
.about li p { margin: 0; font-size: 9.5pt; }
.about li span { color: var(--muted); white-space: nowrap; }
.about h3 { margin: 0 0 3mm; font-size: 8.5pt; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.cta { margin-top: 8mm; padding: 6mm; border-radius: 5mm; background: #fff; border: 1px solid var(--line); font-size: 10.5pt; line-height: 1.8; }
</style></head><body>

<section class="page cover">
  <div>
    <p class="kicker"><span class="plumbob"></span>Portfolio · ${new Date().getFullYear()}</p>
    <h1>Rabiya Ijaz<br><em>Product designer</em></h1>
    <p class="lede">Product designer for human–AI collaboration, based in Peshawar. I’ve spent 4+ years making complicated systems feel human, across recruitment, finance, healthcare and AI.</p>
    <p class="contact">
      <a href="${SITE}">${SITE.replace('https://', '')}</a> (the interactive version)<br>
      ${esc(PROFILE.email)} · <a href="${PROFILE.linkedin}">LinkedIn</a>
    </p>
    <ol class="index">${open.map((p, i) => `<li><b>${String(i + 1).padStart(2, '0')} ${esc(p.name)}</b> · ${esc(p.type)}</li>`).join('')}</ol>
  </div>
  <div class="portrait"><img src="${pub('/img/portrait-640.webp')}" alt=""></div>
</section>

${open.map((p, i) => casePage(p, i + 1)).join('')}

<section class="page about">
  <div>
    <p class="kicker">About</p>
    <h2>I make complicated systems <em>feel human.</em></h2>
    <p>I’m Rabiya, a product designer in Peshawar. Over 4+ years across recruitment, finance, healthcare and AI, my work has kept coming back to one question: when should a system stop and ask the person?</p>
    <p>I start with research, design for trust, and stay close to the build, including working with AI coding partners under my direction.</p>
    <div class="cta">
      <b>Open to new product design work</b>, remote, hybrid or on-site.<br>
      ${esc(PROFILE.email)}<br>
      <a href="${SITE}">${SITE.replace('https://', '')}</a> · <a href="${PROFILE.linkedin}">LinkedIn</a>
    </div>
  </div>
  <div>
    <h3>Experience and community</h3>
    <ul>${roles}</ul>
    <h3 style="margin-top:6mm">Education</h3>
    <ul>${EDUCATION.map(roleRow).join('')}</ul>
  </div>
</section>
</body></html>`;

const tmp = path.join(app, 'scripts', '.portfolio-print.html');
fs.writeFileSync(tmp, await inlineImages(html), 'utf8');
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files'] });
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await page.pdf({ path: OUT, landscape: true, format: 'A4', printBackground: true, preferCSSPageSize: true });
  // PDF_PREVIEW=<folder> also saves a PNG of every page, for checking the layout without a PDF viewer
  if (process.env.PDF_PREVIEW) {
    fs.mkdirSync(process.env.PDF_PREVIEW, { recursive: true });
    await page.setViewport({ width: 1123, height: 794 });
    const pages = await page.$$('.page');
    for (const [i, el] of pages.entries()) await el.screenshot({ path: path.join(process.env.PDF_PREVIEW, `page-${i + 1}.png`) });
  }
  console.log(`${path.relative(app, OUT)}: ${open.length} case studies, ${(fs.statSync(OUT).size / 1024 / 1024).toFixed(1)} MB`);
} finally {
  await browser.close();
  fs.rmSync(tmp, { force: true });
}
