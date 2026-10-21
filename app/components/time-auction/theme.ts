/**
 * 時間拍賣的配色：維多利亞時代的拍賣行版畫（設計總表第 9 節的 A 方向）。2026-10-21 從原件取樣，不自己調：
 * - 紙、墨：《Puck》1888〈Grand Presidential Auction Sale〉彩色石版畫（芝加哥藝術博物館 129246，公有領域）
 * - 紅：George Cruikshank〈Sales by Auction〉1819 手工上色蝕刻（芝加哥藝術博物館 89955，公有領域）的紅色顏料
 * - 金：同一張的黃色顏料，只用在得標的金幣
 *
 * 紅是這款唯一的主色（一個面板一個色相）：按住出價中、這回合得標、第一名。紅與紙互為底字都是 5.6:1，墨在紙上 9.8:1。
 */
export const KEY_BG = 'bg-[#92383a]';
export const KEY_TEXT = 'text-[#92383a]';
export const KEY_RING = 'ring-[#92383a]/25';
export const PAPER = '#ebe1b8';
export const INK = '#35331c';
export const GOLD = '#c4af4c';

/** 首頁主視覺：Cruikshank〈Sales by Auction〉（1819）的拍賣場，裁掉了下面那行說明文字 */
export const KEY_ART = '/games/time-auction/auction.webp';

/**
 * 彈窗：拍賣目錄的一頁 —— 方角紙色面板、一道墨線外框；標題下一道雙線，不用色帶（色帶是 Wall Go 的語彙）。
 * 結算時勝方那一列另外用紅色版塊。
 */
export const TAU_PANEL = '!rounded-[3px] !bg-[#ebe1b8] shadow-[inset_0_0_0_1.5px_#35331c]';
export const TAU_BAND = { className: 'mx-6 !px-0 border-b-[4px] border-double border-[#35331c]/70 bg-transparent', fg: 'text-[#35331c]' };
