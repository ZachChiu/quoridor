import { SIZE, SHAPE_OF, colOf, rowOf, type Point, type Side, type Stone, type StoneColor } from '@/games/blind-gomoku/engine';
import { drawBrand, drawQr, fillBox, fitText, type CardLayout, type ShareAssets } from '@/utils/shareCard';
import { GMK } from './palette';
import { CREAM, INK, LIGHT, STONE_HEX, WHITE_FACE, shapePath } from './Stone';

/**
 * 盲五子棋的結算分享圖（Zach 10/24：結尾的可分享畫面，各自設計符合各自）。
 *
 * 長得像這款的頁面，不像 Wall Go 的平塗撞色：最外緣一圈包袱巾的布條（跟頁面的 .gmk-frame 同一份布、同一個拼法），
 * 裡面是奶油白絲的頁面；上面是遊戲名與勝負，中間是翻開後的終局盤面（白絲棋盤、黑絲的線），連成五子的那一排畫一道青綠的線、
 * 每顆外面一圈青綠；最下面一塊縫著平針的白絲布放站名與 QR。
 * 盲棋的勝方棋子畫成兩面疊在一起：後面是他最後那一手的顏色面（大家看到的），前面是翻開的黑白（答案）。
 * 顏色全部是 palette.ts、Stone.tsx 與外框布條取樣的那幾個；裝飾只有最外緣那一圈。
 */
export type GomokuCardData = {
  board: (Stone | null)[];
  line: Point[] | null;
  winner: Side | 'draw';
  blind: boolean;
  /** 最後一手的顏色（盲棋的勝方大棋子後面那一面） */
  lastColor: StoneColor;
  text: {
    kicker: string;
    name: string;
    sub: string;
    title: string;
    body: string;
    brand: string;
    from: string;
    host: string;
  };
  font: string;
};

// ─── 外框：照 globals.css 的 .gmk-frame ─────────────────────────────────────
// 那張 SVG 的座標是 30 單位寬的邊、240 單位一段（11 條寬窄不一的布，條與條之間 1 單位的白絲縫線），四角兩塊對角拼的三角。
// 改了外框要跟 globals.css 一起改。

const SEAM = '#ede2c7';
type Strip = [width: number, color: string];
const EDGE: Record<'top' | 'bottom' | 'left' | 'right', Strip[]> = {
  top: [[21, '#dfda24'], [13, '#be3479'], [29, '#046161'], [17, '#ede2c7'], [25, '#b35e40'], [11, '#0b2859'], [23, '#f59bad'], [19, '#4da275'], [15, '#46246b'], [27, '#983c4a'], [29, '#be3479']],
  bottom: [[17, '#0b2859'], [25, '#ede2c7'], [13, '#4da275'], [29, '#be3479'], [19, '#dfda24'], [23, '#662d2e'], [11, '#046161'], [27, '#f59bad'], [21, '#b35e40'], [15, '#46246b'], [29, '#046161']],
  left: [[25, '#983c4a'], [17, '#046161'], [29, '#ede2c7'], [13, '#dfda24'], [21, '#46246b'], [27, '#be3479'], [11, '#4da275'], [19, '#b35e40'], [23, '#0b2859'], [15, '#f59bad'], [29, '#dfda24']],
  right: [[15, '#be3479'], [27, '#b35e40'], [19, '#0b2859'], [23, '#ede2c7'], [11, '#4da275'], [29, '#dfda24'], [17, '#983c4a'], [25, '#46246b'], [13, '#046161'], [21, '#662d2e'], [29, '#f59bad']],
};
/** 四角：[外側那塊, 內側那塊] */
const CORNER = { tl: ['#046161', '#be3479'], tr: ['#46246b', '#dfda24'], bl: ['#b35e40', '#0b2859'], br: ['#662d2e', '#4da275'] } as const;

