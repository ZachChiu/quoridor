/**
 * 桌機版排法（11/1 Zach：「盲五子棋桌機那樣很怪，好好重新排列一下」），做了兩種給他挑，挑好就把另一種拿掉：
 *
 * - A（照九子棋）：首頁標題在左上、底下包袱巾，右欄的模式從圖的頂排到圖的底；
 *   對局右欄整塊置中在棋盤旁邊（房子＋標題、兩方、狀態、選色盤、操作）。
 * - B（照尼泊爾虎棋）：首頁左邊只放包袱巾，標題搬到右欄、在模式上面，整欄對著圖置中；
 *   對局右欄從棋盤的頂撐到棋盤的底：上面房子＋標題與兩方，中間狀態與選色盤，操作貼齊棋盤底。
 */
export const DESKTOP_LAYOUT: 'A' | 'B' = 'A';

/** 首頁：外框（lg 換成格線）與各塊的位置 */
export const HOME_GRID = DESKTOP_LAYOUT === 'A'
  ? {
      frame: 'lg:grid lg:grid-cols-[26rem_400px] lg:[grid-template-areas:"title_."_"art_menu"_"._link"] lg:content-center lg:justify-center lg:gap-x-12 lg:gap-y-4',
      nav: 'lg:self-stretch lg:[&>*]:flex-1',
    }
  : {
      frame: 'lg:grid lg:grid-cols-[minmax(0,30rem)_400px] lg:[grid-template-areas:"art_."_"art_title"_"art_menu"_"art_link"_"art_."] lg:[grid-template-rows:1fr_auto_auto_auto_1fr] lg:content-center lg:justify-center lg:gap-x-14',
      nav: 'lg:mt-6',
    };

/** 對局：棋盤與右欄外面那一層（手機是 contents，不影響手機的排法）、右欄本身 */
export const PLAY_GRID = DESKTOP_LAYOUT === 'A'
  ? { row: 'contents lg:flex lg:items-center lg:gap-12', aside: 'lg:justify-center' }
  : { row: 'contents lg:flex lg:items-stretch lg:gap-12', aside: 'lg:justify-between' };
