import type { Player } from '@/game/types';

/**
 * 閒置棋子的小動作（Zach 10/23：「閒置棋子旁邊有牆的，隨機有不同的互動效果」）。
 *
 * 旁邊有牆的棋子，每隔幾秒挑一顆，隨機做一個動作：推牆、撞一下、敲敲、想跳過去、探頭；
 * 兩邊都是牆的還會「被夾扁」。牆也跟著被推出去一點再彈回來 —— 看起來是棋子在跟牆互動，不是自己在抖。
 *
 * 只用 `translate`／`scale` 這兩個獨立屬性，不碰 `transform`：
 * 牆本身用 transform 對齊格縫（translate-y-1/2）、棋子走路也是 transform，
 * 獨立屬性會疊在那之上，不會把它們蓋掉。都交給 element.animate()（合成執行緒跑，見 CLAUDE.md〈換頁轉場〉）。
 *
 * 只算玩家蓋的牆，不算棋盤外圈：外圈那道深色框不會被推動，推它看起來像卡住。
 *
 * 只動等待那一方的棋子，輪到的人的棋子不動（`still`，Zach 10/23）。
 *
 * 不同顏色的兩顆棋子上下左右挨著、中間沒有牆時，會**對打**（Zach 10/24）：揮拳、衝撞、頂牛、挑釁、假動作。
 * 動手的一樣是等待那一方；**被打的那顆一定有反應**，就算是輪到的人的棋子 —— 這是「輪到的人的棋子不動」的第二個例外
 * （Zach 10/24 在「被打的不動」與「被打的有反應」兩支錄影之間選了後者：對打要有來有往）。見 FIGHTS。
 *
 * 例外：**四面都是牆、被關在一格裡的棋子一直在動**，想出去（Zach 10/23：「他可以隨時都在動嗎，想要出去的那種狀態」）——
 * 不管輪到誰都動（那顆本來就不能選、不能走，不會干擾正在下的人）。見 syncTrapped。
 */

type Side = { dx: number; dy: number; wall: string };
type Walls = { h: Player[][]; v: Player[][] };
/** still：輪到的那一方，他的棋子不動。分出勝負後是 null（大家都可以動） */
export type IdleScene = { board: Player[][]; walls: Walls; skip: string[]; still: Player };

/** 這一格四周有哪些牆。wall 是那道牆在 DOM 上的 data-wall（牆畫在左上那格裡） */
function sides(r: number, c: number, { h, v }: Walls): Side[] {
  const out: Side[] = [];
  if (r > 0 && h[r - 1]?.[c]) out.push({ dx: 0, dy: -1, wall: `h:${r - 1},${c}` });
  if (h[r]?.[c]) out.push({ dx: 0, dy: 1, wall: `h:${r},${c}` });
  if (c > 0 && v[r]?.[c - 1]) out.push({ dx: -1, dy: 0, wall: `v:${r},${c - 1}` });
  if (v[r]?.[c]) out.push({ dx: 1, dy: 0, wall: `v:${r},${c}` });
  return out;
}

type Move = (s: Side) => { piece: Keyframe[]; wall?: Keyframe[]; duration: number };

/*
  T(k)：往牆的方向位移 k%（棋子自己大小的百分比；棋子邊到牆大約 33%）。
  S(a, b)：沿著牆的方向縮放 a、垂直方向 b —— 壓扁時一邊扁、一邊胖，看起來才有份量。
  W(px)：牆往外被推幾 px。
*/
const kit = ({ dx, dy }: Side) => ({
  T: (k: number) => `${dx * k}% ${dy * k}%`,
  S: (a: number, b: number) => (dx ? `${a} ${b}` : `${b} ${a}`),
  W: (px: number) => `${dx * px}px ${dy * px}px`,
});

