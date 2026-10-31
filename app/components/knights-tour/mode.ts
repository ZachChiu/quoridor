import { isSize } from '@/games/knights-tour/engine';

/**
 * /knights-tour 的模式放在 hash：`#show` 節目挑戰、`#practice-8` 練習 8×8，其他（含沒有 hash）是選單。
 * 認不得的大小（#practice-4、#practice-abc）一律回選單，不硬開一個不存在的棋盤。
 */
export type Mode = { kind: 'menu' } | { kind: 'show' } | { kind: 'practice'; n: number };

export function parseMode(hash: string): Mode {
  const h = hash.replace(/^#/, '');
  if (h === 'show') return { kind: 'show' };
  const m = /^practice-(\d+)$/.exec(h);
  if (m && isSize(Number(m[1]))) return { kind: 'practice', n: Number(m[1]) };
  return { kind: 'menu' };
}

export function modeHash(mode: Mode): string {
  return mode.kind === 'show' ? '#show' : mode.kind === 'practice' ? `#practice-${mode.n}` : '';
}
