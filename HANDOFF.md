# Handoff: Rabiya Ijaz portfolio ("Sims 2, if it shipped in 2026")

A gamified, Sims-inspired product-design portfolio for **Rabiya Ijaz** (Lead Product Designer, Peshawar). Audience: clients and hiring managers. Everything here was built in a long Claude Code session; this file is the full picture so another agent (Codex) can pick it up.

Written 2026-10-19. The site builds cleanly (`npm run build`) as of this handoff.

---

## 1. Run, build, deploy

All commands run from this folder (`portfolio/app`).

| Task | Command |
|---|---|
| Install | `npm install` |
| Dev server (port **5181**) | `npm run dev` |
| Production build → `dist/` | `npm run build` |
| Preview the build | `npm run preview` |
| Re-export images from raw sources | `npm run optimize` (= `node scripts/optimize.mjs`) |
| Rebuild Access Adda game data + art | `node scripts/build-adda.mjs "C:\Users\Rabiya\Downloads\card game peshawar"` |

- **Stack:** Vite 8, React 19, react-router 7, three.js 0.169 (GLTFLoader + MeshoptDecoder), `sharp` for image processing. No TypeScript, no CSS framework: hand-written CSS with theme tokens.
- **Deploy:** Vercel (`vercel.json` rewrites every non-asset path to `index.html` for the SPA).
- **Env:** `VITE_FORMSPARK_ID=Vtxypr0sq` in `.env` (template in `.env.example`). It must also be set in the host's environment variables, or the contact form shows "not connected". Formspark delivers to rabiyaijaz99@gmail.com (set in the Formspark dashboard, not in code).
- **Dev-server gotcha:** after edits to several files at once, Vite's hot reload sometimes serves a half-updated module ("X is not defined"). Restart the dev server; it's not a real bug. `vite.config.js` ignores `public/models` and `*.glb` in the watcher (exporting big GLBs used to crash it).

---

## 2. Folder map

```
portfolio/                         ← root (not a git repo)
├─ app/                            ← THE SITE (this folder)
│  ├─ src/
│  │  ├─ pages/        Landing, Work, CaseStudy, About, Resume, Contact, NotFound
│  │  ├─ world/        three.js: neighbourhood.js (street + map + prologue), house.js, fountain.js, scene.js (only phaseForHour is used)
│  │  ├─ story/        landing story: story.js (HOUSES + process CHAPTERS), ProcessStory.jsx, story.css (most landing/shared styles)
│  │  ├─ about/        ToolFlow, OffWork (Spotify / PhotoTrail / ChaiStove), WhoIAm3D, ChaiGlass3D, icons, about.css
│  │  ├─ game/         Access Adda: AccessAdda.jsx (playable 3 rounds), AddaDeck.jsx (card wall), adda.css
│  │  ├─ ui/           TopNav, Room (About HUD), SimMenu, PlumbobCanvas, NightCta, Socials, ContactForm, PhaseSwitch, SoundControl, MapBanner, Pin, Logos, ToolIcon, brandIcons.js (generated) …
│  │  ├─ lib/          audio.js (music + sfx engine), phase.jsx (Day/Dusk/Night), simState.jsx (toasts/wants/needs), scroll.js
│  │  ├─ content/      ALL COPY: projects.js, caseStudies.js, about.js, career.js, addaRounds.json, addaDeck.json
│  │  └─ styles.css, hud.css, room.css
│  ├─ public/          img/, models/, music/, sounds/, seq/ (plumbob frames), video/, cv/, embeds/ (Tamasha stage), fonts/
│  ├─ scripts/         optimize.mjs, build-adda.mjs
│  ├─ tools/           process.html (process artboards), plumbob.html/js, scripts/ (capture + asset helpers, see §6)
│  └─ assets-raw/      whiterabiya-v1.glb (34 MB source of the white sculpt)
├─ assets-raw/                     ← raw sources read by optimize.mjs / build-adda.mjs
│  ├─ avatar/rabiya-2d.webp        the 2D avatar used everywhere 2D
│  ├─ models/rabiya-full.glb       source of the colour 3D character
│  ├─ logos/                       logo drop folder (devmode.png, repshep.png, …)
│  ├─ adda-portraits/PROMPTS.md    prompts for the missing Access Adda art (see §8.1)
│  └─ banao/, crewnity-new/, crewnity-real/, vettio-product-hunt/, plates/, sim/ …
├─ Rabiya's works/                 her project files (Figma exports, PDFs, screens). Read-only source material.
│  ├─ cystercare/png of screens/   real CysterCare screens (786px wide PNGs) used in the process story
│  ├─ vettio/Assets Vettio/        Vettio logos (Icon Colour Vettio.png = the owl)
│  └─ access adda game/assets/cards/  the original Access Adda pixel art
├─ DESIGN.md                       design direction notes (v3 → v4.2, audio)
├─ ASSET-SPEC.md                   asset specs
└─ Main Docs/                      PRIVATE (passport, ID…). Never open, never use.
```

