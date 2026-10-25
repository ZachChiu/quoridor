#!/usr/bin/env node
/**
 * 平台首頁分享圖的背景：七款的卡片斜排成一面牆（2026-10-25 Zach：「可以放多個遊戲集結的感覺」）。
 * 產出 scripts/og-art/platform.jpg，build-og-images.mjs 拿它鋪滿、字靠左壓在上面。
 *
 * 卡片＝平台首頁每款小卡片的那張圖（catalog 的 look.art），16:9 裁切；深墨底、左邊一道漸層讓字壓得住。
 * 每張卡各自旋轉後放到斜的格子上：看得到的右半邊七款各出現一次，被漸層蓋住的左半邊才重複，相鄰的不會是同一款。
 *
 * 棋盤類的卡片（Wall Go、尼泊爾虎棋、騎士巡遊）跟著整面牆斜放，Wall Go 與虎棋的卡片圖本身又是斜的，棋盤就歪得很明顯。
 * 10/25 Zach：「棋盤類的擺正重新輸出」—— 這三張改用擺正的盤面，並反向轉回牆的斜度，在圖上看起來是正的
 *（Wall Go 用同一份 card.svg 把裡面的斜度換掉；虎棋用 og-art/bagh-chal.webp，它自己分享圖那張擺正的）。
 *
 * 要在七款都合進來的樹上跑（beta），平台分支上只有 Wall Go 與虎棋的圖：
 *   node scripts/og-art/collage.mjs   →  把產出的 platform.jpg 帶回平台分支 commit
 */
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const W = 1200, H = 630, INK = '#141010';
// 順序就是右半邊由上到下、由右到左出現的順序
const CARDS = [
  'public/games/time-auction/auction.webp', 'public/games/nine-mens-morris/libro.webp', 'public/games/knights-tour/plate.webp',
  'public/games/wall-go/card.svg', 'public/games/balance-mancala/card.webp', 'public/games/blind-gomoku/pojagi.webp',
  'public/games/bagh-chal/key-art.webp',
];
const CW = 256, CH = 144, GAP = 16, R = 16, DEG = Number(process.env.DEG ?? -12);
// DEG、OUT 是試別的斜度時用的（DEG=0 是整面牆擺正）
const OUT = process.env.OUT ?? 'scripts/og-art/platform.jpg';

/**
 * 點陣圖轉過之後四角是空的：只取轉完還完整的中間那塊 16:9。
 * 給了 fill 就改成四角補那個顏色、整張留著（騎士巡遊的數字盤在畫面右邊，取中間會被切掉）。
 */