const MOVES: Record<string, Move> = {
  /** 推牆：用力推兩下，牆被推出去一點 */
  push: (s) => {
    const { T, S, W } = kit(s);
    return {
      duration: 1500,
      piece: [
        { translate: T(0), scale: S(1, 1) },
        { translate: T(27), scale: S(0.82, 1.12), offset: 0.25 },
        { translate: T(21), scale: S(0.9, 1.06), offset: 0.4 },
        { translate: T(28), scale: S(0.8, 1.14), offset: 0.56 },
        { translate: T(-3), scale: S(1.05, 0.96), offset: 0.8 },
        { translate: T(0), scale: S(1, 1) },
      ],
      wall: [
        { translate: W(0) },
        { translate: W(3), offset: 0.25 },
        { translate: W(1), offset: 0.4 },
        { translate: W(4), offset: 0.56 },
        { translate: W(0), offset: 0.8 },
        { translate: W(0) },
      ],
    };
  },
  /** 撞一下：先往後退蓄力、衝過去撞扁、彈回來，牆震一下 */
  bump: (s) => {
    const { T, S, W } = kit(s);
    return {
      duration: 800,
      piece: [
        { translate: T(0), scale: S(1, 1) },
        { translate: T(-10), scale: S(1.06, 0.95), offset: 0.3 },
        { translate: T(31), scale: S(0.68, 1.22), offset: 0.48 },
        { translate: T(-6), scale: S(1.08, 0.94), offset: 0.7 },
        { translate: T(0), scale: S(1, 1) },
      ],
      wall: [
        { translate: W(0) },
        { translate: W(0), offset: 0.46 },
        { translate: W(5), offset: 0.52 },
        { translate: W(-2), offset: 0.64 },
        { translate: W(1), offset: 0.78 },
        { translate: W(0) },
      ],
    };
  },
  /** 敲敲：貼過去輕輕敲三下 */
  knock: (s) => {
    const { T, S, W } = kit(s);
    const tap = (o: number) => [
      { translate: T(26), scale: S(0.88, 1.07), offset: o },
      { translate: T(14), scale: S(1, 1), offset: o + 0.1 },
    ];
    const wallTap = (o: number) => [{ translate: W(2), offset: o }, { translate: W(0), offset: o + 0.1 }];
    return {
      duration: 1200,
      piece: [{ translate: T(0), scale: S(1, 1) }, { translate: T(14), scale: S(1, 1), offset: 0.15 }, ...tap(0.28), ...tap(0.46), ...tap(0.64), { translate: T(0), scale: S(1, 1) }],
      wall: [{ translate: W(0) }, { translate: W(0), offset: 0.27 }, ...wallTap(0.28), ...wallTap(0.46), ...wallTap(0.64), { translate: W(0) }],
    };
  },
  /** 想跳過去：蹲一下、跳起來（俯視看是變大）往牆飛、落回原地壓扁 */
  hop: (s) => {
    const { T, S } = kit(s);
    return {
      duration: 1100,
      piece: [
        { translate: T(0), scale: S(1, 1) },
        { translate: T(-4), scale: '0.9 0.9', offset: 0.18 },
        { translate: T(16), scale: '1.24 1.24', offset: 0.45 },
        { translate: T(22), scale: '1.12 1.12', offset: 0.58 },
        { translate: T(3), scale: S(1.14, 0.86), offset: 0.8 },
        { translate: T(0), scale: S(1, 1) },
      ],
    };
  },
  /** 探頭：往牆那邊伸長，停一下像在看牆後面，縮回來 */
  peek: (s) => {
    const { T, S } = kit(s);
    return {
      duration: 1700,
      piece: [
        { translate: T(0), scale: S(1, 1) },
        { translate: T(22), scale: S(1.22, 0.84), offset: 0.28 },
        { translate: T(24), scale: S(1.25, 0.82), offset: 0.5 },
        { translate: T(20), scale: S(1.2, 0.85), offset: 0.7 },
        { translate: T(0), scale: S(1, 1) },
      ],
    };
  },
};

// ─── 對打 ─────────────────────────────────────────────────────────────────────

/*
  d 是「從動手的那顆往被打的那顆」的方向。位移一樣是棋子自己大小的百分比：
  兩顆棋子中心相距約 170%，所以往前 66% 左右就碰到對方。
  foe 是被打那顆的反應，正的位移＝往遠離動手那顆的方向（同一個 d）。
*/
type Dir = { dx: number; dy: number };
type Fight = (d: Dir) => { piece: Keyframe[]; foe: Keyframe[]; duration: number };

const fkit = ({ dx, dy }: Dir) => ({
  /** 沿 d 走 a、往側邊走 p */
  T: (a: number, p = 0) => `${dx * a - dy * p}% ${dy * a + dx * p}%`,
  /** 沿 d 縮放 a、側向 b */
  S: (a: number, b: number) => (dx ? `${a} ${b}` : `${b} ${a}`),
});

