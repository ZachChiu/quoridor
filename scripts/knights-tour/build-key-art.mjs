#!/usr/bin/env node
/**
 * 騎士巡遊在平台上的三張圖（2026-11-03 Zach 從 A／B／C 挑了 B：「學虎棋」，背後的棋盤不要重複、要有不同路線）：
 *   public/games/knights-tour/hero-wide.webp    1600×660  桌機大卡片，字壓在左邊，棋盤放右
 *   public/games/knights-tour/hero-square.webp  1080×1080 手機大卡片，下面五分之三蓋著黑色漸層與字，棋盤放上半
 *   public/games/knights-tour/card.webp         960×540   小卡片，左上是「可以玩」、左下是名字
 *
 * 跟 Wall Go、尼泊爾虎棋同一個做法：前景是**遊戲裡真的棋盤**（練習模式 8×8 照歐拉的走法下了 20 步、騎士停在正中間，微斜 3°），
 * 底是那款的世界 —— 一疊散開的手稿紙，每張是一條**不同的**騎士巡遊（數字表＋紅粉筆路線，照首頁 Fig. 1 的畫法）。
 * 路線用 Warnsdorff 法則加亂數平手規則產生、每條都驗過是 64 格的合法巡遊，同一張圖裡沒有兩張一樣的。亂數有固定種子，重跑結果一樣。
 *
 * 前景的棋盤是截圖 scripts/knights-tour/board.webp：本機 dev 開 /knights-tour#practice-8，依 euler.ts 的前 20 格點下去（第 20 步是 28 號格，四個中心格之一；11/3 Zach：「騎士剛好跳到中間，不要卡在四角」，原本 23 步停在最下面一排），
 * 把 [data-dot] 藏起來（可走的提示點），截 [role=group] 外層那塊（3 倍解析度）。對局畫面改了要重截。
 *
 *   node scripts/knights-tour/build-key-art.mjs
 *
 * 數字用系統的 Georgia 畫（librsvg 找系統字型），在 macOS 上跑。
 */
import sharp from 'sharp';

const OUT = 'public/games/knights-tour';
const BOARD = 'scripts/knights-tour/board.webp';
const PAPER = '#edddc7', SHEET = '#f1e4d0', INK = '#322e2a', CHALK = '#a5583a';

// 固定種子的亂數（mulberry32）
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const JUMPS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const next = (s) => JUMPS.map(([dr, dc]) => [Math.floor(s / 8) + dr, (s % 8) + dc])
  .filter(([r, c]) => r >= 0 && r < 8 && c >= 0 && c < 8).map(([r, c]) => r * 8 + c);

/** Warnsdorff：出路最少的先走，平手用亂數挑；走不完就重來 */
function tour(rand) {
  for (;;) {
    const seen = new Set([Math.floor(rand() * 64)]);
    const path = [...seen];
    while (path.length < 64) {
      const options = next(path[path.length - 1]).filter((s) => !seen.has(s))
        .map((s) => ({ s, deg: next(s).filter((t) => !seen.has(t)).length, k: rand() }))
        .sort((a, b) => a.deg - b.deg || a.k - b.k);
      if (!options.length) break;
      seen.add(options[0].s);
      path.push(options[0].s);
    }
    if (path.length === 64) return path;
  }
}

function valid(path) {
  return path.length === 64 && new Set(path).size === 64
    && path.every((s, i) => i === 0 || next(path[i - 1]).includes(s));
}

const rand = rng(1759); // 歐拉那篇論文的年份
const TOURS = [];
const keys = new Set();
while (TOURS.length < 48) {
  const t = tour(rand);
  if (!valid(t)) throw new Error('不是合法的巡遊');
  const k = t.join(',');
  if (!keys.has(k)) { keys.add(k); TOURS.push(t); }
}

