import { drawBrand, drawQr, fitText, type CardLayout, type ShareAssets } from '@/utils/shareCard';
import { INK, KEY_ART, PAPER, RED } from './theme';
import { WORDMARK_PATH, WORDMARK_VIEWBOX } from './TauWordmark';

/**
 * 時間拍賣的結算分享圖（Zach 10/24：每款都要有「結尾的可分享畫面」，而且長得像那款自己）。
 *
 * 一頁維多利亞拍賣目錄的「成交紀錄」（prices realised）：報紙色的紙、最外緣一圈紅色牛津角框（同 .tau-frame：
 * 一粗一細兩條線在四角交叉、伸到紙邊），肥臉體的「TIME AUCTION」字標（同 TauWordmark 的向量），分段用雙線。
 * 由上往下：最終排名·模式·難度 → 字標與中文名 → Cruikshank〈Sales by Auction〉（只有 9:16 放得下）→ 大標「你贏了！」
 * （第一名蓋一個紅色成交章）→ 排名表（第一名是紅色版塊，跟對局裡的結算一樣；你那一列前面一顆紅點）→
 * 19 件拍品各由幾號競買人得標（你得的那幾格是紅色版塊、流標是虛線格）→ 最下面站名、出處與 QR。
 *
 * 顏色只有 theme.ts 的紙、墨、紅（取樣自原件），副字用墨色加透明度，不另外加色。數字用 Didone 襯線（同 .tau-display，系統字型）。
 * 版面座標以 1080 寬為準（見 utils/shareCard.ts）。
 */
export type TauCardRow = {
  rank: number;
  /** 競買人編號（對局畫面的 No.1–6，你是 1） */
  no: number;
  name: string;
  /** 電腦的個性（結算才揭曉）；你是 null */
  persona: string | null;
  tokens: number;
  left: string;
  me: boolean;
};

export type TauCardData = {
  rows: TauCardRow[];
  /** 每一回合由第幾席得標（座位，0 是你）；流標是 null */
  lots: (number | null)[];
  /** 你第一名（並列也算）：大標旁邊蓋成交章 */
  won: boolean;
  text: {
    kicker: string;
    title: string;
    /** 中日韓的遊戲名（英文版字標就是名字，null） */
    name: string | null;
    /** 你的標記與剩餘時間那一行 */
    you: string;
    tokensCol: string;
    leftCol: string;
    lotsLabel: string;
    stamp: string;
    brand: string;
    from: string;
    host: string;
  };
  font: string;
};

/** images 的順序（useShareCard 的 images 照這個給） */
export const TAU_CARD_IMAGES = [KEY_ART];

/** 跑秒數字的 Didone（同 globals.css 的 .tau-display）：系統字型，不必等下載 */
export const DIDONE = 'Didot, "Bodoni 72", "Bodoni MT", Georgia, serif';

const SOFT = 0.72;

/** 牛津角框：同 .tau-frame 的 border-image（30 格的圖、切 10 格）—— 粗線在框寬的 0.26–0.50、細線在 0.74–0.83，全長，所以四角交叉、伸到紙邊 */
function frame(ctx: CanvasRenderingContext2D, W: number, H: number, F: number) {
  ctx.fillStyle = RED;
  for (const [a, b] of [[0.26, 0.24], [0.74, 0.09]]) {
    const o = F * a, t = F * b;
    ctx.fillRect(0, o, W, t);
    ctx.fillRect(0, H - o - t, W, t);
    ctx.fillRect(o, 0, t, H);
    ctx.fillRect(W - o - t, 0, t, H);
  }
}

/** 雙線（上粗下細），拍賣目錄分段用 */
function doubleRule(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, s = 1) {
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, w, 3 * s);
  ctx.globalAlpha = 0.7;
  ctx.fillRect(x, y + 7 * s, w, 1.2 * s);
  ctx.globalAlpha = 1;
}

