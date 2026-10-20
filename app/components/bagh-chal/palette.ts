/**
 * 虎羊棋的配色：取自素材圖 board-art.webp（2026-10-21 取樣出現最多的顏色：飾帶底 #eaa42c、盤面米紙 #f4e4bd、
 * 框線橄欖 #736922、棋盤線 #2b1a0d、老虎棋子橘 #db6a0b）。面板的薑黃 #f0b15e 是設計稿主視覺的底。
 * 虎羊棋不套 Wall Go／平台的平塗撞色（CLAUDE.md〈視覺〉），所以顏色收在這裡，不進 globals.css。
 * Tailwind 那邊直接寫 `bg-[#eaa42c]` 這類任意值；要改色時兩邊一起搜。
 */
export const BAGH = {
  /** 外框飾帶的底（素材的薑黃） */
  saffron: '#eaa42c',
  /** 面板、彈窗的底（設計稿主視覺的薑黃；Tailwind 用 bg-bagh-field） */
  field: '#f0b15e',
  /** 老虎那一方（輪到老虎、可以吃的提示）—— 素材老虎棋子的橘；薑黃底上番紅花看不出來 */
  tiger: '#db6a0b',
  /** 框線、羊那一方 */
  olive: '#736922',
  /** 花飾、深色字 */
  brown: '#4a2616',
  /** 花飾、本機對戰 */
  terracotta: '#b8471f',
  /** 米紙：棋盤、選項卡（Tailwind 用 bg-bagh-paper，值在 globals.css 的 --bagh-paper） */
  paper: '#f4e4bd',
  /** 棋盤線 */
  line: '#2b1a0d',
  /** 頁面外圍的手工紙底（換頁轉場也用這個） */
  lokta: '#f1e6cd',
  /** 木窗門 */
  wood: '#3a1d0f',
} as const;
