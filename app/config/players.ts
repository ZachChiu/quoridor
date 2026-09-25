import type { Player } from '@/types/chessboard';

export type PlayerKey = Exclude<Player, null>;

/** 玩家的顯示名稱。原本散在 GameTips 與 ChampionModal 各寫一份。 */
export const PLAYER_NAME: Record<PlayerKey, string> = {
  A: '紅方',
  B: '藍方',
  C: '綠方',
};

/**
 * 疊在該玩家底色上時該用什麼文字色。三個都是米白（對比都 ≥ 4.5:1）。
 *
 * 第三方原本是黃：黃太亮，要讓米白字讀得清楚得壓到 #a06400 那種土黃，
 * 彩度還過不了 0.125；在紅／綠色盲眼裡也跟紅方幾乎同色。換成綠 #0e8142
 * 之後三塊比分都能用米白字，理由與數據見 globals.css 的 --player-C。
 */
export const PLAYER_ON: Record<PlayerKey, string> = {
  A: 'text-tile-cream',
  B: 'text-tile-cream',
  C: 'text-tile-cream',
};

/** inline style 用。動態組出來的 bg-player-${p} 靜態掃描看不到，一律走變數。 */
export const playerVar = (p: PlayerKey) => `var(--player-${p})`;