/** 區段標題：左右兩條細線夾著（同 .tau-head） */
function head(ctx: CanvasRenderingContext2D, font: string, s: string, cx: number, y: number, w: number, size: number) {
  ctx.font = `900 ${size}px ${font}`;
  const tw = Math.min(ctx.measureText(s).width, w * 0.7);
  fitText(ctx, font, s, cx, y, { size, color: INK, align: 'center', max: w * 0.7, alpha: SOFT });
  ctx.fillStyle = INK;
  ctx.globalAlpha = 0.4;
  const mid = y - size * 0.35;
  ctx.fillRect(cx - w / 2, mid, w / 2 - tw / 2 - size * 0.6, 1.5);
  ctx.fillRect(cx + tw / 2 + size * 0.6, mid, w / 2 - tw / 2 - size * 0.6, 1.5);
  ctx.globalAlpha = 1;
}

function wordmark(ctx: CanvasRenderingContext2D, cx: number, top: number, h: number) {
  const [vx, vy, vw, vh] = WORDMARK_VIEWBOX;
  const s = h / vh;
  ctx.save();
  ctx.translate(cx - (vw * s) / 2 - vx * s, top - vy * s);
  ctx.scale(s, s);
  ctx.fillStyle = INK;
  ctx.fill(new Path2D(WORDMARK_PATH));
  ctx.restore();
}

/** 主視覺：拍賣場的版畫，印在紙上（multiply，跟進場那張傳單一樣），一道墨線框 */
function art(ctx: CanvasRenderingContext2D, img: HTMLImageElement | undefined, x: number, y: number, w: number, h: number) {
  if (img) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    // 照原圖比例裁成這個框（object-fit: cover）
    const r = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / r, sh = h / r;
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
    ctx.restore();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

/** 成交章：紅色雙框、斜 7°、印泥壓在字上（multiply） */
function stamp(ctx: CanvasRenderingContext2D, font: string, s: string, x: number, y: number, size: number) {
  ctx.save();
  ctx.font = `900 ${size}px ${font}`;
  const tw = ctx.measureText(s).width;
  const w = tw + size * 0.9, h = size * 1.55;
  ctx.translate(x, y);
  ctx.rotate((-7 * Math.PI) / 180);
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.92;
  ctx.strokeStyle = RED;
  ctx.lineWidth = size * 0.11;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.lineWidth = size * 0.045;
  const k = size * 0.19;
  ctx.strokeRect(-w / 2 + k, -h / 2 + k, w - k * 2, h - k * 2);
  ctx.fillStyle = RED;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, 0, size * 0.04);
  ctx.restore();
}

/** 大標＋你的那一行；第一名在大標的右上角蓋成交章 */
function headline(ctx: CanvasRenderingContext2D, d: TauCardData, cx: number, y: number, o: { size: number; small: number; max: number; gap: number }) {
  const size = fitText(ctx, d.font, d.text.title, cx, y, { size: o.size, color: INK, align: 'center', max: o.max });
  fitText(ctx, d.font, d.text.you, cx, y + o.gap, { size: o.small, weight: 700, color: INK, align: 'center', max: o.max, alpha: 0.8 });
  if (!d.won) return;
  ctx.font = `900 ${size}px ${d.font}`;
  const tw = ctx.measureText(d.text.title).width;
  stamp(ctx, d.font, d.text.stamp, Math.min(cx + tw / 2 + o.small * 0.6, cx + o.max / 2 - o.small), y - size * 0.95, o.small * 1.15);
}

