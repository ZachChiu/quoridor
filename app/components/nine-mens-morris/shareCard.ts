import { COORDS, MILLS, type Cell, type Side } from '@/games/nine-mens-morris/engine';
import { drawBrand, drawQr, fitText, type CardLayout, type ShareAssets, type ShareDraw } from '@/utils/shareCard';
import { BOARD_H, BOARD_W, FRAME_INSET, MAN_FOOT, MAN_OUTLINE, MAN_SIZE, MAN_PARTS, STRIP, TRAY_BOX, TRAY_Y, gx, gy, trayTurn, trayX } from './art';
import { NMM } from './palette';
import { WORDMARK_PATH, WORDMARK_VIEWBOX } from './MorrisWordmark';

/**
 * 九子棋的結算分享圖（Zach 10/24：每款都要有結尾的可分享畫面，「然後各自設計符合各自」）。
 *
 * 長得像這款的頁面、也就是《遊戲之書》那幅插圖：群青底撒白點、最外緣朱紅框（四角小方塊裡一朵四瓣花，同 .nmm-frame），
 * 羊皮紙色的字；中間是終局的棋盤 —— 跟對局一樣的木頭棋盤、嵌線、鐘形小人，被拿掉的子躺在下方。
 * 最下面一塊拱頂的羊皮紙（同 .nmm-arch）放站名與 QR。顏色全部是 palette.ts 的，棋盤與棋子的形狀跟對局共用 art.ts。
 */
export type MorrisCardData = {
  board: Cell[];
  removed: Record<Side, number>;
  text: {
    kicker: string;
    title: string;
    reason: string;
    moves: string;
    brand: string;
    from: string;
    host: string;
  };
  font: string;
};

const P = NMM;

/** 固定種子的亂數：同一局每次畫出來的木紋一樣（預覽與存檔是分開畫的兩張） */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 木頭上的斑：一張很小的隨機透明度圖，放大時讓瀏覽器內插成一塊塊柔和的斑（對局的棋盤是 feTurbulence，看起來一樣） */
function blotches(color: string, cols: number, rows: number, seed: number, strength: number) {
  const c = document.createElement('canvas');
  c.width = cols;
  c.height = rows;
  const g = c.getContext('2d')!;
  const r = rng(seed);
  g.fillStyle = color;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      g.globalAlpha = Math.max(0, r() - 0.45) * strength;
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

/** 一個鐘形小人，box 是邊長（棋盤座標），(cx, cy) 是中心，rot 是躺下的角度 */
function drawMan(ctx: CanvasRenderingContext2D, side: Side, cx: number, cy: number, box: number, rot = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(box / 100, box / 100);
  ctx.translate(-50, -50);
  const parts = MAN_PARTS.map((d) => new Path2D(d));
  ctx.fillStyle = P.ink;
  if (side === 'white') {
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = MAN_OUTLINE;
    ctx.lineJoin = 'round';
    parts.forEach((p) => { ctx.fill(p); ctx.stroke(p); });
    ctx.fillStyle = P.parchment;
  }
  parts.forEach((p) => ctx.fill(p));
  ctx.restore();
}

/** 終局的棋盤：跟對局同一塊（MorrisBoard），寬 w */
function drawBoard(ctx: CanvasRenderingContext2D, d: MorrisCardData, x: number, y: number, w: number) {
  const k = w / BOARD_W;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(1.6, 0);
  ctx.arcTo(BOARD_W, 0, BOARD_W, BOARD_H, 1.6);
  ctx.arcTo(BOARD_W, BOARD_H, 0, BOARD_H, 1.6);
  ctx.arcTo(0, BOARD_H, 0, 0, 1.6);
  ctx.arcTo(0, 0, BOARD_W, 0, 1.6);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = P.wood;
  ctx.fillRect(0, 0, BOARD_W, BOARD_H);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(blotches(P.woodDark, 9, 11, 11, 1.5), 0, 0, BOARD_W, BOARD_H);
  ctx.drawImage(blotches(P.woodDark, 20, 24, 23, 0.8), 0, 0, BOARD_W, BOARD_H);
  ctx.drawImage(blotches(P.woodLight, 14, 17, 4, 1.4), 0, 0, BOARD_W, BOARD_H);
  ctx.restore();

  ctx.strokeStyle = P.woodDark;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, BOARD_W - 1, BOARD_H - 1);

  // 木條：先整條深色的邊，再疊淺金色
  ctx.lineCap = 'square';
  for (const [color, width] of [[P.stripEdge, STRIP.edge], [P.strip, STRIP.core]] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.strokeRect(FRAME_INSET, FRAME_INSET, BOARD_W - FRAME_INSET * 2, BOARD_H - FRAME_INSET * 2);
    ctx.beginPath();
    for (const l of MILLS) {
      const a = COORDS[l[0]], b = COORDS[l[2]];
      ctx.moveTo(gx(a.x), gy(a.y));
      ctx.lineTo(gx(b.x), gy(b.y));
    }
    ctx.stroke();
  }

  // 跟對局一樣：腳底站在交叉點上（方框中心在交叉點上方）
  d.board.forEach((cell, p) => {
    if (cell) drawMan(ctx, cell === 'B' ? 'black' : 'white', gx(COORDS[p].x), gy(COORDS[p].y) - (MAN_FOOT - 0.5) * MAN_SIZE, MAN_SIZE);
  });
  for (const s of ['black', 'white'] as const) {
    for (let i = 0; i < d.removed[s]; i++) drawMan(ctx, s, trayX(s, i), TRAY_Y, TRAY_BOX, (trayTurn(s) * Math.PI) / 180);
  }
  ctx.restore();
}

