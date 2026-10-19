// Extracts Access Adda content from the original game folder:
//  - src/content/addaRounds.json : the three playable rounds (EN / UR / PS)
//  - src/content/addaDeck.json   : extra card variations shown in the case study
// and exports the card art to public/img/adda/.
// Usage: node scripts/build-adda.mjs "<path to card game peshawar>"
import vm from 'node:vm';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = process.argv[2];
const ROUNDS = ['im_sciences_stairs', 'board_bazar_payment', 'local_bus_route_encoding'];

// Deck variations: scenarios not in the playable rounds, chosen for a range of disabilities.
// Icons are used where a scenario has no illustration of its own.
const DECK = [
  { id: 'islamia_lowvision_hall', person: 'dawood', situation: 'hall', barrier: 'eye' },
  { id: 'brt_blind_commute', person: 'bilal', situation: 'boarding', barrier: 'ear' },
  { id: 'qissa_deaf_kahwa', person: 'mehwish', personIcon: 'sign', situation: 'tea', barrier: 'speech' },
  { id: 'church_hearing_loop', person: 'yousaf', personIcon: 'ear' },
  { id: 'brt_vending_timeout', person: 'parveen', personIcon: 'elder', situation: 'ticketMachine', barrier: 'clock' },
  { id: 'sethi_wheelchair_heritage', person: 'kamran', personIcon: 'wheel' },
];
// New portraits dropped into assets-raw/adda-portraits/<key>.(png|jpg|webp) are picked up automatically
const NEW_PORTRAITS_DIR = path.join(app, '..', 'assets-raw', 'adda-portraits');
const PLACES = ['islamia_college', 'qissa_khwani', 'brt_peshawar', 'sethi_house', 'all_saints_church', 'jahaz_chowk', 'bala_hisar'];
const PORTRAITS = ['areeba', 'rahim', 'dawood', 'bilal'];
const PLACE_ART = ['im_sciences', 'board_bazar', 'local_bus', ...PLACES];

const ctx = { window: {}, console, document: { addEventListener() {} } };
vm.createContext(ctx);
for (const f of ['js/data.js', 'js/translations.js']) {
  const src = (await fs.readFile(path.join(game, f), 'utf8')).replace(/\b(const|let) ([A-Z_][A-Z0-9_]*)\s*=/g, 'var $2 =');
  vm.runInContext(src, ctx);
}
const { GAME_DATA, CHALLENGE_TRANSLATIONS } = ctx;
const challenges = Object.values(GAME_DATA.challenges);
const locations = Object.values(GAME_DATA.locations);
const newPortraits = {};
for (const f of await fs.readdir(NEW_PORTRAITS_DIR).catch(() => [])) {
  const m = f.match(/^([a-z_]+)\.(png|jpe?g|webp)$/i);
  if (m) newPortraits[m[1].toLowerCase()] = path.join(NEW_PORTRAITS_DIR, f);
}
const hasArt = (key) => PLACE_ART.includes(key) || PORTRAITS.includes(key) || key in newPortraits;

const rounds = ROUNDS.map((id) => {
  const c = challenges.find((x) => x.id === id);
  const loc = locations.find((l) => l.id === c.locationId);
  return {
    id,
    placeArt: hasArt(c.locationId) ? `/img/adda/${c.locationId}.webp` : null,
    personArt: hasArt(c.person.avatarKey) ? `/img/adda/${c.person.avatarKey}.webp` : null,
    placeName: { en: loc.name, ur: loc.nameUrdu, ps: loc.namePashto },
    en: c, ur: CHALLENGE_TRANSLATIONS.ur[id], ps: CHALLENGE_TRANSLATIONS.ps[id],
  };
});

const deck = {
  places: PLACES.map((id) => {
    const l = locations.find((x) => x.id === id);
    return { title: l.name, body: l.lore || l.cityArea || '', art: `/img/adda/${id}.webp` };
  }),
  people: DECK.map((d) => {
    const p = challenges.find((x) => x.id === d.id).person;
    return { title: `${p.name}, ${p.age}`, sub: p.assistiveTech, body: p.contextType, art: d.person && hasArt(d.person) ? `/img/adda/${d.person}.webp` : null, icon: d.personIcon };
  }),
  situations: DECK.filter((d) => d.situation).map((d) => {
    const s = challenges.find((x) => x.id === d.id).situation;
    return { title: s.title, body: s.desc, icon: d.situation };
  }),
  barriers: DECK.filter((d) => d.barrier).map((d) => {
    const b = challenges.find((x) => x.id === d.id).barrier;
    return { title: b.title, body: b.desc, icon: d.barrier };
  }),
};

await fs.writeFile(path.join(app, 'src/content/addaRounds.json'), JSON.stringify(rounds, null, 1));
await fs.writeFile(path.join(app, 'src/content/addaDeck.json'), JSON.stringify(deck, null, 1));
await fs.mkdir(path.join(app, 'public/img/adda'), { recursive: true });
for (const key of [...PLACE_ART, ...PORTRAITS]) {
  await sharp(path.join(game, 'assets/cards', `${key}.jpg`)).resize({ width: 640 }).webp({ quality: 84 }).toFile(path.join(app, `public/img/adda/${key}.webp`));
}
for (const [key, file] of Object.entries(newPortraits)) {
  await sharp(file).resize({ width: 640, height: 640, fit: 'cover', position: 'top' }).webp({ quality: 84 }).toFile(path.join(app, `public/img/adda/${key}.webp`));
}
if (Object.keys(newPortraits).length) console.log('new portraits:', Object.keys(newPortraits).join(', '));
console.log(`rounds: ${rounds.length}, deck: ${deck.places.length} places, ${deck.people.length} people, ${deck.situations.length} situations, ${deck.barriers.length} barriers`);
