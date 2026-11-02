import type { CornerTheme } from '@/components/cornerTheme';
import type { ShareClasses } from '@/components/ShareResultModal';
import { MCL_BAND, MCL_PANEL } from './palette';

/**
 * 平衡播棋的按鈕與彈窗樣式（零件本身在 globals.css 的 .mcl-*：金箔、畫了格線的羊皮紙條、切角）。
 *
 * 刻意放在沒有 'use client' 的檔案（原因同 bagh-chal/styles.ts）：伺服器元件從 client 模組匯入的常數會變成
 * client reference，塞進 className 就成了一段錯誤訊息文字。
 *
 * 共用元件（聯絡我們、語言、分享圖）裡的按鈕寫死了 rounded-xl／rounded-full，這裡一律 !rounded-none ——
 * 這款的牌子是鑄出來的金屬牌（切角），圓角會從切角裡透出來。
 */

/** 角落的小鈕：切角的淡墨片（金箔留給主要動作） */
export const MCL_ROUND = 'mcl-cut grid size-11 shrink-0 place-items-center bg-[rgb(var(--mcl-ink-rgb)/0.07)] text-xl text-ink-soft transition fine:hover:bg-[rgb(var(--mcl-ink-rgb)/0.12)]';
/** 寬的次要鈕：一條畫了格線的羊皮紙（上下各一道金線、一道墨線） */
export const MCL_WIDE = 'mcl-cloth flex h-11 items-center justify-center gap-2 text-sm font-black';

/**
 * 聯絡我們、語言的圓鈕與彈窗（見 cornerTheme.ts）：跟這款自己的說明、離開彈窗同一塊切角的亮羊皮紙（MCL_PANEL），
 * 標題底下一道雙線（MCL_BAND，不用色帶）；主要鈕與目前的語言是金箔、其他是羊皮紙條；欄位是深一階的紙色，
 * 聚焦時內側一圈深金（切角會把外側的 ring 切掉，所以用 inset）。
 */
export const MCL_CORNER: CornerTheme = {
  button: '!rounded-none mcl-cut bg-[rgb(var(--mcl-ink-rgb)/0.07)] text-ink-soft fine:hover:bg-[rgb(var(--mcl-ink-rgb)/0.12)]',
  band: MCL_BAND,
  panelClassName: MCL_PANEL,
  primary: '!rounded-none mcl-plaque',
  secondary: '!rounded-none mcl-cloth',
  field: '!rounded-none mcl-cut bg-[var(--mcl-cloth)] text-[var(--mcl-ink)] outline-none ring-inset ring-[var(--mcl-brass-deep)] placeholder:text-[rgb(var(--mcl-ink-soft-rgb)/0.7)] focus:ring-2',
  soft: 'text-[var(--mcl-ink-soft)]',
};

/**
 * 結算分享圖底下的按鈕（暗遮罩上）：再來一局是金箔；分享是一條盤面的暗底（格線換成金線＋亮羊皮紙，.mcl-wood）；
 * 比例切換是一片切角的木頭，選中的那個是小黃銅牌。都不透明 —— 半透明的話遮罩底下的盤面會透出來。
 */
export const MCL_SHARE: Partial<ShareClasses> = {
  primary: 'mcl-plaque',
  secondary: 'mcl-wood',
  toggle: '!rounded-none mcl-cut bg-[var(--mcl-wood)]',
  toggleOn: '!rounded-none mcl-plaque is-small',
  toggleOff: '!rounded-none text-[rgb(var(--mcl-cloth-light-rgb)/0.75)] fine:hover:text-[var(--mcl-cloth-light)]',
  button: 'font-black',
  placeholder: 'bg-[rgb(var(--mcl-cloth-rgb)/0.25)]',
};