async function turnRaster(src, fill) {
  if (fill) return sharp(src).rotate(-DEG, { background: fill }).png().toBuffer();
  const { width: W0, height: H0 } = await sharp(src).metadata();
  const a = Math.abs((DEG * Math.PI) / 180), c = Math.cos(a), s = Math.sin(a);
  const k = Math.min(W0 / (16 * c + 9 * s), H0 / (16 * s + 9 * c));
  const w = Math.floor(16 * k), h = Math.floor(9 * k);
  const turned = await sharp(src).rotate(-DEG, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const m = await sharp(turned).metadata();
  return sharp(turned).extract({ left: Math.floor((m.width - w) / 2), top: Math.floor((m.height - h) / 2), width: w, height: h }).png().toBuffer();
}

/**
 * 棋盤類：先轉成跟牆反方向的角度，卡片跟著牆轉回去之後棋盤就是正的。
 * 回傳 sharp 的輸入（Buffer），之後照一般卡片裁成 16:9。
 */
const UPRIGHT = {
  'public/games/wall-go/card.svg': async () =>
    // 原本斜放、放大、偏右上（盤面只露一角）；擺正後整盤放在中間，轉過之後四角也不會被裁掉
    Buffer.from(readFileSync('public/games/wall-go/card.svg', 'utf8')
      .replace('translate(1060 380) rotate(-14) scale(1.45)', `translate(800 450) rotate(${-DEG}) scale(1.02)`)),
  // 虎棋用它自己分享圖那張擺正的方圖（og-art/bagh-chal.webp）；騎士巡遊的數字盤本來就是正的，只要反向轉
  'public/games/bagh-chal/key-art.webp': () => turnRaster('scripts/og-art/bagh-chal.webp'),
  'public/games/knights-tour/plate.webp': async () => {
    // 四角補紙色：取左上角內側一點的顏色（最外緣是外框線）
    const f = 'public/games/knights-tour/plate.webp';
    const { data } = await sharp(f).extract({ left: 40, top: 60, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
    return turnRaster(f, { r: data[0], g: data[1], b: data[2], alpha: 1 });
  },
};
const t = (DEG * Math.PI) / 180;
const u = [Math.cos(t) * (CW + GAP), Math.sin(t) * (CW + GAP)];
const v = [-Math.sin(t) * (CH + GAP), Math.cos(t) * (CH + GAP)];
const round = Buffer.from(`<svg width="${CW}" height="${CH}"><rect width="${CW}" height="${CH}" rx="${R}"/></svg>`);

const tiles = await Promise.all(CARDS.map(async (f) => {
  const input = UPRIGHT[f] ? await UPRIGHT[f]() : f;
  const flat = await sharp(input, { density: 144 }).resize(CW, CH, { fit: 'cover' }).composite([{ input: round, blend: 'dest-in' }]).png().toBuffer();
  return sharp(flat).rotate(DEG, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}));
const tm = await sharp(tiles[0]).metadata();

// 斜格子：奇數列錯開半張
const O = [700, 60];
const slots = [];
for (let r = -2; r < 7; r++) for (let c = -5; c < 3; c++) {
  const x = O[0] + c * u[0] + r * v[0] + (r % 2 ? u[0] / 2 : 0);
  const y = O[1] + c * u[1] + r * v[1] + (r % 2 ? u[1] / 2 : 0);
  if (x < -CW || x > W + CW || y < -CH || y > H + CH) continue;
  slots.push({ x, y });
}
// 看得到的七格依序放七款
const used = new Map();
slots.filter((s) => s.x > 540 && s.x < W - 100 && s.y > 55 && s.y < H - 55).sort((a, b) => a.y - b.y || b.x - a.x)
  .slice(0, CARDS.length).forEach((s, i) => used.set(s, i));
// 其餘的：旁邊沒有的裡面挑目前用得最少的，越右邊越先決定
const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < (CW + GAP) * 1.25;
let k = 0;
for (const s of slots.filter((x) => !used.has(x)).sort((a, b) => b.x - a.x)) {
  const taken = new Set(slots.filter((o) => used.has(o) && near(o, s)).map((o) => used.get(o)));
  const count = (i) => [...used.values()].filter((x) => x === i).length;
  const n = tiles.length;
  used.set(s, tiles.map((_, i) => i).filter((i) => !taken.has(i)).sort((a, b) => count(a) - count(b) || ((a - k + n) % n) - ((b - k + n) % n))[0]);
  k += 3;
}
// composite 不吃負座標：放在加了邊的大畫布上再裁
const P = 400;
const big = await sharp({ create: { width: W + 2 * P, height: H + 2 * P, channels: 4, background: INK } })
  .composite(slots.map((s) => ({ input: tiles[used.get(s)], left: Math.round(s.x - tm.width / 2) + P, top: Math.round(s.y - tm.height / 2) + P })))
  .png().toBuffer();
const crop = await sharp(big).extract({ left: P, top: P, width: W, height: H }).png().toBuffer();
const shade = Buffer.from(`<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" x2="1">
  <stop offset="0" stop-color="${INK}" stop-opacity="1"/><stop offset="0.36" stop-color="${INK}" stop-opacity="0.95"/>
  <stop offset="0.58" stop-color="${INK}" stop-opacity="0.4"/><stop offset="1" stop-color="${INK}" stop-opacity="0.04"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/></svg>`);
await sharp(crop).composite([{ input: shade }]).jpeg({ quality: 86, mozjpeg: true }).toFile(OUT);
console.log(`✓ ${OUT}`);
