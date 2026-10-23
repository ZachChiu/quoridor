import { CELLS, type Seat } from '@/games/balance-mancala/engine';

/**
 * 平衡播棋的閒置小動作（Zach 10/24：每一款都要有棋子之間的互動，各自設計）。
 *
 * 這款的子是丟在木坑裡的種子，所以動作都是「種子在坑裡」會有的樣子：
 * - 滾一下：在坑底的弧面上滾過去又滾回來（位移跟著轉動，像真的在滾）
 * - 晃一晃停下來：落定前左右搖幾下、壓扁一點
 * - 探頭：往順時針的下一格（播種的方向）探一下 —— 想被拿起來播出去
 * - 擠一擠（同一坑裡兩顆子）：一顆往旁邊那顆擠過去，被擠的那顆往外讓、晃一下；或兩顆同時碰一下彈開
 *
 * **只有沒輪到的座位會動**，輪到的人（真人或 AI）的子一律不動、互動也不會找上它 —— 輪到的人正在想，
 * 自己的子在晃會分心。播種動畫、排序預覽、遊戲結束時整個停掉（由 MancalaRing 決定要不要呼叫）。
 *
 * 全部是 WAAPI，只動 translate／rotate／scale 獨立屬性（跟元件本身的 transform 疊加），沒有新顏色。
 * translate 的百分比是相對子自己的大小。子身上還有動畫在跑就跳過。
 */

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const busy = (el: Element) => el.getAnimations().some((a) => a.playState === 'running');
const pct = (v: { x: number; y: number }, k: number) => `${(v.x * k).toFixed(1)}% ${(v.y * k).toFixed(1)}%`;

/** 從 a 的中心指向 b 的中心的單位向量 */
function toward(a: Element, b: Element) {
  const p = a.getBoundingClientRect(), q = b.getBoundingClientRect();
  const dx = q.left + q.width / 2 - (p.left + p.width / 2), dy = q.top + q.height / 2 - (p.top + p.height / 2);
  const n = Math.hypot(dx, dy) || 1;
  return { x: dx / n, y: dy / n };
}

/** 第 cell 格往順時針下一格的方向（盤面上 0 在頂端、順時針編號） */
function clockwise(cell: number) {
  const a = ((-90 + ((cell + 0.5) * 360) / CELLS) * Math.PI) / 180;
  return { x: -Math.sin(a), y: Math.cos(a) };
}

const SOLO: ((el: HTMLElement, cell: number) => void)[] = [
  // 在坑底滾一下：往一邊滾、滾回來一點、停下
  (el) => {
    const s = Math.random() < 0.5 ? 1 : -1;
    el.animate([
      { translate: '0 0', rotate: '0deg' },
      { translate: `${12 * s}% 0`, rotate: `${40 * s}deg`, offset: 0.4 },
      { translate: `${-5 * s}% 0`, rotate: `${-16 * s}deg`, offset: 0.75 },
      { translate: '0 0', rotate: '0deg' },
    ], { duration: 1100, easing: 'ease-in-out' });
  },
  // 晃一晃落定：左右搖、最後壓扁一下
  (el) => el.animate([
    { rotate: '0deg', scale: '1' },
    { rotate: '-12deg', scale: '1', offset: 0.2 },
    { rotate: '9deg', scale: '1', offset: 0.42 },
    { rotate: '-5deg', scale: '1', offset: 0.62 },
    { rotate: '0deg', scale: '1.08 0.9', offset: 0.82 },
    { rotate: '0deg', scale: '1' },
  ], { duration: 950, easing: 'ease-in-out' }),
  // 探頭：往順時針的下一格探一下又縮回來
  (el, cell) => {
    const v = clockwise(cell);
    el.animate([
      { translate: '0 0', scale: '1' },
      { translate: pct(v, 18), scale: '1.06', offset: 0.35 },
      { translate: pct(v, 14), scale: '1.06', offset: 0.6 },
      { translate: '0 0', scale: '1' },
    ], { duration: 1200, easing: 'ease-in-out' });
  },
];

/** 擠一擠：a 往 b 擠過去，b 被擠開、晃一下回來 */
const shove = (a: HTMLElement, b: HTMLElement) => {
  const v = toward(a, b);
  a.animate([
    { translate: '0 0', scale: '1' },
    { translate: pct(v, -6), scale: '0.96', offset: 0.2 },
    { translate: pct(v, 16), scale: '1.05', offset: 0.42, easing: 'ease-out' },
    { translate: '0 0', scale: '1' },
  ], { duration: 820, easing: 'ease-in' });
  b.animate([
    { translate: '0 0', rotate: '0deg' },
    { translate: pct(v, 20), rotate: `${v.x >= 0 ? 14 : -14}deg`, offset: 0.35 },
    { translate: pct(v, -4), rotate: `${v.x >= 0 ? -6 : 6}deg`, offset: 0.7 },
    { translate: '0 0', rotate: '0deg' },
  ], { duration: 700, delay: 300, easing: 'ease-out' });
};

/** 碰一下：兩顆同時往中間靠、碰到就彈開 */
const clink = (a: HTMLElement, b: HTMLElement) => {
  const v = toward(a, b);
  const back = { x: -v.x, y: -v.y };
  const bump = (el: HTMLElement, d: { x: number; y: number }) => el.animate([
    { translate: '0 0' },
    { translate: pct(d, 12), offset: 0.3, easing: 'ease-in' },
    { translate: pct(d, -8), offset: 0.48, easing: 'ease-out' },
    { translate: '0 0' },
  ], { duration: 760 });
  bump(a, v);
  bump(b, back);
};

const PAIR: ((a: HTMLElement, b: HTMLElement) => void)[] = [shove, shove, clink];

/**
 * 挑一顆沒輪到的子動一下。`root` 是盤面（每一格有 data-cell、每顆子有 data-seat），`actor` 是輪到的座位。
 */
export function playIdle(root: HTMLElement, actor: Seat) {
  const free = [...root.querySelectorAll<HTMLElement>('[data-seat]')]
    .filter((el) => Number(el.dataset.seat) !== actor && !busy(el));
  if (!free.length) return;
  // 同一坑裡有兩顆以上可以動的子：六成機會做互動
  const byCell = new Map<number, HTMLElement[]>();
  for (const el of free) {
    const cell = Number(el.closest<HTMLElement>('[data-cell]')?.dataset.cell ?? -1);
    if (cell < 0) continue;
    byCell.set(cell, [...(byCell.get(cell) ?? []), el]);
  }
  const crowded = [...byCell.values()].filter((xs) => xs.length >= 2);
  if (crowded.length && Math.random() < 0.6) {
    const xs = pick(crowded);
    const a = pick(xs);
    const b = pick(xs.filter((x) => x !== a));
    pick(PAIR)(a, b);
    return;
  }
  const el = pick(free);
  const cell = Number(el.closest<HTMLElement>('[data-cell]')?.dataset.cell ?? 0);
  pick(SOLO)(el, cell);
}
