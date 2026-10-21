import { CELL_COLOUR, DEVIL, letterOf, type Colour, type Seat } from '@/games/balance-mancala/engine';

/**
 * 均衡曼卡拉的配色：阿坎（今迦納）的 Adinkra 印花布、黃金砝碼、Oware 播棋盤（設計總表第 9 節）。
 * 2026-10-21 從原件取樣，不自己調：
 * - 布、墨：1825 年的 Adinkra 印花布（萊登世界文化博物館藏，Wikimedia Commons〈Adinkra 1825.jpg〉，公有領域）——
 *   布 #ebd2cb（k-means 最大的淺色群）、亮處 #fef2ec、印花的墨 #201211（暗部平均）
 * - 黃銅：克里夫蘭美術館的黃金砝碼（1962.244 幾何形，CC0）—— #af9b71、暗部 #856f4c；
 *   副字色 #5e4b3f 取自同館的羚羊砝碼（1935.306）
 * - 木頭：Wikimedia Commons〈Oware Board.jpg〉（CC BY-SA 4.0，只取色、不放進網站）的棋盤暗部 #362522
 *
 * 頁面是一塊布（MancalaFrame：最外緣一圈蓋印的布邊），盤面是一塊圓的木頭，上面嵌黃銅的軌道線。
 * 對比：墨在布上 13:1、副字色 5.7:1；黃銅在木頭上 5.4:1、亮布色在木頭上 13:1。
 *
 * 盤子的紅藍綠是規則（站上的玩家色 --player-A/B/C），在木頭上 2.9–3.2:1，盤子外緣另有一圈黃銅（5.4:1）圈出輪廓。
 * **座位色刻意避開紅、藍、綠**：「紅方的藍色分數」這種說法會打結，所以 7 個座位用紫、琥珀、天藍、炭黑、洋紅、橘、褐，
 * 每顆子另外印座位字母（不只靠顏色）。座位色是功能色、不是識別色，沒有跟著換。
 * 子的外圈留一道亮布色的縫，疊在任何盤子上都分得開。
 */
export const CLOTH = '#ebd2cb';
export const CLOTH_LIGHT = '#fef2ec';
export const INK = '#201211';
export const INK_SOFT = '#5e4b3f';
export const BRASS = '#af9b71';
export const BRASS_DEEP = '#856f4c';
export const WOOD = '#362522';
/** 座位色上的米白字（SEAT_LOOK）：全站的 tile-cream，跟 fgClass 一致 */
const CREAM = '#faf7f0';

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