---

## 3. The site, page by page

**Theming:** `html[data-phase="day|dusk|night"]` drives every colour via CSS tokens (`--bg --surface --surface-2 --ink --muted --line --accent --accent-ink --gutter --page`, defined in `styles.css`). The phase follows the visitor's local time and can be switched with `PhaseSwitch` (fixed bottom-left on every page). Dusk has a fixed blue→burnt-orange sky gradient (`--dusk-sky`, `body::before`). Always check all three phases for contrast.

**Landing (`pages/Landing.jsx`, `world/neighbourhood.js`)**
- First visit: a ~4 s **prologue**. The white sculpt (`/models/rabiya-white.glb`) stands in mist with green plumbob shards while the camera orbits her ("Hi, I'm Rabiya."). A green scan line then "formulates" her into the colour model (`/models/rabiya-lite.glb`) via clipping planes, the mist clears, and the camera pulls back to the street. Scrolling, clicking, arrow keys or "Skip intro" skip it; reduced motion skips it entirely. Constants: `WHITE`, `MORPH`, `PROLOGUE_HOLD` at the top of neighbourhood.js.
- Walkable 3D street: arrow keys/WASD work page-wide without focusing the scene, click-to-walk, drag to orbit, pinch/ctrl+wheel zoom. Houses never auto-enter; the visitor presses "Go inside"/Enter. Scrolling flies the camera up into a top-down **map** with logo pins.
- Easter egg: catch frogs at the fountain; they follow her.
- Then `ProcessStory` (Discover → Define → Map → Design → Deliver, CysterCare as the worked example, scrubbed plumbob). **Deliver** is a live animated scene (`DeliverStage` in ProcessStory.jsx: screens pop in and float, then the outcome badges).
- Ends with `NightCta` (contact band, every page).

**Work (`pages/Work.jsx`)**: map banner + filters `All · Human–AI · Research · Healthcare · Service design · Passion projects` (fixed list in `FILTERS`). Passion projects = `passion: true` in projects.js (Access Adda, RepShep, DevMode).

**Case studies (`pages/CaseStudy.jsx`, content in `content/caseStudies.js`)**: sticky TOC with a reading-progress plumbob (reaches 100% at page end). Vettio and Crewnity have hero videos; Tamasha's hero is a live embed (`public/embeds/tamasha-stage.html`); Access Adda embeds the playable game and the card deck.

