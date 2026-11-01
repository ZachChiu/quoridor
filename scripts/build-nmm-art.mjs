/**
 * 九子棋的棋盤與棋子紋理：用無頭 Chrome 把 SVG（feTurbulence 的蛋彩斑駁、筆刷紋、抖動的墨線）烘成 webp，
 * 放 public/games/nine-mens-morris/art/。對局（MorrisBoard）、規則小圖、分享圖（shareCard，Canvas）都貼同一組圖，
 * 手機上不用每一格、每一顆子都即時跑濾鏡（2026-11 Zach 從四種質感裡挑了「手抄本平塗棋盤＋筆觸小人」）。
 *
 * 畫法照《遊戲之書》（1283）那幅插圖：
 * - 棋盤：赭色平塗、深淺不一的斑、直向筆刷紋、零星剝落露出羊皮紙；木條是金色平塗、兩側各一道細墨線、中間一道提白；線條微微抖
 * - 棋子：形狀同 art.ts 的 MAN_PARTS（鐘形小人），細而不均的墨線、蛋彩斑駁、右側同色深一階的平塗帶、左側羊皮紙色提白；
 *   黑方是很深的赭褐（插圖裡的黑子透著木色），不是純黑
 *
 * 幾何（棋盤 106×118、格線 gx／gy、木條位置）要跟 art.ts 一致；改了 art.ts 要重跑：node scripts/build-nmm-art.mjs（要有 Chrome）。
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { openChrome } from './lib/chrome-text.mjs';

const sharp = createRequire(import.meta.url)('sharp');
const OUT = 'public/games/nine-mens-morris/art';

// ── 跟 art.ts 一致 ──
const BOARD_W = 106, BOARD_H = 118, FRAME_INSET = 1.7;
const gx = (i) => 3 + 8 + i * 14;
const gy = (i) => gx(i) + 4;
const MAN_PARTS = [
  'M14 88Q50 99 86 88C82 68 63 58 59 43H41C37 58 18 68 14 88Z',
  'M36 37h28a3.8 3.8 0 0 1 0 7.6H36a3.8 3.8 0 0 1 0-7.6Z',
  'M64.5 24a14.5 14.5 0 1 1-29 0a14.5 14.5 0 1 1 29 0Z',
];
/** 棋子圖比小人的方框（0..100）四邊各多留這麼多，抖動的墨線才不會被裁掉（MorrisBoard 的 PIECE_PAD 同一個數） */
const PAD = 6;

const INK = '#1a0f07', PARCHMENT = '#eee0c4';