/** 一張手稿紙：底色、細框、這條路線的紅粉筆線、每格的步數 */
function sheet(path, size) {
  const c = size / 8;
  const ctr = (s) => [(s % 8) * c + c / 2, Math.floor(s / 8) * c + c / 2];
  const d = path.map((s, i) => { const [x, y] = ctr(s); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join('');
  const nums = path.map((s, i) => {
    const [x, y] = ctr(s);
    return `<text x="${x.toFixed(1)}" y="${(y + c * 0.17).toFixed(1)}" text-anchor="middle" font-family="Georgia" font-size="${(c * 0.42).toFixed(1)}" fill="${INK}" fill-opacity="0.24">${i + 1}</text>`;
  }).join('');
  const m = c * 0.35;
  return `<rect x="${-m}" y="${-m}" width="${size + 2 * m}" height="${size + 2 * m}" fill="${SHEET}" stroke="${INK}" stroke-opacity="0.16" stroke-width="1.2"/>`
    + `<rect width="${size}" height="${size}" fill="none" stroke="${INK}" stroke-opacity="0.2" stroke-width="1.4"/>`
    + `<path d="${d}" fill="none" stroke="${CHALK}" stroke-opacity="0.28" stroke-width="${(c * 0.055).toFixed(2)}" stroke-linejoin="round" stroke-linecap="round"/>`
    + nums;
}

/** 整面鋪滿：錯開的格子上每張各自微轉、微移，像一疊攤開的紙；同一張圖裡每張都是不同路線 */
function background(w, h, size, seed) {
  const r = rng(seed);
  const pick = [...TOURS].sort(() => r() - 0.5);
  const gap = size * 0.92;
  const sheets = [];
  let i = 0;
  for (let row = -1; row * gap < h + size; row++) {
    for (let col = -1; col * gap < w + size; col++) {
      if (i >= pick.length) throw new Error('路線不夠鋪滿這張圖');
      const x = col * gap + (row % 2 ? gap / 2 : 0) + (r() - 0.5) * size * 0.18;
      const y = row * gap + (r() - 0.5) * size * 0.18;
      const deg = (r() - 0.5) * 12;
      sheets.push({ z: r(), body: `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(2)} ${size / 2} ${size / 2})">${sheet(pick[i++], size)}</g>` });
    }
  }
  sheets.sort((a, b) => a.z - b.z);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${PAPER}"/>${sheets.map((s) => s.body).join('')}</svg>`;
}

/** 前景：真的棋盤，跟對局裡一樣只有一圈墨框（不加紙邊：11/3 Zach 問「為什麼多一個白色外框」，對局裡的棋盤沒有），斜放 */
async function board(size, deg) {
  const bw = Math.max(3, Math.round(size * 0.008));
  const inner = await sharp(BOARD).resize(size).composite([{ input: Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect x="${bw / 2}" y="${bw / 2}" width="${size - bw}" height="${size - bw}" fill="none" stroke="${INK}" stroke-width="${bw}"/></svg>`) }]).png().toBuffer();
  const rot = await sharp(inner).rotate(deg, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  // 輕陰影：同一塊的形狀塗黑、模糊、淡淡地壓在底下
  const { width, height } = await sharp(rot).metadata();
  const alpha = await sharp(rot).extractChannel('alpha').toBuffer();
  const shadow = await sharp({ create: { width, height, channels: 3, background: '#2a1d12' } })
    .joinChannel(await sharp(alpha).linear(0.38, 0).toBuffer()).blur(Math.max(4, size * 0.02)).png().toBuffer();
  return { rot, shadow, width, height };
}

async function make(file, w, h, { sheet: sheetSize, size, deg, cx, cy, seed, quality }) {
  const bg = Buffer.from(background(w, h, sheetSize, seed));
  const b = await board(size, deg);
  const left = Math.round(cx * w - b.width / 2), top = Math.round(cy * h - b.height / 2);
  const off = Math.round(size * 0.015);
  const info = await sharp(bg).composite([
    { input: b.shadow, left: left + off, top: top + off * 2 },
    { input: b.rot, left, top },
  ]).webp({ quality }).toFile(`${OUT}/${file}`);
  console.log(`${file} ${w}×${h} ${(info.size / 1024).toFixed(0)} KB`);
}

await make('hero-wide.webp', 1600, 660, { sheet: 300, size: 470, deg: 3, cx: 0.77, cy: 0.51, seed: 1, quality: 62 });
await make('hero-square.webp', 1080, 1080, { sheet: 300, size: 520, deg: 3, cx: 0.56, cy: 0.36, seed: 2, quality: 62 });
// 小卡片的棋盤上下置中（11/3 Zach：「現在偏上」，原本 cy 0.40、上緣被切掉）；手機方圖下半蓋著字，所以仍偏上
await make('card.webp', 960, 540, { sheet: 230, size: 340, deg: 3, cx: 0.64, cy: 0.50, seed: 3, quality: 66 });
