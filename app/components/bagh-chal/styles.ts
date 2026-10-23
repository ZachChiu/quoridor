/**
 * 虎羊棋的按鈕樣式。虎羊棋整套視覺不沿用 Wall Go（Zach：虎羊棋設計大改，Wall Go 的設計跟元素要全部換掉）——
 * Wall Go 是奶油底上的灰色鈕，這裡是紙色面板上的淡沙色實心鈕（沒有外框線）、主要鈕橄欖綠，圓鈕用橄欖綠的外圈。
 *
 * 刻意放在沒有 'use client' 的檔案：伺服器元件（規則頁）從 client 模組匯入的常數會變成 client reference
 * （一個呼叫就丟錯的函式），塞進 className 就成了一段錯誤訊息文字（實際發生過）。
 */
export const BAGH_ROUND = 'grid size-11 shrink-0 place-items-center rounded-full bg-[#fbf4e1] text-xl text-tile-ink ring-2 ring-[#5b6620] transition hover:bg-[#f4e8cc] active:scale-95 disabled:opacity-35';
const BTN = 'flex items-center justify-center gap-2 rounded-xl font-black transition active:scale-[0.98] disabled:opacity-35';
/**
 * 主要鈕：橄欖綠（棋盤框線的顏色）配紙色字，對比 5.7:1。原本是深墨 ——
 * Zach 10/24：「黑色按鈕這種應該是 Wall Go 風格」。一組選項裡選中的那一個（語言、選邊）也用這個色（BAGH_SELECTED）。
 */
export const BAGH_PRIMARY = `${BTN} bg-[#5b6620] text-[#fbf4e1] hover:bg-[#4d5719]`;
export const BAGH_SELECTED = 'bg-[#5b6620] text-[#fbf4e1]';
/** 次要鈕與卡片：淡沙色實心、沒有外框線（Zach：四種選項按鈕不要有外框線） */
export const BAGH_SECONDARY = `${BTN} bg-[#f2e4c4] text-tile-ink hover:bg-[#ead8ad]`;
export const BAGH_SAND = 'bg-[#f2e4c4] text-tile-ink transition hover:bg-[#ead8ad]';
