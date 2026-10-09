// scripts/fetch-avatars.mjs
//
// Usage:
//   npm install sharp
//   node scripts/fetch-avatars.mjs
//
// Fill in the URLs below (right-click an icon on a wiki page →
// "Copy image address"), then run. Files land in public/avatars/
// as 256x256 PNGs named after the keys, which must match the
// names in src/constants/avatars.ts.

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const OUT_DIR = 'public/avatars';
const SIZE = 256;

const avatars = {
  anby: 'https://static.wikia.nocookie.net/zenless-zone-zero/images/7/71/Avatar_Anby_Demara.png/revision/latest/scale-to-width-down/64?cb=20241117203401',
  nicole: 'https://static.wikia.nocookie.net/zenless-zone-zero/images/e/e1/Avatar_Nicole_Demara.png/revision/latest/scale-to-width-down/64?cb=20241117203339',
  billy: 'https://static.wikia.nocookie.net/zenless-zone-zero/images/8/8e/Avatar_Starlight_-_Billy_Kid.png/revision/latest/scale-to-width-down/64?cb=20260528194652',
  nekomata: 'https://static.wikia.nocookie.net/zenless-zone-zero/images/5/53/Avatar_Nekomiya_Mana.png/revision/latest/scale-to-width-down/64?cb=20241117203406',
  grace: 'https://static.wikia.nocookie.net/zenless-zone-zero/images/4/49/Avatar_Grace_Howard.png/revision/latest/scale-to-width-down/64?cb=20241117203439',
};

await fs.mkdir(OUT_DIR, { recursive: true });

let ok = 0;
let failed = 0;

for (const [name, url] of Object.entries(avatars)) {
  if (!url) {
    console.log(`skip   ${name} — no url set`);
    continue;
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const buf = Buffer.from(await res.arrayBuffer());

    await sharp(buf)
      .resize(SIZE, SIZE, { fit: 'cover', position: 'top' })
      .png()
      .toFile(path.join(OUT_DIR, `${name}.png`));

    console.log(`saved  ${name}.png`);
    ok++;
  } catch (err) {
    console.error(`FAILED ${name}: ${err.message}`);
    failed++;
  }
}

console.log(`\n${ok} saved, ${failed} failed`);
