/**
 * 桌機版排法（11/1 Zach：「盲五子棋桌機那樣很怪，好好重新排列一下」），做了兩種給他挑，他選首頁 B、對局 A：
 *
 * - 首頁（照尼泊爾虎棋）：左邊只放包袱巾，標題搬到右欄、在模式上面，整欄對著圖置中。
 * - 對局（照九子棋）：右欄整塊置中在棋盤旁邊（房子＋標題、兩方、狀態、選色盤、操作）。
 */

/** 首頁：外框（lg 換成格線）與各塊的位置 */
export const HOME_GRID = {
  frame: 'lg:grid lg:grid-cols-[minmax(0,30rem)_400px] lg:[grid-template-areas:"art_."_"art_title"_"art_menu"_"art_link"_"art_."] lg:[grid-template-rows:1fr_auto_auto_auto_1fr] lg:content-center lg:justify-center lg:gap-x-14',
  nav: 'lg:mt-6',
};

/** 對局：棋盤與右欄外面那一層（手機是 contents，不影響手機的排法）、右欄本身 */
export const PLAY_GRID = { row: 'contents lg:flex lg:items-center lg:gap-12', aside: 'lg:justify-center' };
