import type { Cell } from '@/games/bagh-chal/engine';
import { drawBrand, drawQr, fillBox, fitText, roundRect, type CardLayout, type ShareAssets } from '@/utils/shareCard';
import { BAGH } from './palette';
import { WORDMARK_PATH, WORDMARK_VIEWBOX } from './BaghWordmark';

/**
 * 尼泊爾虎棋的結算分享圖（Zach 10/24：「結尾 Modal 一樣做成可分享的圖片」）。
 *
 * 長得像這款的頁面，不像 Wall Go 的平塗撞色：番紅花底鋪米提拉圖騰（pattern.webp）、紙色面板、橄欖綠框，
 * 框內兩條線（跟按鈕同一個米提拉畫框；原本中間夾一圈鋸齒，10/24 跟按鈕一起拿掉）。只有 9:16 一種。面板裡由上往下：天城體字標、勝方的大圓牌與「老虎贏了」、終局盤面、
 * 老虎吃掉的羊（5 個位置，吃掉的畫羊牌、沒吃的留虛線圈）、手數，最下面一塊站名與 QR。
 * 顏色全部是 palette.ts 的；棋子是對局用的同一張圖。
 */
export type BaghCardData = {
  board: Cell[];
  winner: 'tiger' | 'goat' | 'draw';
  captured: number;
  plies: number;
  text: {
    kicker: string;
    title: string;
    name: string;
    capturedLabel: string;
    moves: string;
    brand: string;
    from: string;
    host: string;
  };
  font: string;
};

/** images 的順序（useShareCard 的 images 要照這個給） */
export const BAGH_CARD_IMAGES = ['/games/bagh-chal/tiger.webp', '/games/bagh-chal/goat.webp', '/games/bagh-chal/pattern.webp'];

const P = BAGH;
/** 字標與遊戲名用頁面上同一個深墨（tile-ink） */
const INK = '#141010';

/** 米提拉畫框的兩條線（跟按鈕的 .bagh-line 同一個框）。原本中間夾一排往內指的三角形、四角小方塊，Zach 10/24 要拿掉 */
function lineFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, band: number) {
  ctx.save();
  ctx.strokeStyle = P.brown;
  ctx.lineWidth = band * 0.12;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeRect(x + band, y + band, w - band * 2, h - band * 2);
  ctx.restore();
}

function token(ctx: CanvasRenderingContext2D, img: HTMLImageElement | undefined, cx: number, cy: number, d: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(74,38,22,0.45)';
  ctx.beginPath();
  ctx.arc(cx, cy + d * 0.035, d / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
  ctx.clip();
  if (img) ctx.drawImage(img, cx - d / 2, cy - d / 2, d, d);
  else { ctx.fillStyle = P.paper; ctx.fill(); }
  ctx.restore();
}

/** 終局盤面：橄欖綠框、紙色盤面、深褐的線（直線、橫線、兩條對角線與中間的菱形），棋子是對局的圖 */
function board(ctx: CanvasRenderingContext2D, d: BaghCardData, a: ShareAssets, x: number, y: number, size: number) {
  const [tiger, goat] = a.images;
  const fw = size * 0.022;
  fillBox(ctx, P.olive, x, y, size, size, size * 0.03);
  fillBox(ctx, P.saffron, x + fw, y + fw, size - fw * 2, size - fw * 2, size * 0.018);
  const ix = x + fw * 1.4, iy = y + fw * 1.4, is = size - fw * 2.8;
  fillBox(ctx, P.paper, ix, iy, is, is, size * 0.014);
  const pt = (i: number) => [ix + is * (0.1 + (i % 5) * 0.2), iy + is * (0.1 + Math.floor(i / 5) * 0.2)] as const;
  const at = (fx: number, fy: number) => [ix + is * fx, iy + is * fy] as const;
  ctx.save();
  ctx.strokeStyle = P.line;
  ctx.lineWidth = is * 0.006;
  ctx.lineCap = 'round';
  const line = (p: readonly [number, number], q: readonly [number, number]) => { ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q); ctx.stroke(); };
  for (let i = 0; i < 5; i++) {
    line(at(0.1, 0.1 + i * 0.2), at(0.9, 0.1 + i * 0.2));
    line(at(0.1 + i * 0.2, 0.1), at(0.1 + i * 0.2, 0.9));
  }
  line(at(0.1, 0.1), at(0.9, 0.9));
  line(at(0.9, 0.1), at(0.1, 0.9));
  ctx.beginPath();
  ctx.moveTo(...at(0.5, 0.1)); ctx.lineTo(...at(0.9, 0.5)); ctx.lineTo(...at(0.5, 0.9)); ctx.lineTo(...at(0.1, 0.5)); ctx.closePath();
  ctx.stroke();
  ctx.restore();
  d.board.forEach((c, i) => {
    if (!c) return;
    const [cx, cy] = pt(i);
    token(ctx, c === 'T' ? tiger : goat, cx, cy, is * 0.145);
  });
}

