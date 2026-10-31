import type { Side } from '@/games/bagh-chal/engine';
import type { Difficulty } from '@/games/bagh-chal/ai';

/**
 * /bagh-chal/solo 的 hash：`#tiger-normal`、`#goat-hard`。
 * 跟 Wall Go 的 `/solo#hard` 一樣放在 hash —— 重整不必再選一次，分享出去也是直接開那一局。
 */
const SIDES: Side[] = ['tiger', 'goat'];
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];

export function soloHash(side: Side, difficulty: Difficulty): string {
  return `#${side}-${difficulty}`;
}

export function readSoloHash(hash: string): { side: Side; difficulty: Difficulty } | null {
  const parts = hash.replace(/^#/, '').split('-');
  if (parts.length !== 2) return null;
  const [side, difficulty] = parts;
  if (!SIDES.includes(side as Side) || !LEVELS.includes(difficulty as Difficulty)) return null;
  return { side: side as Side, difficulty: difficulty as Difficulty };
}
