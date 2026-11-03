import type { CornerTheme } from '@/components/cornerTheme';

/**
 * 提問與真相的配色：取自 Georges de La Tour〈方塊 A 的老千〉（Le Tricheur à l'as de carreau，約 1635，羅浮宮 RF 1972-8，
 * 公有領域；Wikimedia Commons PD-Art）。整幅畫就是一場藏牌的牌局：老千把方塊 A 藏在背後，三個人用眼神互相試探。
 * 2026-11-03 從原件以 OKLab k-means 分群、每群取中位數（docs/question-and-truth.md〈配色〉），顏色一律從原件取樣，不自己調。
 *
 * - 頁面是背景那片黑（#0e1012），字是交際花衣領蕾絲的米白（10.9:1）
 * - 牌與彈窗的紙是她手上那張牌的白（偏一點綠灰），上面的字是深墨（9.5:1）、紅花色用朱紅（4.3:1）
 * - 朱紅（右邊少年的裙子）在黑底上只有 2.8:1，只當色塊；黑底上的次要字用包頭巾的金（5.9:1）
 * - 牌桌是畫裡的橄欖綠桌布
 * - 最外緣一圈是交際花的珍珠項鍊（globals.css 的 .qt-frame），只有這一圈裝飾
 *
 * 實際的值都是 CSS 變數（globals.css 的 .qt-root），元件只寫 var(--qt-…)，這裡留一份給 Canvas（分享圖）與進場用。
 */
export const QT = {
  page: '#0e1012',
  fg: '#c8c5a5',
  gold: '#af8942',
  red: '#993e27',
  table: '#635b33',
  paper: '#c2d1c5',
  ink: '#211e19',
} as const;

/** 紅方、黑方的記號色（紅方是朱紅的方塊、黑方是深墨的黑桃，都畫在牌紙上） */
export const SEAT_HEX = [QT.red, QT.ink] as const;

/** 彈窗：標題列是黑底上一排珍珠（跟外框同一條項鍊），面板是牌的紙色 */
export const QT_BAND = {
  className: 'qt-band',
  style: {},
  fg: 'text-[var(--qt-fg)]',
};
export const QT_PANEL = '!rounded-[6px] !bg-[var(--qt-paper)] !text-[var(--qt-ink)]';

/** 首頁上方「聯絡我們」與「語言」（components/cornerTheme.ts） */
export const QT_CORNER: CornerTheme = {
  button: 'qt-btn is-quiet',
  band: QT_BAND,
  panelClassName: QT_PANEL,
  primary: 'qt-btn is-ink-on-paper',
  secondary: 'qt-btn is-paper',
  field: 'qt-field',
  soft: 'opacity-70',
};
