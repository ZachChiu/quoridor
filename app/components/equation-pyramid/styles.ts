import type { CornerTheme } from '@/components/cornerTheme';
import type { ShareClasses } from '@/components/ShareResultModal';

/**
 * 方程式金字塔的按鈕與彈窗樣式。放在沒有 'use client' 的檔案（原因見 bagh-chal/styles.ts）。
 * 主要是深釉（一塊深色彩陶磚，上緣圓、下緣方，跟牆上的磚一樣），次要是淡墨；沒有框線。顏色見 palette.ts。
 */
export const BTN_ROUND = 'ep-soft grid size-11 shrink-0 place-items-center text-xl disabled:opacity-35';
export const BTN = 'ep-soft flex min-h-12 items-center justify-center gap-2 px-3 py-2 text-sm font-black leading-tight active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35 lg:min-h-14 lg:text-base';
export const BTN_PRIMARY = 'ep-deep flex min-h-12 items-center justify-center gap-2 px-3 py-2 text-sm font-black leading-tight active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35 lg:min-h-14 lg:text-lg';

/** 彈窗：石灰白的面板，標題底下一道深釉線（不用色帶） */
export const MODAL_PANEL = '!rounded-[14px] !bg-[#e8ebe2] !text-[#071a19]';
export const BAND = { className: 'mx-6 !px-0 border-b-2 border-[#195153] bg-transparent', fg: 'text-[#195153]' };

/** 首頁上排的聯絡我們、語言（cornerTheme.ts） */
export const EP_CORNER: CornerTheme = {
  button: 'ep-soft text-[#071a19]',
  band: BAND,
  panelClassName: MODAL_PANEL,
  primary: 'ep-deep',
  secondary: 'ep-soft',
  field: 'rounded-[10px] bg-[#071a19]/[0.05] text-[#071a19] outline-none placeholder:text-[#071a19]/45 focus:shadow-[inset_0_0_0_2px_#195153]',
  soft: 'text-[#071a19]/70',
};

/** 結算分享圖底下的按鈕（暗遮罩上）：再玩一次是石灰白、分享是淡的 */
export const EP_SHARE: Partial<ShareClasses> = {
  primary: 'bg-[#e8ebe2] text-[#071a19] rounded-[12px_12px_6px_6px]',
  secondary: 'bg-white/15 text-[#e8ebe2] rounded-[12px_12px_6px_6px]',
  button: 'font-black',
  placeholder: 'bg-[#e8ebe2]/20',
};
