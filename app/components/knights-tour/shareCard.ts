import { colOf, isKnightMove, type Square } from '@/games/knights-tour/engine';
import { drawBrand, drawQr, fillBox, fitText, type CardLayout, type ShareAssets } from '@/utils/shareCard';
import { drawKnight, KNIGHT_GAP, KNIGHT_SIZE } from './knightArt';
import { KT } from './palette';

/**
 * 騎士巡遊的結算分享圖（Zach 10/24：每款都要有「結尾的可分享畫面」，各自設計符合各自）。
 *
 * 一張書裡的銅版圖版，跟頁面同一套東西：紙色滿版、紙邊留白、銅版雙線框（外粗內細，同 .kt-frame）、右上角「Tab. I.」；
 * 標題是紅粉筆字、底下一道紅粉筆雙線（同遊戲裡的彈窗）；用時用舊式襯線寫大字。
 * 圖就是走完的那張棋盤，畫法跟對局一模一樣（TourBoard）：走過的格子一層淡紅粉筆、每格寫第幾步、
 * 淡紅粉筆連起整條路、最後一步重一點、騎士停在終點；封閉巡遊（最後一步跳得回起點）多一段虛線接回第 1 格。
 * 圖說照首頁的「Fig. 1.」寫法。節目挑戰三關都畫（Fig. 1–3，6×6、7×7 小、8×8 大），每張底下寫那一關的用時。
 * 最下面一道細雙線隔開站名與 QR。顏色全部是 palette.ts 的（加上對局裡走過的格子那一層 #e2c9b1）。
 * 只有 9:16（Zach 10/24：「感覺可以留 9:16 就好」，同尼泊爾虎棋）。
 */
export type KtPlate = {
  n: number;
  path: readonly Square[];
  /** 這一關的用時（節目挑戰才有） */
  time?: string;
};

export type KtCardData = {
  plates: KtPlate[];
  /** 總用時 */
  time: string;
  isNew: boolean;
  text: {
    name: string;
    subtitle?: string;
    kicker: string;
    title: string;
    timeLabel: string;
    newBest: string;
    closed: string;
    brand: string;
    from: string;
    host: string;
  };
  /** 中日韓字（頁面的 --font-app） */
  font: string;
};

/** 拉丁字與數字：跟頁面的 .kt-serif 同一組系統襯線 */
export const KT_SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
/** 走過的格子（同 TourBoard） */
const WASH = '#e2c9b1';

export const isClosed = (p: KtPlate) => p.path.length === p.n * p.n && isKnightMove(p.n, p.path[0], p.path[p.path.length - 1]);

/** 銅版雙線框：外面一道粗線、隔一點紙色、裡面一道細線（比例同 globals.css 的 .kt-frame） */
function frame(ctx: CanvasRenderingContext2D, w: number, h: number, m: number) {
  const outer = 10, gap = 9, inner = 3.5;
  ctx.save();
  ctx.strokeStyle = KT.ink;
  ctx.lineWidth = outer;
  ctx.strokeRect(m + outer / 2, m + outer / 2, w - m * 2 - outer, h - m * 2 - outer);
  ctx.lineWidth = inner;
  const k = m + outer + gap + inner / 2;
  ctx.strokeRect(k, k, w - k * 2, h - k * 2);
  ctx.restore();
}

/** 一道橫的雙線（上粗下細），標題底下用紅粉筆、頁尾用淡墨 */
function rule(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, color: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x0, y, x1 - x0, 3.5);
  ctx.fillRect(x0, y + 8, x1 - x0, 1.5);
  ctx.restore();
}