**About (`pages/About.jsx`)**
- `Room` + HUD (ui/Room.jsx, hud.css): Sims room with a radial mode dial (gently glowing buttons), Sim card, wants and fears, and panels: Needs, Personality, Career & Skills, Relationships, Inventory, Off work. Needs are **read-only**; they fill through the pie menu when you click Rabiya (Make chai, Eat grilled cheese (3 in a row = hidden aspiration), Water the plants, Take a power nap, Say hi, Ask about work).
- Relationships: 6 cards. Hovering one opens a speech-bubble testimonial (portalled to body) with a word-by-word reveal. The 4 reference quotes are condensed from real recommendation letters; Sarim's and Dad's are playful and invented by design.
- "Who I am": scroll-driven 3D scene (`about/WhoIAm3D.jsx`). The camera flies around the white sculpt in 4 shots while text beats appear on the free side. Reduced motion or no WebGL falls back to the photo version (`IntroStatic`).
- How I work (`about/ToolFlow.jsx`): 7 steps with tool chips. Discover lists methods, not tools.
- Off work: Spotify playlist embed (pauses the site music via `holdMusic`), Camera (Instagram polaroid pile + mouse trail, `PhotoTrail.jsx`), Chai (Sims-style stove scene, `ChaiStove.jsx`: action queue, recipe steps, Tapal Danedar jar and Nurpur pack cut-outs on a shelf, and a 3D cutting-chai glass in `ChaiGlass3D.jsx`).

**Resume** (data in `content/career.js`) and **Contact** (Formspark form `ui/ContactForm.jsx` + socials).

