import { colOf, rowOf, type Square } from '@/games/knights-tour/engine';

/**
 * 12:34；練習超過一小時是 1:02:03。
 * 節目挑戰的倒數用 countdown：無條件進位（一開始是 60:00、時間到剛好 00:00），
 * 而且不進位成小時 —— 節目的大螢幕就是 60:00 往下數，不是 1:00:00。
 */
export function formatTime(ms: number, countdown = false): string {
  const total = Math.max(0, countdown ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
  const h = countdown ? 0 : Math.floor(total / 3600);
  const mm = String(Math.floor((total - h * 3600) / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export const sizeLabel = (n: number) => `${n}×${n}`;

/** 西洋棋的格子名稱：左下是 a1（讀屏用） */
export function squareName(n: number, sq: Square): string {
  return `${'abcdefghij'[colOf(n, sq)]}${n - rowOf(n, sq)}`;
}

/**
 * 點了不能走的格子：那一格左右晃一下。用瀏覽器原生的 Web Animations API，
 * 跟換頁轉場同一個做法（不用每格 JS 寫 style，也不必在 globals.css 多一支 keyframes）。
 */
export function shake(el: HTMLElement | null): void {
  if (!el || typeof el.animate !== 'function') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-9%)' },
      { transform: 'translateX(8%)' },
      { transform: 'translateX(-5%)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 300, easing: 'ease-out' },
  );
}
