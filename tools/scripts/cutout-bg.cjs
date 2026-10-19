// Remove a plain white background by flood-filling from the image edges (keeps white inside the product).
// argv: in out height tolerance
const sharp = require('C:/Users/Rabiya/Downloads/portfolio/app/node_modules/sharp');
const [inp, out, H = 360, TOL = 22] = process.argv.slice(2);
(async () => {
  const img = sharp(inp).resize({ height: +H * 2 }).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const bg = (i) => 255 - Math.min(data[i], data[i + 1], data[i + 2]) <= +TOL && Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) < 14;
  const seen = new Uint8Array(w * h), stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    if (!bg(p * 4)) continue;
    seen[p] = 1;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) stack.push(p - 1); if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w); if (y < h - 1) stack.push(p + w);
  }
  // Clear background; soften a 1px fringe next to it
  for (let p = 0; p < w * h; p++) {
    if (seen[p]) { data[p * 4 + 3] = 0; continue; }
    const x = p % w, y = (p / w) | 0;
    const n = (x > 0 && seen[p - 1]) + (x < w - 1 && seen[p + 1]) + (y > 0 && seen[p - w]) + (y < h - 1 && seen[p + w]);
    if (n) data[p * 4 + 3] = 255 - n * 50;
  }
  const res = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 1 }).webp({ quality: 90, alphaQuality: 90 }).toFile(out);
  console.log(out.split(/[\\/]/).pop(), res.width, res.height, Math.round(res.size / 1024) + ' KB');
})();