/** 群青底撒白點（同 .nmm-field，兩層錯開的點陣） */
function field(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = P.field;
  ctx.fillRect(0, 0, w, h);
  const step = 60;
  for (const [off, r, a] of [[0, 1.7, 0.32], [step / 2, 1.3, 0.18]] as const) {
    ctx.fillStyle = `rgba(238, 224, 196, ${a})`;
    for (let y = off; y < h; y += step) {
      for (let x = off; x < w; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/** 最外緣的朱紅框：朱紅一圈、內側一條羊皮紙細線，四角小方塊裡一朵四瓣花（同 .nmm-frame，b 是框的寬） */
function frame(ctx: CanvasRenderingContext2D, w: number, h: number, b: number) {
  const red = b * (8.5 / 12), line = b * (1.5 / 12);
  ctx.fillStyle = P.frame;
  ctx.fillRect(0, 0, w, red);
  ctx.fillRect(0, h - red, w, red);
  ctx.fillRect(0, 0, red, h);
  ctx.fillRect(w - red, 0, red, h);
  ctx.strokeStyle = P.parchment;
  ctx.lineWidth = line;
  ctx.strokeRect(red + line / 2, red + line / 2, w - (red + line / 2) * 2, h - (red + line / 2) * 2);
  for (const [cx, cy] of [[0, 0], [w - b, 0], [0, h - b], [w - b, h - b]]) {
    ctx.fillStyle = P.frame;
    ctx.fillRect(cx, cy, b, b);
    const mx = cx + b / 2, my = cy + b / 2, pr = b * (1.8 / 12), off = b * (2.1 / 12);
    ctx.fillStyle = P.parchment;
    for (const [dx, dy] of [[-off, 0], [off, 0], [0, -off], [0, off]]) {
      ctx.beginPath();
      ctx.arc(mx + dx, my + dy, pr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = P.frame;
    ctx.beginPath();
    ctx.arc(mx, my, b * (0.85 / 12), 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 拱頂的羊皮紙（同 .nmm-arch）：上緣是一道圓拱，內側一道朱紅細線 */
function arch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rise: number) {
  const path = (inset: number) => {
    ctx.beginPath();
    ctx.moveTo(x + inset, y + h - inset);
    ctx.lineTo(x + inset, y + rise);
    ctx.ellipse(x + w / 2, y + rise, w / 2 - inset, rise - inset, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(x + w - inset, y + h - inset);
    ctx.closePath();
  };
  path(0);
  ctx.fillStyle = P.parchment;
  ctx.fill();
  path(7);
  ctx.strokeStyle = P.frame;
  ctx.lineWidth = 4;
  ctx.stroke();
}

function wordmark(ctx: CanvasRenderingContext2D, cx: number, y: number, width: number, color: string) {
  const [vx, vy, vw, vh] = WORDMARK_VIEWBOX;
  const k = width / vw;
  ctx.save();
  ctx.translate(cx - width / 2 - vx * k, y - vy * k);
  ctx.scale(k, k);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(WORDMARK_PATH));
  ctx.restore();
  return vh * k;
}

export function drawMorrisCard(d: MorrisCardData): ShareDraw {
  return (ctx: CanvasRenderingContext2D, layout: CardLayout, assets: ShareAssets) => {
    const f = d.font;
    const paper = P.parchment;
    const W = 1080;
    const H = layout === 'story' ? 1920 : layout === 'poster' ? 1350 : 1080;
    field(ctx, W, H);

    if (layout === 'square') {
      const b = 34;
      frame(ctx, W, H, b);
      fitText(ctx, f, d.text.kicker, 84, 112, { size: 28, weight: 700, color: paper, alpha: 0.8, max: 700 });
      fitText(ctx, f, d.text.title, 84, 196, { size: 76, color: paper, max: 700 });
      fitText(ctx, f, `${d.text.reason}  ${d.text.moves}`, 84, 246, { size: 28, weight: 700, color: paper, alpha: 0.85, max: 700 });
      drawQr(ctx, assets.qr, W - 84 - 150, 72, 150, P.ink, paper, 10);
      const bh = 700, bw = (bh * BOARD_W) / BOARD_H;
      drawBoard(ctx, d, (W - bw) / 2, 282, bw);
      const end = drawBrand(ctx, f, assets, d.text.brand, 84, 1024, { size: 30, color: paper, max: 520 });
      fitText(ctx, f, `${d.text.from} · ${d.text.host}`, W - 84, 1024, { size: 22, weight: 700, color: paper, alpha: 0.75, align: 'right', max: W - 84 - end - 40 });
      return;
    }

    const story = layout === 'story';
    const b = story ? 40 : 34;
    frame(ctx, W, H, b);
    fitText(ctx, f, d.text.kicker, W / 2, story ? 172 : 120, { size: story ? 34 : 30, weight: 700, color: paper, alpha: 0.8, align: 'center', max: 900 });
    fitText(ctx, f, d.text.title, W / 2, story ? 296 : 214, { size: story ? 112 : 92, color: paper, align: 'center', max: 900 });
    fitText(ctx, f, d.text.reason, W / 2, story ? 366 : 268, { size: story ? 38 : 32, weight: 700, color: paper, alpha: 0.85, align: 'center', max: 900 });

    const bw = story ? 840 : (748 * BOARD_W) / BOARD_H;
    const by = story ? 420 : 298;
    drawBoard(ctx, d, (W - bw) / 2, by, bw);
    const bottom = by + (bw * BOARD_H) / BOARD_W;

    fitText(ctx, f, d.text.moves, W / 2, bottom + (story ? 76 : 50), { size: story ? 40 : 34, weight: 700, color: paper, align: 'center', max: 900 });
    if (story) wordmark(ctx, W / 2, bottom + 118, 560, paper);

    // 下方一塊拱頂的羊皮紙：站名、出處、QR
    const px = story ? 84 : 76, pw = W - px * 2;
    const ph = story ? 270 : 190, py = H - b - (story ? 44 : 22) - ph;
    const rise = story ? 64 : 48;
    arch(ctx, px, py, pw, ph, rise);
    const qr = story ? 176 : 132;
    const qx = px + pw - 36 - qr, qy = py + ph - 30 - qr;
    drawQr(ctx, assets.qr, qx, qy, qr, P.ink, paper, 0);
    const tx = px + 44, max = qx - tx - 30;
    drawBrand(ctx, f, assets, d.text.brand, tx, py + ph - (story ? 112 : 84), { size: story ? 44 : 36, color: P.ink, max });
    fitText(ctx, f, `${d.text.from} · ${d.text.host}`, tx, py + ph - (story ? 50 : 36), { size: story ? 28 : 24, weight: 700, color: P.ink, alpha: 0.7, max });
  };
}
