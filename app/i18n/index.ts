import type { Locale } from './locales';
import zhTW, { type Messages } from './messages/zh-TW';
import en from './messages/en';
import ja from './messages/ja';
import ko from './messages/ko';
import zhHans from './messages/zh-Hans';
import th from './messages/th';

/**
 * 所有字典全部靜態 import。
 *
 * 動態 import 在 output: export 下沒有好處：每一頁在 build 時就決定了語系，
 * 產出的 HTML 只會帶到自己那一份。反而動態 import 會多一次 await，
 * 讓 server component 變得更難寫。
 */
const ALL: Record<Locale, Messages> = { 'zh-TW': zhTW, en, ja, ko, 'zh-Hans': zhHans, th };

export function getMessages(locale: Locale): Messages {
  return ALL[locale];
}

export type { Messages };

/**
 * 站名：「牆壁圍棋 Wall Go」，英文只有「Wall Go」。
 *
 * 英文的 `titleLine2` 是**整個不給**的（型別上選填）—— 英文站不需要在
 * Wall Go 旁邊再放一次中文名。先前這裡是用字串模板直接拼：
 *
 *     `${t.home.titleLine1} ${t.home.titleLine2}`.trim()
 *
 * `undefined` 進了模板會變成字面上的 "undefined"，`.trim()` 也救不了 ——
 * 於是整個英文站的 og:site_name 與三個 JSON-LD 節點都是「Wall Go undefined」。
 * 那不會出現在畫面上任何地方，只出現在分享預覽與結構化資料裡，
 * 所以看網站看一輩子也看不到。
 */
export function siteName(locale: Locale): string {
  const t = getMessages(locale);
  return [t.home.titleLine1, t.home.titleLine2].filter(Boolean).join(' ');
}