const FIGHTS: Record<string, Fight> = {
  /** 連打：湊過去、三記短拳（拳打出去時身體拉長），對方每挨一下往後縮一點 */
  jab: (d) => {
    const { T, S } = fkit(d);
    const hit = (o: number) => [
      { translate: T(62), scale: S(1.2, 0.86), offset: o },
      { translate: T(34), scale: S(1, 1), offset: o + 0.1 },
    ];
    const ouch = (o: number) => [
      { translate: T(6), scale: S(0.88, 1.08), offset: o + 0.02 },
      { translate: T(0), scale: S(1, 1), offset: o + 0.12 },
    ];
    return {
      duration: 1300,
      piece: [{ translate: T(0), scale: S(1, 1) }, { translate: T(34), scale: S(1, 1), offset: 0.2 }, ...hit(0.32), ...hit(0.5), ...hit(0.68), { translate: T(0), scale: S(1, 1) }],
      foe: [{ translate: T(0), scale: S(1, 1) }, { translate: T(0), scale: S(1, 1), offset: 0.32 }, ...ouch(0.32), ...ouch(0.5), ...ouch(0.68), { translate: T(0), scale: S(1, 1) }],
    };
  },
  /** 衝撞：往後蓄力、整顆撞過去壓扁，對方被撞得往後彈 */
  charge: (d) => {
    const { T, S } = fkit(d);
    return {
      duration: 1000,
      piece: [
        { translate: T(0), scale: S(1, 1) },
        { translate: T(-14), scale: S(1.08, 0.94), offset: 0.32 },
        { translate: T(64), scale: S(0.72, 1.22), offset: 0.5 },
        { translate: T(40), scale: S(1.06, 0.95), offset: 0.64 },
        { translate: T(0), scale: S(1, 1) },
      ],
      foe: [
        { translate: T(0), scale: S(1, 1) },
        { translate: T(0), scale: S(1, 1), offset: 0.49 },
        { translate: T(20), scale: S(0.72, 1.2), offset: 0.56 },
        { translate: T(-4), scale: S(1.06, 0.95), offset: 0.74 },
        { translate: T(0), scale: S(1, 1) },
      ],
    };
  },
  /** 頂牛：貼上去一直頂，兩顆一起擠扁；對方被頂得慢慢後退 */
  shove: (d) => {
    const { T, S } = fkit(d);
    return {
      duration: 1700,
      piece: [
        { translate: T(0), scale: S(1, 1) },
        { translate: T(64), scale: S(0.84, 1.1), offset: 0.22 },
        { translate: T(68), scale: S(0.8, 1.13), offset: 0.38 },
        { translate: T(64), scale: S(0.85, 1.09), offset: 0.5 },
        { translate: T(72), scale: S(0.78, 1.15), offset: 0.64 },
        { translate: T(-4), scale: S(1.05, 0.96), offset: 0.84 },
        { translate: T(0), scale: S(1, 1) },
      ],
      foe: [
        { translate: T(0), scale: S(1, 1) },
        { translate: T(0), scale: S(1, 1), offset: 0.2 },
        { translate: T(4), scale: S(0.86, 1.09), offset: 0.38 },
        { translate: T(2), scale: S(0.88, 1.08), offset: 0.5 },
        { translate: T(8), scale: S(0.82, 1.12), offset: 0.64 },
        { translate: T(0), scale: S(1, 1), offset: 0.84 },
        { translate: T(0), scale: S(1, 1) },
      ],
    };
  },
  /** 挑釁：原地跳兩下、湊過去左右晃（「來啊」），對方也挺起來 */
  taunt: (d) => {
    const { T, S } = fkit(d);
    return {
      duration: 1600,
      piece: [
        { translate: T(0), scale: '1 1' },
        { translate: T(0), scale: '1.14 1.14', offset: 0.12 },
        { translate: T(0), scale: '0.94 0.94', offset: 0.24 },
        { translate: T(0), scale: '1.14 1.14', offset: 0.36 },
        { translate: T(0), scale: '1 1', offset: 0.46 },
        { translate: T(26, 7), scale: S(1.12, 0.92), offset: 0.58 },
        { translate: T(28, -7), scale: S(1.12, 0.92), offset: 0.7 },
        { translate: T(26, 7), scale: S(1.12, 0.92), offset: 0.8 },
        { translate: T(0), scale: '1 1' },
      ],
      foe: [
        { translate: T(0), scale: '1 1' },
        { translate: T(0), scale: '1 1', offset: 0.56 },
        { translate: T(-6), scale: '1.12 1.12', offset: 0.68 },
        { translate: T(-6), scale: '1.1 1.1', offset: 0.8 },
        { translate: T(0), scale: '1 1' },
      ],
    };
  },
  /** 假動作：往旁邊晃一下、再晃回來，趁對方往旁邊躲時一拳打過去 */
  feint: (d) => {
    const { T, S } = fkit(d);
    return {
      duration: 1400,
      piece: [
        { translate: T(0), scale: S(1, 1) },
        { translate: T(18, -16), scale: S(1, 1), offset: 0.2 },
        { translate: T(18, 16), scale: S(1, 1), offset: 0.4 },
        { translate: T(8), scale: S(1.06, 0.95), offset: 0.52 },
        { translate: T(64), scale: S(0.74, 1.2), offset: 0.64 },
        { translate: T(0), scale: S(1, 1) },
      ],
      foe: [
        { translate: T(0), scale: S(1, 1) },
        { translate: T(0, 12), scale: S(1, 1), offset: 0.24 },
        { translate: T(0, -12), scale: S(1, 1), offset: 0.44 },
        { translate: T(0), scale: S(1, 1), offset: 0.62 },
        { translate: T(16), scale: S(0.76, 1.18), offset: 0.7 },
        { translate: T(0), scale: S(1, 1) },
      ],
    };
  },
};

