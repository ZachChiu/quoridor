import type { Player } from '@/game/types';

/**
 * 閒置棋子的小動作（Zach 10/23：「閒置棋子旁邊有牆的，隨機有不同的互動效果」）。
 *
 * 旁邊有牆的棋子，每隔幾秒挑一顆，隨機做一個動作：推牆、撞一下、敲敲、想跳過去、探頭；
 * 兩邊都是牆的還會「被夾扁」。牆也跟著被推出去一點再彈回來 —— 看起來是棋子在跟牆互動，不是自己在抖。
 *
 * 只用 `translate`／`scale` 這兩個獨立屬性，不碰 `transform`：
 * 牆本身用 transform 對齊格縫（translate-y-1/2）、棋子走路與「對手正在擠牆」也是 transform，
 * 獨立屬性會疊在那之上，不會把它們蓋掉。都交給 element.animate()（合成執行緒跑，見 CLAUDE.md〈換頁轉場〉）。
 *
 * 只算玩家蓋的牆，不算棋盤外圈：外圈那道深色框不會被推動，推它看起來像卡住。
 */

type Side = { dx: number; dy: number; wall: string };
type Walls = { h: Player[][]; v: Player[][] };
export type IdleScene = { board: Player[][]; walls: Walls; skip: string[] };

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

/** 挑一顆旁邊有牆的閒置棋子，隨機做一個動作。沒有符合的就什麼都不做 */
export function playIdle(root: HTMLElement | null, { board, walls, skip }: IdleScene) {
  if (!root) return;
  const cand: { key: string; sides: Side[] }[] = [];
  board.forEach((row, r) => row.forEach((p, c) => {
    const key = `${r},${c}`;
    if (!p || skip.includes(key)) return;
    const s = sides(r, c, walls);
    if (s.length) cand.push({ key, sides: s });
  }));
  if (!cand.length) return;
  const { key, sides: around } = pick(cand);
  const piece = root.querySelector<HTMLElement>(`[data-cell="${key}"] [data-piece]`);
  if (!piece || piece.getAnimations().some((a) => a.id === 'idle')) return;
  const wallEl = (id: string) => root.querySelector<HTMLElement>(`[data-wall="${id}"]`);
  const opts = (duration: number): KeyframeAnimationOptions => ({ duration, easing: 'ease-in-out', id: 'idle' });

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
