// Makes every org logo tile consistent: each mark is trimmed to its own edges, then centred on the same
// 240×240 transparent square, with its longer side at the same size. OrgLogo (ui/Logos.jsx) shows these.
// Usage: node scripts/logos.mjs   (sources below; add a line to update one)
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

sharp.cache(false); // on Windows a cached input keeps the file locked, and some sources are rewritten below
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(app, '..');
// (Banao uses the crisp drawn brick B in ui/Logos.jsx instead of a file.)
const SOURCES = {
  crewnity: `${root}/repshep video/crewnity-cover/assets/logo_raw.png`,
  vettio: `${root}/Rabiya's works/vettio/Assets Vettio/Icon Colour Vettio.png`,
  cystercare: `${app}/public/img/logos/cystercare.webp`,
  gdsc: `${app}/public/img/logos/gdsc.webp`,
  devmode: `${app}/public/img/logos/devmode.webp`,
};
const BOX = 240, MARK = 196; // the mark's longer side fills ~82% of the tile

// Some sources have a flat background baked in (Crewnity's cream square). If the corner pixel is opaque,
// turn every pixel's distance from that colour into alpha, keeping the mark's own colours.
async function knockout(buf) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const [br, bg, bb, ba] = data.slice(0, 4);
  if (ba < 250) return buf; // already transparent
  let far = 1;
  for (let i = 0; i < data.length; i += 4) far = Math.max(far, Math.hypot(data[i] - br, data[i + 1] - bg, data[i + 2] - bb));
  for (let i = 0; i < data.length; i += 4) {
    const d = Math.hypot(data[i] - br, data[i + 1] - bg, data[i + 2] - bb) / far;
    data[i + 3] = Math.round(255 * Math.min(1, Math.max(0, (d - 0.08) / 0.5)));
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

for (const [name, src] of Object.entries(SOURCES)) {
  // Read into memory first, since some sources are the outputs being rewritten
  let input = await sharp(fs.readFileSync(src)).ensureAlpha().png().toBuffer();
  input = await knockout(input);
  const trimmed = await sharp(input).trim({ threshold: 10 }).toBuffer();
  const mark = await sharp(trimmed).resize(MARK, MARK, { fit: 'inside', kernel: 'lanczos3' }).toBuffer();
  const m = await sharp(mark).metadata();
  await sharp({ create: { width: BOX, height: BOX, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: mark, left: Math.round((BOX - m.width) / 2), top: Math.round((BOX - m.height) / 2) }])
    .webp({ quality: 92, alphaQuality: 100 }).toFile(`${app}/public/img/logos/${name}.webp`);
  console.log(`${name.padEnd(11)} mark ${m.width}×${m.height} on ${BOX}×${BOX}`);
}