function frame(ctx: CanvasRenderingContext2D, W: number, H: number, band: number) {
  const u = band / 30;
  ctx.fillStyle = SEAM;
  ctx.fillRect(0, 0, W, band);
  ctx.fillRect(0, H - band, W, band);
  ctx.fillRect(0, 0, band, H);
  ctx.fillRect(W - band, 0, band, H);
  // 一條邊：像 border-image 的 round，整數段、每段等比例拉長到剛好放滿
  const edge = (strips: Strip[], len: number, draw: (a: number, b: number, color: string) => void) => {
    const seg = 240 * u;
    const n = Math.max(1, Math.round(len / seg));
    const k = len / (n * seg);
    for (let i = 0; i < n; i++) {
      let x = i * seg * k + 0.5 * u * k;
      for (const [w, color] of strips) {
        draw(x, w * u * k, color);
        x += (w + 1) * u * k;
      }
    }
  };
  const inner = 0.5 * u, thick = 29 * u;
  edge(EDGE.top, W - band * 2, (a, w, c) => { ctx.fillStyle = c; ctx.fillRect(band + a, inner, w, thick); });
  edge(EDGE.bottom, W - band * 2, (a, w, c) => { ctx.fillStyle = c; ctx.fillRect(band + a, H - band + inner, w, thick); });
  edge(EDGE.left, H - band * 2, (a, w, c) => { ctx.fillStyle = c; ctx.fillRect(inner, band + a, thick, w); });
  edge(EDGE.right, H - band * 2, (a, w, c) => { ctx.fillStyle = c; ctx.fillRect(W - band + inner, band + a, thick, w); });
  // 四角：沿對角線拼的兩塊三角，中間一道縫
  const tri = (pts: [number, number][], color: string) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (const p of pts.slice(1)) ctx.lineTo(...p);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  const a = 0.5 * u, b = 29 * u, c = 29.5 * u, d = 1.2 * u;
  tri([[a, a], [b, a], [a, b]], CORNER.tl[0]);
  tri([[c, d], [c, c], [d, c]], CORNER.tl[1]);
  tri([[W - c + a, a], [W - a, a], [W - a, b]], CORNER.tr[0]);
  tri([[W - c + a, d], [W - d, c], [W - c + a, c]], CORNER.tr[1]);
  tri([[a, H - c + a], [c, H - c + a], [a, H - a]], CORNER.bl[0]);
  tri([[a, H - c + d], [c - d, H - a], [a, H - a]], CORNER.bl[1]);
  tri([[W - c + a, H - c + a], [W - a, H - c + a], [W - c + a, H - a]], CORNER.br[0]);
  tri([[W - a, H - c + d], [W - a, H - a], [W - c + d, H - a]], CORNER.br[1]);
}

// ─── 棋子 ─────────────────────────────────────────────────────────────────────

/** 翻開那一面：黑子一塊黑絲；白子白絲＋一圈黑絲邊（同 Stone.tsx 的 SideFace） */
function sideStone(ctx: CanvasRenderingContext2D, side: Side, cx: number, cy: number, d: number) {
  ctx.beginPath();
  if (side === 'black') {
    ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
  } else {
    ctx.arc(cx, cy, d * 0.46, 0, Math.PI * 2);
    ctx.fillStyle = WHITE_FACE;
    ctx.fill();
    ctx.lineWidth = d * 0.08;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
}

/** 顏色那一面：布色＋形狀、一圈黑絲邊（同 Stone.tsx 的 ColorFace） */
function colorStone(ctx: CanvasRenderingContext2D, color: StoneColor, cx: number, cy: number, d: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, d * 0.475, 0, Math.PI * 2);
  ctx.fillStyle = STONE_HEX[color];
  ctx.fill();
  ctx.lineWidth = d * 0.05;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.save();
  ctx.translate(cx - d / 2, cy - d / 2);
  ctx.scale(d / 100, d / 100);
  ctx.fillStyle = LIGHT.has(color) ? INK : CREAM;
  ctx.fill(new Path2D(shapePath(SHAPE_OF[color])));
  ctx.restore();
}

