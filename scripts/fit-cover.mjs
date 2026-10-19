// Fits a wide cover (e.g. a 16:9 reel cover) onto the Work cards' 16:11 frame without cropping anything.
//   default (dark, busy covers): a blurred, stretched copy of the cover fills the frame and the full cover sits
//     centred on top with soft top/bottom edges.
//   --bottom (light covers whose bottom runs off the edge by design): the cover sits on the card's bottom edge and
//     the space above is filled with the cover's own background colour, sampled from its top edge.
// Usage: node scripts/fit-cover.mjs <source.png> <public/img/work/name.webp> [--bottom]
import sharp from 'sharp';

const [src, out, mode] = process.argv.slice(2);
if (!src || !out) { console.error('Usage: node scripts/fit-cover.mjs <source> <output.webp> [--bottom]'); process.exit(1); }

const W = 1600, H = 1100; // the card's 16:11
const meta = await sharp(src).metadata();
const h = Math.round((W * meta.height) / meta.width);
if (h > H) { console.error(`Cover is taller than 16:11 (${meta.width}×${meta.height}); this script only pads wide covers.`); process.exit(1); }
const cover = await sharp(src).resize(W, h).toBuffer();

if (mode === '--bottom') {
  // Average a strip along the top edge for the fill, so it matches the cover's own background exactly
  const { data } = await sharp(cover).extract({ left: 0, top: 0, width: W, height: 4 }).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  const background = { r: data[0], g: data[1], b: data[2] };
  await sharp(cover).extend({ top: H - h, background }).webp({ quality: 88 }).toFile(out);
  console.log(`${out}: ${W}×${H}, cover on the bottom edge, fill rgb(${data[0]}, ${data[1]}, ${data[2]})`);
} else {
  const top = Math.round((H - h) / 2);
  const fade = Math.min(60, top); // feather as far as the padding reaches
  // The fill skips a 4% strip at the top and bottom, so edge lines (progress bars, accent rules) don't smear into it
  const inset = Math.round(meta.height * 0.04);
  const bg = await sharp(src).extract({ left: 0, top: inset, width: meta.width, height: meta.height - 2 * inset })
    .resize(W, H, { fit: 'cover' }).blur(60).modulate({ brightness: 0.96 }).toBuffer();
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}"><defs>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${fade / h}" stop-color="#fff"/>
<stop offset="${1 - fade / h}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  const fg = await sharp(cover).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  await sharp(bg).composite([{ input: fg, top, left: 0 }]).webp({ quality: 86 }).toFile(out);
  console.log(`${out}: ${W}×${H}, cover ${W}×${h} centred`);
}
