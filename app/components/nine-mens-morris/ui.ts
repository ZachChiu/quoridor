/** 九子棋彈窗共用的樣式（設定頁、對局頁、說明都用）。介面零件本身在 globals.css 的 .nmm-* */

/** 標題前的段落符要用 Tailwind 的 arbitrary variant 才碰得到 Modal 裡的 h2（直接寫 ¶，不寫跳脫碼：原始碼與執行時的字串要一樣，Tailwind 才產得出這條） */
export const MORRIS_BAND = {
  className: "mx-6 !px-0 pt-7 border-b-2 border-[#c54915]/45 bg-transparent [&_h2]:before:mr-1.5 [&_h2]:before:text-[#c54915] [&_h2]:before:content-['¶']",
  fg: 'text-[#1e120a]',
};
/** 彈窗：拱頂的羊皮紙頁 */
export const MORRIS_PANEL = '!bg-[#eee0c4] !rounded-[50%_50%_10px_10px/3.2rem_3.2rem_10px_10px] shadow-[inset_0_0_0_2px_#c54915]';
