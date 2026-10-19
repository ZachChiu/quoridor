import { describe, it, expect } from 'vitest';
import { LOCALES } from '@/i18n/locales';
import { TEXT } from '@/games/time-auction/text';

/**
 * 文案表的一致性（同 tests/i18n/content.test.ts 的做法）。型別擋得住漏 key，
 * 擋不住陣列少一條、空字串、忘了翻而照抄、簡中殘留繁體字。
 */
const flat = (o: object, prefix = ''): [string, string][] =>
  Object.entries(o).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? flat(v, `${prefix}${k}.`) : [[`${prefix}${k}`, String(v)] as [string, string]],
  );

describe('時間拍賣文案', () => {
  it('六個語系的 key 一樣，規則條數一樣，沒有空字串', () => {
    const ref = flat(TEXT['zh-TW']).map(([k]) => k).sort();
    for (const l of LOCALES) {
      expect(flat(TEXT[l]).map(([k]) => k).sort(), l).toEqual(ref);
      expect(TEXT[l].rules, l).toHaveLength(TEXT['zh-TW'].rules.length);
      for (const [k, v] of flat(TEXT[l])) expect(v.trim(), `${l}.${k}`).not.toBe('');
    }
  });

  it('模板的佔位字每個語系都有', () => {
    for (const l of LOCALES) {
      const t = TEXT[l];
      expect(t.computer, l).toContain('{n}');
      expect(t.roundOf, l).toContain('{n}');
      expect(t.roundOf, l).toContain('{total}');
      expect(t.youBid, l).toContain('{t}');
      expect(t.maxLeft, l).toContain('{t}');
      expect(t.winOther, l).toContain('{name}');
      expect(t.rules[0], l).toContain('{budget}');
      expect(t.rules[1], l).toContain('{countdown}');
    }
  });

  it('英文、泰文、韓文不該殘留中文字；簡中不該殘留繁體字', () => {
    const cjk = /[一-鿿]/;
    for (const l of ['en', 'th', 'ko'] as const) {
      for (const [k, v] of flat(TEXT[l])) expect(cjk.test(v), `${l}.${k}: ${v}`).toBe(false);
    }
    // 站上共用的那張表，再加上這款遊戲會用到、繁簡不同的字（賣標記餘數給棄間）
    const trad = /[牆圍計謀個這們對戰連線開關發說話設裝錄較點與從為會時選擇區擋離網頁載註冊鍵結復號碼賣標記餘數給棄間]/;
    for (const [k, v] of flat(TEXT['zh-Hans'])) expect(trad.test(v), `zh-Hans.${k}: ${v} → ${v.match(trad)?.[0]}`).toBe(false);
  });
});
