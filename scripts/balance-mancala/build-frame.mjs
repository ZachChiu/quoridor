// 均衡曼卡拉的頁邊（border-image，84×84、slice 28、邊段 28 一段藤蔓）。
// node scripts/balance-mancala/build-frame.mjs → public/games/balance-mancala/frame.svg（頁面用）＋ frame-card.png（3 倍，結算分享圖的 Canvas 用：
// Canvas 從 SVG 切九宮格時是照 84px 的原尺寸點陣化再放大，會糊）。顏色出處見 app/components/balance-mancala/palette.ts。
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';
const B = 28, S = 84;
const f = (v) => +v.toFixed(2);
function frame(bg, edge, corner) {
  const place = [[B, 0, 0], [S, B, 90], [S - B, S, 180], [0, S - B, 270]];
  const corners = [[0, 0, 0], [S, 0, 90], [S, S, 180], [0, S, 270]];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">`
    + (bg ? `<rect width="${S}" height="${S}" fill="${bg}"/>` : '')
    + place.map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})">${edge}</g>`).join('')
    + corners.map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})">${corner}</g>`).join('')
    + `</svg>`;
}

// 頁邊的墨線藤蔓、金色常春藤葉（金點描墨邊），內側一道金線；四角一朵群青＋朱紅的花。羊皮紙底。
{
  const vel = '#eedec1', ink = '#3f3833', gold = '#d2ae67', goldD = '#9c7436', blue = '#3f5063', red = '#ac6744', green = '#628a54';
  const pts = [];
  for (let x = 0; x <= 28; x += 1) pts.push(`${x} ${f(13 + 4.2 * Math.sin((x / 28) * Math.PI * 2))}`);
  const vine = `<polyline points="${pts.join(' ')}" fill="none" stroke="${ink}" stroke-width="0.8"/>`;
  const leaf = (x, y, flip) => `<path d="M${x} ${y} q ${flip * 2.6} -3.2 0 -6.4 q ${-flip * 2.6} 3.2 0 6.4 Z" fill="${gold}" stroke="${goldD}" stroke-width="0.5" transform="rotate(${flip * 35} ${x} ${y})"/>`
    + `<path d="M${x} ${y} l ${flip * 1.2} ${-0.4}" stroke="${ink}" stroke-width="0.5"/>`;
  const dots = [[3, 4], [10.5, 22.5], [17.5, 4], [24.5, 22.5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.9" fill="${gold}" stroke="${ink}" stroke-width="0.35"/>`
    + `<path d="M${x} ${y} l 0 ${y < 13 ? 2.4 : -2.4}" stroke="${ink}" stroke-width="0.45"/>`).join('');
  const edge = `<rect width="28" height="${B}" fill="${vel}"/>${vine}${leaf(7, 9, 1)}${leaf(21, 17, -1)}${dots}`
    + `<rect x="0" y="25.6" width="28" height="1.1" fill="${gold}"/><rect x="0" y="27.1" width="28" height="0.4" fill="${ink}" fill-opacity="0.6"/>`;
  const petals = Array.from({ length: 5 }, (_, i) => `<ellipse cx="14" cy="8" rx="3.3" ry="4.8" transform="rotate(${i * 72} 14 14)" fill="${i % 2 ? blue : red}" stroke="${ink}" stroke-width="0.5"/>`).join('');
  const corner = `<rect width="${B}" height="${B}" fill="${vel}"/>`
    + `<path d="M4 24 q 2 -8 8 -10" stroke="${green}" stroke-width="1.6" fill="none"/>${petals}<circle cx="14" cy="14" r="3" fill="${gold}" stroke="${ink}" stroke-width="0.5"/>`
    + `<rect x="25.6" y="25.6" width="2.4" height="2.4" fill="${gold}"/>`;
  const svg = frame(null, edge, corner);
  writeFileSync('public/games/balance-mancala/frame.svg', svg);
  await sharp(Buffer.from(svg), { density: 216 }).resize(S * 3, S * 3).png({ compressionLevel: 9 }).toFile('public/games/balance-mancala/frame-card.png');
}