/** 上下左右挨著、中間沒有牆、不同顏色的對手。dx／dy 是從這顆往對手的方向 */
function foes(board: Player[][], r: number, c: number, { h, v }: Walls) {
  const me = board[r][c];
  const n = board.length;
  const out: { key: string; dx: number; dy: number }[] = [];
  const near = [
    { dx: 0, dy: -1, open: r > 0 && !h[r - 1]?.[c] },
    { dx: 0, dy: 1, open: r < n - 1 && !h[r]?.[c] },
    { dx: -1, dy: 0, open: c > 0 && !v[r]?.[c - 1] },
    { dx: 1, dy: 0, open: c < n - 1 && !v[r]?.[c] },
  ];
  for (const { dx, dy, open } of near) {
    const p = open ? board[r + dy][c + dx] : null;
    if (p && p !== me) out.push({ key: `${r + dy},${c + dx}`, dx, dy });
  }
  return out;
}

/** 兩邊都是牆：被夾扁，兩道牆一起被撐開 */
function squeeze(a: Side, b: Side) {
  const { S, W } = kit(a);
  const back = kit(b).W;
  return {
    duration: 1300,
    piece: [
      { scale: S(1, 1) },
      { scale: S(0.7, 1.22), offset: 0.3 },
      { scale: S(0.76, 1.16), offset: 0.5 },
      { scale: S(1.12, 0.9), offset: 0.75 },
      { scale: S(1, 1) },
    ],
    walls: [
      [a.wall, [{ translate: W(0) }, { translate: W(3), offset: 0.3 }, { translate: W(2), offset: 0.5 }, { translate: W(0), offset: 0.75 }, { translate: W(0) }]],
      [b.wall, [{ translate: back(0) }, { translate: back(3), offset: 0.3 }, { translate: back(2), offset: 0.5 }, { translate: back(0), offset: 0.75 }, { translate: back(0) }]],
    ] as [string, Keyframe[]][],
  };
}

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/** 挑一顆旁邊有牆或有對手的閒置棋子，隨機做一個動作。沒有符合的就什麼都不做 */
export function playIdle(root: HTMLElement | null, { board, walls, skip, still }: IdleScene) {
  if (!root) return;
  const cand: { key: string; sides: Side[]; foes: ReturnType<typeof foes> }[] = [];
  const caged = new Set(trappedCells(board, walls));
  board.forEach((row, r) => row.forEach((p, c) => {
    const key = `${r},${c}`;
    if (!p || p === still || skip.includes(key) || caged.has(key)) return;
    const s = sides(r, c, walls);
    const f = foes(board, r, c, walls);
    if (s.length || f.length) cand.push({ key, sides: s, foes: f });
  }));
  if (!cand.length) return;
  const { key, sides: around, foes: rivals } = pick(cand);
  const el = (k: string) => root.querySelector<HTMLElement>(`[data-cell="${k}"] [data-piece]`);
  const piece = el(key);
  if (!piece || piece.getAnimations().some((a) => a.id === 'idle')) return;
  const wallEl = (id: string) => root.querySelector<HTMLElement>(`[data-wall="${id}"]`);
  const opts = (duration: number): KeyframeAnimationOptions => ({ duration, easing: 'ease-in-out', id: 'idle' });

  // 旁邊有對手的，多半先打架（比跟牆玩有趣）
  if (rivals.length && (!around.length || Math.random() < 0.6)) {
    const foe = pick(rivals);
    const m = FIGHTS[pick(Object.keys(FIGHTS))](foe);
    piece.animate(m.piece, opts(m.duration));
    // 被打的那顆一定有反應（輪到的人的也是，見檔頭）；只有正在被操作、正在走的那顆不動
    const target = skip.includes(foe.key) ? null : el(foe.key);
    if (target && !target.getAnimations().some((a) => a.id === 'idle')) target.animate(m.foe, opts(m.duration));
    return;
  }

  const across = around.find((a) => around.some((b) => b.dx === -a.dx && b.dy === -a.dy && (a.dx || a.dy)));
  if (across && Math.random() < 0.4) {
    const other = around.find((b) => b.dx === -across.dx && b.dy === -across.dy)!;
    const m = squeeze(across, other);
    piece.animate(m.piece, opts(m.duration));
    for (const [id, kf] of m.walls) wallEl(id)?.animate(kf, opts(m.duration));
    return;
  }
  const side = pick(around);
  const m = MOVES[pick(Object.keys(MOVES))](side);
  piece.animate(m.piece, opts(m.duration));
  if (m.wall) wallEl(side.wall)?.animate(m.wall, opts(m.duration));
}

