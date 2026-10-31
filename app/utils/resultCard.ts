import type { GameState, PlayerKey } from '@/game/types';
// 中立區跟棋盤上同一個顏色（頁面底色）
import { NEUTRAL_FILL } from '@/components/neutralZone';

/**
 * 結算的分享圖：在瀏覽器裡用 Canvas 把終局盤面畫成一張 PNG。
 *
 * 不用伺服器（靜態站沒有），也不用 html-to-image 這類「把 DOM 截成圖」的套件 ——
 * 那些要把整棵 DOM 連同樣式複製一份再畫，字型、圓角、Safari 的相容性問題一堆，
 * 而這張圖要的東西很單純：色塊、盤面、幾行字。Canvas 的文字由瀏覽器自己排版，
 * 泰文的疊字也排得對（satori 排不對，見 scripts/lib/chrome-text.mjs）。
 *
 * 視覺照站上的平塗撞色：實色底、900 字重、沒有陰影也沒有漸層。
 * 三種比例都是**整張勝方色**（平局、多人同勝是深墨），品牌與 QR 放在最下面一塊紙色上 ——
 * 原本只有 9:16 是滿版，4:5、1:1 是上面一條色帶、下面米灰底（Zach 10/24：「4:5、1:1 也可以變底色全部都紅或藍嗎」）。
 * 地盤用 -100 的淡色（同 OG 圖）—— 對局畫面用的 -50 縮成聊天室縮圖就看不見了。
 */

/* 色票與 app/globals.css 同源。Canvas 吃不到 CSS 變數，改了那邊記得回來對一次。 */
const C = {
  cream: '#faf7f0',
  ink: '#141010',
  inkSoft: '#6b5c4d',
  line: '#3a322c',
  grid: '#d4d0c9',
  player: { A: '#cd4642', B: '#2478b7', C: '#0e8142' } as Record<PlayerKey, string>,
  tint: { A: '#f0c8c6', B: '#cadfee', C: '#bfd6bd' } as Record<PlayerKey, string>,
};

export type CardLayout = 'poster' | 'square' | 'story';

export const CARD_SIZE: Record<CardLayout, { w: number; h: number }> = {
  // 4:5 是 IG 貼文與 LINE 聊天室都不會裁掉的直式比例
  poster: { w: 1080, h: 1350 },
  square: { w: 1080, h: 1080 },
  // 9:16 是限時動態的滿版
  story: { w: 1080, h: 1920 },
};

export type ResultCardData = {
  state: GameState;
  ownerByCell: Record<string, PlayerKey>;
  /** 中立區（被牆圍住、裡面沒有棋子）的格子，鋪頁面底色 */
  neutral?: string[];
  /** 勝方，平局是 ['draw'] */
  winners: (PlayerKey | 'draw')[];
  owned: Partial<Record<PlayerKey, number>>;
  /** 這台裝置上的人是哪一方（連線、跟 AI 下）。他的那塊比分多一圈框，跟對局中一樣 */
  me?: PlayerKey;
  /** 已經挑好語系的字 */
  text: {
    kicker: string;
    title: string;
    players: Record<PlayerKey, string>;
    squares: string;
    brand: string;
    from: string;
    host: string;
  };
  /** QR code 的格子（uqr 的 encode().data）。沒有就不畫 */
  qr?: boolean[][];
  /** 站的圖示（public/icons/wall-go-192.png，跟分頁上的 favicon 同一個），放在站名前面。沒載到就只寫站名 */
  icon?: CanvasImageSource;
  /** CSS 的 font-family，跟頁面同一套（--font-app） */
  font: string;
};

// ─── 小工具 ────────────────────────────────────────────────────────────────

/** 圓角矩形。不用 ctx.roundRect —— iOS 15 的 Safari 沒有。 */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

function fill(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number, r = 0) {
  ctx.fillStyle = color;
  if (r) { rr(ctx, x, y, w, h, r); ctx.fill(); } else ctx.fillRect(x, y, w, h);
}

/**
 * 寫一行字，太長就縮小到放得下（最小 min）。回傳實際用的字級。
 * 標題在英文、泰文會比中文長很多（「Red & Blue win」），寫死字級一定有語系會爆出去。
 */
