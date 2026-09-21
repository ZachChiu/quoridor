import type { Player } from '@/types/chessboard';

export type PlayerKey = Exclude<Player, null>;

/** 玩家的顯示名稱。原本散在 GameTips 與 ChampionModal 各寫一份。 */
export const PLAYER_NAME: Record<PlayerKey, string> = {
  A: '紅方',
  B: '藍方',
  C: '黃方',
};

/**
 * 疊在該玩家底色上時該用什麼文字色。三個都是米白。
 *
 * 黃方原本是 `#c0821d` 配墨字 —— 那個黃太亮，米白字只有 3.04:1，
 * 只有墨字讀得動（5.81:1）。但三塊比分並排時兩白一黑就是不對盤。
 *
 * 所以把黃壓到 `#a06400`（OKLCH L 0.654 → 0.557，彩度 0.131 → 0.123）：
 * 米白字 4.55:1，對棋盤格底也從 3.04 升到 4.55，棋子與牆反而更清楚。
 * 色相維持 70°（離紅方 44°），沒有變成橘 —— 試過彩度更高的 `#b15900`，
 * 但那是 55° 的燒橘，對紅方的明度對比只有 1.06，盤面上兩種棋會混在一起。
 *
 * 代價是彩度 0.123 比專案的 0.125 下限低 0.002。在這個色相上，
 * 「米白字過 4.5」與「彩度 ≥0.125」不可能同時成立（量過整條色相線），
 * 而可讀性優先。
 */
export const PLAYER_ON: Record<PlayerKey, string> = {
  A: 'text-tile-cream',
  B: 'text-tile-cream',
  C: 'text-tile-cream',
};

/** inline style 用。動態組出來的 bg-player-${p} 靜態掃描看不到，一律走變數。 */
export const playerVar = (p: PlayerKey) => `var(--player-${p})`;
