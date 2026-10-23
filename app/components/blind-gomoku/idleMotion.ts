import { DIRECTIONS, colOf, inside, pointAt, rowOf, type Point, type Side, type Stone } from '@/games/blind-gomoku/engine';

/**
 * 盲五子棋的棋子動作（Zach 10/24：學 Wall Go 補上棋子的互動，但要照這款自己的世界）。
 * 這款的棋盤是一塊白絲、棋子是一塊塊布，所以動作都是「布上的東西」：
 *
 * - **落子壓一下布**（dip）：新的子落下時，旁邊兩圈的子都往它那邊滑一點再回來，像布被壓出一個凹。
 *   不分黑白、每一顆一樣 —— 盲棋也有，因為它不透露任何東西。
 * - **連成五子**（celebrate）：那一排從頭到尾依序跳一下，像一串縫線被拉緊。只在結算、黑白已經翻開之後。
 * - **閒置**（playIdle）：只有**一般模式**、只有**等待那一方**的子（輪到的人在想，自己的子在晃會分心；Zach 10/23 Wall Go 的規矩）：
 *   - 旁邊（八個方向）有對方的子：靠過去碰一下或敲兩下，**被碰的那顆一定有反應**（就算是輪到那一方的，跟 Wall Go 對打一樣）
 *   - 跟自己的子連成一串（2 顆以上）：整串依序跳一下，像串珠
 *   - 都沒有：原地挪一挪坐好、慢慢呼吸、或小跳一下
 *
 * **盲棋沒有閒置動作**：「只動等待那一方的子」本身就是在告訴你哪些子是對方的 —— 黑白藏在底面是這款唯一的規則，
 * 不能被動畫洩漏。所以盲棋只留不分黑白的落子壓布。
 *
 * 全部是 WAAPI，只動 `translate`／`scale` 兩個獨立屬性（落子本身的彈跳用 transform，疊在一起不互相蓋掉）。
 * translate 的百分比是相對棋子自己的大小（子的直徑是格距的 0.9）。身上還有動畫的子就跳過，閒置動畫帶 id 讓換人時能停掉。
 */

export const IDLE_ID = 'gmk-idle';
/** 子的直徑佔格距的比例（同 GomokuBoard 的 STONE） */
const STONE = 0.9;

type Board = (Stone | null)[];

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
export const stoneEl = (root: HTMLElement, p: Point) => root.querySelector<HTMLElement>(`[data-p="${p}"] [data-stone]`);
const busy = (el: Element) => el.getAnimations().length > 0;

/** 八個方向的鄰居 */
function around(p: Point): Point[] {
  const r = rowOf(p), c = colOf(p);
  const out: Point[] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if ((dr || dc) && inside(r + dr, c + dc)) out.push(pointAt(r + dr, c + dc));
  }
  return out;
}

/** a 指向 b 的單位向量，與兩點的距離（格） */
function toward(a: Point, b: Point) {
  const dx = colOf(b) - colOf(a), dy = rowOf(b) - rowOf(a);
  const n = Math.hypot(dx, dy) || 1;
  return { x: dx / n, y: dy / n, cells: n };
}
const at = (v: { x: number; y: number }, pct: number) => `${(v.x * pct).toFixed(1)}% ${(v.y * pct).toFixed(1)}%`;

/** 經過 p、同一方連在一起的最長一串（依棋盤順序） */
function runThrough(board: Board, p: Point): Point[] {
  const side = board[p]?.side;
  let best: Point[] = [p];
  for (const [dr, dc] of DIRECTIONS) {
    const run: Point[] = [p];
    for (const sign of [-1, 1]) {
      let r = rowOf(p) + dr * sign, c = colOf(p) + dc * sign;
      while (inside(r, c) && board[pointAt(r, c)]?.side === side) {
        if (sign < 0) run.unshift(pointAt(r, c)); else run.push(pointAt(r, c));
        r += dr * sign; c += dc * sign;
      }
    }
    if (run.length > best.length) best = run;
  }
  return best;
}

/** 一串子依序跳一下 */
function ripple(root: HTMLElement, run: Point[], o: { lift: number; grow: number; gap: number; duration: number; id?: string }) {
  run.forEach((q, i) => {
    const el = stoneEl(root, q);
    if (!el || (o.id && busy(el))) return;
    el.animate([
      { translate: '0 0', scale: '1' },
      { translate: `0 ${-o.lift}%`, scale: `${o.grow}`, offset: 0.4 },
      { translate: '0 0', scale: '0.97 1.03', offset: 0.75 },
      { translate: '0 0', scale: '1' },
    ], { duration: o.duration, delay: i * o.gap, easing: 'ease-in-out', id: o.id });
  });
}

