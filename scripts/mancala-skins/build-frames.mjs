// 試做（explore/mancala-skins）：均衡曼卡拉木雕版、祈禱書版的外框 SVG（border-image，84×84、slice 28、邊段 28 一個圖案）。
// node scripts/mancala-skins/build-frames.mjs → public/games/balance-mancala/skins/{wood,hours}-frame.svg
// 顏色出處見 app/components/balance-mancala/skins.ts。
import { writeFileSync } from 'node:fs';
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

// 木雕版：桑吉巴門框那圈菱格（1920 的照片），外側一排刻出來的三角（Bao 棋盤的邊）。烏木底、石灰白的刻線。
{
  const ink = '#13151c', lime = '#c7d2d5', grey = '#697f90';
  const notch = [0, 7, 14, 21].map((x) => `<path d="M${x} 2.2 L${x + 3.5} 7 L${x + 7} 2.2 Z" fill="${lime}" fill-opacity="0.55"/>`).join('');
  const dia = [0, 14].map((x) => `<path d="M${x} 16.5 L${x + 7} 10 L${x + 14} 16.5 L${x + 7} 23 Z" fill="none" stroke="${lime}" stroke-width="1.3"/>`
    + `<circle cx="${x + 7}" cy="16.5" r="1.4" fill="${lime}"/>`).join('');
  const rails = `<rect x="0" y="8.4" width="28" height="0.9" fill="${lime}" fill-opacity="0.7"/><rect x="0" y="24.2" width="28" height="0.9" fill="${lime}" fill-opacity="0.7"/>`;
  const edge = `<rect width="28" height="${B}" fill="${ink}"/>${notch}${rails}${dia}<rect x="0" y="26.6" width="28" height="1.4" fill="${grey}"/>`;
  // 四角：八瓣的蓮花（斯瓦希里門上常見的花），框在兩道刻線裡
  const petals = Array.from({ length: 8 }, (_, i) => `<ellipse cx="14" cy="9.2" rx="2.1" ry="4.2" transform="rotate(${i * 45} 14 14)" fill="none" stroke="${lime}" stroke-width="1"/>`).join('');
  const corner = `<rect width="${B}" height="${B}" fill="${ink}"/><rect x="1.5" y="1.5" width="25" height="25" fill="none" stroke="${lime}" stroke-opacity="0.7" stroke-width="0.9"/>${petals}<circle cx="14" cy="14" r="2" fill="${lime}"/>`
    + `<rect x="26.6" y="0" width="1.4" height="28" fill="${grey}"/><rect x="0" y="26.6" width="28" height="1.4" fill="${grey}"/>`;
  writeFileSync('public/games/balance-mancala/skins/wood-frame.svg', frame(null, edge, corner));
}

// 祈禱書版：頁邊的墨線藤蔓、金色常春藤葉（金點描墨邊），內側一道金線；四角一朵群青＋朱紅的花。羊皮紙底。
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
  writeFileSync('public/games/balance-mancala/skins/hours-frame.svg', frame(null, edge, corner));
}
