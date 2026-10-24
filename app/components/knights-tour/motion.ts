import { colOf, rowOf, type Square } from '@/games/knights-tour/engine';

/**
 * 騎士巡遊的棋盤動作（Zach 10/24：學 Wall Go 補上棋子的互動，但各自設計）。這款只有一顆騎士，所以互動是騎士跟棋盤：
 *
 * - 跳：騎士照「日」字跳過去 —— 沿著一條往 L 轉角彎的弧線（先走兩格那一邊、再拐一格），半空中放大一點、
 *   往前進的方向側一下，落地壓一下。同時紅粉筆從上一格畫到這一格，上一格的步數在騎士離開時才寫上去，
 *   新的落點在騎士落地後才一顆顆冒出來。
 * - 放下騎士：從上面落下來、壓一下。
 * - 走完：步數照 1、2、3… 的順序一格一格跳一下（像歐拉那張表從頭念一遍），最後騎士揚起前腳；
 *   封閉巡遊接回起點的那段虛線這時才淡淡浮出來。
 * - 走錯（節目挑戰踩到走過的格子）：騎士往那一格探過去、縮回來搖頭；卡住沒路可走就原地左右張望。
 * - 閒著：玩家一陣子（3.5–6.5 秒）沒動，騎士轉頭望向一個跳得到的格子、那個圓點跟著輕輕脹一下；有時候用前蹄刨地。
 *   只是隨機挑一個合法的格子，不是提示。
 *
 * 全部是 WAAPI、只動 translate／rotate／scale／opacity（紅粉筆的線是 stroke-dashoffset），不加顏色；
 * 開了「減少動態效果」就一個都不播。translate 的百分比是相對騎士自己（格子的 84%）。
 */

/** 跳一步要多久；走完的琶音、結算的時間都從這裡算 */
export const JUMP_MS = 340;
/** 走完之後的整段（步數念一遍、騎士揚蹄）要多久：結算的分享圖等它播完才出來 */
export const finaleMs = (squares: number) => (reducedMotion() ? 450 : JUMP_MS + Math.min(640, squares * 16) + 520);

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cellEl = (root: HTMLElement, sq: Square) => root.querySelector<HTMLElement>(`[data-cell="${sq}"]`);
const knightEl = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-knight]');
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];
const ease = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
/** 從 a 指向 b 的單位向量（格子座標） */
const toward = (n: number, a: Square, b: Square) => {
  const x = colOf(n, b) - colOf(n, a), y = rowOf(n, b) - rowOf(n, a);
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
};

/** 剛走了一步（path 的最後一格是新的）。走完的話接著播 finale */
export function animateStep(root: HTMLElement, n: number, path: readonly Square[], closed: boolean) {
  if (reducedMotion()) return;
  const cur = path[path.length - 1];
  const knight = knightEl(root);
  if (knight) {
    if (path.length === 1) {
      knight.animate([
        { opacity: 0, translate: '0 -32%', scale: '1.35' },
        { opacity: 1, translate: '0 0', scale: '0.92', offset: 0.6, easing: 'ease-out' },
        { translate: '0 0', scale: '1' },
      ], { duration: 320, easing: 'ease-in' });
    } else {
      const prev = path[path.length - 2];
      const size = root.clientWidth / n;
      const dx = (colOf(n, prev) - colOf(n, cur)) * size;
      const dy = (rowOf(n, prev) - rowOf(n, cur)) * size;
      // L 的轉角（相對終點）：先走兩格的那一邊，再拐一格。弧線的控制點放在這裡，騎士就沿著「日」字彎過去
      const vertical = Math.abs(dy) > Math.abs(dx);
      const kx = vertical ? dx : 0, ky = vertical ? 0 : dy;
      const lean = dx < 0 ? 9 : -9;
      const frames: Keyframe[] = [];
      for (let i = 0; i <= 8; i++) {
        const t = ease(i / 8);
        const x = (1 - t) ** 2 * dx + 2 * (1 - t) * t * kx;
        const y = (1 - t) ** 2 * dy + 2 * (1 - t) * t * ky;
        const lift = Math.sin(Math.PI * t);
        frames.push({ translate: `${x.toFixed(1)}px ${y.toFixed(1)}px`, scale: `${(1 + 0.2 * lift).toFixed(3)}`, rotate: `${(lean * lift).toFixed(1)}deg`, offset: (i / 8) * 0.84 });
      }
      frames.push({ translate: '0 0', scale: '1.07 0.9', rotate: '0deg', offset: 0.92 }, { translate: '0 0', scale: '1', rotate: '0deg' });
      knight.animate(frames, { duration: JUMP_MS, easing: 'linear' });

      // 紅粉筆跟著畫過去；上一格的步數在騎士離開時才寫上
      const line = root.querySelector<SVGElement>('[data-last]');
      const len = line?.getAttribute('stroke-dasharray')?.split(' ')[0];
      if (line && len) line.animate([{ strokeDashoffset: len }, { strokeDashoffset: '0' }], { duration: JUMP_MS * 0.9, easing: 'ease-in-out' });
      cellEl(root, prev)?.querySelector('[data-num]')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: JUMP_MS * 0.3, fill: 'backwards' });
    }
  }
  // 新的落點在落地後才冒出來
  root.querySelectorAll('[data-dot]').forEach((dot, i) => {
    dot.animate([{ opacity: 0, scale: '0.3' }, { opacity: 1, scale: '1' }], { duration: 220, delay: JUMP_MS * 0.8 + i * 35, easing: 'ease-out', fill: 'backwards' });
  });
  if (path.length === n * n) finale(root, n, path, closed);
}