/** 把盤面上還在播的閒置動作全部停掉（棋子與牆回到原位） */
export function stopIdle(root: HTMLElement | null) {
  root?.getAnimations({ subtree: true }).forEach((a) => { if (a.id === 'idle') a.cancel(); });
}

// ─── 被關在一格裡的棋子：一直想出去 ───────────────────────────────────────────

/** 四面都是牆的格子（棋盤外緣本身就算一道牆）。只回傳上面有棋子的 */
export function trappedCells(board: Player[][], { h, v }: Walls): string[] {
  const n = board.length;
  const out: string[] = [];
  board.forEach((row, r) => row.forEach((p, c) => {
    if (!p) return;
    const up = r === 0 || !!h[r - 1]?.[c];
    const down = r === n - 1 || !!h[r]?.[c];
    const left = c === 0 || !!v[r]?.[c - 1];
    const right = c === n - 1 || !!v[r]?.[c];
    if (up && down && left && right) out.push(`${r},${c}`);
  }));
  return out;
}

const DIRS = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];

/**
 * 一圈「想出去」的動作：四個方向各撞一次（順序每顆隨機），其中一邊連撞兩下、一邊伸長探一下，中間喘口氣。
 * 撞到的如果是玩家蓋的牆，那道牆跟著被撞出去一點；外框推不動，只有棋子扁掉。
 * 棋子與牆的動畫同一個長度、同時開始、無限循環，所以一直對得上。
 */
