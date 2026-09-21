import { getMessages } from './index';
import { FAQ_TEXT } from './content/faq';
import { localePath, type Locale } from './locales';

const SITE = process.env.SITE_URL || 'https://quoridorgame.com';

/**
 * 結構化資料。
 *
 * ── 為什麼是一張 @graph 而不是好幾個 script ────────────────────────
 *
 * 原本每一頁各自吐出兩三個獨立的 JSON-LD 區塊：WebSite 一塊、VideoGame
 * 一塊、BreadcrumbList 一塊。那些區塊彼此**沒有任何關聯** —— 對解析器
 * 而言是三件不相干的事實，它不知道「這個 BreadcrumbList 是這個 WebPage 的」
 * 也不知道「這個 WebPage 在講的就是那個 VideoGame」。
 *
 * 改成單一 `@graph`，每個節點給 `@id`，彼此用 `{'@id': …}` 互指。
 * 同一個實體在整站只定義一次、四個語系共用同一個 `@id`（實體不分語言，
 * 語言由 hreflang 表達），頁面節點則是每頁一個。
 *
 * ── 哪些會有搜尋結果的外觀、哪些不會 ────────────────────────────
 *
 * - **BreadcrumbList**：會顯示，把結果頁的網址列換成階層
 * - **Organization / WebSite**：影響站台識別與 logo
 * - **VideoGame / TVSeries**：沒有對應的 rich result，是給知識圖譜與
 *   語意理解用的。成本零
 * - **FAQPage**：2023 年起 rich result 只留給知名的政府／醫療網站，
 *   我們不會長出摺疊式問答。留著是因為它仍被拿去理解頁面主題
 *
 * ── 一條刻意沒做 ──────────────────────────────────────────────
 *
 * `aggregateRating` 可以長出星等，是這裡唯一還拿得到的顯眼 rich result。
 * 但我們沒有真實評分，編一個出來就是偽造評價 —— 違反規範，也不該做。
 */

type PageKind = 'home' | 'rules' | 'solo';

const id = (fragment: string) => `${SITE}#${fragment}`;

/**
 * 節目。`sameAs` 指向維基百科 —— 那是這個實體最穩定的外部識別。
 * 該頁確認涵蓋 Death Room 這一季，並把 Wall Go 列為 Day 5 的對決項目。
 */
function seriesNode(locale: Locale) {
  const t = getMessages(locale);
  return {
    '@type': 'TVSeries',
    '@id': id('series'),
    name: t.meta.showName,
    alternateName: "The Devil's Plan: Death Room",
    sameAs: ['https://en.wikipedia.org/wiki/The_Devil%27s_Plan'],
  };
}

function organizationNode(locale: Locale) {
  const t = getMessages(locale);
  return {
    '@type': 'Organization',
    '@id': id('organization'),
    name: `${t.home.titleLine1} ${t.home.titleLine2}`.trim(),
    url: SITE,
    logo: { '@type': 'ImageObject', url: `${SITE}/icon-192.png`, width: 192, height: 192 },
  };
}

function websiteNode(locale: Locale) {
  const t = getMessages(locale);
  return {
    '@type': 'WebSite',
    '@id': id('website'),
    url: SITE,
    name: `${t.home.titleLine1} ${t.home.titleLine2}`.trim(),
    alternateName: 'Wall Go',
    publisher: { '@id': id('organization') },
    inLanguage: locale,
  };
}

/** 遊戲本身。整站只有一個，各頁用 `about` 指過來。 */
function gameNode(locale: Locale) {
  const t = getMessages(locale);
  return {
    '@type': 'VideoGame',
    '@id': id('game'),
    name: `${t.home.titleLine1} ${t.home.titleLine2}`.trim(),
    alternateName: 'Wall Go',
    url: SITE + localePath(locale, '/'),
    description: t.meta.ogDescription,
    inLanguage: locale,
    genre: ['Strategy', 'Board Game'],
    gamePlatform: 'Web browser',
    applicationCategory: 'Game',
    operatingSystem: 'Any',
    numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3 },
    playMode: ['SinglePlayer', 'CoOp', 'MultiPlayer'],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD', availability: 'https://schema.org/InStock' },
    publisher: { '@id': id('organization') },
    isBasedOn: { '@id': id('series') },
    image: `${SITE}/og-image.png`,
  };
}

/**
 * 麵包屑。position 從 1 開始且必須連續 —— 跳號會讓整組不被採用。
 * 最後一層仍然給 item，不賭解析器的容忍度。
 */
function breadcrumbNode(locale: Locale, pageUrl: string, trail: { name: string; path: string }[]) {
  const t = getMessages(locale);
  const all = [{ name: t.crumb.home, path: '/' }, ...trail];
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: all.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: SITE + localePath(locale, c.path),
    })),
  };
}

/**
 * 整頁的 JSON-LD。
 *
 * 每一頁都帶上完整的實體節點（Organization / WebSite / VideoGame / TVSeries）。
 * 重複看似浪費，但那是 `@id` 的用意 —— 解析器看到同一個 `@id` 會合併成
 * 同一個實體，而不是當成四個。少帶的話，直接落在 /rules 的爬蟲就不知道
 * 這頁在講什麼遊戲。
 */
export function pageGraph(locale: Locale, kind: PageKind) {
  const t = getMessages(locale);
  const path = kind === 'home' ? '/' : `/${kind}`;
  const pageUrl = SITE + localePath(locale, path);

  const base = [organizationNode(locale), websiteNode(locale), seriesNode(locale), gameNode(locale)];

  if (kind === 'home') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        ...base,
        {
          '@type': 'WebPage',
          '@id': `${pageUrl}#webpage`,
          url: pageUrl,
          name: t.meta.titleDefault,
          description: t.meta.description,
          isPartOf: { '@id': id('website') },
          about: { '@id': id('game') },
          primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE}/og-image.png` },
          inLanguage: locale,
        },
      ],
    };
  }

  const crumbName = kind === 'rules' ? t.rules.metaTitle : t.solo.metaTitle;
  const page = {
    // FAQPage 是 WebPage 的子型別，所以規則頁直接用它當頁面節點，
    // 不另外開一個 —— 同一個網址掛兩個頁面節點會讓解析器無所適從。
    '@type': kind === 'rules' ? 'FAQPage' : 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: kind === 'rules' ? t.rules.metaTitle : t.solo.metaTitle,
    description: kind === 'rules' ? t.rules.metaDescription : t.solo.metaDescription,
    isPartOf: { '@id': id('website') },
    about: { '@id': id('game') },
    breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
    inLanguage: locale,
    ...(kind === 'rules'
      ? {
          mainEntity: FAQ_TEXT[locale].map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : {}),
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [...base, page, breadcrumbNode(locale, pageUrl, [{ name: crumbName, path }])],
  };
}

/** 一律走這個函式輸出，免得每個呼叫端各自寫一次 dangerouslySetInnerHTML。 */
export const ldScript = (data: unknown) => ({
  type: 'application/ld+json',
  dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
});
