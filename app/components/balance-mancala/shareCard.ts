import { COLOURS, letterOf, type Scores, type Seat } from '@/games/balance-mancala/engine';
import { drawBrand, drawQr, fitText, type CardLayout, type ShareAssets } from '@/utils/shareCard';
import { fill } from '@/i18n/gameText';
import { BRASS, BRASS_DEEP, CLOTH, CLOTH_LIGHT, INK, INK_SOFT, WOOD, seatLook } from './palette';

/**
 * 平衡播棋的結算分享圖（Zach 10/24：結尾的可分享畫面，各自設計）。長得像這款的頁面，不像 Wall Go 的平塗撞色：
 *
 * - 底是 1825 年那塊 Adinkra 印花布的布色，最外緣一圈蓋印的布邊 —— 跟頁面同一張 frame.png 照 border-image 的方式切九宮格、
 *   邊段 round 重複（整數個印章），裡面不加任何花紋
 * - 上面是首頁的主視覺（三件黃金砝碼）、節目出處、遊戲名；結果寫在一塊黃銅牌上（主要按鈕的那塊牌子）
 * - 名次一人一列：勝方是一塊木頭（盤面的木色），輸家是一條印花布（上下兩道梳線，次要按鈕的那條布）。
 *   每列右邊是三個盤子 —— 盤面上同樣的紅藍綠、同樣的黃銅外緣 —— 裡面寫那一色的分數，最右邊是最終分數（2×最低−最高）
 * - 最下面一條印花布放站名與 QR
 *
 * 顏色全部是 palette.ts 的（布、墨、黃銅、木頭、座位色）；盤子的紅藍綠是站上的玩家色，由畫面讀 CSS 變數傳進來。
 * 版面座標以 1080 寬為準。
 */
export type MancalaCardRow = { seat: Seat; rank: number; name: string; scores: Scores; final: number };

export type MancalaCardData = {
  /** 已經照名次排好（standings） */
  rows: MancalaCardRow[];
  /** 紅藍綠盤子的顏色（--player-A/B/C 的值） */
  dish: [string, string, string];
  font: string;
  text: {
    showRef: string;
    name: string;
    altName: string;
    kicker: string;
    title: string;
    reason: string;
    formula: string;
    colourShort: [string, string, string];
    /** 「第 {n} 名」 */
    rank: string;
    final: string;
    brand: string;
    from: string;
    host: string;
  };
};

/** images 的順序（useShareCard 的 images 照這個給）：布邊、三件砝碼 */
export const MCL_CARD_IMAGES = ['/games/balance-mancala/frame.png', '/games/balance-mancala/weights.webp'];

type Ctx = CanvasRenderingContext2D;
const WEIGHTS_RATIO = 264 / 1000;

/** 切角的長方形（.mcl-plaque／.mcl-cut 的形狀） */
function cutPath(ctx: Ctx, x: number, y: number, w: number, h: number, k: number) {
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.lineTo(x + w - k, y);
  ctx.lineTo(x + w, y + k);
  ctx.lineTo(x + w, y + h - k);
  ctx.lineTo(x + w - k, y + h);
  ctx.lineTo(x + k, y + h);
  ctx.lineTo(x, y + h - k);
  ctx.lineTo(x, y + k);
  ctx.closePath();
}

/** 黃銅牌：黃銅底、切角，內側一圈淡墨（同 .mcl-plaque 的 inset 陰影） */
function plaque(ctx: Ctx, x: number, y: number, w: number, h: number, k: number) {
  ctx.save();
  cutPath(ctx, x, y, w, h, k);
  ctx.fillStyle = BRASS;
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(32,18,17,0.28)';
  ctx.lineWidth = k * 0.7;
  cutPath(ctx, x, y, w, h, k);
  ctx.stroke();
  ctx.restore();
}

/** 印花布條：亮布色，上下各兩道梳線（同 .mcl-cloth，s 是 CSS px 到圖上的倍數） */
function comb(ctx: Ctx, x: number, y: number, w: number, h: number, s: number) {
  ctx.fillStyle = CLOTH_LIGHT;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(32,18,17,0.55)';
  for (const dy of [3, 6]) {
    ctx.fillRect(x, y + dy * s, w, s);
    ctx.fillRect(x, y + h - dy * s - s, w, s);
  }
}

/**
 * 最外緣的布邊：frame.png（234×234，slice 84）照 CSS 的 `border-image: … 84 / band round` 畫 ——
 * 四角各一個印章，邊段重複整數次、稍微伸縮到剛好填滿。圖沒載到就畫兩道墨線。
 */