/** 走完：步數照順序一格一格跳一下，騎士揚起前腳，封閉巡遊的虛線淡入 */
function finale(root: HTMLElement, n: number, path: readonly Square[], closed: boolean) {
  const step = Math.min(16, 640 / path.length);
  path.forEach((sq, i) => {
    cellEl(root, sq)?.querySelector('[data-num]')?.animate(
      [{ scale: '1' }, { scale: '1.35', offset: 0.35 }, { scale: '1' }],
      { duration: 320, delay: JUMP_MS + i * step, easing: 'ease-out' },
    );
  });
  const end = JUMP_MS + path.length * step;
  knightEl(root)?.animate([
    { translate: '0 0', rotate: '0deg' },
    { translate: '0 -14%', rotate: '-14deg', offset: 0.35, easing: 'ease-out' },
    { translate: '0 -14%', rotate: '-10deg', offset: 0.55 },
    { translate: '0 0', rotate: '3deg', offset: 0.8 },
    { translate: '0 0', rotate: '0deg' },
  ], { duration: 620, delay: end, easing: 'ease-in-out' });
  if (closed) root.querySelector('[data-close]')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: end, fill: 'backwards' });
}

/** 走錯了：failed 是騎士所在的格子（卡住）就原地張望；是別的格子（踩到走過的格子）就探過去、縮回來搖頭 */
export function animateFail(root: HTMLElement, n: number, knightAt: Square, failed: Square, delay = 0) {
  if (reducedMotion()) return;
  const knight = knightEl(root);
  if (!knight) return;
  const shake: Keyframe[] = [
    { rotate: '0deg' }, { rotate: '-13deg', offset: 0.2 }, { rotate: '11deg', offset: 0.45 }, { rotate: '-7deg', offset: 0.7 }, { rotate: '0deg' },
  ];
  if (failed === knightAt) {
    knight.animate(shake, { duration: 760, delay, easing: 'ease-in-out' });
    return;
  }
  const v = toward(n, knightAt, failed);
  knight.animate([
    { translate: '0 0', scale: '1' },
    { translate: `${(v.x * 26).toFixed(1)}% ${(v.y * 26).toFixed(1)}%`, scale: '1.08', offset: 0.35, easing: 'ease-in' },
    { translate: '0 0', scale: '0.94', offset: 0.6, easing: 'ease-out' },
    { translate: '0 0', scale: '1' },
  ], { duration: 460, delay, easing: 'ease-out' });
  knight.animate(shake, { duration: 640, delay: delay + 460, easing: 'ease-in-out' });
}

/** 閒著的時候：望向一個跳得到的格子（那個圓點輕輕脹一下），或用前蹄刨地 */
export function idleGlance(root: HTMLElement, n: number, at: Square, targets: readonly Square[]) {
  const knight = knightEl(root);
  if (!knight || knight.getAnimations().length) return;
  if (!targets.length || Math.random() < 0.25) {
    knight.animate([
      { translate: '0 0', rotate: '0deg' },
      { translate: '0 -7%', rotate: '-6deg', offset: 0.2 }, { translate: '0 0', rotate: '0deg', offset: 0.4 },
      { translate: '0 -5%', rotate: '-4deg', offset: 0.6 }, { translate: '0 0', rotate: '0deg' },
    ], { duration: 780, easing: 'ease-in-out' });
    return;
  }
  const to = pick(targets);
  const v = toward(n, at, to);
  const look = { translate: `${(v.x * 9).toFixed(1)}% ${(v.y * 9).toFixed(1)}%`, rotate: `${v.x >= 0 ? 6 : -6}deg` };
  knight.animate([
    { translate: '0 0', rotate: '0deg' }, { ...look, offset: 0.3 }, { ...look, offset: 0.65 }, { translate: '0 0', rotate: '0deg' },
  ], { duration: 1300, easing: 'ease-in-out' });
  cellEl(root, to)?.querySelector('[data-dot]')?.animate(
    [{ scale: '1', opacity: 1 }, { scale: '1.6', opacity: 0.6, offset: 0.5 }, { scale: '1', opacity: 1 }],
    { duration: 700, delay: 340, easing: 'ease-in-out' },
  );
}
