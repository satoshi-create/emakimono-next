const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/mimiz/.cursor/projects/c-Users-mimiz-Projects-emakimono-next/assets';
const out = path.join(dir, '_grid');
fs.mkdirSync(out, { recursive: true });

(async () => {
  for (let i = 1; i <= 6; i++) {
    const f = path.join(
      dir,
      `C__Users_mimiz_Projects_emakimono-next_scrolls_rakuchu-rakugai-funaki_sources__crops_A_p0${i}_full.png`
    );
    const m = await sharp(f).metadata();
    const w = m.width * 3, h = m.height * 3;
    const parts = [];
    for (let p = 10; p < 100; p += 10) {
      const x = Math.round((w * p) / 100);
      const y = Math.round((h * p) / 100);
      parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="red" stroke-width="${w * 0.004}" opacity="0.5"/>`);
      parts.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="red" stroke-width="${w * 0.004}" opacity="0.5"/>`);
      parts.push(`<text x="${x + 3}" y="${h * 0.018}" font-size="${w * 0.045}" fill="blue">${p}</text>`);
      parts.push(`<text x="3" y="${y - 4}" font-size="${w * 0.045}" fill="blue">${p}</text>`);
    }
    const buf = Buffer.from(`<svg width="${w}" height="${h}">${parts.join('')}</svg>`);
    await sharp(f).resize(w, h).composite([{ input: buf, top: 0, left: 0 }]).toFile(path.join(out, `p0${i}.png`));
    console.log(`p0${i} ${w}x${h}`);
  }
})().catch((e) => console.error(e));
