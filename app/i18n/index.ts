import type { Locale } from './locales';
import zhTW, { type Messages } from './messages/zh-TW';
import en from './messages/en';
import ja from './messages/ja';
import ko from './messages/ko';

/**
 * 四份字典全部靜態 import。
 *
 * 動態 import 在 output: export 下沒有好處：每一頁在 build 時就決定了語系，
 * 產出的 HTML 只會帶到自己那一份。反而動態 import 會多一次 await，
 * 讓 server component 變得更難寫。
 */
const ALL: Record<Locale, Messages> = { 'zh-TW': zhTW, en, ja, ko };

export function getMessages(locale: Locale): Messages {
  return ALL[locale];
}

export type { Messages };
