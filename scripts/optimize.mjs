// Turns the raw source assets in the portfolio folder into web-sized files in public/.
// Re-run with `npm run optimize` whenever a source changes.
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => path.resolve(app, '..', p);
const out = (p) => path.resolve(app, 'public', p);
const works = (p) => `Rabiya's works/${p}`;

// Rabiya's chosen 2D avatar (1024x1536, transparent); swap this file to update every 2D use at once
const AVATAR = 'assets-raw/avatar/rabiya-2d.webp';

// [source, output, width, quality]
const images = [
  // The Sim (new renders, Direction v3)
  // The 2D avatar replaces the older Sim renders everywhere except the 3D hero.
  [AVATAR, 'img/sim-fullbody.webp', 720, 90],
  // Head and shoulders at the source's full resolution (640×800, no upscaling)
  [AVATAR, 'img/portrait-160.webp', 160, 88, { left: 192, top: 0, width: 640, height: 800 }],
  [AVATAR, 'img/portrait-640.webp', 640, 92, { left: 192, top: 0, width: 640, height: 800 }],

  // Work heroes
  [works('vettio/Product Hunt.png'), 'img/work/vettio.webp', 1600, 84],
  [works('cystercare/1.png'), 'img/work/cystercare.webp', 1600, 84],
  [works('crewnity/oct version/finance crew.png'), 'img/work/crewnity.webp', 1600, 84],
  [works('flownet/Landing Page.png'), 'img/work/flownet.webp', 1600, 84],
  [works('devmode/01-landing 1.png'), 'img/work/devmode.webp', 1600, 84],
  [works('repshep/business side/Frame 1000002267.png'), 'img/work/repshep.webp', 1600, 84],
  [works('access adda game/assets/logo.png'), 'img/work/access-adda.webp', 900, 86],

  // Case studies: originals from Rabiya's works (crop = { left, top, width, height } in source px)
  [works('vettio/Frame 1984079135.png'), 'img/cs/vettio/intro.webp', 1600, 86],
  [works('vettio/Frame 1984079136.png'), 'img/cs/vettio/interview.webp', 1600, 86],
  [works('vettio/Frame 1984079137.png'), 'img/cs/vettio/complete.webp', 1600, 86],
  [works('vettio/Candidate profile.png'), 'img/cs/vettio/match.webp', 1600, 86, { left: 236, top: 1780, width: 1204, height: 1045 }],
  [works('vettio/Candidate profile.png'), 'img/cs/vettio/profile.webp', 1600, 86, { left: 236, top: 60, width: 1204, height: 1360 }],
  [works('vettio/Sign Up-2.png'), 'img/cs/vettio/jd-builder.webp', 1600, 86],
  ['assets-raw/vettio-product-hunt/ph-1-interview.png', 'img/cs/vettio/ph-1.webp', 1270, 88],
  ['assets-raw/vettio-product-hunt/ph-2-features.png', 'img/cs/vettio/ph-2.webp', 1270, 88],
  ['assets-raw/vettio-product-hunt/ph-3-profile.png', 'img/cs/vettio/ph-3.webp', 1270, 88],
  ['assets-raw/vettio-product-hunt/ph-4-intake.png', 'img/cs/vettio/ph-4.webp', 1270, 88],

  [works('crewnity/oct version/finance crew.png'), 'img/cs/crewnity/crew.webp', 1600, 86],
  [works('crewnity/oct version/financial doc hesitant sample flow.png'), 'img/cs/crewnity/sample-path.webp', 1600, 86],
  [works('crewnity/oct version/Frame 2147226154.png'), 'img/cs/crewnity/doc-guide.webp', 1600, 86],
  [works('crewnity/oct version/Frame 2147226155.png'), 'img/cs/crewnity/nda.webp', 1600, 86],
  [works('crewnity/oct version/Business questions expanded view-3.png'), 'img/cs/crewnity/review.webp', 1400, 86, { left: 240, top: 2860, width: 950, height: 760 }],
  [works('crewnity/oct version/Business questions expanded view-3.png'), 'img/cs/crewnity/recommend.webp', 1400, 86, { left: 240, top: 3600, width: 950, height: 700 }],
  [works('crewnity/oct version/Business questions expanded view-3.png'), 'img/cs/crewnity/upload.webp', 1400, 86, { left: 240, top: 40, width: 950, height: 880 }],

  // Crewnity workspace: exported from the Figma page "Portfolio (realistic numbers)" (consistent SAR figures)
  ['assets-raw/crewnity-real/dashboard.png', 'img/cs/crewnity/dashboard.webp', 1512, 88, { left: 0, top: 0, width: 1512, height: 912 }],
  ['assets-raw/crewnity-real/dashboard.png', 'img/cs/crewnity/dashboard-2.webp', 1512, 88, { left: 0, top: 912, width: 1512, height: 912 }],
  ['assets-raw/crewnity-real/nav.png', 'img/cs/crewnity/nav.webp', 1512, 88],
  ['assets-raw/crewnity-real/ledger.png', 'img/cs/crewnity/journals.webp', 1512, 88, { left: 0, top: 0, width: 1512, height: 912 }],
  ['assets-raw/crewnity-real/ledger.png', 'img/cs/crewnity/ledger.webp', 1512, 88, { left: 0, top: 952, width: 1512, height: 1050 }],
  ['assets-raw/crewnity-real/journal-new.png', 'img/cs/crewnity/journal-new.webp', 1512, 88],
  ['assets-raw/crewnity-real/assets.png', 'img/cs/crewnity/assets.webp', 1512, 88],
  ['assets-raw/crewnity-real/loans.png', 'img/cs/crewnity/loans.webp', 1512, 88],
  ['assets-raw/crewnity-real/recon-overview.png', 'img/cs/crewnity/recon-overview.webp', 1512, 88],
  ['assets-raw/crewnity-real/recon-chat.png', 'img/cs/crewnity/recon-chat-1.webp', 1512, 88, { left: 0, top: 0, width: 1512, height: 1075 }],
  ['assets-raw/crewnity-real/recon-chat.png', 'img/cs/crewnity/recon-chat-2.webp', 1512, 88, { left: 0, top: 1075, width: 1512, height: 975 }],
  ['assets-raw/crewnity-real/recon-report.png', 'img/cs/crewnity/recon-report.webp', 1512, 88],
  ['assets-raw/crewnity-real/balance-sheet.png', 'img/cs/crewnity/balance-sheet.webp', 1512, 88],
  ['assets-raw/crewnity-real/pnl.png', 'img/cs/crewnity/pnl.webp', 1512, 88],
  ['assets-raw/crewnity-real/cash-flow.png', 'img/cs/crewnity/cash-flow.webp', 1512, 88],
  ['assets-raw/crewnity-real/trial-balance.png', 'img/cs/crewnity/trial-balance.webp', 1512, 88],
  ['assets-raw/crewnity-real/general-ledger.png', 'img/cs/crewnity/general-ledger.webp', 1512, 88],

  [works('flownet/Landing Page.png'), 'img/cs/flownet/landing.webp', 1600, 86, { left: 0, top: 0, width: 1512, height: 925 }],
  [works('flownet/User Differentitator.png'), 'img/cs/flownet/paths.webp', 1600, 86],
  [works('flownet/Dashboard.png'), 'img/cs/flownet/doctor.webp', 1600, 86],
  [works('flownet/Milestone _ Evidence.png'), 'img/cs/flownet/evidence.webp', 1600, 86],
  [works('flownet/supervisor side/Dashboard.png'), 'img/cs/flownet/supervisor.webp', 1600, 86],
  [works('flownet/supervisor side/Frame 2147223324.png'), 'img/cs/flownet/sign-off.webp', 1600, 86],
  [works('flownet/Milestone Completion Animation.png'), 'img/cs/flownet/milestone.webp', 1600, 86],

  [works('cystercare/team peshawar X imaginathon/11.png'), 'img/cs/cystercare/prototype.webp', 1800, 84],
  [works('cystercare/team peshawar X imaginathon/7.png'), 'img/cs/cystercare/research.webp', 1800, 84],
  [works('cystercare/Pain points 1.png'), 'img/cs/cystercare/pain-points.webp', 1600, 84],
  [works('cystercare/team peshawar X imaginathon/17.png'), 'img/cs/cystercare/community.webp', 1800, 84],
  [works('cystercare/team peshawar X imaginathon/14.png'), 'img/cs/cystercare/symptoms.webp', 1800, 84],
  [works('cystercare/team peshawar X imaginathon/16.png'), 'img/cs/cystercare/specialists.webp', 1800, 84],
  [works('cystercare/png of screens/Cycle_Period-3.png'), 'img/cs/cystercare/feed.webp', 786, 86],
  [works('cystercare/png of screens/Cycle_Period-4.png'), 'img/cs/cystercare/research-tab.webp', 786, 86],

  ['assets-raw/access-adda-cover.jpg', 'img/cs/access-adda/cover.webp', 1376, 88],
  [works('access adda game/assets/cards/qissa_khwani.jpg'), 'img/cs/access-adda/qissa-khwani.webp', 1200, 84],
  [works('access adda game/assets/cards/brt_peshawar.jpg'), 'img/cs/access-adda/brt.webp', 1200, 84],
  [works('access adda game/assets/cards/sethi_house.jpg'), 'img/cs/access-adda/sethi-house.webp', 1200, 84],
  [works('access adda game/assets/cards/bilal.jpg'), 'img/cs/access-adda/bilal.webp', 900, 84],
  [works('access adda game/assets/cards/areeba.jpg'), 'img/cs/access-adda/areeba.webp', 900, 84],
  [works('access adda game/assets/cards/dawood.jpg'), 'img/cs/access-adda/dawood.webp', 900, 84],

  // Banao Tamasha: 2x section captures of the style guide (github.com/rabiyaijaz/tamasha.banao, index.html).
  // The resulting webps are committed in public/img/cs/tamasha, so the site never needs these PNGs to run.
  ['assets-raw/banao/hero.png', 'img/cs/tamasha/hero.webp', 1600, 86],
  ['assets-raw/banao/brand-audit.png', 'img/cs/tamasha/brand-audit.webp', 1600, 86, { left: 0, top: 150, width: 2176, height: 1640 }],
  ['assets-raw/banao/puppet-roots.png', 'img/cs/tamasha/roots.webp', 1600, 86],
  ['assets-raw/banao/cast.png', 'img/cs/tamasha/rig.webp', 1600, 86, { left: 0, top: 560, width: 2176, height: 900 }],
  ['assets-raw/banao/cast-grid.png', 'img/cs/tamasha/cast.webp', 1600, 86],
  ['assets-raw/banao/kit.png', 'img/cs/tamasha/kit.webp', 1600, 86],
  ['assets-raw/banao/poster-a.png', 'img/cs/tamasha/poster-a.webp', 1056, 88],
  ['assets-raw/banao/poster-b.png', 'img/cs/tamasha/poster-b.webp', 1056, 88],
  ['assets-raw/banao/poster-c.png', 'img/cs/tamasha/poster-c.webp', 1056, 88],
  ['assets-raw/banao/poster-d.png', 'img/cs/tamasha/poster-d.webp', 840, 88],
  ['assets-raw/banao/flow.png', 'img/cs/tamasha/flow.webp', 1600, 88],
  ['assets-raw/banao/homepage-band.png', 'img/cs/tamasha/homepage-band.webp', 1600, 86],
  ['assets-raw/banao/stage-hero.png', 'img/cs/tamasha/stage-hero.webp', 1600, 86],
  ['assets-raw/banao/acts.png', 'img/cs/tamasha/acts.webp', 1600, 86],
  ['assets-raw/banao/entries.png', 'img/cs/tamasha/entries.webp', 1600, 86],

  [works('repshep/business side/Frame 1000002281.png'), 'img/cs/repshep/poke.webp', 786, 88],
  [works('repshep/business side/Frame 1000002283.png'), 'img/cs/repshep/whatsapp.webp', 786, 88],
  [works('repshep/business side/[Walkthrough] 25.png'), 'img/cs/repshep/failed.webp', 866, 88],
  [works('repshep/business side/[Walkthrough] 28.png'), 'img/cs/repshep/history.webp', 866, 88],
  [works('repshep/business side/Frame 1000002279.png'), 'img/cs/repshep/channels.webp', 866, 88],

  [works('devmode/04-dashboard 1.png'), 'img/cs/devmode/dashboard.webp', 1600, 86],
  [works('devmode/05-curriculum 1.png'), 'img/cs/devmode/curriculum.webp', 1600, 86],
  [works('devmode/06-api-lesson 1.png'), 'img/cs/devmode/api-lesson.webp', 1600, 86],
  [works('devmode/08-build-challenge 1.png'), 'img/cs/devmode/build.webp', 1600, 86],
  [works('devmode/09-architecture-lab 1.png'), 'img/cs/devmode/arch-lab.webp', 1600, 86],
  [works('devmode/07-projects 1.png'), 'img/cs/devmode/projects.webp', 1600, 86],

  // Company logos (About and Resume cards)
  [works('vettio/Assets Vettio/Icon Colour Vettio.png'), 'img/logos/vettio.webp', 160, 90],
  [works('cystercare/favicon.png'), 'img/logos/cystercare.webp', 160, 92],
  // Marks cropped from the products' own screens and badges (a file in assets-raw/logos overrides these)
  ['assets-raw/crewnity-real/dashboard.png', 'img/logos/crewnity.webp', 96, 92, { left: 11, top: 17, width: 23, height: 23 }],
  [works('flownet/Landing Page.png'), 'img/logos/flownet.webp', 96, 92, { left: 38, top: 20, width: 30, height: 30 }],
  [works('access adda game/favicon.svg'), 'img/logos/access-adda.webp', 128, 92],
  ['output/banao-pk-badge.png', 'img/logos/banao.webp', 160, 90, { left: 575, top: 285, width: 430, height: 570 }],

  // About: the room, wants and fears
  ['output/sims-avatar/background.png', 'img/about/room.webp', 1920, 86],
  ['output/sims2-wants-fears/want-studies.png', 'img/about/want-studies.webp', 112, 85],
  ['output/sims2-wants-fears/want-travel.png', 'img/about/want-travel.webp', 112, 85],
  ['output/sims2-wants-fears/want-concert.png', 'img/about/want-concert.webp', 112, 85],
  ['output/sims2-wants-fears/want-movies.png', 'img/about/want-movies.webp', 112, 85],
  ['output/sims2-wants-fears/want-friends.png', 'img/about/want-friends.webp', 112, 85],
  ['output/sims2-wants-fears/fear-lost-work.png', 'img/about/fear-lost-work.webp', 112, 85],
  ['output/sims2-wants-fears/fear-missed-deadlines.png', 'img/about/fear-missed-deadlines.webp', 112, 85],
  ['output/sims2-wants-fears/fear-creative-block.png', 'img/about/fear-creative-block.webp', 112, 85],
  [AVATAR, 'img/about/sim-full.webp', 1024, 90],
  // About HUD (dial, portrait, clock, wants & fears), exported from Rabiya's Figma at 2x
  ['assets-raw/hud-left.png', 'img/about/hud-left.webp', 1427, 92],

  // About: Sim card items
  ['output/sims2-inventory/lenovo-legion.png', 'img/about/inv-lenovo.webp', 160, 85],
  ['output/sims2-inventory/hackathon-medals.png', 'img/about/inv-medals.webp', 160, 85],
  ['output/sims2-inventory/naruto-frog-wallet.png', 'img/about/inv-wallet.webp', 160, 85],
  ['output/banao-pk-badge.png', 'img/about/inv-banao.webp', 160, 85],
  ['output/sims2-inventory/fujifilm-white-camera.png', 'img/about/inv-camera.webp', 160, 85],
  ['output/sims2-inventory/tailwind-shadcn-library.png', 'img/about/inv-tailwind.webp', 160, 85],
  ['output/sims2-inventory/doodh-patti-chai.png', 'img/about/inv-chai.webp', 160, 85],
  ['avatars/teacher_female_hijab.png', 'img/about/rel-shabana.webp', 128, 85],
  ['avatars/boss_male_suit_1.png', 'img/about/rel-mohsin.webp', 128, 85],
  ['avatars/boss_male_suit_2.png', 'img/about/rel-hamad.webp', 128, 85],
  ['avatars/friend_young_male.png', 'img/about/rel-sarim.webp', 128, 85],
  ['avatars/dad_middle_aged.png', 'img/about/rel-ijaz.webp', 128, 85],
  ['output/boss-male-suit-blonde.png', 'img/about/rel-mostafa.webp', 128, 85],
];

