import { describe, it, expect } from 'vitest';
import { TEXT } from '@/games/nine-mens-morris/text';
import { LOCALES } from '@/i18n/locales';

/** 攤平成 { 'hint.place': '…', 'rules.0': '…' } 方便逐條比對 */
function flat(o: unknown, prefix = ''): Record<string, string> {
  if (typeof o === 'string') return { [prefix]: o };
  return Object.entries(o as Record<string, unknown>).reduce<Record<string, string>>(
    (acc, [k, v]) => ({ ...acc, ...flat(v, prefix ? `${prefix}.${k}` : k) }), {});
}
const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');

describe('九子棋文案', () => {
  const base = flat(TEXT['zh-TW']);

  it('六個語系的 key 一樣、規則條數一樣、沒有空字串', () => {
    for (const l of LOCALES) {
      const t = flat(TEXT[l]);
      expect(Object.keys(t).sort(), l).toEqual(Object.keys(base).sort());
      for (const [k, v] of Object.entries(t)) expect(v.trim(), `${l} ${k}`).not.toBe('');
    }
  });

  it('{side}、{n} 這些代入的位置每個語系都有', () => {
    for (const l of LOCALES) {
      const t = flat(TEXT[l]);
      for (const [k, v] of Object.entries(base)) expect(placeholders(t[k]), `${l} ${k}`).toBe(placeholders(v));
    }
  });

  it('簡中不該殘留繁體字', () => {
    // 跟 tests/i18n/content.test.ts 同一張表，再加上這款會用到的字
    const re = /[牆圍計謀個這們對戰連線開關發說話設裝錄較點與從為會時選擇區擋離網頁載註冊鍵結復號碼盤輪顆雙節規則電腦難換來動後飛贏輸標樣現續鄰條]/;
    for (const [k, v] of Object.entries(flat(TEXT['zh-Hans']))) expect(re.test(v), `zh-Hans ${k}: ${v.match(re)?.[0]}`).toBe(false);
  });

  it('泰文不該殘留中文字', () => {
    for (const [k, v] of Object.entries(flat(TEXT.th))) expect(/[一-鿿]/.test(v), `th ${k}`).toBe(false);
  });
});