function cageLoop(r: number, c: number, walls: Walls) {
  const order = [...DIRS].sort(() => Math.random() - 0.5);
  const piece: Keyframe[] = [{ translate: '0% 0%', scale: '1 1', offset: 0 }];
  const wallKf = new Map<string, Keyframe[]>();
  const wallAt = ({ dx, dy }: { dx: number; dy: number }) =>
    dy === -1 ? (r > 0 && walls.h[r - 1]?.[c] ? `h:${r - 1},${c}` : null)
      : dy === 1 ? (walls.h[r]?.[c] ? `h:${r},${c}` : null)
        : dx === -1 ? (c > 0 && walls.v[r]?.[c - 1] ? `v:${r},${c - 1}` : null)
          : (walls.v[r]?.[c] ? `v:${r},${c}` : null);
  const jolt = (id: string | null, at: number, px: number, d: { dx: number; dy: number }) => {
    if (!id) return;
    const list = wallKf.get(id) ?? [{ translate: '0px 0px', offset: 0 }];
    const W = (k: number) => `${d.dx * k}px ${d.dy * k}px`;
    list.push({ translate: W(0), offset: at - 0.005 }, { translate: W(px), offset: at + 0.01 }, { translate: W(-1), offset: at + 0.025 }, { translate: W(0), offset: at + 0.04 });
    wallKf.set(id, list);
  };
  // 每一段佔整圈的 0.25：前面是動作、後面停一下
  order.forEach((d, i) => {
    const { T, S } = kit({ ...d, wall: '' });
    const o = i * 0.25;
    if (i === 1) {
      // 連撞兩下
      piece.push(
        { translate: T(-6), scale: S(1.05, 0.96), offset: o + 0.04 },
        { translate: T(30), scale: S(0.74, 1.18), offset: o + 0.07 },
        { translate: T(8), scale: S(1, 1), offset: o + 0.1 },
        { translate: T(31), scale: S(0.72, 1.2), offset: o + 0.13 },
        { translate: T(-4), scale: S(1.06, 0.95), offset: o + 0.17 },
        { translate: '0% 0%', scale: '1 1', offset: o + 0.21 },
      );
      jolt(wallAt(d), o + 0.07, 3, d);
      jolt(wallAt(d), o + 0.13, 4, d);
    } else if (i === 2) {
      // 伸長探一下，看看有沒有縫
      piece.push(
        { translate: T(18), scale: S(1.2, 0.86), offset: o + 0.07 },
        { translate: T(22), scale: S(1.24, 0.84), offset: o + 0.14 },
        { translate: '0% 0%', scale: '1 1', offset: o + 0.21 },
      );
    } else {
      // 蓄力、衝過去撞扁、彈回來
      piece.push(
        { translate: T(-10), scale: S(1.06, 0.95), offset: o + 0.05 },
        { translate: T(31), scale: S(0.7, 1.2), offset: o + 0.09 },
        { translate: T(-5), scale: S(1.07, 0.95), offset: o + 0.14 },
        { translate: '0% 0%', scale: '1 1', offset: o + 0.19 },
      );
      jolt(wallAt(d), o + 0.09, 5, d);
    }
  });
  piece.push({ translate: '0% 0%', scale: '1 1', offset: 1 });
  for (const list of wallKf.values()) list.push({ translate: '0px 0px', offset: 1 });
  return { piece, walls: wallKf, duration: 5200 + Math.round(Math.random() * 1200) };
}

/**
 * 讓被關住的棋子一直動、不再被關住的停下來。盤面每變一次就呼叫一次（已經在動的不重來）。
 * 動畫的 id 是 `cage:r,c`，閒置動作（id 'idle'）與 stopIdle 都不會碰到它。
 */
export function syncTrapped(root: HTMLElement | null, board: Player[][], walls: Walls) {
  if (!root) return;
  const want = new Set(trappedCells(board, walls));
  // 先停掉不該動的（牆被破掉、換了一局）
  for (const a of root.getAnimations({ subtree: true })) {
    const key = a.id.startsWith('cage:') ? a.id.slice(5) : null;
    if (key && !want.has(key)) a.cancel();
  }
  for (const key of want) {
    const piece = root.querySelector<HTMLElement>(`[data-cell="${key}"] [data-piece]`);
    if (!piece || piece.getAnimations().some((a) => a.id === `cage:${key}`)) continue;
    const [r, c] = key.split(',').map(Number);
    const m = cageLoop(r, c, walls);
    const opts = { duration: m.duration, iterations: Infinity, easing: 'ease-in-out', id: `cage:${key}` };
    piece.animate(m.piece, opts);
    for (const [id, kf] of m.walls) root.querySelector<HTMLElement>(`[data-wall="${id}"]`)?.animate(kf, opts);
  }
}

/** 全部停掉（離開頁面、減少動態效果） */
export function stopTrapped(root: HTMLElement | null) {
  root?.getAnimations({ subtree: true }).forEach((a) => { if (a.id.startsWith('cage:')) a.cancel(); });
}

