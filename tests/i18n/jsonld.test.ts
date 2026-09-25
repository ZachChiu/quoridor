import { describe, it, expect } from 'vitest';
import { LOCALES } from '@/i18n/locales';
import { pageGraph } from '@/i18n/jsonld';
import { FAQ_TEXT } from '@/i18n/content/faq';

/**
 * 結構化資料的完整性。
 *
 * JSON-LD 壞掉的方式很安靜：`{'@id': '…#game'}` 指到一個不存在的節點，
 * 檔案仍是合法 JSON、build 照過、頁面照顯示 —— 只有解析器知道那是一個
 * 懸空的引用，而它的處理通常是整組不採用。眼睛看不出來，所以用測試守。
 */
const KINDS = ['home', 'rules', 'solo'] as const;

type Node = Record<string, unknown> & { '@id'?: string; '@type'?: string };

function graphOf(locale: (typeof LOCALES)[number], kind: (typeof KINDS)[number]) {
  const g = pageGraph(locale, kind) as { '@context': string; '@graph': Node[] };
  return g;
}

/** 走遍整棵物件，收集所有 `{'@id': x}` 形式的**引用**（不含節點自己的 @id）。 */
function refsIn(value: unknown, isRoot = false): string[] {
  if (Array.isArray(value)) return value.flatMap((v) => refsIn(v));
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    const keys = Object.keys(o);
    // 只有 @id 一個鍵 → 這是引用，不是節點
    if (!isRoot && keys.length === 1 && keys[0] === '@id') return [String(o['@id'])];
    return keys.filter((k) => k !== '@id').flatMap((k) => refsIn(o[k]));
  }
  return [];
}

describe('JSON-LD 圖的完整性', () => {
  for (const locale of LOCALES) {
    for (const kind of KINDS) {
      it(`${locale} / ${kind}：每個 @id 引用都指得到真實節點`, () => {
        const g = graphOf(locale, kind);
        const defined = new Set(g['@graph'].map((n) => n['@id']).filter(Boolean) as string[]);
        const refs = g['@graph'].flatMap((n) => refsIn(n, true));
        const dangling = [...new Set(refs)].filter((r) => !defined.has(r));
        expect(dangling, `懸空引用（圖裡沒有這些節點）`).toEqual([]);
      });

      it(`${locale} / ${kind}：@id 不重複`, () => {
        const ids = graphOf(locale, kind)['@graph'].map((n) => n['@id']);
        expect(new Set(ids).size, `重複的 @id：${ids}`).toBe(ids.length);
      });

      it(`${locale} / ${kind}：每個節點都有 @type`, () => {
        for (const n of graphOf(locale, kind)['@graph']) {
          expect(n['@type'], JSON.stringify(n).slice(0, 80)).toBeTruthy();
        }
      });
    }
  }

  it('實體的 @id 不隨語系改變 —— 四個語系講的是同一個遊戲', () => {
    const idsFor = (l: (typeof LOCALES)[number]) =>
      graphOf(l, 'home')['@graph']
        .map((n) => n['@id']!)
        .filter((x) => !x.includes('#webpage') && !x.includes('#breadcrumb'))
        .sort();
    const ref = idsFor('zh-TW');
    for (const l of LOCALES) expect(idsFor(l), l).toEqual(ref);
  });

  it('頁面節點的 @id 隨語系改變 —— 那是四個不同的網址', () => {
    const pageId = (l: (typeof LOCALES)[number]) =>
      graphOf(l, 'rules')['@graph'].find((n) => n['@id']!.includes('#webpage'))!['@id'];
    const all = LOCALES.map(pageId);
    expect(new Set(all).size).toBe(LOCALES.length);
  });

  it('麵包屑的 position 從 1 開始且連續，每一項都有 item 與 name', () => {
    for (const locale of LOCALES) {
      for (const kind of ['rules', 'solo'] as const) {
        const bc = graphOf(locale, kind)['@graph'].find((n) => n['@type'] === 'BreadcrumbList');
        expect(bc, `${locale}/${kind} 沒有 BreadcrumbList`).toBeTruthy();
        const items = bc!.itemListElement as { position: number; name: string; item: string }[];
        expect(items.map((x) => x.position)).toEqual(items.map((_, i) => i + 1));
        for (const x of items) {
          expect(x.name.trim(), `${locale}/${kind}`).not.toBe('');
          expect(x.item, `${locale}/${kind}`).toMatch(/^https?:\/\//);
        }
      }
    }
  });

  it('規則頁的 FAQ 題數與畫面上的一致 —— 標記與內容不符會整組不被採用', () => {
    for (const locale of LOCALES) {
      const page = graphOf(locale, 'rules')['@graph'].find((n) => n['@type'] === 'FAQPage')!;
      const qs = page.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
      expect(qs).toHaveLength(FAQ_TEXT[locale].length);
      qs.forEach((q, i) => {
        expect(q.name).toBe(FAQ_TEXT[locale][i].q);
        expect(q.acceptedAnswer.text).toBe(FAQ_TEXT[locale][i].a);
      });
    }
  });

  it('沒有 aggregateRating —— 我們沒有真實評分，掛上去就是偽造評價', () => {
    for (const locale of LOCALES) {
      for (const kind of KINDS) {
        const json = JSON.stringify(graphOf(locale, kind));
        expect(json).not.toContain('aggregateRating');
        expect(json).not.toContain('ratingValue');
      }
    }
  });
});