/** 落子壓布：旁邊兩圈的子往新子那邊滑一點再回來（不分黑白） */
export function dip(root: HTMLElement, board: Board, p: Point) {
  const r0 = rowOf(p), c0 = colOf(p);
  for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
    if (!(dr || dc) || !inside(r0 + dr, c0 + dc)) continue;
    const q = pointAt(r0 + dr, c0 + dc);
    if (!board[q]) continue;
    const el = stoneEl(root, q);
    if (!el || busy(el)) continue;
    const ring = Math.max(Math.abs(dr), Math.abs(dc));
    const v = toward(q, p);
    el.animate([
      { translate: '0 0' },
      { translate: at(v, ring === 1 ? 6 : 3), offset: 0.35 },
      { translate: '0 0' },
    ], { duration: 420, delay: 110 + (ring - 1) * 40, easing: 'ease-out' });
  }
}

/** 連成五子的那一排依序跳一下（結算、黑白翻開之後） */
export function celebrate(root: HTMLElement, line: Point[]) {
  ripple(root, line, { lift: 10, grow: 1.16, gap: 80, duration: 480 });
}

/** 碰一下對方的子：to 是要靠過去多少（%），對方被撞開 knock（%） */
function nudge(el: HTMLElement, foe: HTMLElement | null, v: { x: number; y: number; cells: number }, double: boolean) {
  // 兩顆子邊對邊的距離（佔子的直徑 %）：上下左右約 11%，斜角約 57%
  const gap = (v.cells / STONE - 1) * 100;
  const reach = gap + 3;
  const frames: Keyframe[] = double
    ? [
      { translate: '0 0' },
      { translate: at(v, reach), offset: 0.2, easing: 'ease-in' },
      { translate: at(v, reach * 0.55), offset: 0.38 },
      { translate: at(v, reach), offset: 0.56, easing: 'ease-in' },
      { translate: '0 0' },
    ]
    : [
      { translate: '0 0', scale: '1' },
      { translate: at(v, -6), scale: '0.96', offset: 0.25 },
      { translate: at(v, reach), scale: '1.04', offset: 0.45, easing: 'ease-in' },
      { translate: '0 0', scale: '1' },
    ];
  const duration = double ? 900 : 860;
  el.animate(frames, { duration, easing: 'ease-out', id: IDLE_ID });
  if (!foe || busy(foe)) return;
  // 被碰的那顆往後一退、晃一下回來 —— 一定有反應（就算是輪到那一方的子）
  const hits = double ? [0.2, 0.56] : [0.45];
  hits.forEach((h) => foe.animate([
    { translate: '0 0' },
    { translate: at(v, 7), offset: 0.3 },
    { translate: at(v, -2), offset: 0.7 },
    { translate: '0 0' },
  ], { duration: 360, delay: duration * h, easing: 'ease-out', id: IDLE_ID }));
}

const SOLO: ((el: HTMLElement) => void)[] = [
  // 挪一挪坐好：左右小小地挪兩下
  (el) => el.animate([
    { translate: '0 0' }, { translate: '-4% 0', offset: 0.25 }, { translate: '3% 0', offset: 0.6 }, { translate: '0 0' },
  ], { duration: 760, easing: 'ease-in-out', id: IDLE_ID }),
  // 慢慢呼吸
  (el) => el.animate([{ scale: '1' }, { scale: '1.07', offset: 0.45 }, { scale: '1' }], { duration: 1400, easing: 'ease-in-out', id: IDLE_ID }),
  // 小跳一下：先蹲、跳、落地再壓一下
  (el) => el.animate([
    { translate: '0 0', scale: '1' },
    { translate: '0 0', scale: '1.07 0.92', offset: 0.18 },
    { translate: '0 -16%', scale: '0.95 1.06', offset: 0.45 },
    { translate: '0 0', scale: '1.06 0.93', offset: 0.75 },
    { translate: '0 0', scale: '1' },
  ], { duration: 640, easing: 'ease-in-out', id: IDLE_ID }),
];

/** 一般模式的閒置：side 是等待的那一方（只動他的子） */
export function playIdle(root: HTMLElement, board: Board, side: Side) {
  const mine = board.flatMap((s, p) => (s?.side === side ? [p] : []));
  if (!mine.length) return;
  const foesOf = (p: Point) => around(p).filter((q) => board[q] && board[q]!.side !== side);
  const facing = mine.filter((p) => foesOf(p).length > 0);
  const roll = Math.random();
  if (facing.length && roll < 0.45) {
    const p = pick(facing);
    const el = stoneEl(root, p);
    if (!el || busy(el)) return;
    const q = pick(foesOf(p));
    nudge(el, stoneEl(root, q), toward(p, q), Math.random() < 0.4);
    return;
  }
  const lined = mine.map((p) => runThrough(board, p)).filter((run) => run.length >= 2);
  if (lined.length && roll < 0.75) {
    ripple(root, pick(lined), { lift: 8, grow: 1.1, gap: 90, duration: 440, id: IDLE_ID });
    return;
  }
  const el = stoneEl(root, pick(mine));
  if (el && !busy(el)) pick(SOLO)(el);
}

/** 換人的那一下：把還在播的閒置動作停掉（輪到的人的子不能還在晃） */
export function stopIdle(root: HTMLElement) {
  for (const a of root.getAnimations({ subtree: true })) if (a.id === IDLE_ID) a.cancel();
}