function text(
  ctx: CanvasRenderingContext2D, font: string, s: string, x: number, y: number,
  o: { size: number; weight?: number; color: string; max?: number; min?: number; align?: CanvasTextAlign; alpha?: number },
): number {
  let size = o.size;
  const weight = o.weight ?? 900;
  ctx.font = `${weight} ${size}px ${font}`;
  if (o.max) {
    const min = o.min ?? Math.round(size * 0.5);
    while (size > min && ctx.measureText(s).width > o.max) {
      size -= 2;
      ctx.font = `${weight} ${size}px ${font}`;
    }
  }
  ctx.fillStyle = o.color;
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
  ctx.globalAlpha = 1;
  return size;
}

// ─── 盤面 ──────────────────────────────────────────────────────────────────

/**
 * 終局盤面，邊長 size、左上角 (x, y)。
 * 跟對局畫面同一套畫法：外圈那道深色是牆（不是裝飾邊框）、格縫細、牆粗、棋子是格子的 60%。
 * 牆的位置對齊格縫中心而不是格子邊（差半個格縫，見 CLAUDE.md〈棋盤〉）。
 */
function board(ctx: CanvasRenderingContext2D, d: ResultCardData, x: number, y: number, size: number) {
  const n = d.state.board.length;
  const wall = Math.round(size * 0.022);
  const gap = Math.max(2, Math.round(size * 0.004));
  const inner = size - wall * 2;
  const cell = (inner - gap * (n - 1)) / n;
  const step = cell + gap;
  const ox = x + wall, oy = y + wall;

  fill(ctx, C.line, x, y, size, size, size * 0.035);
  fill(ctx, C.grid, ox, oy, inner, inner, size * 0.035 - wall);

  const neutral = new Set(d.neutral);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const owner = d.ownerByCell[`${r},${c}`];
      const bg = owner ? C.tint[owner] : neutral.has(`${r},${c}`) ? NEUTRAL_FILL : C.cream;
      // 四個角落的格子要跟著內圓角，不然方角會從外框的弧線裡露出來
      const corner = (r === 0 || r === n - 1) && (c === 0 || c === n - 1);
      ctx.save();
      if (corner) { rr(ctx, ox, oy, inner, inner, size * 0.035 - wall); ctx.clip(); }
      fill(ctx, bg, ox + c * step, oy + r * step, cell, cell);
      ctx.restore();
    }
  }

  const half = gap / 2;
  const over = wall * 0.35;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const h = d.state.horizontalWalls[r]?.[c];
      if (h) fill(ctx, C.player[h], ox + c * step - over, oy + r * step + cell + half - wall / 2, cell + over * 2, wall, wall / 2);
      const v = d.state.verticalWalls[r]?.[c];
      if (v) fill(ctx, C.player[v], ox + c * step + cell + half - wall / 2, oy + r * step - over, wall, cell + over * 2, wall / 2);
    }
  }

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const p = d.state.board[r][c];
      if (!p) continue;
      ctx.fillStyle = C.player[p];
      ctx.beginPath();
      ctx.arc(ox + c * step + cell / 2, oy + r * step + cell / 2, cell * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ─── 比分 ──────────────────────────────────────────────────────────────────

type Rank = { player: PlayerKey; count: number; won: boolean };

/** 勝方排最前面，其次看地盤 —— 跟結算視窗同一個理由：投降的人地可能比較多，但他輸了。 */
function ranking(d: ResultCardData): Rank[] {
  const draw = d.winners[0] === 'draw' || d.winners.length === 0;
  const keys = (['A', 'B', 'C'] as PlayerKey[]).filter((p) => d.owned[p] !== undefined);
  const won = (p: PlayerKey) => draw || d.winners.includes(p);
  return keys
    .map((p) => ({ player: p, count: d.owned[p] ?? 0, won: won(p) }))
    .sort((a, b) => Number(b.won) - Number(a.won) || b.count - a.count);
}

/**
 * 一排比分，疊在勝方色的底上：勝方是米白底、勝方色字（紅疊紅會不見），輸家是米白的淡色塊、淡字、一顆色點；
 * 自己那塊外面多一圈米白的框、中間留縫（對局中是自己的顏色，這裡底已經是顏色了）。
 */
function scores(ctx: CanvasRenderingContext2D, d: ResultCardData, cx: number, y: number, h: number, maxW: number) {
  const list = ranking(d);
  const gapX = h * 0.28;
  const w = Math.min((maxW - gapX * (list.length - 1)) / list.length, h * 3.4);
  let x = cx - (w * list.length + gapX * (list.length - 1)) / 2;
  for (const { player, count, won } of list) {
    if (player === d.me) {
      const ring = Math.max(4, h * 0.05);
      ctx.strokeStyle = C.cream;
      ctx.lineWidth = ring;
      rr(ctx, x - ring * 1.6, y - ring * 1.6, w + ring * 3.2, h + ring * 3.2, h * 0.3 + ring * 1.6);
      ctx.stroke();
    }
    const bg = won ? C.cream : 'rgba(250,247,240,0.16)';
    const fg = won ? C.player[player] : 'rgba(250,247,240,0.7)';
    fill(ctx, bg, x, y, w, h, h * 0.3);
    if (!won) {
      ctx.fillStyle = C.player[player];
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(x + h * 0.34, y + h / 2, h * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    const pad = h * (won ? 0.3 : 0.56);
    // 時間（各自想了多久、整局多久）都不寫在圖上（Zach 10/23：「結果畫面不用有個人花多久下棋」「對局時間都不用到結尾」）
    text(ctx, d.font, d.text.players[player], x + pad, y + h * 0.62, { size: Math.round(h * 0.3), color: fg, max: w * 0.5 });
    const sq = text(ctx, d.font, d.text.squares, x + w - h * 0.28, y + h * 0.66, { size: Math.round(h * 0.2), weight: 700, color: fg, align: 'right' });
    ctx.font = `700 ${sq}px ${d.font}`;
    const sqW = ctx.measureText(d.text.squares).width;
    text(ctx, d.font, String(count), x + w - h * 0.28 - sqW - h * 0.1, y + h * 0.7, { size: Math.round(h * (won ? 0.56 : 0.42)), color: fg, align: 'right' });
    x += w + gapX;
  }
}

// ─── 品牌與 QR ─────────────────────────────────────────────────────────────

/**
 * 站名，前面放站的圖示（Zach 10/23：「分享圖可以補上 favicon 嗎」）—— 跟瀏覽器分頁上看到的是同一個，
 * 看到圖的人點進來會認得。圖示對齊字的視覺中線（中文字身約在基線上 0.38 個字級的位置）。
 */
function brand(ctx: CanvasRenderingContext2D, d: ResultCardData, x: number, y: number, size: number, max: number) {
  let tx = x;
  if (d.icon) {
    const side = Math.round(size * 1.25);
    ctx.drawImage(d.icon, x, Math.round(y - size * 0.38 - side / 2), side, side);
    tx = x + side + Math.round(size * 0.3);
  }
  text(ctx, d.font, d.text.brand, tx, y, { size, color: C.ink, max: max - (tx - x) });
}

function qr(ctx: CanvasRenderingContext2D, d: ResultCardData, x: number, y: number, size: number) {
  if (!d.qr) return;
  const pad = size * 0.08;
  fill(ctx, C.cream, x, y, size, size, size * 0.08);
  const n = d.qr.length;
  const m = (size - pad * 2) / n;
  ctx.fillStyle = C.ink;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      // 稍微多畫一點點，相鄰的格子才不會在縮放後透出細縫
      if (d.qr[r][c]) ctx.fillRect(x + pad + c * m, y + pad + r * m, m + 0.5, m + 0.5);
    }
  }
}

function bandColor(d: ResultCardData) {
  const solo = d.winners.length === 1 && d.winners[0] !== 'draw' ? (d.winners[0] as PlayerKey) : null;
  return solo ? C.player[solo] : C.ink;
}

// ─── 三種版型 ──────────────────────────────────────────────────────────────

/*
  三種版型都不寫「掃碼來跟我下一局」這類邀請句（Zach 10/23 拿掉的）：QR 與網址留著，讓看到的人自己掃。
*/

/** 最下面那塊紙色：左邊站名、出處、網址三行，右邊 QR。三種比例共用，只差尺寸 */
function footer(ctx: CanvasRenderingContext2D, d: ResultCardData, y: number, h: number, o: { brand: number; small: number; qr: number }) {
  const w = 1080; // 三種比例都是 1080 寬
  fill(ctx, C.cream, 60, y, w - 120, h, 36);
  const left = 110, max = w - 120 - 50 - o.qr - 80;
  // 三行在紙色塊裡垂直置中
  const block = o.brand + o.small * 2 * 1.75;
  const top = y + (h - block) / 2;
  brand(ctx, d, left, top + o.brand * 0.86, o.brand, max);
  text(ctx, d.font, d.text.from, left, top + o.brand + o.small * 1.55, { size: o.small, weight: 700, color: C.inkSoft, max });
  text(ctx, d.font, d.text.host, left, top + o.brand + o.small * 3.3, { size: o.small, weight: 700, color: C.inkSoft, max });
  if (d.qr) qr(ctx, d, w - 110 - o.qr, y + (h - o.qr) / 2, o.qr);
}

/** 4:5 直式。跟 9:16 同一個順序：結果、比分、盤面、最下面紙色一塊放品牌＋QR。 */
function poster(ctx: CanvasRenderingContext2D, d: ResultCardData) {
  const { w, h } = CARD_SIZE.poster;
  fill(ctx, bandColor(d), 0, 0, w, h);
  text(ctx, d.font, d.text.kicker, w / 2, 108, { size: 36, color: C.cream, alpha: 0.75, align: 'center', max: 900 });
  text(ctx, d.font, d.text.title, w / 2, 232, { size: 120, color: C.cream, align: 'center', max: 940 });
  scores(ctx, d, w / 2, 286, 96, 920);
  board(ctx, d, 230, 430, 620);
  footer(ctx, d, 1100, 190, { brand: 46, small: 24, qr: 150 });
}

/**
 * 1:1。左邊大盤面、右邊一欄比分直排，最下面紙色一塊放品牌＋QR。
 * 標題與盤面之間要留空：先前標題字的下緣直接壓到盤面的外框（Zach 10/23：「1:1 的有點卡到文字」）。
 */
function square(ctx: CanvasRenderingContext2D, d: ResultCardData) {
  const { w } = CARD_SIZE.square;
  fill(ctx, bandColor(d), 0, 0, w, w);
  text(ctx, d.font, d.text.kicker, 72, 82, { size: 30, color: C.cream, alpha: 0.75, max: 936 });
  text(ctx, d.font, d.text.title, 72, 180, { size: 86, color: C.cream, max: 936 });
  board(ctx, d, 72, 226, 580);
  // 右欄：比分直排，一次畫一塊；勝負照整局的 winners 判斷（輸家才會是淡的）
  const colX = 712, colW = 300;
  let y = 290;
  for (const r of ranking(d)) {
    const one: ResultCardData = { ...d, owned: { [r.player]: r.count } };
    scores(ctx, one, colX + colW / 2, y, r.won ? 110 : 80, colW);
    y += (r.won ? 110 : 80) + 26;
  }
  footer(ctx, d, 850, 170, { brand: 44, small: 22, qr: 136 });
}

/** 9:16 限時動態。滿版勝方色、超大結果，盤面在中間，最下面一塊紙色放品牌＋大 QR。 */
function story(ctx: CanvasRenderingContext2D, d: ResultCardData) {
  const { w, h } = CARD_SIZE.story;
  fill(ctx, bandColor(d), 0, 0, w, h);
  text(ctx, d.font, d.text.kicker, w / 2, 250, { size: 40, color: C.cream, alpha: 0.75, align: 'center', max: 940 });
  text(ctx, d.font, d.text.title, w / 2, 420, { size: 150, color: C.cream, align: 'center', max: 960 });
  scores(ctx, d, w / 2, 500, 110, 960);
  board(ctx, d, 110, 680, 860);
  footer(ctx, d, 1600, 260, { brand: 50, small: 28, qr: 200 });
}

const DRAW: Record<CardLayout, (ctx: CanvasRenderingContext2D, d: ResultCardData) => void> = { poster, square, story };

/**
 * 畫到一張新的 canvas 上。scale < 1 給畫面上的預覽用：照顯示的大小重新畫一次，
 * 不要拿 1080 寬的大圖讓瀏覽器縮 —— 縮太多倍時細的格線會一條有一條沒有（Zach 10/23：「在更小的地方渲染會怪怪」）。
 * 版面座標一律是 1080 寬，縮放交給 ctx.scale。
 */
export function drawResultCard(d: ResultCardData, layout: CardLayout, scale = 1): HTMLCanvasElement {
  const { w, h } = CARD_SIZE[layout];
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  DRAW[layout](ctx, d);
  return canvas;
}
