import type { Player } from '@/types/chessboard';

export type PlayerKey = Exclude<Player, null>;

/** 玩家的顯示名稱。原本散在 GameTips 與 ChampionModal 各寫一份。 */
export const PLAYER_NAME: Record<PlayerKey, string> = {
  A: '紅方',
  B: '藍方',
  C: '黃方',
};

/**
 * 疊在該玩家底色上時該用什麼文字色。
 * 紅與藍偏暗用米白、黃偏亮用墨 —— 是逐一量過對比度的結果，
 * 交給程式從亮度猜會在黃色上出錯。
 */
export const PLAYER_ON: Record<PlayerKey, string> = {
  A: 'text-tile-cream',
  B: 'text-tile-cream',
  C: 'text-tile-ink',
};

/** inline style 用。動態組出來的 bg-player-${p} 靜態掃描看不到，一律走變數。 */
export const playerVar = (p: PlayerKey) => `var(--player-${p})`;