/** 走完的棋盤，畫法同 TourBoard */
function plate(ctx: CanvasRenderingContext2D, p: KtPlate, x: number, y: number, size: number) {
  const { n, path } = p;
  const c = size / n;
  const fw = Math.max(2.5, size * 0.008);
  const center = (sq: Square) => [x + (sq % n) * c + c / 2, y + Math.floor(sq / n) * c + c / 2] as const;
  fillBox(ctx, KT.ink, x - fw, y - fw, size + fw * 2, size + fw * 2);
  fillBox(ctx, WASH, x, y, size, size);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (isClosed(p)) {
    // 封閉巡遊：最後一格跳回第 1 格的那一步，虛線
    const [ax, ay] = center(path[path.length - 1]);
    const [bx, by] = center(path[0]);
    ctx.strokeStyle = KT.chalkLight;
    ctx.lineWidth = c * 0.05;
    ctx.setLineDash([c * 0.14, c * 0.1]);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.strokeStyle = KT.chalkLight;
  ctx.lineWidth = c * 0.05;
  ctx.beginPath();
  path.forEach((sq, i) => { const [px, py] = center(sq); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
  ctx.stroke();
  if (path.length > 1) {
    const [ax, ay] = center(path[path.length - 2]);
    const [bx, by] = center(path[path.length - 1]);
    // 停在騎士前面一點（同 TourBoard）
    const k = 1 - KNIGHT_GAP / Math.sqrt(5);
    ctx.strokeStyle = KT.chalk;
    ctx.lineWidth = c * 0.08;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (bx - ax) * k, ay + (by - ay) * k); ctx.stroke();
  }
  ctx.restore();

  // 第幾步（舊式襯線，同對局的 Num），終點畫騎士
  ctx.fillStyle = KT.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  path.forEach((sq, i) => {
    const [px, py] = center(sq);
    if (i === path.length - 1) {
      // 騎士跟對局同一隻（knightArt.ts），面向最後一步前進的方向
      const face = i > 0 && colOf(n, sq) < colOf(n, path[i - 1]) ? -1 : 1;
      drawKnight(ctx, px, py, c * KNIGHT_SIZE, face);
      return;
    }
    const k = i + 1;
    const fs = c * (k >= 100 ? 0.38 : 0.48);
    ctx.font = `600 ${fs}px ${KT_SERIF}`;
    ctx.fillStyle = KT.ink;
    ctx.fillText(String(k), px, py + fs * 0.36);
  });
}

/** 圖說：「Fig. 1.」斜體，後面接大小與用時 */
function caption(ctx: CanvasRenderingContext2D, i: number, p: KtPlate, cx: number, y: number, size: number, max: number) {
  const head = `Fig. ${i}.`;
  const tail = ` ${p.n}×${p.n}${p.time ? ` · ${p.time}` : ''}`;
  let fs = size;
  const measure = () => {
    ctx.font = `italic 400 ${fs}px ${KT_SERIF}`;
    const a = ctx.measureText(head).width;
    ctx.font = `400 ${fs}px ${KT_SERIF}`;
    return [a, ctx.measureText(tail).width] as const;
  };
  let [a, b] = measure();
  while (a + b > max && fs > 12) { fs -= 1; [a, b] = measure(); }
  const x = cx - (a + b) / 2;
  ctx.save();
  ctx.fillStyle = KT.ink;
  ctx.globalAlpha = 0.85;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `italic 400 ${fs}px ${KT_SERIF}`;
  ctx.fillText(head, x, y);
  ctx.font = `400 ${fs}px ${KT_SERIF}`;
  ctx.fillText(tail, x + a, y);
  ctx.restore();
}

/** 遊戲名（中日韓粗體）＋英文名（斜體襯線），置中一行 */
function nameLine(ctx: CanvasRenderingContext2D, d: KtCardData, x: number, y: number, size: number, max: number) {
  const sub = d.text.subtitle ? ` ${d.text.subtitle}` : '';
  let fs = size;
  const measure = () => {
    ctx.font = `900 ${fs}px ${d.font}`;
    const a = ctx.measureText(d.text.name).width;
    ctx.font = `italic 400 ${fs * 0.9}px ${KT_SERIF}`;
    return [a, sub ? ctx.measureText(sub).width : 0] as const;
  };
  let [a, b] = measure();
  while (a + b > max && fs > 14) { fs -= 1; [a, b] = measure(); }
  const x0 = x - (a + b) / 2;
  ctx.fillStyle = KT.ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `900 ${fs}px ${d.font}`;
  ctx.fillText(d.text.name, x0, y);
  if (sub) {
    ctx.font = `italic 400 ${fs * 0.9}px ${KT_SERIF}`;
    ctx.fillText(sub, x0 + a, y);
  }
}

/** 紅粉筆小章（新紀錄、封閉巡遊）：同 .kt-chalk —— 紅粉筆底、內縮一道紙色細線，置中排成一列 */
function chips(ctx: CanvasRenderingContext2D, d: KtCardData, x: number, y: number, size: number) {
  const items = [d.isNew && d.text.newBest, d.plates.some(isClosed) && d.text.closed].filter((s): s is string => !!s);
  if (!items.length) return;
  ctx.font = `900 ${size}px ${d.font}`;
  const padX = size * 0.7, h = size * 1.9, gap = size * 0.5;
  const widths = items.map((s) => ctx.measureText(s).width + padX * 2);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let cx = x - total / 2;
  items.forEach((s, i) => {
    const w = widths[i];
    fillBox(ctx, KT.chalk, cx, y, w, h, 2);
    ctx.save();
    ctx.strokeStyle = KT.paper;
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx + 5, y + 5, w - 10, h - 10);
    ctx.restore();
    ctx.font = `900 ${size}px ${d.font}`;
    ctx.fillStyle = KT.paper;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, cx + w / 2, y + h / 2 + size * 0.04);
    cx += w + gap;
  });
  ctx.textBaseline = 'alphabetic';
}

