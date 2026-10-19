// Write app/src/ui/brandIcons.js from simple-icons (CC0 SVG paths).
const si = require('simple-icons');
const fs = require('fs');
const pick = { figma: 'siFigma', miro: 'siMiro', hotjar: 'siHotjar', framer: 'siFramer', claude: 'siClaude', openai: 'siOpenai', google: 'siGoogle', gemini: 'siGooglegemini', tailwind: 'siTailwindcss', shadcn: 'siShadcnui', html5: 'siHtml5', css3: 'siCss3', python: 'siPython', linkedin: 'siLinkedin', behance: 'siBehance', upwork: 'siUpwork', discord: 'siDiscord', webflow: 'siWebflow' };
const out = Object.fromEntries(Object.entries(pick).map(([k, v]) => [k, { title: si[v].title, hex: '#' + si[v].hex, path: si[v].path }]));
fs.writeFileSync('C:/Users/Rabiya/Downloads/portfolio/app/src/ui/brandIcons.js',
  `// Brand marks for the tools I use, from simple-icons (CC0, https://simpleicons.org). Generated; don't edit by hand.\nexport const BRANDS = ${JSON.stringify(out, null, 1)};\n`);
console.log(Object.keys(out).join(', '));
