import type { Difficulty } from '@/game/ai';

/** 網址 hash 裡帶的對局模式（見 app/utils/gameMode.ts 的 gameHash / readGameHash）。 */
export type GameMode = {
  playersNum?: 2 | 3;
  aiDifficulty?: Difficulty;
};
