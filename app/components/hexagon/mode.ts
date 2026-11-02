import type { Level } from '@/games/hexagon/engine';

/**
 * /hexagon 的模式放在 hash：`#daily` 每日一題、`#show` 節目規則、`#practice-easy|normal|hard` 練習，其他（含沒有 hash）是選單。
 * 放 hash 的理由同騎士巡遊（components/knights-tour/KnightsTour.tsx）：返回鍵回選單，而不是離開整個遊戲。
 */
export type Mode = { kind: 'menu' } | { kind: 'daily' } | { kind: 'show' } | { kind: 'practice'; level: Level };

export function parseMode(hash: string): Mode {
  const h = hash.replace(/^#/, '');
  if (h === 'daily') return { kind: 'daily' };
  if (h === 'show') return { kind: 'show' };
  const m = /^practice-(easy|normal|hard)$/.exec(h);
  if (m) return { kind: 'practice', level: m[1] as Level };
  return { kind: 'menu' };
}

export function modeHash(mode: Mode): string {
  return mode.kind === 'menu' ? '' : mode.kind === 'practice' ? `#practice-${mode.level}` : `#${mode.kind}`;
}
