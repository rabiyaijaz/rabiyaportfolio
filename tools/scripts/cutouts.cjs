// Cut the CysterCare screen exports (786px wide, some tall scroll captures) into one-phone-viewport
// webps for the process story: the top 786×1704 (393×852 pt), resized for crisp 2x display.
const fs = require('fs'), path = require('path');
const sharp = require('C:/Users/Rabiya/Downloads/portfolio/app/node_modules/sharp');
const SRC = "C:/Users/Rabiya/Downloads/portfolio/Rabiya's works/cystercare/png of screens";
const OUT = 'C:/Users/Rabiya/Downloads/portfolio/app/public/img/process/screens';
const PICK = {
  'symptoms': 'Symptoms-1.png',      // Add symptoms: date strip, then the symptoms
  'symptoms-set': 'Chat Page-1.png', // "Your symptoms are all set", with a way back to edit them
  'welcome': 'Welcome-1.png',
  'home': 'Cycle_Period-7.png',      // home: daily check-in, quick actions
  'agent': 'Chat Page.png',          // the CysterCare AI agent
  'specialists': 'Cycle_Period-6.png',
};
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [name, file] of Object.entries(PICK)) {
    const buf = fs.readFileSync(path.join(SRC, file));
    const info = await sharp(buf).extract({ left: 0, top: 0, width: 786, height: 1704 }).resize(460).webp({ quality: 86, alphaQuality: 90 }).toFile(path.join(OUT, `${name}.webp`));
    console.log(name, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`);
  }
})();