/** 一排點線（拍賣目錄裡名字與價錢之間的那種） */
function leader(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, color: string, r: number) {
  if (x1 - x0 < r * 6) return;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.35;
  for (let x = x0 + r * 2; x < x1 - r; x += r * 5) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** 排名表：名次、No.、名字（電腦附個性）、點線、標記數、剩餘時間。第一名是紅色版塊、紙色字（同對局結算的 .tau-press） */
function standings(ctx: CanvasRenderingContext2D, d: TauCardData, x: number, y: number, w: number, rh: number, size: number) {
  const timeR = x + w - size * 0.7;
  const timeW = size * 3.6;
  const tokC = timeR - timeW - size * 1.2;
  const small = Math.round(size * 0.62);
  fitText(ctx, d.font, d.text.tokensCol, tokC, y - small * 0.6, { size: small, weight: 700, color: INK, align: 'center', alpha: SOFT, max: size * 3 });
  fitText(ctx, d.font, d.text.leftCol, timeR, y - small * 0.6, { size: small, weight: 700, color: INK, align: 'right', alpha: SOFT, max: timeW });
  d.rows.forEach((r, i) => {
    const top = y + i * rh;
    const first = r.rank === 1;
    const fg = first ? PAPER : INK;
    const alpha = first || r.me ? 1 : SOFT;
    if (first) {
      ctx.fillStyle = RED;
      ctx.fillRect(x, top + 3, w, rh - 6);
      ctx.strokeStyle = 'rgba(235, 225, 184, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 6.75, top + 9.75, w - 13.5, rh - 19.5);
    } else {
      leader(ctx, x, x + w, top + rh - 2, INK, 1.4);
    }
    const base = top + rh / 2 + size * 0.36;
    let tx = x + size * 0.6;
    fitText(ctx, DIDONE, String(r.rank), tx + size * 0.4, base, { size: size * 1.05, weight: 700, style: 'italic', color: fg, align: 'center', alpha });
    tx += size * 1.5;
    if (r.me && !first) {
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.arc(tx + size * 0.2, base - size * 0.32, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      tx += size * 0.6;
    }
    ctx.font = `italic 400 ${small}px ${DIDONE}`;
    const no = `No.${r.no}`;
    fitText(ctx, DIDONE, no, tx, base, { size: small, weight: 400, style: 'italic', color: fg, alpha: alpha * 0.8 });
    tx += ctx.measureText(no).width + size * 0.35;
    const nameMax = tokC - size * 1.6 - tx;
    const used = fitText(ctx, d.font, r.name, tx, base, { size, color: fg, alpha, max: nameMax, min: size * 0.7 });
    ctx.font = `900 ${used}px ${d.font}`;
    tx += ctx.measureText(r.name).width;
    if (r.persona) {
      ctx.font = `700 ${small}px ${d.font}`;
      const pw = ctx.measureText(r.persona).width;
      // 放不下就不寫個性（名次與數字比較重要）
      if (tx + size * 0.4 + pw < tokC - size * 1.4) {
        fitText(ctx, d.font, r.persona, tx + size * 0.4, base, { size: small, weight: 700, color: fg, alpha: alpha * 0.8 });
        tx += size * 0.4 + pw;
      }
    }
    leader(ctx, tx + size * 0.3, tokC - size * 1.1, base - size * 0.08, fg, 1.6);
    fitText(ctx, d.font, String(r.tokens), tokC, base, { size: size * 1.1, color: fg, align: 'center', alpha });
    fitText(ctx, DIDONE, r.left, timeR, base, { size: size * 0.95, weight: 700, color: fg, align: 'right', alpha, max: timeW });
  });
}

/**
 * 19 件拍品：每格寫由幾號競買人得標。你得的是紅色版塊、別人得的是墨色雙線的票、流標是虛線格寫「–」。
 * 格子夠大時左上角另外印拍品號碼。perRow 一排幾格，置中排。
 */
function lots(ctx: CanvasRenderingContext2D, d: TauCardData, cx: number, y: number, c: number, gap: number, perRow: number) {
  const n = d.lots.length;
  const showNo = c >= 56;
  d.lots.forEach((winner, i) => {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, n - row * perRow);
    const col = i % perRow;
    const x = cx - (inRow * c + (inRow - 1) * gap) / 2 + col * (c + gap);
    const top = y + row * (c + gap);
    const mine = winner === 0;
    if (mine) {
      ctx.fillStyle = RED;
      ctx.fillRect(x, top, c, c);
      ctx.strokeStyle = 'rgba(235, 225, 184, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x + c * 0.09, top + c * 0.09, c * 0.82, c * 0.82);
    } else if (winner !== null) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, top + 1, c - 2, c - 2);
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + c * 0.1, top + c * 0.1, c * 0.8, c * 0.8);
      ctx.globalAlpha = 1;
    } else {
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([c * 0.08, c * 0.07]);
      ctx.lineWidth = 1.6;
      ctx.strokeRect(x + 1, top + 1, c - 2, c - 2);
      ctx.restore();
    }
    const fg = mine ? PAPER : INK;
    if (showNo) {
      fitText(ctx, DIDONE, String(i + 1), x + c * 0.16, top + c * 0.3, { size: c * 0.2, weight: 400, style: 'italic', color: fg, alpha: 0.7 });
    }
    const size = c * (showNo ? 0.46 : 0.52);
    fitText(ctx, DIDONE, winner === null ? '–' : String(winner + 1), x + c / 2, top + c * (showNo ? 0.6 : 0.5) + size * 0.36,
      { size, weight: 700, color: fg, align: 'center', alpha: winner === null ? 0.45 : 1 });
  });
  return Math.ceil(n / perRow) * (c + gap) - gap;
}

