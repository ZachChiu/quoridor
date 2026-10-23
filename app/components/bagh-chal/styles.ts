import type { CornerTheme } from '@/components/cornerTheme';

/**
 * 虎羊棋的按鈕樣式。虎羊棋整套視覺不沿用 Wall Go（Zach：虎羊棋設計大改，Wall Go 的設計跟元素要全部換掉）——
 * Wall Go 是奶油底上的灰色鈕，這裡是紙色面板上的淡沙色鈕、主要鈕橄欖綠，外框是米提拉畫的畫框（Zach 10/24：按鈕也要是圖騰風）：
 * 卡片與主要鈕兩條線夾一排三角（.bagh-totem／.bagh-totem-on）、次要鈕只有兩條線（.bagh-line）、圓鈕是小圓牌（.bagh-medal），
 * 樣式在 globals.css 虎羊棋那段。米提拉的畫框是方的，所以都是直角。
 *
 * 刻意放在沒有 'use client' 的檔案：伺服器元件（規則頁）從 client 模組匯入的常數會變成 client reference
 * （一個呼叫就丟錯的函式），塞進 className 就成了一段錯誤訊息文字（實際發生過）。
 */
export const BAGH_ROUND = 'bagh-medal grid size-11 shrink-0 place-items-center rounded-full text-lg text-tile-ink transition active:scale-95 disabled:opacity-35';
const BTN = 'flex items-center justify-center gap-2 font-black transition active:scale-[0.98] disabled:opacity-35';
/**
 * 主要鈕：橄欖綠（棋盤框線的顏色）配紙色字，對比 5.7:1。原本是深墨 ——
 * Zach 10/24：「黑色按鈕這種應該是 Wall Go 風格」。一組選項裡選中的那一個（語言、選邊）也用這個色（BAGH_SELECTED）。
 */
export const BAGH_PRIMARY = `${BTN} bagh-totem-on bg-[#5b6620] text-[#fbf4e1] hover:bg-[#4d5719]`;
export const BAGH_SELECTED = 'bagh-totem-on bg-[#5b6620] text-[#fbf4e1]';
/** 次要鈕：淡沙色、兩條線的框 */
export const BAGH_SECONDARY = `${BTN} bagh-line bg-[#f2e4c4] text-tile-ink hover:bg-[#ead8ad]`;
/** 選項卡片（老虎、羊、本機、連線、難度）：淡沙色、鋸齒框 */
export const BAGH_CARD = 'bagh-totem bg-[#f2e4c4] text-tile-ink transition hover:bg-[#ead8ad]';
export const BAGH_SAND = 'bagh-line bg-[#f2e4c4] text-tile-ink transition hover:bg-[#ead8ad]';

/** 聯絡我們、語言的圓鈕與彈窗（見 cornerTheme.ts）：紙色面板、上方飾帶（skin）、深褐標題、橄欖綠主要鈕 */
export const BAGH_CORNER: CornerTheme = {
  button: 'bagh-medal text-tile-ink',
  band: { className: 'bg-[#4a2616]', fg: 'text-tile-cream' },
  primary: BAGH_SELECTED,
  secondary: 'bagh-line bg-[#f2e4c4] text-tile-ink hover:bg-[#ead8ad]',
  field: 'bg-[#f2e4c4] outline-none ring-[#5b6620] focus:ring-2',
  skin: 'bagh',
};
