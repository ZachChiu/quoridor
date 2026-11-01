import type { CornerTheme } from '@/components/cornerTheme';
/** 九子棋彈窗共用的樣式（設定頁、對局頁、說明都用）。介面零件本身在 globals.css 的 .nmm-* */

/** 標題前的段落符要用 Tailwind 的 arbitrary variant 才碰得到 Modal 裡的 h2（直接寫 ¶，不寫跳脫碼：原始碼與執行時的字串要一樣，Tailwind 才產得出這條） */
export const MORRIS_BAND = {
  className: "mx-6 !px-0 pt-7 border-b-2 border-[#c54915]/45 bg-transparent [&_h2]:before:mr-1.5 [&_h2]:before:text-[#c54915] [&_h2]:before:content-['¶']",
  fg: 'text-[#1e120a]',
};
/** 彈窗：拱頂的羊皮紙頁 */
export const MORRIS_PANEL = '!bg-[#eee0c4] !rounded-[50%_50%_10px_10px/3.2rem_3.2rem_10px_10px] shadow-[inset_0_0_0_2px_#c54915]';

/**
 * 首頁右上角的聯絡、語言彈窗也是拱頂的羊皮紙頁（Zach 10/24：九子棋有些彈窗打開還是舊的 Wall Go 樣式）。
 * 圓鈕是羊皮紙底、內側一道朱紅細線（跟 .nmm-arch 的線一樣）；主要鈕是朱紅的小拱、其他是羊皮紙小拱。
 */
export const MORRIS_CORNER: CornerTheme = {
  button: 'bg-[#eee0c4] text-[#1e120a] shadow-[inset_0_0_0_2px_#c54915,inset_0_0_0_4px_#eee0c4,inset_0_0_0_5px_rgb(197_73_21/0.35)] hover:bg-[#e3c99c]',
  band: MORRIS_BAND,
  panelClassName: MORRIS_PANEL,
  primary: 'nmm-arch is-small is-red',
  secondary: 'nmm-arch is-small',
  field: 'bg-[#e3c99c]/45 text-[#1e120a] outline-none ring-[#c54915] focus:ring-2',
  soft: 'text-[#1e120a]/70',
};
