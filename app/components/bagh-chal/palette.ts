/**
 * 虎羊棋的配色：取自尼泊爾那張印刷棋盤與 AI 畫的飾帶（番紅花外框、橄欖綠框線、深褐與陶紅的花飾、紙色盤面）。
 * 虎羊棋不套 Wall Go／平台的平塗撞色（CLAUDE.md〈視覺〉），所以顏色收在這裡，不進 globals.css。
 * Tailwind 那邊直接寫 `bg-[#e3a43c]` 這類任意值；要改色時兩邊一起搜。
 */
export const BAGH = {
  /** 外框底色、老虎那一方 */
  saffron: '#e3a43c',
  /** 框線、羊那一方 */
  olive: '#5b6620',
  /** 花飾、深色字 */
  brown: '#4a2616',
  /** 花飾、本機對戰 */
  terracotta: '#b8471f',
  /** 奶油紙：棋盤、選項卡（Tailwind 用 bg-bagh-paper，值在 globals.css 的 --bagh-paper；面板的泰奶色是 --bagh-field） */
  paper: '#fcf3e2',
  /** 棋盤線 */
  line: '#4a3426',
  /** 頁面外圍的手工紙底（換頁轉場也用這個） */
  lokta: '#f1e6cd',
  /** 木窗門 */
  wood: '#3a1d0f',
} as const;
