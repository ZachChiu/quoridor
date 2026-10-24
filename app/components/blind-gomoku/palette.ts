import type { CornerTheme } from '@/components/cornerTheme';

/**
 * 盲眼五子棋的配色：取自 19 世紀朝鮮的拼布包袱巾（조각보／보자기，芝加哥藝術博物館 145403，公有領域），
 * 2026-10-21 只取高彩度的布塊分群取樣。顏色一律從原件取樣，不自己調（見 CLAUDE.md 虎羊棋那段）。
 *
 * - 頁面是包袱巾裡的奶油白絲（深一階），棋盤是淺一階的白絲，線是黑絲的顏色
 * - 主色是青綠：包袱巾裡最多的布色（18%），白絲字放在上面 5.7:1
 * - 七色棋子也從這塊布來（見 Stone.tsx 的 STONE_HEX），色盲靠每色一個形狀
 */
export const GMK = {
  /** 頁面：奶油白絲（深一階） */
  silk: '#e4d6bb',
  /** 棋盤、卡片：淺一階的白絲 */
  silkLight: '#f2e4c9',
  /** 黑絲：棋盤線、黑子、主要按鈕 */
  ink: '#2a2525',
  /** 主色：青綠布 */
  teal: '#046161',
} as const;

/**
 * 彈窗：一塊包袱巾 —— 標題列是拼起來的青綠布（左上角一塊桃紅三角、中間一道白絲縫線），
 * 整塊面板內側一圈平針縫。介面零件本身在 globals.css 的 .gmk-*。
 */
export const GMK_BAND = {
  style: {
    background:
      'linear-gradient(135deg, transparent 33px, #f2e4c9 33px, #f2e4c9 35px, transparent 35px), linear-gradient(135deg, #be3479 34px, #046161 34px)',
  },
  fg: 'text-[#f2e4c9]',
};
export const GMK_PANEL = '!rounded-[3px] !bg-[#f2e4c9] ![outline:1.5px_dashed_rgb(42_37_37/0.35)] ![outline-offset:-7px]';

/**
 * 遊戲首頁右上角「聯絡我們」與「語言」（見 components/cornerTheme.ts）：跟這款自己的彈窗同一個樣子 ——
 * 標題列是拼起來的青綠布、面板一圈平針縫；圓鈕跟對局畫面的小鈕一樣是一塊半透明的苧麻布；
 * 主要鈕（送出、目前的語言、選中的評分）是拼起來的青綠布，桃紅三角縮小一點（清單列的字從左邊 16px 開始，大三角會壓到字）；
 * 次要鈕是苧麻布；文字欄位是深一階的白絲，縫線在框裡，focus 時縫線變成青綠實線。
 *
 * 放在這個沒有 'use client' 的檔案（原因見 bagh-chal/styles.ts）。
 */
export const GMK_CORNER: CornerTheme = {
  button: 'gmk-patch is-ramie text-ink-soft',
  band: GMK_BAND,
  panelClassName: GMK_PANEL,
  primary: 'gmk-patch is-pieced ![--corner:15px]',
  secondary: 'gmk-patch is-ramie',
  field: 'gmk-patch !bg-[#e4d6bb]/70 focus:![outline-color:#046161] focus:![outline-style:solid] focus:![outline-width:2px]',
  soft: 'text-ink-soft',
};
