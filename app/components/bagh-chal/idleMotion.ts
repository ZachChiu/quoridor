import { NEIGHBORS, SIZE, type Cell, type Point, type Side } from '@/games/bagh-chal/engine';

/**
 * 虎羊棋的閒置小動作（Zach 10/24：學 Wall Go 補上棋子的互動）。規則跟 Wall Go 一樣：
 * 只有**沒輪到、在等的那一方**會自己動（輪到的人正在想，自己的棋子在晃會分心），
 * 唯一的例外是互動時「被找上的那一顆」一定有反應，就算它是輪到的那一方的。
 *
 * - 老虎旁邊有羊：老虎逗牠 —— 作勢撲過去兩下又收回來，羊嚇得往後縮、發抖
 * - 羊旁邊有老虎：羊偷看老虎一眼、縮一下發抖（羊不會去惹老虎：Zach 10/24「虎羊棋正常來說是老虎逗羊」，
 *   一開始做成羊頂老虎、老虎往後縮，被糾正）
 * - 旁邊沒有對手：羊跳一下或低頭吃草，老虎伸懶腰或左右張望
 *
 * 全部是 WAAPI、只動 translate／rotate／scale（跟 Tailwind 的 transform 疊加），棋子身上還有動畫就跳過。
 * translate 的百分比是相對棋子自己的大小。
 */

type Motion = (el: HTMLElement) => void;

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const pieceAt = (root: HTMLElement, p: Point) => root.querySelector<HTMLElement>(`[data-point="${p}"] [data-piece]`);
const busy = (el: Element) => el.getAnimations().length > 0;
const foes = (board: Cell[], p: Point) => {
  const them = board[p] === 'T' ? 'G' : 'T';
  return NEIGHBORS[p].filter((q) => board[q] === them);
};
/** 從 a 指向 b 的單位向量（斜線也算） */
const toward = (a: Point, b: Point) => {
  const dx = (b % SIZE) - (a % SIZE), dy = Math.floor(b / SIZE) - Math.floor(a / SIZE);
  const n = Math.hypot(dx, dy) || 1;
  return { x: dx / n, y: dy / n };
};
const at = (v: { x: number; y: number }, pct: number) => `${(v.x * pct).toFixed(1)}% ${(v.y * pct).toFixed(1)}%`;

const GOAT_SOLO: Motion[] = [
  // 原地跳一下：先蹲、跳起來、落地再壓一下
  (el) => el.animate([
    { translate: '0 0', scale: '1' },
    { translate: '0 0', scale: '1.07 0.9', offset: 0.15 },
    { translate: '0 -18%', scale: '0.95 1.06', offset: 0.45 },
    { translate: '0 0', scale: '1.07 0.9', offset: 0.75 },
    { translate: '0 0', scale: '1' },
  ], { duration: 620, easing: 'ease-in-out' }),
  // 低頭吃草：左右歪幾下
  (el) => el.animate([
    { rotate: '0deg' }, { rotate: '-12deg', offset: 0.2 }, { rotate: '8deg', offset: 0.45 }, { rotate: '-6deg', offset: 0.7 }, { rotate: '0deg' },
  ], { duration: 900, easing: 'ease-in-out' }),
];

const TIGER_SOLO: Motion[] = [
  // 伸懶腰：慢慢撐大、停一下、縮回來
  (el) => el.animate([{ scale: '1' }, { scale: '1.1', offset: 0.4 }, { scale: '1.1', offset: 0.6 }, { scale: '1' }], { duration: 1100, easing: 'ease-in-out' }),
  // 左右張望
  (el) => el.animate([{ rotate: '0deg' }, { rotate: '-10deg', offset: 0.3 }, { rotate: '10deg', offset: 0.65 }, { rotate: '0deg' }], { duration: 1200, easing: 'ease-in-out' }),
];

/** 發抖：左右小幅快速晃 */
const tremble = (el: HTMLElement, delay = 0) => el.animate([
  { translate: '0 0' }, { translate: '-4% 0', offset: 0.15 }, { translate: '4% 0', offset: 0.3 }, { translate: '-4% 0', offset: 0.45 },
  { translate: '4% 0', offset: 0.6 }, { translate: '-2% 0', offset: 0.8 }, { translate: '0 0' },
], { duration: 520, delay, easing: 'linear' });

export function playIdle(root: HTMLElement, board: Cell[], side: Side) {
  const own = side === 'tiger' ? 'T' : 'G';
  const mine = board.flatMap((c, p) => (c === own ? [p] : []));
  if (!mine.length) return;
  const facing = mine.filter((p) => foes(board, p).length > 0);
  const interact = facing.length > 0 && Math.random() < 0.6;
  const p = pick(interact ? facing : mine);
  const el = pieceAt(root, p);
  if (!el || busy(el)) return;

  if (!interact) { pick(side === 'tiger' ? TIGER_SOLO : GOAT_SOLO)(el); return; }

  const q = pick(foes(board, p));
  const foe = pieceAt(root, q);
  const v = toward(p, q);
  // 被選起來的棋子（輪到的人正拿著）不去打擾它
  const foeFree = foe && !busy(foe) && !foe.closest('[aria-pressed="true"]');
  if (side === 'tiger') {
    // 老虎逗羊：往後蓄一下、作勢撲過去，收回來再撲一下（撲得快、收得慢，像貓在撥東西）
    el.animate([
      { translate: '0 0', scale: '1' },
      { translate: at(v, -6), scale: '0.97', offset: 0.18 },
      { translate: at(v, 20), scale: '1.08', offset: 0.3, easing: 'ease-out' },
      { translate: '0 0', scale: '1', offset: 0.55 },
      { translate: at(v, 16), scale: '1.06', offset: 0.68, easing: 'ease-out' },
      { translate: '0 0', scale: '1' },
    ], { duration: 1150, easing: 'ease-in' });
    // 羊每被撲一下就往後縮、抖一下
    if (foeFree) {
      const back = at(v, 10);
      foe.animate([
        { translate: '0 0', scale: '1' },
        { translate: back, scale: '0.94', offset: 0.12 }, { translate: '0 0', scale: '1', offset: 0.4 },
        { translate: back, scale: '0.95', offset: 0.55 }, { translate: '0 0', scale: '1' },
      ], { duration: 900, delay: 300, easing: 'ease-out' });
      tremble(foe, 1200);
    }
  } else {
    // 羊偷看旁邊的老虎：歪頭朝老虎、往反方向縮一下，再發抖
    el.animate([
      { translate: '0 0', rotate: '0deg' },
      { translate: '0 0', rotate: `${v.x >= 0 ? 10 : -10}deg`, offset: 0.25 },
      { translate: at(v, -12), rotate: '0deg', scale: '0.94', offset: 0.5 },
      { translate: '0 0', rotate: '0deg', scale: '1' },
    ], { duration: 900, easing: 'ease-in-out' });
    tremble(el, 900);
  }
}
