import type { CSSProperties } from 'react';

/**
 * 遊戲首頁右上角「聯絡我們」與「語言」的外觀：圓鈕本身，加上打開的那兩個彈窗。
 *
 * 每款遊戲都有自己的視覺，這兩個彈窗卻一直是 Wall Go 的奶油底＋深墨按鈕（Zach 10/24：九子棋有些彈窗打開還是舊的 Wall Go 樣式，
 * 「每一頁都有各自的視覺了，把右上角的留言跟語系彈窗一起整併好」）。各遊戲在自己的資料夾定義一份，交給 PlatformCorner。
 *
 * 只放字串（class 與 style），不放元件：遊戲首頁多半是伺服器元件，函式傳不進 client 元件。
 * 也刻意放在沒有 'use client' 的檔案（原因見 bagh-chal/styles.ts）。
 */
export type CornerTheme = {
  /** 頁面上那兩顆圓鈕 */
  button: string;
  /** 彈窗的標題色帶（Modal 的 band） */
  band: { className?: string; style?: CSSProperties; fg: string };
  /** 彈窗面板（換紙色、字色、標題的裝飾；Modal 的 panelClassName） */
  panelClassName?: string;
  /** 主要鈕：送出、關閉、目前的語言、選中的評分 */
  primary: string;
  /** 次要鈕：「之後再說」、其他語言、沒選的評分 */
  secondary: string;
  /** 文字欄位 */
  field: string;
  /** 小字（說明、選填）的顏色 */
  soft?: string;
  /** 虎羊棋的彈窗有上方飾帶（Modal 的 skin） */
  skin?: 'default' | 'bagh';
};

/** Wall Go 與平台的預設（奶油底、灰鈕、深墨主要鈕） */
export const DEFAULT_CORNER: CornerTheme = {
  button: 'bg-tile-ink/[0.06] text-ink-soft hover:bg-tile-ink/[0.12]',
  band: { className: 'bg-tile-purple', fg: 'text-tile-cream' },
  primary: 'bg-tile-ink text-tile-cream',
  secondary: 'bg-tile-ink/[0.06] text-ink-soft',
  field: 'bg-primary-50 outline-none ring-tile-ink/30 focus:ring-2',
};
