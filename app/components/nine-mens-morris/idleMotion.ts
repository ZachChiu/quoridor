import { COORDS, MILLS, NEIGHBORS, type Cell, type Point, type Side } from '@/games/nine-mens-morris/engine';

/**
 * 九子棋的閒置小動作（Zach 10/24：每款都要像 Wall Go 一樣有棋子之間的互動，「然後各自設計符合各自」）。
 * 棋子是插圖裡站著的鐘形小人，所以動作也照「站著的小人」想：以腳底為軸搖晃、鞠躬、用肩膀頂人。
 *
 * 規則跟 Wall Go、虎羊棋一樣：只有**沒輪到、在等的那一方**會自己動（輪到的人在想，自己的子在晃會分心），
 * 互動時「被找上的那一顆」一定有反應，就算它是輪到的那一方的。
 *
 * - 旁邊有對方的子：用肩膀頂一下（對方被頂得往後晃、站穩），或是朝對方鞠個躬（對方也回一個躬）—— 宮廷裡的棋
 * - 自己連成一線的三顆：依序跳一下，像在歡呼
 * - 都沒有：左右晃一晃，或原地小跳一下
 *
 * 全部是 WAAPI、只動 translate／rotate／scale，transform-origin 在腳底（MorrisBoard 設好的）；棋子身上還有動畫就跳過。
 * translate 的百分比相對棋子自己的大小。
 */

type Motion = (el: HTMLElement) => void;

const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];
const pieceAt = (root: HTMLElement, p: Point) => root.querySelector<HTMLElement>(`[data-point="${p}"] [data-piece]`);
const busy = (el: Element) => el.getAnimations().length > 0;
/** 被選起來、正拿在手上的子不打擾它 */
const held = (el: Element) => !!el.closest('[aria-pressed="true"]');

const SOLO: Motion[] = [
  // 左右晃一晃（腳底不動）
  (el) => el.animate([
    { rotate: '0deg' }, { rotate: '-7deg', offset: 0.25 }, { rotate: '6deg', offset: 0.55 }, { rotate: '-3deg', offset: 0.8 }, { rotate: '0deg' },
  ], { duration: 1100, easing: 'ease-in-out' }),
  // 原地小跳：先蹲、跳、落地壓一下
  (el) => el.animate([
    { translate: '0 0', scale: '1' },
    { translate: '0 0', scale: '1.06 0.92', offset: 0.18 },
    { translate: '0 -16%', scale: '0.96 1.05', offset: 0.45 },
    { translate: '0 0', scale: '1.06 0.92', offset: 0.75 },
    { translate: '0 0', scale: '1' },
  ], { duration: 600, easing: 'ease-in-out' }),
];

/** 從 a 看 b 在哪個方向（盤上相鄰的點一定是同一列或同一欄） */
const dir = (a: Point, b: Point) => {
  const dx = Math.sign(COORDS[b].x - COORDS[a].x), dy = Math.sign(COORDS[b].y - COORDS[a].y);
  return { dx, dy };
};

/** 朝某個方向傾：左右用旋轉（小人往旁邊歪），上下用位移（往前、往後探） */
const lean = (d: { dx: number; dy: number }, deg: number, pct: number) =>
  d.dx ? { rotate: `${d.dx * deg}deg`, translate: `${d.dx * pct * 0.4}% 0` } : { rotate: '0deg', translate: `0 ${d.dy * pct}%` };
const rest = { rotate: '0deg', translate: '0 0' };

export function playIdle(root: HTMLElement, board: Cell[], side: Side) {
  const own = side === 'black' ? 'B' : 'W';
  const them = side === 'black' ? 'W' : 'B';
  const mine = board.flatMap((c, p) => (c === own ? [p] : []));
  if (!mine.length) return;

  // 自己連成一線的三顆：偶爾依序跳一下
  const mills = MILLS.filter((l) => l.every((p) => board[p] === own));
  if (mills.length && Math.random() < 0.2) {
    const els = pick(mills).map((p) => pieceAt(root, p));
    if (els.some((el) => !el || busy(el) || held(el))) return;
    els.forEach((el, i) => el!.animate([
      { translate: '0 0', scale: '1' },
      { translate: '0 0', scale: '1.05 0.93', offset: 0.2 },
      { translate: '0 -20%', scale: '0.97 1.04', offset: 0.5 },
      { translate: '0 0', scale: '1' },
    ], { duration: 520, delay: i * 110, easing: 'ease-in-out' }));
    return;
  }

  const facing = mine.filter((p) => NEIGHBORS[p].some((q) => board[q] === them));
  const interact = facing.length > 0 && Math.random() < 0.6;
  const p = pick(interact ? facing : mine);
  const el = pieceAt(root, p);
  if (!el || busy(el) || held(el)) return;
  if (!interact) { pick(SOLO)(el); return; }

  const q = pick(NEIGHBORS[p].filter((x) => board[x] === them));
  const foe = pieceAt(root, q);
  const d = dir(p, q);
  const back = { dx: -d.dx, dy: -d.dy };
  const foeFree = foe && !busy(foe) && !held(foe);

  if (Math.random() < 0.6) {
    // 用肩膀頂一下：往後蓄力、撞過去、彈回來
    el.animate([
      rest,
      { ...lean(d, -6, 6), offset: 0.2 },
      { ...lean(d, 14, 22), offset: 0.38, easing: 'ease-out' },
      { ...lean(d, -3, 0), offset: 0.65 },
      rest,
    ], { duration: 900, easing: 'ease-in' });
    // 被頂的那顆往後晃兩下才站穩
    if (foeFree) foe.animate([
      rest,
      { ...lean(back, 16, 14), offset: 0.25, easing: 'ease-out' },
      { ...lean(d, 7, 0), offset: 0.55 },
      { ...lean(back, 4, 0), offset: 0.8 },
      rest,
    ], { duration: 800, delay: 300 });
  } else {
    // 鞠躬：朝對方彎下去、停一下、起身；對方回一個躬（上下相鄰的看不出歪向哪邊，改成往下壓）
    const bow = (who: HTMLElement, toward: { dx: number; dy: number }, delay: number) => {
      const down = toward.dx ? { rotate: `${toward.dx * 22}deg`, scale: '1' } : { rotate: '0deg', scale: '1 0.82' };
      who.animate([
        { rotate: '0deg', scale: '1' }, { ...down, offset: 0.35 }, { ...down, offset: 0.6 }, { rotate: '0deg', scale: '1' },
      ], { duration: 1000, delay, easing: 'ease-in-out' });
    };
    bow(el, d, 0);
    if (foeFree) bow(foe, back, 650);
  }
}
