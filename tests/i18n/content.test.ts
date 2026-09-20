import { describe, it, expect } from 'vitest';
import { LOCALES, DEFAULT_LOCALE, localePath, localeFromPath, stripLocale, toLocale } from '@/i18n/locales';
import { getMessages } from '@/i18n';
import { STEP_TEXT } from '@/i18n/content/steps';
import { FAQ_TEXT } from '@/i18n/content/faq';
import { GAME_TEXT } from '@/i18n/content/game';

/**
 * 多語內容的一致性。
 *
 * 字典本身有型別守衛（漏 key 就編不過），但**陣列內容**型別擋不住：
 * 少一則 FAQ、少一步教學、或某一格留空字串，都能順利編譯過去，
 * 然後在那個語系的頁面上開天窗。這裡把它們鎖住。
 */

const ref = DEFAULT_LOCALE;

describe('教學步驟四語一致', () => {
  it('每個語系的步數都一樣', () => {
    for (const l of LOCALES) {
      expect(STEP_TEXT[l], l).toHaveLength(STEP_TEXT[ref].length);
    }
  });

  it('沒有空字串，也沒有忘記翻譯而留下的佔位符', () => {
    for (const l of LOCALES) {
      STEP_TEXT[l].forEach((s, i) => {
        expect(s.title.trim(), `${l}[${i}].title`).not.toBe('');
        expect(s.body.trim(), `${l}[${i}].body`).not.toBe('');
        expect(s.body, `${l}[${i}].body`).not.toMatch(/TODO|FIXME|XXX/);
      });
    }
  });

  it('非中文語系不該整段照抄中文 —— 那是忘了翻譯', () => {
    for (const l of LOCALES) {
      if (l === ref) continue;
      STEP_TEXT[l].forEach((s, i) => {
        expect(s.title, `${l}[${i}].title`).not.toBe(STEP_TEXT[ref][i].title);
        expect(s.body, `${l}[${i}].body`).not.toBe(STEP_TEXT[ref][i].body);
      });
    }
  });
});

describe('FAQ 四語一致', () => {
  it('每個語系的題數都一樣', () => {
    for (const l of LOCALES) {
      expect(FAQ_TEXT[l], l).toHaveLength(FAQ_TEXT[ref].length);
    }
  });

  it('沒有空字串，也沒有整段照抄', () => {
    for (const l of LOCALES) {
      FAQ_TEXT[l].forEach((f, i) => {
        expect(f.q.trim(), `${l}[${i}].q`).not.toBe('');
        expect(f.a.trim(), `${l}[${i}].a`).not.toBe('');
        if (l !== ref) expect(f.a, `${l}[${i}].a`).not.toBe(FAQ_TEXT[ref][i].a);
      });
    }
  });

  it('英文版不該殘留中文字 —— 這類漏抄用眼睛很難發現', () => {
    const cjk = /[一-鿿]/;
    for (const f of FAQ_TEXT.en) {
      expect(cjk.test(f.q), `en q: ${f.q}`).toBe(false);
      expect(cjk.test(f.a), `en a: ${f.a.slice(0, 30)}`).toBe(false);
    }
    for (const s of STEP_TEXT.en) {
      expect(cjk.test(s.title), `en title: ${s.title}`).toBe(false);
      expect(cjk.test(s.body), `en body: ${s.body.slice(0, 30)}`).toBe(false);
    }
  });

  it('韓文版不該殘留漢字或假名', () => {
    const han = /[一-鿿぀-ヿ]/;
    for (const f of FAQ_TEXT.ko) {
      expect(han.test(f.a), `ko a: ${f.a.slice(0, 30)}`).toBe(false);
    }
  });
});

describe('字典每個語系都齊全', () => {
  it('所有語系都拿得到訊息，且沒有空字串', () => {
    for (const l of LOCALES) {
      const t = getMessages(l);
      for (const [group, entries] of Object.entries(t)) {
        for (const [key, value] of Object.entries(entries)) {
          if (Array.isArray(value)) {
            expect(value.length, `${l}.${group}.${key}`).toBeGreaterThan(0);
          } else {
            expect(String(value).trim(), `${l}.${group}.${key}`).not.toBe('');
          }
        }
      }
    }
  });
});

