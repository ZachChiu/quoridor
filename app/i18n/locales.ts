/**
 * 支援的語系。
 *
 * zh-TW **不加前綴**：現有網址（/、/rules、/local…）一個都不動，
 * 已經被索引的連結與別人貼出去的連結全部保持有效。
 * 其餘語系走 /en、/ja、/ko 前綴。
 *
 * 也因此 generateStaticParams 不含 zh-TW —— 產出 /zh-TW/ 會和 / 是
 * 一模一樣的內容，那是重複內容，只會稀釋自己。
 */
export const LOCALES = ['zh-TW', 'en', 'ja', 'ko'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'zh-TW';

/** 有網址前綴的語系（= 除了預設語系以外的全部）。 */
export const PREFIXED = LOCALES.filter((l) => l !== DEFAULT_LOCALE) as Exclude<Locale, 'zh-TW'>[];

/** `<html lang>` 用的值。 */
export const HTML_LANG: Record<Locale, string> = {
  'zh-TW': 'zh-Hant-TW',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
};

/** 語言切換器上顯示的名字，一律用該語言自己的說法。 */
export const LOCALE_NAME: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
};

/** 某個語系下，某條路徑的網址。預設語系不加前綴。 */
export function localePath(locale: Locale, path: string): string {
  const clean = path === '/' ? '' : path.replace(/^\/|\/$/g, '');
  if (locale === DEFAULT_LOCALE) return clean ? `/${clean}` : '/';
  return clean ? `/${locale}/${clean}` : `/${locale}`;
}

/** 從 pathname 判斷目前語系。用於語言切換器。 */
export function localeFromPath(pathname: string): Locale {
  const seg = pathname.split('/').filter(Boolean)[0];
  return (LOCALES as readonly string[]).includes(seg) ? (seg as Locale) : DEFAULT_LOCALE;
}

/** 去掉語系前綴後的路徑，例如 /ja/rules → /rules。 */
export function stripLocale(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if ((LOCALES as readonly string[]).includes(parts[0])) parts.shift();
  return '/' + parts.join('/');
}

/**
 * 把路由參數收窄成 Locale。
 *
 * Next 的 params 型別是 `string`，不是我們的聯集 —— 所以一定要在邊界
 * 檢查一次。認不得的值退回預設語系而不是硬轉型：靜態匯出只會產生
 * generateStaticParams 列出的路徑，理論上進不來別的值，
 * 但「理論上進不來」不是可以不檢查的理由。
 */
export function toLocale(value: string): Locale {
  return (LOCALES as readonly string[]).includes(value) ? (value as Locale) : DEFAULT_LOCALE;
}
