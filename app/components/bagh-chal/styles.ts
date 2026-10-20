/**
 * 虎羊棋的按鈕樣式。虎羊棋整套視覺不沿用 Wall Go（Zach：虎羊棋設計大改，Wall Go 的設計跟元素要全部換掉）——
 * Wall Go 是奶油底上的灰色無框鈕，這裡是紙色底、深墨粗框（跟首頁四個按鈕同一種），圓鈕用橄欖綠的外圈。
 *
 * 刻意放在沒有 'use client' 的檔案：伺服器元件（規則頁）從 client 模組匯入的常數會變成 client reference
 * （一個呼叫就丟錯的函式），塞進 className 就成了一段錯誤訊息文字（實際發生過）。
 */
export const BAGH_ROUND = 'grid size-11 shrink-0 place-items-center rounded-full bg-[#fbf4e1] text-xl text-tile-ink ring-2 ring-[#5b6620] transition hover:bg-[#f4e8cc] active:scale-95 disabled:opacity-35';
const BTN = 'flex items-center justify-center gap-2 rounded-xl border-2 border-tile-ink font-black transition active:scale-[0.98] disabled:opacity-35';
export const BAGH_PRIMARY = `${BTN} bg-tile-ink text-tile-cream hover:brightness-125`;
export const BAGH_SECONDARY = `${BTN} bg-[#fbf4e1] text-tile-ink hover:bg-[#f4e8cc]`;
