import type { CornerTheme } from '@/components/cornerTheme';
import type { ShareClasses } from '@/components/ShareResultModal';

/**
 * 六角數字盤的按鈕與彈窗樣式。放在沒有 'use client' 的檔案（原因見 bagh-chal/styles.ts）。
 *
 * 零件照磁磚（globals.css 的 .hx-*）：次要是一塊白釉磁磚、內緣一道鈷藍細線（磁磚的釉邊）；
 * 主要是一塊鈷藍磁磚、內縮一道釉白細線。圓角 10px（磁磚燒過的邊）。顏色見 palette.ts。
 */
export const BTN_ROUND = 'hx-tile grid size-11 shrink-0 place-items-center text-xl disabled:opacity-35';
export const BTN = 'hx-tile flex min-h-12 items-center justify-center gap-2 px-3 py-2 text-sm font-black leading-tight active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35';
export const BTN_PRIMARY = 'hx-cobalt flex min-h-12 items-center justify-center gap-2 px-3 py-2 text-sm font-black leading-tight active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35';

/** 彈窗：一塊大磁磚 —— 釉白面板、內緣鈷藍細線，標題底下一道鈷藍線（不用色帶） */
export const MODAL_PANEL = '!rounded-[14px] !bg-[#f5e5d3] !text-[#22283b] shadow-[inset_0_0_0_2px_#2a5b8a,inset_0_0_0_5px_#f5e5d3,inset_0_0_0_6px_rgb(79_107_103/0.6)]';
export const BAND = { className: 'mx-6 !px-0 border-b-2 border-[#2a5b8a] bg-transparent', fg: 'text-[#2a5b8a]' };

/** 首頁右上角的聯絡我們、語言（cornerTheme.ts）：同一套磁磚 */
export const HX_CORNER: CornerTheme = {
  button: 'hx-tile text-[#22283b]',
  band: BAND,
  panelClassName: MODAL_PANEL,
  primary: 'hx-cobalt',
  secondary: 'hx-tile',
  field: 'rounded-[10px] bg-[#22283b]/[0.04] text-[#22283b] shadow-[inset_0_0_0_1.5px_rgb(42_91_138/0.6)] outline-none placeholder:text-[#22283b]/45 focus:shadow-[inset_0_0_0_2px_#2a5b8a]',
  soft: 'text-[#22283b]/70',
};

/** 結算分享圖底下的按鈕（暗遮罩上）：再玩一次是鈷藍磁磚、分享是白釉磁磚 */
export const HX_SHARE: Partial<ShareClasses> = {
  primary: 'hx-cobalt',
  secondary: 'hx-tile',
  button: 'font-black',
  placeholder: 'bg-[#f5e5d3]/20',
};
