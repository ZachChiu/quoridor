/**
 * 六角數字盤的顏色：全部從大都會博物館兩塊 15 世紀的六角磁磚取樣（Open Access，CC0），不自己調（CLAUDE.md〈視覺〉第二批那段）。
 * - 釉白 #f5e5d3、墨 #22283b、青綠 #4f6b67：埃及（馬木路克）15 世紀上半的六角磁磚，1982.478.1
 *   （https://www.metmuseum.org/art/collection/search/453196）—— 白釉最亮的 5%、鈷藍線最暗的 5%、邊上青綠釉最飽和的 5%
 * - 鈷藍 #2a5b8a：土耳其伊茲尼克 1535 年左右的六角花磚，40.181.11（https://www.metmuseum.org/art/collection/search/450368）—— 鈷藍最飽和的 5%
 * 取樣的做法與原圖見 docs/hexagon.md〈配色〉。
 *
 * 對比（WCAG）：墨字在釉白上 11.9:1；鈷藍字在釉白上、釉白字在鈷藍上都是 5.75:1；青綠在釉白上 4.69:1（只畫線，不寫小字）。
 * 鈷藍的 OKLCH 彩度 0.093，低於全站 0.125 的下限 —— 是原件的顏色，照第二批的原則不提彩度。
 */
export const HX = {
  glaze: '#f5e5d3',
  ink: '#22283b',
  cobalt: '#2a5b8a',
  teal: '#4f6b67',
} as const;