describe('網址組合', () => {
  it('預設語系不加前綴，其餘加', () => {
    expect(localePath('zh-TW', '/')).toBe('/');
    expect(localePath('zh-TW', '/rules')).toBe('/rules');
    expect(localePath('en', '/')).toBe('/en');
    expect(localePath('ja', '/rules')).toBe('/ja/rules');
  });

  it('從路徑認出語系，認不得就退回預設', () => {
    expect(localeFromPath('/ja/rules')).toBe('ja');
    expect(localeFromPath('/rules')).toBe('zh-TW');
    expect(localeFromPath('/local')).toBe('zh-TW'); // 不能把 /local 誤認成語系
  });

  it('剝掉語系前綴後，切語言能停在同一頁', () => {
    expect(stripLocale('/ko/solo')).toBe('/solo');
    expect(stripLocale('/solo')).toBe('/solo');
    expect(stripLocale('/')).toBe('/');
  });

  it('toLocale 對非預期的值退回預設，而不是硬轉型', () => {
    expect(toLocale('en')).toBe('en');
    expect(toLocale('de')).toBe('zh-TW');
    expect(toLocale('')).toBe('zh-TW');
  });
});

describe('遊戲內 UI 四語一致', () => {
  const keys = (o: object, prefix = ''): string[] =>
    Object.entries(o).flatMap(([k, v]) =>
      typeof v === 'object' && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]
    );
  const flat = (o: object, prefix = ''): [string, string][] =>
    Object.entries(o).flatMap(([k, v]) =>
      typeof v === 'object' && v !== null ? flat(v, `${prefix}${k}.`) : [[`${prefix}${k}`, String(v)] as [string, string]]
    );

  it('四語的 key 完全一致', () => {
    const ref = keys(GAME_TEXT[DEFAULT_LOCALE]).sort();
    for (const l of LOCALES) expect(keys(GAME_TEXT[l]).sort(), l).toEqual(ref);
  });

  it('沒有空字串', () => {
    for (const l of LOCALES) {
      for (const [k, v] of flat(GAME_TEXT[l])) expect(v.trim(), `${l}.${k}`).not.toBe('');
    }
  });

  it('佔位符必須跟中文版一模一樣 —— 少一個就會在畫面上印出空白', () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    const ref = Object.fromEntries(flat(GAME_TEXT[DEFAULT_LOCALE]));
    for (const l of LOCALES) {
      if (l === DEFAULT_LOCALE) continue;
      for (const [k, v] of flat(GAME_TEXT[l])) expect(ph(v), `${l}.${k}`).toEqual(ph(ref[k]));
    }
  });

  /*
    這一條是因為我自己犯過兩次：翻譯到一半留下一個英文單字
    （「コリドールは competition ではなく」「リンクを friends に送ると」）。
    混在整段日文裡用眼睛掃真的看不出來，但讀者一眼就會發現。

    允許清單只放真的會原樣出現的專有名詞。
  */
  it('日文與韓文裡不該混進英文單字', () => {
    const allow = /^(Wall|Go|email|CC|BY|ISC|Netflix|Quoridor|AI|CPU)$/i;
    for (const l of ['ja', 'ko'] as const) {
      for (const [k, v] of flat(GAME_TEXT[l])) {
        // 佔位符 {row} 裡的變數名是給程式看的，不是給人讀的文案
        const words = v.replace(/\{\w+\}/g, '').match(/[A-Za-z]{2,}/g) ?? [];
        const bad = words.filter((w) => !allow.test(w));
        expect(bad, `${l}.${k} → 「${v}」`).toEqual([]);
      }
      for (const s of STEP_TEXT[l]) {
        for (const w of (s.body.match(/[A-Za-z]{2,}/g) ?? [])) expect(allow.test(w), `${l} step: ${w}`).toBe(true);
      }
      for (const f of FAQ_TEXT[l]) {
        for (const w of (f.a.match(/[A-Za-z]{2,}/g) ?? [])) expect(allow.test(w), `${l} faq: ${w}`).toBe(true);
      }
    }
  });
});
