import type { Locale } from '@/i18n/locales';

/**
 * 平台名：**骰子惡魔**（2026-10-25 Zach 定案，對應左上那顆長角的藍骰子 logo，public/brand/die-mark.svg）。
 * 頁首的 aria-label、網頁標題的後半、分享圖、og:site_name、結構化資料都吃這裡。
 *
 * 中文讀者看中文名（簡中只換字形）；其他語系一律用英文名 Dice Devil ——
 * 日文的「骰子」是罕用字、泰文與英文頁的標題後面掛一串漢字像亂碼。對照寫在 i18n/glossary.md。
 * 改了要跑 npm run font:subset 與 npm run og:build。
 */
const BRAND_NAME: Record<Locale, string> = {
  'zh-TW': '骰子惡魔',
  en: 'Dice Devil',
  ja: 'Dice Devil',
  ko: 'Dice Devil',
  'zh-Hans': '骰子恶魔',
  th: 'Dice Devil',
};

export const brandName = (locale: Locale): string => BRAND_NAME[locale];

/** 沒有語系可看的地方（各遊戲分支還沒換成 brandName 的舊寫法）用繁中 */
export const BRAND = BRAND_NAME['zh-TW'];
