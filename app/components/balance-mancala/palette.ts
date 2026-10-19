import { CELL_COLOUR, DEVIL, letterOf, type Colour, type Seat } from '@/games/balance-mancala/engine';

/**
 * Balance Mancala 的配色。
 *
 * 盤面是一塊夜空藍的實色磁磚（平台卡片與主視覺 key-art 的主色 #141b3d），
 * 外面的分數、按鈕照全站的奶油底平塗。
 *
 * 盤子的紅藍綠直接用站上的玩家色（--player-A/B/C）—— 它們在夜空藍上 3.4–3.6:1，
 * 米白字 4.3–4.6:1。**座位色刻意避開紅、藍、綠**：「紅方的藍色分數」這種說法會打結，
 * 所以 7 個座位用紫、琥珀、天藍、炭黑、洋紅、橘、褐，每顆子另外印座位字母（不只靠顏色）。
 * 子的外圈留一道米白縫，疊在任何盤子上都分得開。
 * 天藍 #1aa7c9 的彩度 0.118 略低於全站 0.125 的下限 —— sRGB 在這個色相、這個明度做不到更高。
 */
export const NAVY = '#141b3d';
export const GOLD = '#d9b45a';
export const CREAM = '#faf7f0';
export const INK = '#141010';

export const DISH_BG: Record<Colour, string> = { 0: 'var(--player-A)', 1: 'var(--player-B)', 2: 'var(--player-C)' };

export type SeatLook = { bg: string; fg: string; fgClass: 'text-tile-cream' | 'text-tile-ink' };

/** 字母與底色的對比都 ≥4.8:1（米白字或深墨字，量過才配） */
export const SEAT_LOOK: SeatLook[] = [
  { bg: '#7e3fa8', fg: CREAM, fgClass: 'text-tile-cream' }, // A 紫
  { bg: '#e9af4c', fg: INK, fgClass: 'text-tile-ink' }, // B 琥珀
  { bg: '#1aa7c9', fg: INK, fgClass: 'text-tile-ink' }, // C 天藍
  { bg: '#3d3836', fg: CREAM, fgClass: 'text-tile-cream' }, // D 炭黑
  { bg: '#b8347d', fg: CREAM, fgClass: 'text-tile-cream' }, // E 洋紅
  { bg: '#e8772e', fg: INK, fgClass: 'text-tile-ink' }, // F 橘
  { bg: '#a35a1f', fg: CREAM, fgClass: 'text-tile-cream' }, // G 褐
];

export const seatLook = (seat: Seat): SeatLook => SEAT_LOOK[seat] ?? SEAT_LOOK[0];

/**
 * 格子的名字：盤子是「藍盤」，惡魔、天使是名字。
 * 不用節目的盤子編號（01–12）：盤面上沒有印編號，句子裡出現「05」反而對不起來；
 * 同色的盤子有四個，要指哪一個由盤面上的標示負責（上一手、預覽）。
 */
export function cellName(cell: number, t: { devil: string; angel: string; dishNames: string[] }): string {
  const c = CELL_COLOUR[cell];
  if (c === null) return cell === DEVIL ? t.devil : t.angel;
  return t.dishNames[c];
}

export { letterOf };