**Socials** (`PROFILE.socials` in projects.js): LinkedIn, Behance, Upwork links; Discord `froggie2320` is a copy-to-clipboard button (Discord can't link by username).

**Audio (`lib/audio.js`)**: music and sfx buses, ducking, preferences in localStorage `rn.audio.v1`. Music is on by default and starts as early as the browser allows (first gesture). One mute button; hover splits music and effects.

---

## 4. Rules that must hold (Rabiya's standing instructions)

1. **No invented metrics, results or quotes.** Only what's documented. Mark unknowns, don't fill them. (The Tamasha brief has `[FILL IN]` items; leave them.)
2. **Never mention an HCI master's degree** anywhere.
3. **Case-study changes go everywhere.** When a project's description changes, update every place it appears: `content/projects.js` (headline/type/tags), `content/caseStudies.js`, `story/story.js`, `content/career.js`, `content/about.js`, alt text, `tools/process.html` (then re-capture the boards), map pins, Work cards. Grep for the project name and the old wording before finishing.
4. **Current positioning:**
   - **CysterCare**: "a lifelong AI detection and care system for PCOS/PMOS". Always "PCOS/PMOS" (PCOS was renamed PMOS in 2026; the 2023 guideline keeps its real title).
   - **RepShep**: "an all-in-one gym system with AI retention on WhatsApp" (a complete management system plus AI WhatsApp workflows that nudge members back), for large gyms. Still a personal project with mock data and no research yet.
   - Accessibility is in every project, so it is not a filter or a tag.
5. **Never open `Main Docs/`** (passport, ID, private documents).
6. **Don't rewrite text files with PowerShell `Set-Content`/`Out-File`** without `-Encoding utf8`. It produced mojibake before. Use the editor or Node.
7. Everything must work in **Day, Dusk and Night**, on **phones**, and with **reduced motion**.
8. Rabiya prefers smooth, slow, consistent motion (e.g. the plumbob always scrubs through its own frames; it never spins).

---

## 5. Content: where to edit

| What | File |
|---|---|
| Projects (name, headline, type, tags, cover, meta, `passion`, `heroVideo`, `heroEmbed`) and PROFILE (name, email, CV, socials) | `src/content/projects.js` |
| Case study bodies, stats, images | `src/content/caseStudies.js` |
| Houses on the street (angle, colours, logo, label) and process chapters | `src/story/story.js` |
| Experience and community | `src/content/career.js` |
| HUD: needs, personality, skills, relationships and testimonials, inventory, wants and fears, off work | `src/content/about.js` |
| How I work steps and tools | `src/about/ToolFlow.jsx` (`STEPS`) |
| Tool icons | `src/ui/ToolIcon.jsx`; brand SVGs in `src/ui/brandIcons.js` (generated, §6) |
| Access Adda game data | generated by `scripts/build-adda.mjs`; don't hand-edit the JSON |

---

## 6. Assets and pipelines

**Image pipeline (`scripts/optimize.mjs`)**: reads from `portfolio/assets-raw/…` and `Rabiya's works/…`, writes webp to `public/img/…`. Logo drop folder: `portfolio/assets-raw/logos/<name>.png` → `public/img/logos/<name>.webp`. Avatar: `assets-raw/avatar/rabiya-2d.webp`.

**3D models (`public/models/`)**
- `rabiya-lite.glb` (≈3 MB): colour character, from `assets-raw/models/rabiya-full.glb` via `npx -y @gltf-transform/cli@4 optimize … --compress meshopt` (simplify ratio ≈0.2, 2048px webp textures). Preloaded in `index.html`.
- `rabiya-white.glb` (≈1 MB): white sculpt, from `app/assets-raw/whiterabiya-v1.glb`:
  `npx -y @gltf-transform/cli@4 optimize assets-raw/whiterabiya-v1.glb public/models/rabiya-white.glb --compress meshopt --simplify-ratio 0.12 --simplify-error 0.0004`
- Both are modelled facing +X, so the code rotates them by −90°.
- ⚠ `rabiya.glb` and `rabiya character.glb` (21 MB each) are **unused** but still ship. Delete them before deploying (ask Rabiya first).

**Process artboards (`tools/process.html`)**: five 1200×780 boards (listen, synthesis, blueprint, wireframes, ship) drawn in HTML from real CysterCare material, captured to `public/img/process/*.webp`. Steps:
1. Run the dev server.
2. Capture with `node tools/scripts/process.cjs <outDir> [ids…]` (puppeteer-core plus a local Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`; install puppeteer-core first: `npm i -D puppeteer-core`).
3. Resize each PNG to 1600px webp with sharp.

The wireframes board pairs lo-fi wireframes with real screens cut by `tools/scripts/cutouts.cjs` into `public/img/process/screens/` (symptoms, symptoms-set, welcome, home, agent, specialists).

**Other helper scripts (`tools/scripts/`)**. They have absolute Windows paths inside; adjust them if they move.
- `brand.cjs`: regenerates `src/ui/brandIcons.js` from simple-icons (needs `simple-icons` installed). Current set: figma, miro, hotjar, framer, claude, openai, google, gemini, tailwind, shadcn, html5, css3, python, linkedin, behance, upwork, discord, webflow.
- `cutout-bg.cjs`: removes a plain white background by flood fill (used for `public/img/chai/danedar.webp` and `nurpur.webp`).
- `insta-pick.cjs`: Instagram photos → `public/img/insta/photo-NN.webp` (4:5). Source: `Downloads/(2) Instagram_files`. Order is set in `about/PhotoTrail.jsx` (`ORDER`, Canon shot first).
- Tamasha stage: now `scripts/sync-tamasha.mjs` (not in `tools/`). It rebuilds `public/embeds/tamasha-stage.html` from the style guide on GitHub, https://github.com/rabiyaijaz/tamasha.banao (`index.html`). It runs automatically before every build (`prebuild`, so on every Vercel deploy) or by hand with `npm run sync:tamasha`. If GitHub is unreachable it keeps the committed copy. The Tamasha case-study images in `public/img/cs/tamasha/` are committed too; they were captured from the same guide.
- `themes.cjs`: headless screenshot sheets (`route|scroll|phase`), used for visual checks.

**Plumbob**: transparent frame sequence `public/seq/plumbob-t/000–099.webp` (made with `tools/plumbob.html`). `ui/PlumbobCanvas.jsx` modes: `progress` (scroll-scrubbed), `play`/`loop`, `ending` (the contact-band one: assembles once, breathes, shimmers on hover/overscroll). Frames: 0 whole · 30 shards · 47 threads · 68 wireframe · 97 green glass.

**Logos**: `public/img/logos/<id>.webp`; house roundels can have a padded 512px version in `public/img/logos/house/` (currently Vettio only, listed in `HOUSE_ROUNDELS` in world/house.js).

**Audio**: `public/sounds/ui/*.mp3` (sfx), `public/music/*.mp3` (Sims 2 soundtrack: **copyrighted**, see §8).

**Videos**: `public/video/vettio-intro.mp4`, `crewnity-intro.mp4`. **CV**: `public/cv/Rabiya-Ijaz-CV.pdf`.

---

## 7. How to check work

- Headless Chrome via puppeteer-core is how everything was verified (screenshot sheets per page × phase × width). In the browser console in dev, `window.__hood` is the landing scene (e.g. `__hood.skipIntro()`, `__hood.prologue.stage`).
- Pages with hero videos never go network-idle, so wait for `domcontentloaded` plus a delay instead of `networkidle0`.
- Check at 1440×900, 1280×720, a short laptop (≈1000×560) and a phone (390×800), in Day, Dusk and Night, plus reduced motion (`emulateMediaFeatures prefers-reduced-motion: reduce`).
- Always finish with `npm run build`.

---

## 8. Open tasks

### 8.1 Access Adda portraits: ✅ DONE (2026-10-19)
The 5 portraits and the Hashtnagri bus terminal scene were generated into `card game peshawar/assets/cards/`, copied into `assets-raw/adda-portraits/` (`parveen_bibi.jpg` → `parveen.jpg`), and `local_bus` was added to `PLACE_ART` in `scripts/build-adda.mjs`. The steps below are kept for reference, e.g. to regenerate a portrait.

### (reference) How portraits get in
Mehwish, Yousaf, Parveen Bibi and Kamran (the card deck) and Gul Khan (playable round 3) still show icons, and round 3 has no place illustration. Everything is wired; only the images are missing.
1. Generate them with the prompts in `portfolio/assets-raw/adda-portraits/PROMPTS.md`. Attach the existing art from `Rabiya's works/access adda game/assets/cards/` (areeba, rahim, dawood, bilal) as style references.
2. Save with the exact names into `portfolio/assets-raw/adda-portraits/`: `mehwish.png`, `yousaf.png`, `parveen.png`, `kamran.png`, `gul_khan.png`, `local_bus.png`.
3. Run `node scripts/build-adda.mjs "C:\Users\Rabiya\Downloads\card game peshawar"`. It picks them up automatically, regenerates `addaRounds.json`/`addaDeck.json`, and exports to `public/img/adda/`.
4. Check the Access Adda case study (deck + all 3 game rounds) and build.

### 8.2 Hero and About subtext (done)
- Hero (`pages/Landing.jsx` `.hood__line`, plus `PROFILE.line`): "Product designer for human–AI collaboration. Every house on this street is something I designed."
- About intro (`about/WhoIAm3D.jsx` beat 2 **and** `pages/About.jsx` `IntroStatic`): "I’m Rabiya, a product designer in Peshawar. Over 4+ years across recruitment, finance, healthcare and AI, I’ve done the same thing: made complicated systems feel human." No employer named, so it doesn't date when she changes jobs.
- `NightCta` lede: "Open to new product design projects in human–AI collaboration."
- Still open: the "Who I am" heading ("I design products around the people who live with them").

### 8.3 Before publishing
- **Replace the Sims 2 music** (`public/music/`). It's copyrighted. Use licensed or original tracks with the same file names, or update `TRACKS` in `lib/audio.js`.
- Delete the unused 21 MB GLBs (§6), with Rabiya's OK.
- Set `VITE_FORMSPARK_ID` on the host.

### 8.4 Small, optional
- The inventory item still says "Tailwind + shadcn/ui" (`content/about.js`); shadcn was removed from How I work. Ask whether to make it "Tailwind".
- Discord could become a real profile link if Rabiya shares her numeric user ID.
- `src/about/Journey.jsx` is unused (the section was removed from About in favour of the Resume). Safe to delete.
