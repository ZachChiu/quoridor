import type { CornerTheme } from '@/components/cornerTheme';
import type { ShareClasses } from '@/components/ShareResultModal';

/**
 * 騎士巡遊的按鈕與彈窗樣式（原本寫在 GameFrame.tsx）。
 *
 * 刻意放在沒有 'use client' 的檔案：伺服器元件從 client 模組匯入的常數會變成 client reference，
 * 塞進 className 就成了一段錯誤訊息文字（見 bagh-chal/styles.ts 的說明）。
 *
 * 按鈕照銅版畫（globals.css 的 .kt-*，Zach 10/22：每款的按鈕要有自己的樣子）：
 * 次要是雙線壓痕框、主要是紅粉筆色、選中填斜線排線。hover 只給滑鼠（觸控會一直停在 :hover）。
 * 墨是 18 世紀銅版畫取樣的 #322e2a、紅粉筆 #834d36（palette.ts）。
 */
export const BTN_ROUND = 'kt-plate grid size-11 shrink-0 place-items-center text-xl disabled:opacity-35';
export const BTN = 'kt-plate flex min-h-12 items-center justify-center gap-2 px-3 py-2 text-sm font-black leading-tight active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35';
export const BTN_PRIMARY = 'kt-chalk flex min-h-12 items-center justify-center gap-2 px-3 py-2 text-sm font-black leading-tight active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35';
/** 騎士巡遊的彈窗：書裡的一頁圖版 —— 紙色面板內側一道銅版雙線，標題下一道雙線（紅粉筆或墨），不用色帶 */
export const MODAL_PANEL = '!rounded-[2px] !bg-[#edddc7] shadow-[inset_0_0_0_1.5px_#322e2a,inset_0_0_0_4px_#edddc7,inset_0_0_0_4.6px_rgb(50_46_42/0.6)]';
export const BAND_CHALK = { className: 'mx-6 !px-0 border-b-[3px] border-double border-[#834d36] bg-transparent', fg: 'text-[#834d36]' };
export const BAND_INK = { className: 'mx-6 !px-0 border-b-[3px] border-double border-[#322e2a]/70 bg-transparent', fg: 'text-[#322e2a]' };

/**
 * 首頁右上角「聯絡我們」與「語言」（見 cornerTheme.ts）：跟遊戲裡的彈窗同一張圖版 ——
 * 圓鈕是雙線壓痕的方鈕（跟對局左上角那幾顆一樣），彈窗是紙色面板、紅粉筆標題下一道雙線，
 * 送出與目前的語言用紅粉筆、其他是壓痕框，文字欄位是紙上一道細墨線。
 * .kt-plate／.kt-chalk 寫在 globals.css 的 utilities 之後，所以會蓋掉元件本身的 rounded-xl。
 */
export const KT_CORNER: CornerTheme = {
  button: 'kt-plate text-[#322e2a]',
  band: BAND_CHALK,
  panelClassName: MODAL_PANEL,
  primary: 'kt-chalk',
  secondary: 'kt-plate',
  field: '!rounded-[1.5px] bg-[#322e2a]/[0.04] text-[#322e2a] shadow-[inset_0_0_0_1.2px_rgb(50_46_42/0.6)] outline-none placeholder:text-[#322e2a]/45 focus:shadow-[inset_0_0_0_2px_#834d36]',
  soft: 'text-[#322e2a]/70',
};

/**
 * 結算分享圖底下的按鈕（暗遮罩上）：同一套銅版零件 —— 再挑戰一次是紅粉筆、分享是紙色壓痕框。
 * 分享圖只有 9:16，沒有比例切換，所以不給切換的樣式。
 */
export const KT_SHARE: Partial<ShareClasses> = {
  primary: 'kt-chalk',
  secondary: 'kt-plate',
  button: 'font-black',
  placeholder: 'bg-[#edddc7]/20',
};