const wobble = (id, scale, freq, seed) => `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
const noise = (id, freq, octaves, seed, matrix) => `<filter id="${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${octaves}" seed="${seed}"/>
  <feColorMatrix type="matrix" values="${matrix}"/></filter>`;

function boardSvg() {
  const sq = (i) => `M${gx(i)} ${gy(i)}H${gx(6 - i)}V${gy(6 - i)}H${gx(i)}Z`;
  const lines = [sq(0), sq(1), sq(2),
    `M${gx(3)} ${gy(0)}V${gy(2)}`, `M${gx(3)} ${gy(4)}V${gy(6)}`, `M${gx(0)} ${gy(3)}H${gx(2)}`, `M${gx(4)} ${gy(3)}H${gx(6)}`,
    `M${FRAME_INSET} ${FRAME_INSET}H${BOARD_W - FRAME_INSET}V${BOARD_H - FRAME_INSET}H${FRAME_INSET}Z`].join(' ');
  const r = `<rect width="${BOARD_W}" height="${BOARD_H}"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOARD_W} ${BOARD_H}" width="100%" height="100%" preserveAspectRatio="none"><defs>
  ${noise('bl', '0.035 0.025', 3, 21, '0 0 0 0 0.40 0 0 0 0 0.24 0 0 0 0 0.08 -3.2 0 0 0 1.55')}
  ${noise('st', '0.9 0.018', 2, 7, '0 0 0 0 0.30 0 0 0 0 0.18 0 0 0 0 0.06 -2.2 0 0 0 1.05')}
  ${noise('hi', '0.06 0.04', 2, 33, '0 0 0 0 0.72 0 0 0 0 0.55 0 0 0 0 0.32 0 2.4 0 0 -1.45')}
  ${noise('fl', '0.35', 2, 42, '0 0 0 0 0.90 0 0 0 0 0.82 0 0 0 0 0.66 0 0 9 0 -7.0')}
  ${wobble('wb', 0.7, 0.08, 4)}
  </defs>
  ${r} fill="#94652a"/>${r} filter="url(#bl)"/>${r} filter="url(#hi)"/>${r} filter="url(#st)" opacity="0.35"/>${r} filter="url(#fl)" opacity="0.8"/>
  <g filter="url(#wb)" fill="none" stroke-linecap="square">
    <rect x="0.4" y="0.4" width="${BOARD_W - 0.8}" height="${BOARD_H - 0.8}" stroke="${INK}" stroke-width="0.8"/>
    <path d="${lines}" stroke="${INK}" stroke-width="2.5"/>
    <path d="${lines}" stroke="#c29a4e" stroke-width="1.7"/>
    <path d="${lines}" stroke="#e2c88a" stroke-width="0.35" opacity="0.8"/>
  </g></svg>`;
}

function manSvg(side) {
  const black = side === 'black';
  const body = MAN_PARTS.join(' ');
  const mot = (id, rgb, k, off, freq, seed) => noise(id, freq, 3, seed, `0 0 0 0 ${rgb[0]} 0 0 0 0 ${rgb[1]} 0 0 0 0 ${rgb[2]} ${k} 0 0 0 ${off}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-PAD} ${-PAD} ${100 + PAD * 2} ${100 + PAD * 2}" width="100%" height="100%"><defs>
  <clipPath id="k"><path d="${body}"/></clipPath>
  ${wobble('w', 3.2, 0.05, black ? 3 : 8)}
  ${mot('m', black ? [0.36, 0.25, 0.16] : [0.55, 0.42, 0.26], 1.1, -0.5, 0.045, black ? 2 : 9)}
  ${mot('n', black ? [0.1, 0.06, 0.03] : [0.98, 0.95, 0.86], -1.2, 0.38, 0.07, black ? 12 : 4)}
  </defs><g filter="url(#w)">
  <path d="${body}" fill="${black ? '#3a2414' : '#e9dbbc'}"/>
  <g clip-path="url(#k)"><rect width="100" height="100" filter="url(#m)"/><rect width="100" height="100" filter="url(#n)"/>
    <path d="M60 40 C66 58 82 68 88 90 L100 100 V0 H62 Z M56 8 C66 14 68 30 58 40 L70 40 V0 Z" fill="${black ? '#000' : '#8a6a40'}" opacity="${black ? 0.35 : 0.32}"/></g>
  <g fill="none" stroke="${PARCHMENT}" stroke-linecap="round" opacity="${black ? 0.7 : 0.9}">
    <path d="M28 84 C32 72 39 63 44 52" stroke-width="1.8"/><path d="M36 86 C39 76 44 68 47 60" stroke-width="1.2"/><path d="M41 17 C44 13 48 12 51 12" stroke-width="1.8"/></g>
  <g fill="none" stroke="${INK}" stroke-linejoin="round" stroke-linecap="round">
    <path d="${MAN_PARTS[0]}" stroke-width="${black ? 3 : 3.6}"/><path d="${MAN_PARTS[1]}" stroke-width="2.6"/>
    <path d="${MAN_PARTS[2]}" stroke-width="${black ? 3 : 3.6}"/><path d="M14 88Q50 99 86 88" stroke-width="4.6"/></g>
  </g></svg>`;
}

mkdirSync(OUT, { recursive: true });
const chrome = await openChrome();
try {
  const board = await chrome.renderSvg({ svg: boardSvg(), width: BOARD_W * 10, height: BOARD_H * 10 });
  writeFileSync(`${OUT}/board.webp`, await sharp(board).webp({ quality: 80 }).toBuffer());
  for (const side of ['black', 'white']) {
    const png = await chrome.renderSvg({ svg: manSvg(side), width: 320, height: 320 });
    writeFileSync(`${OUT}/man-${side}.webp`, await sharp(png).webp({ quality: 88, alphaQuality: 100 }).toBuffer());
  }
} finally { await chrome.close(); }
console.log('九子棋紋理 →', OUT);