/** 用時：小字標籤＋舊式襯線的大字，置中 */
function timeBlock(ctx: CanvasRenderingContext2D, d: KtCardData, x: number, y: number, o: { label: number; size: number; max: number }) {
  fitText(ctx, d.font, d.text.timeLabel, x, y, { size: o.label, weight: 700, color: KT.ink, align: 'center', max: o.max, alpha: 0.7 });
  fitText(ctx, KT_SERIF, d.time, x, y + o.size * 0.95, { size: o.size, weight: 600, color: KT.ink, align: 'center', max: o.max });
}

/** 標題（紅粉筆，置中）＋底下一道紅粉筆雙線 */
function titleBlock(ctx: CanvasRenderingContext2D, d: KtCardData, x: number, y: number, size: number, x0: number, x1: number) {
  fitText(ctx, d.font, d.text.title, x, y, { size, color: KT.chalk, align: 'center', max: x1 - x0 });
  rule(ctx, x0, x1, y + size * 0.3, KT.chalk);
}

/** 頁尾：一道淡墨細雙線，左邊站名與出處，右邊 QR */
function footer(ctx: CanvasRenderingContext2D, d: KtCardData, a: ShareAssets, x0: number, x1: number, y: number, h: number, o: { brand: number; small: number; qr: number }) {
  rule(ctx, x0, x1, y, KT.ink, 0.55);
  const top = y + 22;
  const mid = top + (h - 22) / 2;
  const max = x1 - x0 - o.qr - 40;
  drawBrand(ctx, d.font, a, d.text.brand, x0, mid - o.small * 0.35, { size: o.brand, color: KT.ink, max });
  fitText(ctx, d.font, `${d.text.from} · ${d.text.host}`, x0, mid + o.small * 1.45, { size: o.small, weight: 700, color: KT.ink, max, alpha: 0.7 });
  drawQr(ctx, a.qr, x1 - o.qr, mid - o.qr / 2, o.qr, KT.ink, KT.paper, 0);
}

function tab(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.font = `italic 400 ${size}px ${KT_SERIF}`;
  ctx.fillStyle = KT.ink;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Tab. I.', x, y);
  ctx.restore();
}

function paper(ctx: CanvasRenderingContext2D, w: number, h: number, m: number) {
  ctx.fillStyle = KT.paper;
  ctx.fillRect(0, 0, w, h);
  frame(ctx, w, h, m);
}

function story(ctx: CanvasRenderingContext2D, d: KtCardData, a: ShareAssets) {
  const W = 1080, H = 1920, x0 = 110, x1 = 970, cx = W / 2;
  paper(ctx, W, H, 44);
  tab(ctx, x1, 128, 26);
  nameLine(ctx, d, cx, 180, 50, 700);
  fitText(ctx, d.font, d.text.kicker, cx, 240, { size: 30, weight: 700, color: KT.ink, align: 'center', max: x1 - x0, alpha: 0.75 });
  titleBlock(ctx, d, cx, 370, 108, x0, x1);
  timeBlock(ctx, d, cx, 478, { label: 28, size: 118, max: x1 - x0 });
  chips(ctx, d, cx, 628, 28);
  if (d.plates.length === 1) {
    const s = 780;
    plate(ctx, d.plates[0], cx - s / 2, 730, s);
    caption(ctx, 1, d.plates[0], cx, 730 + s + 56, 32, x1 - x0);
  } else {
    const [p6, p7, p8] = d.plates;
    const s = 340;
    plate(ctx, p6, cx - 20 - s, 730, s);
    plate(ctx, p7, cx + 20, 730, s);
    caption(ctx, 1, p6, cx - 20 - s / 2, 730 + s + 46, 28, s + 20);
    caption(ctx, 2, p7, cx + 20 + s / 2, 730 + s + 46, 28, s + 20);
    if (p8) {
      const b = 430;
      plate(ctx, p8, cx - b / 2, 1150, b);
      caption(ctx, 3, p8, cx, 1150 + b + 46, 28, x1 - x0);
    }
  }
  footer(ctx, d, a, x0, x1, 1660, 180, { brand: 38, small: 23, qr: 140 });
}

/** useKtShare 只給 story，不會要別的比例 */
export function drawKtCard(d: KtCardData) {
  return (ctx: CanvasRenderingContext2D, layout: CardLayout, a: ShareAssets) => story(ctx, d, a);
}