function frame(ctx: Ctx, img: HTMLImageElement | undefined, w: number, h: number, band: number) {
  if (!img) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = band * 0.06;
    for (const k of [0.25, 0.75]) ctx.strokeRect(band * k, band * k, w - band * k * 2, h - band * k * 2);
    return;
  }
  const S = 84, M = img.naturalWidth - S * 2, E = img.naturalWidth - S;
  const unit = (band * M) / S;
  const edge = (len: number) => { const n = Math.max(1, Math.round(len / unit)); return { n, seg: len / n }; };
  ctx.drawImage(img, 0, 0, S, S, 0, 0, band, band);
  ctx.drawImage(img, E, 0, S, S, w - band, 0, band, band);
  ctx.drawImage(img, 0, E, S, S, 0, h - band, band, band);
  ctx.drawImage(img, E, E, S, S, w - band, h - band, band, band);
  const hz = edge(w - band * 2);
  for (let i = 0; i < hz.n; i++) {
    const x = band + i * hz.seg;
    // 多畫半個像素，相鄰兩段之間才不會透出細縫
    ctx.drawImage(img, S, 0, M, S, x, 0, hz.seg + 0.5, band);
    ctx.drawImage(img, S, E, M, S, x, h - band, hz.seg + 0.5, band);
  }
  const vt = edge(h - band * 2);
  for (let i = 0; i < vt.n; i++) {
    const y = band + i * vt.seg;
    ctx.drawImage(img, 0, S, S, M, 0, y, band, vt.seg + 0.5);
    ctx.drawImage(img, E, S, S, M, w - band, y, band, vt.seg + 0.5);
  }
}

