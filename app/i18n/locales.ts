/**
 * 支援的語系。
 *
 * zh-TW **不加前綴**：現有網址（/、/rules、/local…）一個都不動，
 * 已經被索引的連結與別人貼出去的連結全部保持有效。
 * 其餘語系走 /zh-Hans、/en、/ja、/ko、/th 前綴。
 *
 * 簡體中文與泰文是依節目的市場加的（2026-09 研究：第二季在新加坡、香港、
 * 台灣、泰國進過 Netflix 前十，兩季都進榜的是泰國與新加坡）。
 * 兩者都是人工翻譯，不是繁簡自動轉換 —— Zach 的決定。
 *
 * 簡中的代號（也就是網址前綴）是 zh-Hans 而不是 zh-CN：zh-CN 是「中國大陸的
 * 中文」，而這一版的主要讀者在新加坡與馬來西亞，不該被標成中國。
 * 以文字系統命名、不標地區，是國際網站常見的中性做法（Zach 提的）。
 *
 * 也因此 generateStaticParams 不含 zh-TW —— 產出 /zh-TW/ 會和 / 是
 * 一模一樣的內容，那是重複內容，只會稀釋自己。
 */
// 順序就是語言選單的順序：繁中、簡中在前（Zach 指定），其餘接著
export const LOCALES = ['zh-TW', 'zh-Hans', 'en', 'ja', 'ko', 'th'] as const;
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
  'zh-Hans': 'zh-Hans',
  th: 'th',
};

/**
 * hreflang 用的語言標記，跟 <html lang> 分開 —— 目標讀者不一樣。
 *
 * 中文用**文字系統**而不是地區：zh-Hant 涵蓋台灣、香港、澳門，
 * zh-Hans 涵蓋新加坡、馬來西亞與中國大陸。寫成 zh-TW／zh-CN 的話，
 * 香港的繁中使用者與新加坡的簡中使用者都不算「對得上」，
 * 搜尋引擎就不會把對應版本推給他們。
 */
export const HREFLANG: Record<Locale, string> = {
  'zh-TW': 'zh-Hant',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
  'zh-Hans': 'zh-Hans',
  th: 'th',
};

/** Open Graph 的 og:locale（語言_地區，底線分隔）。 */
export const OG_LOCALE: Record<Locale, string> = {
  'zh-TW': 'zh_TW',
  en: 'en_US',
  ja: 'ja_JP',
  ko: 'ko_KR',
  'zh-Hans': 'zh_CN',
  th: 'th_TH',
};

/** 語言切換器上顯示的名字，一律用該語言自己的說法。 */
export const LOCALE_NAME: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  'zh-Hans': '简体中文',
  th: 'ไทย',
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
