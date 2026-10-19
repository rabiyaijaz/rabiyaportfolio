// Builds app/public/embeds/tamasha-stage.html from the stage hero in the Tamasha style guide.
// The puppet rig is copied verbatim (const P ... const onDark) so the embed matches the original.
const fs = require('fs');
const src = fs.readFileSync('C:/Users/Rabiya/Downloads/portfolio/banao-tamasha/tamasha-style-guide.html', 'utf8').split(/\r?\n/);
const start = src.findIndex((l) => l.startsWith('const P = {'));
const end = src.findIndex((l) => l.startsWith('const onDark'));
if (start < 0 || end < 0) throw new Error('rig not found');
const rig = src.slice(start, end + 1).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tamasha stage</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Satisfy&family=Space+Grotesk:wght@400;600&family=Noto+Nastaliq+Urdu:wght@400&display=swap">
<style>
:root { --body: 'Space Grotesk', system-ui, sans-serif; --script: 'Satisfy', 'Brush Script MT', cursive; --urdu: 'Noto Nastaliq Urdu', serif; --ease: cubic-bezier(.2,.6,.2,1); --eo: cubic-bezier(.22,1,.36,1); }
* { box-sizing: border-box; }
html, body { margin: 0; background: #081F14; font-family: var(--body); line-height: 1.6; -webkit-font-smoothing: antialiased; overflow: hidden; }
.btn { display: inline-flex; align-items: center; gap: 11px; font: 600 15px var(--body); text-decoration: none; padding: 13px 22px; border-radius: 12px; border: 0; cursor: pointer; transition: transform .14s var(--ease), background-color .14s var(--ease); }
.btn::before { content: ""; width: 9px; height: 9px; border-radius: 3px; background: #CDB878; transition: transform .14s var(--ease); flex: none; }
.btn:hover { transform: translateY(-1px); } .btn:hover::before { transform: rotate(12deg) scale(1.1); }
.btn .ar { transition: transform .14s var(--ease); } .btn:hover .ar { transform: translateX(4px); }
.btn-gold { background: #CDB878; color: #0F2318; } .btn-gold::before { background: #144A30; } .btn-gold:hover { background: #D9C78E; }
.btn-ghost { background: transparent; color: #F1EEE5; box-shadow: inset 0 0 0 1.5px rgba(241,238,229,.35); } .btn-ghost::before { background: rgba(241,238,229,.5); }
.stagehero { position: relative; overflow: hidden; background: radial-gradient(80% 90% at 50% 10%, #1D6A43 0%, #0F3A25 55%, #081F14 100%); color: #F1EEE5; text-align: center; padding-block: 64px 0; }
.stagehero .valance { position: absolute; z-index: 3; inset: 0 0 auto 0; height: 46px; background: radial-gradient(circle at 30px -10px, #0A2418 38px, transparent 39px) 0 0 / 60px 46px repeat-x; }
.stagehero .valance::after { content: ""; position: absolute; left: 0; right: 0; top: 38px; height: 9px; background: repeating-linear-gradient(90deg, #CDB878 0 10px, transparent 10px 16px); }
.curtain { position: absolute; z-index: 2; top: 0; bottom: 0; width: 52%; background: repeating-linear-gradient(90deg, #0E3523 0 6px, #1E6440 22px, #155234 34px, #0E3523 44px); transition: transform 1.1s var(--eo); }
.curtain.l { left: 0; transform: translateX(-80%); border-right: 6px solid #CDB878; }
.curtain.r { right: 0; transform: translateX(80%); border-left: 6px solid #CDB878; }
.stagehero.closed .curtain.l, .stagehero.closed .curtain.r { transform: translateX(0); transition-duration: .5s; }
.stagehero .troupe { position: relative; z-index: 1; display: flex; justify-content: center; align-items: flex-start; gap: clamp(0px, 3vw, 40px); height: 270px; margin-top: -24px; }
.stagehero .troupe svg { height: 100%; width: auto; max-width: 33%; transition: transform .9s var(--eo); }
.stagehero .troupe svg:nth-child(2) { transition-delay: .12s; } .stagehero .troupe svg:nth-child(3) { transition-delay: .24s; }
.stagehero.closed .troupe svg { transform: translateY(-110%); transition-duration: .3s; transition-delay: 0s; }
.stagehero .copy { position: relative; z-index: 1; padding-inline: 16px; }
.stagehero h1 { font-family: var(--script); font-weight: 400; font-size: clamp(64px, 10vw, 112px); line-height: 1; margin: 0; }
.stagehero .ur { font-family: var(--urdu); color: #CDB878; font-size: clamp(24px, 3vw, 34px); line-height: 2.1; direction: rtl; }
.stagehero p { max-width: 560px; margin: 8px auto 26px; opacity: .88; font-size: 17px; }
.stagehero .ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.stagehero .floor { position: relative; z-index: 1; height: 54px; margin-top: 40px; background: repeating-linear-gradient(90deg, #4A3420 0 120px, #3E2B1A 120px 122px); border-top: 4px solid #CDB878; }
.replay { position: absolute; z-index: 4; right: 14px; bottom: 66px; font: 600 12.5px var(--body); color: #F1EEE5; background: rgba(8,31,20,.7); border: 1px solid rgba(205,184,120,.5); border-radius: 999px; padding: 7px 12px; cursor: pointer; }
.replay:focus-visible, .btn:focus-visible { outline: 2px solid #CDB878; outline-offset: 2px; }
.sway { transform-origin: 0 0; animation: sway var(--dur, 3.4s) ease-in-out infinite alternate; }
@keyframes sway { from { transform: rotate(calc(var(--amp, 3deg) * -1)); } to { transform: rotate(var(--amp, 3deg)); } }
.bob { animation: bob 1.8s ease-in-out infinite alternate; }
@keyframes bob { from { transform: translateY(0); } to { transform: translateY(-5px); } }
.floaty { animation: floaty 2.6s ease-in-out infinite; }
@keyframes floaty { 0%,100% { transform: translateY(0); opacity: .95; } 50% { transform: translateY(-8px); opacity: .6; } }
@media (max-width: 640px) { .stagehero .troupe { height: 190px; } .stagehero p { font-size: 15px; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
</style>
</head>
<body>
<div class="stagehero closed" id="stageHero">
  <div class="valance" aria-hidden="true"></div>
  <div class="curtain l" aria-hidden="true"></div><div class="curtain r" aria-hidden="true"></div>
  <div class="troupe" id="troupe" aria-hidden="true"></div>
  <div class="copy">
    <h1>Tamasha</h1>
    <div class="ur" lang="ur">تماشا</div>
    <p>Banao's first talent show. Builders have more than one trick. Show us the other one.</p>
    <div class="ctas"><button class="btn btn-gold" type="button" data-replay>Enter your act <span class="ar">→</span></button><button class="btn btn-ghost" type="button" data-replay>See the acts</button></div>
  </div>
  <div class="floor" aria-hidden="true"></div>
  <button class="replay" type="button" data-replay>↻ Replay the parda</button>
</div>
<script>
(() => {
${rig}

document.getElementById('troupe').innerHTML = [['comic', 92, .3], ['singer', 40, 0], ['poet', 92, 1.4]].map(([k, L, d]) =>
  \`<svg viewBox="-105 -40 210 330">\${mk(k, Object.assign({ x: 0, y: -10, s: .95, L, delay: d }, onDark), P.gold)}</svg>\`).join('');

const hero = document.getElementById('stageHero');
const open = () => hero.classList.remove('closed');
const replay = () => { hero.classList.add('closed'); setTimeout(open, 650); };
document.querySelectorAll('[data-replay]').forEach((b) => b.addEventListener('click', replay));

// The parda rises the first time the stage scrolls into view
if (matchMedia('(prefers-reduced-motion: reduce)').matches) open();
else {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); setTimeout(open, 350); } }, { threshold: 0.15 });
  io.observe(hero);
}

// Tell the case study page how tall the stage is, so the frame never scrolls
const report = () => parent.postMessage({ tamashaStage: hero.offsetHeight }, location.origin);
new ResizeObserver(report).observe(hero);
document.fonts && document.fonts.ready.then(report);
})();
</script>
</body>
</html>
`;
fs.mkdirSync('C:/Users/Rabiya/Downloads/portfolio/app/public/embeds', { recursive: true });
fs.writeFileSync('C:/Users/Rabiya/Downloads/portfolio/app/public/embeds/tamasha-stage.html', html);
console.log('rig lines', end - start + 1);