/** 勝方的大棋子：盲棋是兩面疊著（後面顏色、前面黑白），平局一黑一白並排。回傳整塊的寬 */
function winnerStone(ctx: CanvasRenderingContext2D, d: GomokuCardData, x: number, cy: number, dia: number): number {
  if (d.winner === 'draw') {
    sideStone(ctx, 'black', x + dia * 0.42, cy, dia * 0.84);
    sideStone(ctx, 'white', x + dia * 1.1, cy, dia * 0.8);
    return dia * 1.5;
  }
  if (d.blind) {
    // 兩顆只疊一點點：顏色面的形狀要整個露出來，才看得出是同一顆子的兩面
    colorStone(ctx, d.lastColor, x + dia * 0.36, cy - dia * 0.1, dia * 0.72);
    sideStone(ctx, d.winner, x + dia * 0.98, cy + dia * 0.04, dia * 0.86);
    return dia * 1.41;
  }
  sideStone(ctx, d.winner, x + dia / 2, cy, dia);
  return dia;
}

const stoneWidth = (d: GomokuCardData, dia: number) => (d.winner === 'draw' ? dia * 1.5 : d.blind ? dia * 1.41 : dia);

/** 大棋子＋大標一排，整排置中 */
function winnerRow(ctx: CanvasRenderingContext2D, d: GomokuCardData, cx: number, cy: number, dia: number, size: number, max: number) {
  ctx.font = `900 ${size}px ${d.font}`;
  const stoneW = stoneWidth(d, dia);
  const gap = size * 0.4;
  const titleW = Math.min(ctx.measureText(d.text.title).width, max - stoneW - gap);
  const x0 = cx - (stoneW + gap + titleW) / 2;
  winnerStone(ctx, d, x0, cy, dia);
  fitText(ctx, d.font, d.text.title, x0 + stoneW + gap, cy + size * 0.36, { size, color: INK, max: max - stoneW - gap });
}

// ─── 盤面 ─────────────────────────────────────────────────────────────────────

