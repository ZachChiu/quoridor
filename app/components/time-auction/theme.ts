import type { CornerTheme } from '@/components/cornerTheme';

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

/** 角落的小鈕（回首頁、聲音、說明）：方角、一道墨線，像傳單角落的小框 */
export const roundBtn = 'grid size-11 shrink-0 place-items-center rounded-[2px] text-xl text-[#35331c] shadow-[inset_0_0_0_1.5px_#35331c] transition fine:hover:bg-[#35331c]/[0.07] disabled:opacity-35';

/** 首頁主視覺：Cruikshank〈Sales by Auction〉（1819）的拍賣場，裁掉了下面那行說明文字 */
export const KEY_ART = '/games/time-auction/auction.webp';

/**
 * 彈窗：拍賣目錄的一頁 —— 方角紙色面板、一道墨線外框；標題下一道雙線，不用色帶（色帶是 Wall Go 的語彙）。
 * 結算時勝方那一列另外用紅色版塊。
 */
export const TAU_PANEL = '!rounded-[3px] !bg-[#ebe1b8] shadow-[inset_0_0_0_1.5px_#35331c]';
export const TAU_BAND = { className: 'mx-6 !px-0 border-b-[4px] border-double border-[#35331c]/70 bg-transparent', fg: 'text-[#35331c]' };

/** 紅（Cruikshank 的紅色顏料）：分享圖等用 canvas 畫的地方要色值，不是 class */
export const RED = '#92383a';

/**
 * 首頁右上角的「聯絡我們」與「語言」（見 components/cornerTheme.ts）：跟對局裡的彈窗同一張拍賣目錄的紙 ——
 * 方角紙色面板、標題下雙線（TAU_PANEL／TAU_BAND）。圓鈕是傳單角落那種方角墨線小框（同上面的 roundBtn）。
 * 主要鈕（送出、目前的語言、選中的評分）是紅色鉛字版塊 .tau-press，次要鈕是墨色雙線的票 .tau-lot，欄位是名片那種細框、
 * 對焦時換成紅框（自己那張名片的紅框）。
 *
 * 這個檔案刻意沒有 'use client'：伺服器元件匯入 client 模組的常數會變成 client reference（原因見 bagh-chal/styles.ts）。
 * 共用元件寫死的 size-10、rounded-full／rounded-xl 要用 ! 蓋掉（.tau-* 本身在 globals.css 已經壓得過圓角 utility）。
 */
export const TAU_CORNER: CornerTheme = {
  button: '!size-11 !rounded-[2px] text-[#35331c] shadow-[inset_0_0_0_1.5px_#35331c] fine:hover:bg-[#35331c]/[0.07]',
  band: TAU_BAND,
  panelClassName: TAU_PANEL,
  primary: 'tau-press tracking-normal',
  secondary: 'tau-lot',
  field: '!rounded-[2px] bg-[#35331c]/[0.05] shadow-[inset_0_0_0_1px_rgb(53_51_28/0.5)] outline-none focus:shadow-[inset_0_0_0_2px_#92383a]',
  soft: 'text-ink-soft',
};
