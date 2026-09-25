import { describe, it, expect } from 'vitest';
import { LOCALES, DEFAULT_LOCALE, localePath, localeFromPath, stripLocale, toLocale } from '@/i18n/locales';
import { getMessages, siteName } from '@/i18n';
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

describe('站名', () => {
  /*
    先前是字串模板直接拼 `${titleLine1} ${titleLine2}`，而英文的 titleLine2
    整個不給 —— 拼出來是字面上的 "Wall Go undefined"，`.trim()` 救不了。
    那個字串進了 og:site_name 與三個 JSON-LD 節點，但不出現在畫面上任何
    地方，所以看網站永遠看不到。
  */
  it('沒有任何語系拼出 undefined / null', () => {
    for (const l of LOCALES) {
      expect(siteName(l), l).not.toMatch(/undefined|null/);
    }
  });

  it('每個語系都以 Wall Go 結尾 —— 那是不翻譯的專有名詞', () => {
    for (const l of LOCALES) {
      expect(siteName(l), l).toMatch(/Wall Go$/);
    }
  });

  it('中日韓帶自己的譯名，英文只有 Wall Go', () => {
    expect(siteName('en')).toBe('Wall Go');
    for (const l of LOCALES.filter((x) => x !== 'en')) {
      expect(siteName(l).length, l).toBeGreaterThan('Wall Go'.length);
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

  /*
    反向的漏法：別的語言的**文字系統**混進來。

    用瀏覽器把四語系每一頁的畫面文字掃過一遍，唯一跨語系出現的只有
    語言選單自己的名字（繁體中文／English／日本語／한국어）—— 那是刻意的，
    看不懂當前語言的人才找得到自己那一項，所以 LOCALE_NAME 不在檢查範圍內。
    其餘任何一個字混進去都是翻譯漏了，而那種漏法讀者一眼就看得出來。

    這一組把同樣的檢查搬到字典層級，不需要瀏覽器也擋得住。
  */
  const HAN = /[\u4e00-\u9fff]/;
  const KANA = /[\u3040-\u30ff]/;
  const HANGUL = /[\uac00-\ud7af]/;

  const everyString = (l: (typeof LOCALES)[number]) => [
    ...flat(getMessages(l)),
    ...flat(GAME_TEXT[l]),
    ...STEP_TEXT[l].flatMap((s, i) => [[`step${i}.title`, s.title], [`step${i}.body`, s.body]] as [string, string][]),
    ...FAQ_TEXT[l].flatMap((f, i) => [[`faq${i}.q`, f.q], [`faq${i}.a`, f.a]] as [string, string][]),
  ];

  it('英文字典裡不該有任何中日韓文字', () => {
    for (const [k, v] of everyString('en')) {
      expect(HAN.test(v), `en.${k} → 「${v}」`).toBe(false);
      expect(KANA.test(v), `en.${k} → 「${v}」`).toBe(false);
      expect(HANGUL.test(v), `en.${k} → 「${v}」`).toBe(false);
    }
  });

  it('韓文字典裡不該殘留漢字或假名', () => {
    for (const [k, v] of everyString('ko')) {
      expect(HAN.test(v), `ko.${k} → 「${v}」`).toBe(false);
      expect(KANA.test(v), `ko.${k} → 「${v}」`).toBe(false);
    }
  });

  it('日文字典裡不該出現諺文', () => {
    for (const [k, v] of everyString('ja')) {
      expect(HANGUL.test(v), `ja.${k} → 「${v}」`).toBe(false);
    }
  });

  it('中文字典裡不該出現假名或諺文', () => {
    for (const [k, v] of everyString('zh-TW')) {
      expect(KANA.test(v), `zh-TW.${k} → 「${v}」`).toBe(false);
      expect(HANGUL.test(v), `zh-TW.${k} → 「${v}」`).toBe(false);
    }
  });
});

describe('教學的圖與文字要一一對應', () => {
  it('每個語系的文字數量都等於盤面圖的數量', async () => {
    const { STEPS } = await import('@/components/tutorialSteps');
    for (const l of LOCALES) {
      expect(STEP_TEXT[l].length, `${l} 的文字數與圖數不符`).toBe(STEPS.length);
    }
  });

  it('兩人／三人規則不同的步驟，四語都要標出來', () => {
    // 開局（index 1）與破牆（index 6）在兩人局與三人局不一樣。
    // 混在同一段裡讓讀者自己分辨適用於誰，是這份教學原本的問題。
    const marks: Record<string, [string, string]> = {
      'zh-TW': ['兩人：', '三人：'],
      en: ['2 players:', '3 players:'],
      ja: ['2人：', '3人：'],
      ko: ['2인:', '3인:'],
    };
    for (const l of LOCALES) {
      for (const i of [1, 6]) {
        const body = STEP_TEXT[l][i].body;
        for (const m of marks[l]) {
          expect(body, `${l} 第 ${i + 1} 步少了「${m}」`).toContain(m);
        }
      }
    }
  });
});
