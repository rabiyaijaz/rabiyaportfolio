// Turn the picked Instagram posts into small 4:5 webp photos for the About camera card, plus a preview sheet.
// argv: folder, outDir, sheet.png, ...indices (as numbered in insta.cjs)
const fs = require('fs'), path = require('path');
const sharp = require('C:/Users/Rabiya/Downloads/portfolio/app/node_modules/sharp');
const [dir, outDir, sheet, ...picks] = process.argv.slice(2);
(async () => {
  const files = fs.readdirSync(dir).filter((f) => /_n(\(\d\))?\.jpg$/i.test(f)).sort();
  fs.mkdirSync(outDir, { recursive: true });
  const tiles = [];
  for (const [k, i] of picks.entries()) {
    const src = fs.readFileSync(path.join(dir, files[+i])); // read first: avoids a Windows file lock
    const name = `photo-${String(k + 1).padStart(2, '0')}.webp`;
    const info = await sharp(src).rotate().resize(400, 500, { fit: 'cover', position: sharp.strategy.attention }).webp({ quality: 80 }).toFile(path.join(outDir, name));
    console.log(name, '<-', i, `${Math.round(info.size / 1024)} KB`);
    tiles.push(await sharp(path.join(outDir, name)).resize(200, 250).toBuffer());
  }
  await sharp({ create: { width: 200 * Math.min(7, tiles.length), height: 250 * Math.ceil(tiles.length / 7), channels: 3, background: '#fff' } })
    .composite(tiles.map((input, i) => ({ input, left: (i % 7) * 200, top: Math.floor(i / 7) * 250 }))).png().toFile(sheet);
})();
