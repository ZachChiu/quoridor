/**
 * 虎羊棋的按鈕樣式。虎羊棋整套視覺不沿用 Wall Go：紙色面板上的淡沙色實心鈕、沒有外框線
 * （Zach：選項按鈕不要有外框線），主要鈕深墨。
 *
 * 刻意放在沒有 'use client' 的檔案：伺服器元件（規則頁）從 client 模組匯入的常數會變成 client reference
 * （一個呼叫就丟錯的函式），塞進 className 就成了一段錯誤訊息文字（實際發生過）。
 */
export const BAGH_ROUND = 'grid size-11 shrink-0 place-items-center rounded-full bg-[#f2e4c4] text-xl text-tile-ink transition hover:bg-[#ead8ad] active:scale-95 disabled:opacity-35';
const BTN = 'flex items-center justify-center gap-2 rounded-xl font-black transition active:scale-[0.98] disabled:opacity-35';
export const BAGH_PRIMARY = `${BTN} bg-tile-ink text-tile-cream hover:brightness-125`;
export const BAGH_SECONDARY = `${BTN} bg-[#f2e4c4] text-tile-ink hover:bg-[#ead8ad]`;