/** 最下面：雙線，左邊站名與出處，右邊 QR（墨色、方角，像印上去的） */
function footer(ctx: CanvasRenderingContext2D, d: TauCardData, a: ShareAssets, x: number, y: number, w: number, h: number, o: { brand: number; small: number; qr: number }) {
  doubleRule(ctx, x, y, w);
  const top = y + 10, inner = h - 10;
  const max = w - o.qr - 40;
  const mid = top + inner / 2;
  drawBrand(ctx, d.font, a, d.text.brand, x, mid - o.small * 0.2, { size: o.brand, color: INK, max });
  fitText(ctx, d.font, `${d.text.from} · ${d.text.host}`, x, mid + o.small * 1.55, { size: o.small, weight: 700, color: INK, max, alpha: SOFT });
  drawQr(ctx, a.qr, x + w - o.qr, top + (inner - o.qr) / 2, o.qr, INK, PAPER, 0);
}

function paper(ctx: CanvasRenderingContext2D, W: number, H: number, F: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  frame(ctx, W, H, F);
}

/** 少於 6 席時多出來的高度，平均分到排名表的上下（不要全部堆在最下面） */
const slackOf = (d: TauCardData, rh: number) => ((6 - d.rows.length) * rh) / 2;

function story(ctx: CanvasRenderingContext2D, d: TauCardData, a: ShareAssets) {
  const W = 1080, H = 1920, F = 40, x = 100, w = 880, cx = W / 2, rh = 70;
  paper(ctx, W, H, F);
  const slack = slackOf(d, rh);
  let y = 132;
  fitText(ctx, d.font, d.text.kicker, cx, y, { size: 30, weight: 700, color: INK, align: 'center', max: w, alpha: SOFT });
  const wm = d.text.name ? 72 : 88;
  wordmark(ctx, cx, y + 32, wm);
  y += 32 + wm + 26;
  doubleRule(ctx, x, y, w);
  if (d.text.name) { y += 84; fitText(ctx, d.font, d.text.name, cx, y, { size: 64, color: INK, align: 'center', max: w }); }
  y += 40;
  const aw = d.text.name ? 560 : 640, ah = Math.round(aw * 462 / 818);
  art(ctx, a.images[0], cx - aw / 2, y, aw, ah);
  y += ah + 32;
  doubleRule(ctx, x, y, w);
  y += 136 + slack * 0.5;
  headline(ctx, d, cx, y, { size: 112, small: 34, max: w, gap: 58 });
  y += 58 + 76 + slack * 0.5;
  standings(ctx, d, x, y, w, rh, 34);
  y += d.rows.length * rh + 66 + slack;
  head(ctx, d.font, d.text.lotsLabel, cx, y, w, 26);
  y += 26;
  lots(ctx, d, cx, y, 66, 12, 10);
  footer(ctx, d, a, x, H - F - 28 - 128, w, 128, { brand: 36, small: 24, qr: 108 });
}

