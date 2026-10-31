import { useLocale } from './LocaleProvider';
import type { Locale } from './locales';

/**
 * 每款遊戲自己的文案表（app/games/<id>/text.ts），不塞進 messages/ 那六個大檔：
 * 五款遊戲同時開發時不會互相改到同一份檔案，刪掉一款也只刪一個資料夾。
 *
 * 文案表的寫法有一個硬規定：六個語系的 key 要在**兩格縮排**、依
 * 'zh-TW' → en → ja → ko → 'zh-Hans' → th 的順序排 ——
 * scripts/build-font-subset.mjs 靠這個切出簡中與泰文的字，寫錯會安靜地掉到系統字型。
 *
 *   export const TEXT = {
 *     'zh-TW': { title: '時間拍賣' },
 *     en: { title: 'Time Auction' },
 *     …
 *   } satisfies Record<Locale, unknown>;
 */
export type TextTable<T> = Record<Locale, T>;

/** server 端（metadata、靜態文字）用 */
export function pickText<T>(table: TextTable<T>, locale: Locale): T {
  return table[locale];
}

/** client 元件用 */
export function useTextTable<T>(table: TextTable<T>): T {
  return table[useLocale()];
}

/** 把 '{n} 秒' 這類模板換成值 */
export function fill(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
