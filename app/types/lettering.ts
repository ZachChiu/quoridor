import type { Locale } from '@/i18n/locales';

/**
 * 一個語系的遊戲名字標（scripts/build-name-lettering.mjs 產生，2026-10-25 Zach：「各語系有沒有辦法也找到一樣的字型」）。
 *
 * 名字切成幾段，每段一張單色 SVG（public/ 底下），段與段之間可以換行（日文的中間點後面、韓文的空格）。
 * 長度都是 em，跟著外面的字級走：同一個字級下，跟用那個字型直接打字一樣大。
 */
export type LocalLettering = {
  /** 寫的是哪幾個字。跟現在的名字對不上（改了譯名還沒重新產生）就不用，退回一般文字 */
  text: string;
  /** 每一段的高 */
  h: number;
  /** 同一行裡段與段的間距（空格、字距） */
  gap: number;
  /** 換行之後兩行的間距 */
  lead: number;
  /** w：寬；ml／mr：字的筆畫超出字身的部分（負的外距），沒有就省略 */
  pieces: { src: string; w: number; ml?: number; mr?: number }[];
};

export type NameLettering = Partial<Record<Locale, LocalLettering>>;