function centered(ctx: Ctx, font: string, s: string, cx: number, cy: number, size: number, color: string, alpha = 1) {
  ctx.save();
  ctx.font = `900 ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, cx, cy + size * 0.04);
  ctx.restore();
}

/** 一顆子：座位色＋字母，外圈一道亮布色的縫（同 PieceDisc） */
function disc(ctx: Ctx, font: string, seat: Seat, cx: number, cy: number, d: number, alpha = 1) {
  const look = seatLook(seat);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = CLOTH_LIGHT;
  ctx.beginPath();
  ctx.arc(cx, cy, d / 2 + d * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = look.bg;
  ctx.beginPath();
  ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  centered(ctx, font, letterOf(seat), cx, cy, d * 0.56, look.fg, alpha);
}

/** 一個盤子：紅／藍／綠，黃銅外緣（同盤面），裡面寫分數 */
function dish(ctx: Ctx, font: string, color: string, value: number, cx: number, cy: number, d: number, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = d * 0.06;
  ctx.beginPath();
  ctx.arc(cx, cy, d / 2 - d * 0.03, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  centered(ctx, font, String(value), cx, cy, d * 0.44, CLOTH_LIGHT, alpha);
}

type Cols = { x: number; w: number; u: number; rankLabel: boolean };

/**
 * 名次表。欄位位置只跟 u（這張圖的比例尺）有關，勝方與輸家的列高不同、欄位仍然對齊。
 * u 由寬度與「全部塞得進 h」兩邊決定；人少時列與列之間拉開一點（最多 1.3 倍），不讓表縮在中間。
 */
function table(ctx: Ctx, d: MancalaCardData, x: number, y: number, w: number, h: number, uMax: number, rankLabel: boolean) {
  const n = d.rows.length;
  const wins = d.rows.filter((r) => r.rank === 1).length;
  const need = wins * 180 + (n - wins) * 104 + (n - 1) * 16;
  // 一列最少要這麼寬（名字至少留 120）
  const u = Math.min(uMax, w / (rankLabel ? 828 : 764), h / need);
  const spread = Math.min(1.3, h / (need * u));
  const c: Cols = { x, w, u, rankLabel };
  let top = y + (h - need * u * spread) / 2;
  for (const r of d.rows) {
    const rh = (r.rank === 1 ? 180 : 104) * u * spread;
    row(ctx, d, r, c, top, rh);
    top += rh + 16 * u * spread;
  }
}

function row(ctx: Ctx, d: MancalaCardData, r: MancalaCardRow, c: Cols, y: number, h: number) {
  const { u } = c;
  const win = r.rank === 1;
  const cy = y + h / 2;
  if (win) {
    cutPath(ctx, c.x, y, c.w, h, 14 * u);
    ctx.fillStyle = WOOD;
    ctx.fill();
  } else comb(ctx, c.x, y, c.w, h, 2.4 * u);

  const pad = 28 * u;
  const rankW = c.rankLabel ? 104 * u : 40 * u;
  const discCX = c.x + pad + rankW + 45 * u;
  const nameX = discCX + 45 * u + 22 * u;
  const finalW = 110 * u;
  const finalR = c.x + c.w - pad;
  const pitD = (win ? 86 : 58) * u;
  const pit2 = finalR - finalW - 20 * u - 43 * u;
  const pits = [pit2 - 200 * u, pit2 - 100 * u, pit2];
  const nameMax = pits[0] - 43 * u - 20 * u - nameX;
  const fg = win ? CLOTH_LIGHT : INK;
  const soft = win ? BRASS : INK_SOFT;

  const label = c.rankLabel ? fill(d.text.rank, { n: r.rank }) : String(r.rank);
  fitText(ctx, d.font, label, c.x + pad, cy + 9 * u, { size: (win ? 28 : 24) * u, color: soft, max: rankW - 12 * u });
  disc(ctx, d.font, r.seat, discCX, cy, (win ? 90 : 58) * u, win ? 1 : 0.8);
  fitText(ctx, d.font, r.name, nameX, cy + (win ? 14 : 11) * u, { size: (win ? 42 : 32) * u, color: win ? fg : INK_SOFT, max: nameMax });

  COLOURS.forEach((k) => {
    const px = pits[k];
    dish(ctx, d.font, d.dish[k], r.scores[k], px, cy - (win ? 10 : 6) * u, pitD, win ? 1 : 0.85);
    fitText(ctx, d.font, d.text.colourShort[k], px, cy - (win ? 10 : 6) * u + pitD / 2 + (win ? 26 : 18) * u, {
      size: (win ? 19 : 15) * u, weight: 900, color: soft, align: 'center', max: 96 * u,
    });
  });

  if (win) fitText(ctx, d.font, d.text.final, finalR, cy - 34 * u, { size: 20 * u, weight: 900, color: CLOTH_LIGHT, align: 'right', alpha: 0.7, max: finalW + 20 * u });
  fitText(ctx, d.font, String(r.final), finalR, cy + (win ? 38 : 18) * u, { size: (win ? 80 : 52) * u, color: win ? BRASS : INK, align: 'right', max: finalW + 20 * u });
}

/** 結果的黃銅牌：上面一行小字（遊戲結束 · 模式），牌子裡是大標 */
function resultPlaque(ctx: Ctx, d: MancalaCardData, cx: number, y: number, w: number, h: number, size: number) {
  plaque(ctx, cx - w / 2, y, w, h, Math.round(h * 0.13));
  fitText(ctx, d.font, d.text.title, cx, y + h / 2 + size * 0.36, { size, color: INK, align: 'center', max: w - h * 0.6 });
}

function weights(ctx: Ctx, a: ShareAssets, cx: number, y: number, w: number) {
  const img = a.images[1];
  if (img) ctx.drawImage(img, cx - w / 2, y, w, w * WEIGHTS_RATIO);
}

function footer(ctx: Ctx, d: MancalaCardData, a: ShareAssets, x: number, y: number, w: number, h: number, o: { brand: number; small: number; qr: number; s: number }) {
  comb(ctx, x, y, w, h, o.s);
  const left = x + 40, max = w - 40 - o.qr - 80;
  drawBrand(ctx, d.font, a, d.text.brand, left, y + h / 2 - o.small * 0.15, { size: o.brand, color: INK, max });
  fitText(ctx, d.font, `${d.text.from} · ${d.text.host}`, left, y + h / 2 + o.small * 1.55, { size: o.small, weight: 700, color: INK_SOFT, max });
  drawQr(ctx, a.qr, x + w - 36 - o.qr, y + (h - o.qr) / 2, o.qr, INK, CLOTH_LIGHT, 0);
}

function base(ctx: Ctx, a: ShareAssets, w: number, h: number, band: number) {
  ctx.fillStyle = CLOTH;
  ctx.fillRect(0, 0, w, h);
  frame(ctx, a.images[0], w, h, band);
}

function story(ctx: Ctx, d: MancalaCardData, a: ShareAssets) {
  const W = 1080, H = 1920, B = 64, cx = W / 2;
  base(ctx, a, W, H, B);
  weights(ctx, a, cx, 112, 600);
  fitText(ctx, d.font, d.text.showRef, cx, 326, { size: 30, weight: 700, color: INK_SOFT, align: 'center', max: 860 });
  fitText(ctx, d.font, d.text.name, cx, 430, { size: 100, color: INK, align: 'center', max: 860 });
  if (d.text.altName) fitText(ctx, d.font, d.text.altName, cx, 486, { size: 34, weight: 700, color: INK_SOFT, align: 'center', max: 860 });
  fitText(ctx, d.font, d.text.kicker, cx, 562, { size: 28, weight: 700, color: INK_SOFT, align: 'center', max: 860 });
  resultPlaque(ctx, d, cx, 586, 740, 120, 64);
  table(ctx, d, 104, 748, 872, 812, 1, true);
  fitText(ctx, d.font, d.text.formula, cx, 1604, { size: 28, weight: 900, color: BRASS_DEEP, align: 'center', max: 860 });
  fitText(ctx, d.font, d.text.reason, cx, 1646, { size: 26, weight: 700, color: INK_SOFT, align: 'center', max: 880 });
  footer(ctx, d, a, 104, 1690, 872, 128, { brand: 38, small: 22, qr: 100, s: 2.4 });
}

/** 只有 9:16（Zach 10/24：「感覺可以留 9:16 就好」，跟尼泊爾虎棋一樣）；4:5、1:1 的版面拿掉了 */
export function drawMancalaCard(d: MancalaCardData) {
  return (ctx: CanvasRenderingContext2D, layout: CardLayout, a: ShareAssets) => story(ctx, d, a);
}