/** 老虎吃掉的羊：5 個位置，吃掉的畫羊牌、還沒吃的是一圈虛線 */
function captures(ctx: CanvasRenderingContext2D, d: BaghCardData, a: ShareAssets, cx: number, y: number, dia: number) {
  const gap = dia * 0.28;
  const total = dia * 5 + gap * 4;
  for (let i = 0; i < 5; i++) {
    const x = cx - total / 2 + dia / 2 + i * (dia + gap);
    if (i < d.captured) token(ctx, a.images[1], x, y, dia);
    else {
      ctx.save();
      ctx.strokeStyle = P.brown;
      ctx.globalAlpha = 0.35;
      ctx.setLineDash([dia * 0.08, dia * 0.07]);
      ctx.lineWidth = dia * 0.05;
      ctx.beginPath();
      ctx.arc(x, y, dia / 2 - dia * 0.03, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function wordmark(ctx: CanvasRenderingContext2D, cx: number, y: number, h: number, color: string) {
  const [vx, vy, vw, vh] = WORDMARK_VIEWBOX;
  const s = h / vh;
  ctx.save();
  ctx.translate(cx - (vw * s) / 2 - vx * s, y - vy * s);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(WORDMARK_PATH));
  ctx.restore();
}

/** 背景：番紅花底鋪圖騰；圖沒載到就只有番紅花 */
function background(ctx: CanvasRenderingContext2D, a: ShareAssets, w: number, h: number) {
  ctx.fillStyle = P.saffron;
  ctx.fillRect(0, 0, w, h);
  const img = a.images[2];
  if (!img) return;
  const tw = 420, th = (img.naturalHeight / img.naturalWidth) * tw;
  for (let y = 0; y < h; y += th) for (let x = 0; x < w; x += tw) ctx.drawImage(img, x, y, tw, th);
}

function footer(ctx: CanvasRenderingContext2D, d: BaghCardData, a: ShareAssets, x: number, y: number, w: number, h: number, o: { brand: number; small: number; qr: number }) {
  fillBox(ctx, '#f2e4c4', x, y, w, h);
  const left = x + 48, max = w - 48 - o.qr - 90;
  drawBrand(ctx, d.font, a, d.text.brand, left, y + h / 2 - o.small * 0.3, { size: o.brand, color: P.brown, max });
  fitText(ctx, d.font, `${d.text.from} · ${d.text.host}`, left, y + h / 2 + o.small * 1.5, { size: o.small, weight: 700, color: P.brown, max, alpha: 0.75 });
  drawQr(ctx, a.qr, x + w - 48 - o.qr, y + (h - o.qr) / 2, o.qr, P.brown, P.paper, 4);
}

/** 勝方的大圓牌＋大標。平局兩枚並排 */
function winnerBlock(ctx: CanvasRenderingContext2D, d: BaghCardData, a: ShareAssets, cx: number, y: number, dia: number, titleSize: number, maxW: number) {
  const [tiger, goat] = a.images;
  if (d.winner === 'draw') {
    token(ctx, tiger, cx - dia * 0.42, y + dia / 2, dia * 0.8);
    token(ctx, goat, cx + dia * 0.42, y + dia / 2, dia * 0.8);
  } else {
    ctx.save();
    ctx.strokeStyle = d.winner === 'tiger' ? P.saffron : P.olive;
    ctx.lineWidth = dia * 0.05;
    ctx.beginPath();
    ctx.arc(cx, y + dia / 2, dia / 2 + dia * 0.09, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    token(ctx, d.winner === 'tiger' ? tiger : goat, cx, y + dia / 2, dia);
  }
  fitText(ctx, d.font, d.text.title, cx, y + dia + titleSize * 1.25, { size: titleSize, color: P.brown, align: 'center', max: maxW });
}

function story(ctx: CanvasRenderingContext2D, d: BaghCardData, a: ShareAssets) {
  const W = 1080, H = 1920, m = 48;
  background(ctx, a, W, H);
  const px = m, py = m, pw = W - m * 2, ph = H - m * 2;
  fillBox(ctx, P.paper, px, py, pw, ph, 28);
  ctx.save(); ctx.strokeStyle = P.olive; ctx.lineWidth = 8; roundRect(ctx, px + 4, py + 4, pw - 8, ph - 8, 26); ctx.stroke(); ctx.restore();
  lineFrame(ctx, px + 30, py + 30, pw - 60, ph - 60, 26);
  const cx = W / 2;
  wordmark(ctx, cx, 150, 82, INK);
  fitText(ctx, d.font, d.text.name, cx, 300, { size: 46, color: INK, align: 'center', max: 800 });
  fitText(ctx, d.font, d.text.kicker, cx, 360, { size: 30, weight: 700, color: P.brown, align: 'center', max: 820, alpha: 0.8 });
  winnerBlock(ctx, d, a, cx, 410, 190, 92, 820);
  board(ctx, d, a, (W - 680) / 2, 760, 680);
  fitText(ctx, d.font, d.text.capturedLabel, cx, 1500, { size: 32, weight: 900, color: P.brown, align: 'center', max: 820 });
  captures(ctx, d, a, cx, 1562, 70);
  fitText(ctx, d.font, d.text.moves, cx, 1644, { size: 28, weight: 700, color: P.brown, align: 'center', max: 820, alpha: 0.75 });
  footer(ctx, d, a, px + 56, H - m - 56 - 120, pw - 112, 120, { brand: 36, small: 22, qr: 100 });
}

/** 只有 9:16（Zach 10/24：「分享圖不要，留 9:16 就好」），BaghPlay 的 useShareCard 只給 story，不會要別的比例 */
export function drawBaghCard(d: BaghCardData) {
  return (ctx: CanvasRenderingContext2D, layout: CardLayout, a: ShareAssets) => story(ctx, d, a);
}