/** 終局盤面：白絲棋盤（內距 2.5%）、黑絲的線與星位、翻開的黑白；連成的那一排一道青綠的線＋每顆一圈青綠 */
function board(ctx: CanvasRenderingContext2D, d: GomokuCardData, x: number, y: number, size: number) {
  fillBox(ctx, GMK.silkLight, x, y, size, size, size * 0.012);
  const pad = size * 0.025;
  const s = size - pad * 2;
  const cell = s / SIZE;
  const px = (c: number) => x + pad + (c + 0.5) * cell;
  const py = (r: number) => y + pad + (r + 0.5) * cell;
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = cell * 0.04;
  ctx.beginPath();
  for (let i = 0; i < SIZE; i++) {
    ctx.moveTo(px(0), py(i)); ctx.lineTo(px(SIZE - 1), py(i));
    ctx.moveTo(px(i), py(0)); ctx.lineTo(px(i), py(SIZE - 1));
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = cell * 0.07;
  ctx.strokeRect(px(0), py(0), px(SIZE - 1) - px(0), py(SIZE - 1) - py(0));
  ctx.fillStyle = INK;
  for (const [r, c] of [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]]) {
    ctx.beginPath(); ctx.arc(px(c), py(r), cell * 0.12, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  d.board.forEach((st, p) => { if (st) sideStone(ctx, st.side, px(colOf(p)), py(rowOf(p)), cell * 0.9); });
  if (!d.line) return;
  ctx.save();
  ctx.strokeStyle = GMK.teal;
  ctx.lineWidth = cell * 0.09;
  for (const p of d.line) {
    ctx.beginPath(); ctx.arc(px(colOf(p)), py(rowOf(p)), cell * 0.56, 0, Math.PI * 2); ctx.stroke();
  }
  const a = d.line[0], b = d.line[d.line.length - 1];
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = cell * 0.26;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(px(colOf(a)), py(rowOf(a)));
  ctx.lineTo(px(colOf(b)), py(rowOf(b)));
  ctx.stroke();
  ctx.restore();
}

// ─── 字與頁尾 ─────────────────────────────────────────────────────────────────

/** 換行寫字（中日文按字、其他按詞；有 Intl.Segmenter 就用它切，泰文才不會切在字中間）。回傳最後一行的 y */
function wrap(ctx: CanvasRenderingContext2D, family: string, s: string, x: number, y: number,
  o: { size: number; weight?: number; color: string; max: number; line: number; align?: CanvasTextAlign; alpha?: number; lines?: number }): number {
  ctx.font = `${o.weight ?? 700} ${o.size}px ${family}`;
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  // 「對局結束 · 盲棋 · 對 AI」這種一段一段的，只在 · 斷開（不要把「盲棋」拆成兩行）
  const parts = s.includes(' · ')
    ? s.split(' · ').map((x, i, all) => (i < all.length - 1 ? `${x} · ` : x))
    : Seg ? Array.from(new Seg(undefined, { granularity: 'word' }).segment(s), (x) => x.segment) : s.split(/(\s+)/);
  const lay = (max: number) => {
    const rows: string[] = [];
    let cur = '';
    for (const p of parts) {
      if (cur && ctx.measureText(cur + p).width > max) { rows.push(cur.trimEnd()); cur = p.trimStart(); }
      else cur += p;
    }
    if (cur) rows.push(cur);
    return rows;
  };
  // 每行差不多長：同樣的行數下，把寬度縮到不能再縮為止（不然最後一行常常只剩「子。」一個字）
  let rows = lay(o.max);
  for (let w = o.max - 8; rows.length > 1 && w > o.max * 0.5; w -= 8) {
    const next = lay(w);
    if (next.length !== rows.length) break;
    rows = next;
  }
  const shown = rows.slice(0, o.lines ?? 3);
  shown.forEach((r, i) => fitText(ctx, family, r, x, y + i * o.line, { size: o.size, weight: o.weight ?? 700, color: o.color, max: o.max, align: o.align, alpha: o.alpha }));
  return y + (shown.length - 1) * o.line;
}

/** 平針縫：一圈虛線（同 .gmk-patch 的 outline） */
function stitch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, inset: number, width: number, color: string, alpha: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.setLineDash([width * 3.2, width * 2.4]);
  ctx.strokeRect(x + inset, y + inset, w - inset * 2, h - inset * 2);
  ctx.restore();
}

/** 頁尾：一塊白絲布、一圈平針縫；左邊站名與出處、右邊 QR */
function footer(ctx: CanvasRenderingContext2D, d: GomokuCardData, a: ShareAssets, x: number, y: number, w: number, h: number, o: { brand: number; small: number; qr: number }) {
  fillBox(ctx, GMK.silkLight, x, y, w, h, 4);
  stitch(ctx, x, y, w, h, 12, 3, INK, 0.35);
  const pad = Math.max(40, (h - o.qr) / 2);
  const left = x + pad, max = w - pad * 2 - o.qr - 32;
  drawBrand(ctx, d.font, a, d.text.brand, left, y + h / 2 - o.small * 0.25, { size: o.brand, color: INK, max });
  fitText(ctx, d.font, `${d.text.from} · ${d.text.host}`, left, y + h / 2 + o.small * 1.55, { size: o.small, weight: 700, color: INK, max, alpha: 0.7 });
  drawQr(ctx, a.qr, x + w - pad - o.qr, y + (h - o.qr) / 2, o.qr, INK, GMK.silkLight, 0);
}

function page(ctx: CanvasRenderingContext2D, W: number, H: number, band: number) {
  ctx.fillStyle = GMK.silk;
  ctx.fillRect(0, 0, W, H);
  frame(ctx, W, H, band);
}

// ─── 三種比例 ─────────────────────────────────────────────────────────────────

function story(ctx: CanvasRenderingContext2D, d: GomokuCardData, a: ShareAssets) {
  const W = 1080, H = 1920, cx = W / 2;
  page(ctx, W, H, 44);
  fitText(ctx, d.font, d.text.kicker, cx, 166, { size: 30, weight: 700, color: INK, align: 'center', max: 880, alpha: 0.7 });
  fitText(ctx, d.font, d.text.name, cx, 300, { size: 124, color: INK, align: 'center', max: 900 });
  fitText(ctx, d.font, d.text.sub, cx, 366, { size: 40, weight: 700, color: INK, align: 'center', max: 880, alpha: 0.7 });
  winnerRow(ctx, d, cx, 490, 128, 84, 880);
  board(ctx, d, 100, 600, 880);
  wrap(ctx, d.font, d.text.body, cx, 1550, { size: 36, color: INK, max: 860, line: 50, align: 'center', lines: 2 });
  footer(ctx, d, a, 100, 1638, 880, 184, { brand: 40, small: 24, qr: 140 });
}

function poster(ctx: CanvasRenderingContext2D, d: GomokuCardData, a: ShareAssets) {
  const W = 1080, H = 1350, cx = W / 2;
  page(ctx, W, H, 40);
  fitText(ctx, d.font, `${d.text.name} · ${d.text.sub}`, cx, 132, { size: 36, color: INK, align: 'center', max: 860 });
  fitText(ctx, d.font, d.text.kicker, cx, 180, { size: 24, weight: 700, color: INK, align: 'center', max: 860, alpha: 0.7 });
  winnerRow(ctx, d, cx, 262, 100, 68, 860);
  board(ctx, d, 210, 352, 660);
  wrap(ctx, d.font, d.text.body, cx, 1066, { size: 30, color: INK, max: 820, line: 40, align: 'center', lines: 1 });
  footer(ctx, d, a, 120, 1112, 840, 150, { brand: 34, small: 21, qr: 110 });
}

function square(ctx: CanvasRenderingContext2D, d: GomokuCardData, a: ShareAssets) {
  const W = 1080, H = 1080;
  page(ctx, W, H, 36);
  // 左欄：名字、勝負、一句話；右邊是盤面；頁尾橫跨底下
  const lx = 84, lw = 228, lcx = lx + lw / 2;
  const k = wrap(ctx, d.font, d.text.kicker, lcx, 128, { size: 22, color: INK, max: lw, line: 30, align: 'center', alpha: 0.7, lines: 2 });
  fitText(ctx, d.font, d.text.name, lcx, k + 92, { size: 60, color: INK, align: 'center', max: lw });
  fitText(ctx, d.font, d.text.sub, lcx, k + 134, { size: 24, weight: 700, color: INK, align: 'center', max: lw, alpha: 0.7 });
  const dia = 104;
  winnerStone(ctx, d, lcx - stoneWidth(d, dia) / 2, k + 250, dia);
  fitText(ctx, d.font, d.text.title, lcx, k + 384, { size: 54, color: INK, align: 'center', max: lw });
  wrap(ctx, d.font, d.text.body, lcx, k + 436, { size: 24, color: INK, max: lw, line: 34, align: 'center', lines: 3 });
  board(ctx, d, 340, 80, 660);
  footer(ctx, d, a, 84, 772, 912, 214, { brand: 40, small: 24, qr: 150 });
}

export function drawGomokuCard(d: GomokuCardData) {
  return (ctx: CanvasRenderingContext2D, layout: CardLayout, a: ShareAssets) => {
    if (layout === 'story') story(ctx, d, a);
    else if (layout === 'poster') poster(ctx, d, a);
    else square(ctx, d, a);
  };
}

