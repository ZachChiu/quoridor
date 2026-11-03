import type { CpuLevel } from '@/games/equation-pyramid/engine';

/**
 * /equation-pyramid 的模式放在 hash（同六角數字盤、騎士巡遊：返回鍵回選單，而不是離開整個遊戲）：
 * - `#show-easy|normal|hard`：節目規則、跟電腦搶答；`#show-solo`：節目規則、一個人計分
 * - `#daily`：每日一題；`#big`：大金字塔
 * 其他（含沒有 hash）是選單。
 */
export type Mode = { kind: 'menu' } | { kind: 'show'; cpu: CpuLevel | null } | { kind: 'daily' } | { kind: 'big' };

export function parseMode(hash: string): Mode {
  const h = hash.replace(/^#/, '');
  if (h === 'daily') return { kind: 'daily' };
  if (h === 'big') return { kind: 'big' };
  const m = /^show-(solo|easy|normal|hard)$/.exec(h);
  if (m) return { kind: 'show', cpu: m[1] === 'solo' ? null : (m[1] as CpuLevel) };
  return { kind: 'menu' };
}

export function modeHash(mode: Mode): string {
  if (mode.kind === 'menu') return '';
  if (mode.kind === 'show') return `#show-${mode.cpu ?? 'solo'}`;
  return `#${mode.kind}`;
}
