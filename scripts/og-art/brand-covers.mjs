/**
 * 平台首頁給 Google 的代表圖：骰子惡魔放正中間、平台外殼的深色底，1:1、4:3、16:9 三種比例
 * （docs/platform-thumbnail.md；Google 建議每種比例各給一張、至少 1200px 寬）。圖上不放字，六個語系共用。
 * JSON-LD 的 `image` 指這三張（app/i18n/jsonld.ts 的 BRAND_COVERS）。標誌改了就重跑：node scripts/og-art/brand-covers.mjs
 */
import sharp from 'sharp';

const BG = '#1c1816'; // globals.css 的 --plat-bg
const SIZES = { '1x1': [1200, 1200], '4x3': [1600, 1200], '16x9': [1920, 1080] };

for (const [name, [w, h]] of Object.entries(SIZES)) {
  const s = Math.round(h * 0.62);
  const mark = await sharp('public/brand/die-mark.svg', { density: 300 }).resize(s, s).png().toBuffer();
  await sharp({ create: { width: w, height: h, channels: 3, background: BG } })
    .composite([{ input: mark, left: Math.round((w - s) / 2), top: Math.round((h - s) / 2) }])
    .png({ palette: true, quality: 90 })
    .toFile(`public/brand/cover-${name}.png`);
  console.log(`  public/brand/cover-${name}.png`);
}
