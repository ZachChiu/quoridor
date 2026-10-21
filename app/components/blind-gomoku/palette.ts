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