const copies = [
  ['Main Docs/RABIYA_IJAZ_EUROPASS_CV_RESUME_SEP_2026.pdf', 'cv/Rabiya-Ijaz-CV.pdf'],
];

for (const [from, to, width, quality, crop] of images) {
  await fs.mkdir(path.dirname(out(to)), { recursive: true });
  let img = sharp(src(from), { limitInputPixels: false });
  if (crop) img = img.extract(crop);
  const info = await img
    .resize({ width, withoutEnlargement: true }).webp({ quality, alphaQuality: 90 }).toFile(out(to));
  console.log(`${to}  ${info.width}x${info.height}  ${Math.round(info.size / 1024)} KB`);
}
// Logo drop folder: assets-raw/logos/<name>.(png|jpg|svg|webp) → img/logos/<name>.webp, whitespace trimmed.
// Names the site knows: crewnity, vettio, flownet, cystercare, apptex, tyut, gdsc, mlsa, lincoln, banao,
// plus tool icons lovable, usertesting, antigravity, figmamake. A dropped file wins over the defaults above.
{
  const dir = src('assets-raw/logos');
  const files = await fs.readdir(dir).catch(() => []);
  for (const f of files.filter((n) => /\.(png|jpe?g|svg|webp)$/i.test(n))) {
    const name = f.replace(/\.[^.]+$/, '').toLowerCase();
    await fs.mkdir(out('img/logos'), { recursive: true });
    const info = await sharp(path.join(dir, f), { density: 300 }).trim({ threshold: 10 })
      .resize({ width: 240, height: 240, fit: 'inside', withoutEnlargement: true }).webp({ quality: 90, alphaQuality: 95 }).toFile(out(`img/logos/${name}.webp`));
    console.log(`img/logos/${name}.webp  ${info.width}x${info.height}  (from assets-raw/logos/${f})`);
  }
}
for (const [from, to] of copies) {
  await fs.mkdir(path.dirname(out(to)), { recursive: true });
  await fs.copyFile(src(from), out(to));
  console.log(`${to}  (copied)`);
}
