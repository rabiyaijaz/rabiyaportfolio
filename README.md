# Rabiya Ijaz · Product Designer Portfolio

**A portfolio you can walk around in.** My product design work, built as a Sims-inspired neighbourhood: every house on the street is a project I designed. Walk my Sim up to a door to step inside a case study, or scroll up to see the whole map.

I'm Rabiya, a Lead Product Designer based in Peshawar, Pakistan, designing AI products people can understand and trust. This site is itself a design project: research-led, accessible, and built with AI tools that I designed for and directed.

---

## What's inside

### 🏘️ A walkable 3D neighbourhood
- The landing page is a real-time 3D street. My Sim walks with the arrow keys or a click, and you can drag to look around.
- On a first visit, a white sculpt of me turns into my full-colour Sim before the street appears.
- Scroll and the camera rises into a top-down map, with logo pins for every project.
- Hidden detail: there are frogs at the fountain you can catch.

### 📂 Case studies
| Project | What it is |
|---|---|
| **Crewnity** | Designing human-AI collaboration for small and medium-sized Saudi businesses' finances |
| **Vettio** | An AI hiring platform that keeps candidates and recruiters in the loop |
| **Flownet** | Designing shared workspaces for apprenticeships in Swedish government hospitals |
| **CysterCare** | A lifelong AI detection and care system for PCOS/PMOS |
| **Tamasha Banao** | Design strategy for a talent night at Banao.pk, Pakistan's builder community |
| **Access Adda** | An interactive card game translating Peshawar's physical barriers into universal design interventions (playable in the browser) |
| **RepShep** | An all-in-one gym system with AI retention on WhatsApp |
| **DevMode** | A course that teaches designers to build with AI |

### 🔁 My design process
Discover → Define → Map → Design → Deliver, told through a scroll-driven plumbob and real artefacts from the CysterCare project: research, affinity maps, a service blueprint, wireframes next to the final UI, and the shipped work.

### 🙋 About me, the Sims way
- A Sims-style room and HUD with needs, personality, skills and inventory. Click my Sim to make chai, eat a grilled cheese or take a power nap.
- Hover a relationship to read testimonials drawn from real recommendation letters.
- A scroll-driven 3D portrait.
- What keeps me going off work: a playlist, a camera, and a stove where my Sim makes doodh patti chai.

### 🌗 Day, Dusk and Night
The whole site follows your local time, and you can switch it yourself. There's also an optional soundtrack and sound effects with one mute button.

---

## Built with
- **React 19** and **Vite**
- **three.js** for the 3D neighbourhood, characters and the chai glass
- **React Router** for pages and case studies
- **Formspark** for the contact form
- Hand-written CSS with theme tokens, no UI framework
- Designed in **Figma**; built with AI coding partners (Claude, Codex) under my design direction

## Accessibility
- Every page works with the keyboard.
- All animation respects *reduced motion*: 3D scenes fall back to still versions.
- Colour contrast is checked in all three themes.
- Images have descriptive alt text.

---

## Run it locally
```bash
npm install
npm run dev        # http://localhost:5181
npm run build      # production build in dist/
```

Copy `.env.example` to `.env` and add your Formspark form ID to enable the contact form:
```
VITE_FORMSPARK_ID=your_form_id
```

## Deploy (Vercel)
1. Import this repository in Vercel. The framework preset is **Vite**; the build command is `npm run build` and the output folder is `dist`.
2. Add `VITE_FORMSPARK_ID` under **Settings → Environment Variables**.
3. `vercel.json` already routes every page to the app.

---

## Contact
- **LinkedIn:** [rabiya-ijaz](https://www.linkedin.com/in/rabiya-ijaz-05ab32202/)
- **Behance:** [bloheart666](https://www.behance.net/bloheart666)
- **Upwork:** [Rabiya Ijaz](https://www.upwork.com/freelancers/~01e7e61860c43d4c00)
- Or use the message form on the site.

---

<sub>© 2026 Rabiya Ijaz. All case-study content, designs and artwork are my own work or used with permission, and may not be reused. The Sims is a trademark of Electronic Arts; this is an independent, fan-inspired portfolio with no affiliation.</sub>