function poster(ctx: CanvasRenderingContext2D, d: TauCardData, a: ShareAssets) {
  const W = 1080, H = 1350, F = 36, x = 92, w = 896, cx = W / 2, rh = 60;
  paper(ctx, W, H, F);
  const slack = slackOf(d, rh);
  let y = 118;
  fitText(ctx, d.font, d.text.kicker, cx, y, { size: 26, weight: 700, color: INK, align: 'center', max: w, alpha: SOFT });
  const wm = d.text.name ? 58 : 76;
  wordmark(ctx, cx, y + 28, wm);
  y += 28 + wm + 22;
  doubleRule(ctx, x, y, w);
  if (d.text.name) { y += 72; fitText(ctx, d.font, d.text.name, cx, y, { size: 52, color: INK, align: 'center', max: w }); }
  y += 124 + slack * 0.5;
  headline(ctx, d, cx, y, { size: 92, small: 28, max: w, gap: 48 });
  y += 48 + 70 + slack * 0.5;
  standings(ctx, d, x, y, w, rh, 29);
  y += d.rows.length * rh + 56 + slack;
  head(ctx, d.font, d.text.lotsLabel, cx, y, w, 22);
  y += 22;
  lots(ctx, d, cx, y, 58, 10, 10);
  footer(ctx, d, a, x, H - F - 26 - 124, w, 124, { brand: 32, small: 21, qr: 100 });
}

function square(ctx: CanvasRenderingContext2D, d: TauCardData, a: ShareAssets) {
  const W = 1080, H = 1080, F = 34, rh = 60;
  paper(ctx, W, H, F);
  const x = 84, w = 912, cx = W / 2;
  fitText(ctx, d.font, d.text.kicker, cx, 116, { size: 22, weight: 700, color: INK, align: 'center', max: w, alpha: SOFT });
  wordmark(ctx, cx, 140, 56);
  doubleRule(ctx, x, 218, w);
  const footTop = H - F - 22 - 128;
  // 兩欄：左邊名字、大標與版畫，右邊排名表與拍品。整塊在雙線與頁尾之間置中；版畫的下緣跟右欄切齊（右欄比較高時）
  const lw = 380, lcx = x + lw / 2, rx = 500, rw = x + w - rx;
  const ah = Math.round(lw * 462 / 818);
  const lotsH = Math.ceil(d.lots.length / 10) * 50 - 6;
  const rightH = 24 + d.rows.length * rh + 70 + lotsH;
  const leftH = (d.text.name ? 46 : 0) + 92 + 84 + ah;
  const y0 = 240 + (footTop - 30 - 240 - Math.max(rightH, leftH)) / 2;
  const top = y0 + 24;
  standings(ctx, d, rx, top, rw, rh, 23);
  const ry = top + d.rows.length * rh + 52;
  head(ctx, d.font, d.text.lotsLabel, rx + rw / 2, ry, rw, 18);
  lots(ctx, d, rx + rw / 2, ry + 18, 44, 6, 10);
  let ly = y0;
  if (d.text.name) { ly += 46; fitText(ctx, d.font, d.text.name, lcx, ly, { size: 44, color: INK, align: 'center', max: lw }); }
  ly += 92;
  headline(ctx, d, lcx, ly, { size: 70, small: 22, max: lw, gap: 44 });
  art(ctx, a.images[0], x, Math.max(ly + 84, y0 + rightH - ah), lw, ah);
  footer(ctx, d, a, x, footTop, w, 128, { brand: 32, small: 20, qr: 100 });
}

export function drawTauCard(d: TauCardData) {
  return (ctx: CanvasRenderingContext2D, layout: CardLayout, a: ShareAssets) => {
    if (layout === 'story') story(ctx, d, a);
    else if (layout === 'poster') poster(ctx, d, a);
    else square(ctx, d, a);
  };
}
