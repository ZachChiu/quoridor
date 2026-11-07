import { getMessages, siteName } from './index';
import { FAQ_TEXT } from './content/faq';
import { SEASON3_TEXT, SEASON3_UPDATED } from './content/season3';
import { localePath, type Locale } from './locales';
import { KNIGHTS_TOUR, season, trialRules, wallGo } from './routes';
import { SEASONS, gameName } from '@/games/catalog';
import { brandName } from '@/brand';
import { TEXT as KT_TEXT } from '@/games/knights-tour/text';
import { ogImageUrl, OG_SIZE, platformDescription } from './metadata';

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
 * - **BreadcrumbList**：會顯示，把結果頁的網址列換成階層。
 *   Google 的文件**沒有**要求頁面上要有看得見的麵包屑 —— 這裡刻意
 *   只留標記不放導覽：那條導覽在遊戲頁會和左上角的回首頁鈕疊在一起，
 *   而它提供的資訊（你在站台的哪一層）在只有兩層的站台上等於零
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

/**
 * 平台首頁的代表圖：骰子惡魔置中、深色底，三種比例（scripts/og-art/brand-covers.mjs 產生，六個語系共用）。
 * 11/2 Zach 搜「WALL GO」，縮圖是頁面上九子棋的古畫 —— Google 沒被告知代表圖時，從頁面上的 img 挑最像照片的那張
 *（docs/platform-thumbnail.md；Zach 從骰子惡魔、Wall Go 棋盤兩稿挑了骰子惡魔）。
 */
const BRAND_COVERS = [
  { file: 'cover-1x1.png', width: 1200, height: 1200 },
  { file: 'cover-4x3.png', width: 1600, height: 1200 },
  { file: 'cover-16x9.png', width: 1920, height: 1080 },
].map(({ file, ...size }) => ({ '@type': 'ImageObject', url: `${SITE}/brand/${file}`, ...size }));

/** platform＝平台首頁（/），其餘是 Wall Go 的頁面（/wall-go/…） */
type PageKind = 'platform' | 'home' | 'rules' | 'solo';

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
  return {
    '@type': 'Organization',
    '@id': id('organization'),
    name: brandName(locale),
    url: SITE,
    logo: { '@type': 'ImageObject', url: `${SITE}/icon-192.png`, width: 192, height: 192 },
  };
}

function websiteNode(locale: Locale) {
  return {
    '@type': 'WebSite',
    '@id': id('website'),
    url: SITE,
    name: brandName(locale),
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
    name: siteName(locale),
    alternateName: 'Wall Go',
    url: SITE + localePath(locale, wallGo()),
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
    image: ogImageUrl(locale, '/wall-go'),
  };
}

/**
 * 麵包屑。position 從 1 開始且必須連續 —— 跳號會讓整組不被採用。
 * 最後一層仍然給 item，不賭解析器的容忍度。
 */
function breadcrumbNode(locale: Locale, pageUrl: string, trail: { name: string; path: string }[]) {
  const t = getMessages(locale);
  // 平台首頁 → Wall Go → 這一頁
  const all = [{ name: t.crumb.home, path: '/' }, { name: siteName(locale), path: wallGo() }, ...trail];
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
  const path = kind === 'platform' ? '/' : kind === 'home' ? wallGo() : wallGo(`/${kind}`);
  const pageUrl = SITE + localePath(locale, path);

  const base = [organizationNode(locale), websiteNode(locale), seriesNode(locale), gameNode(locale)];

  if (kind === 'platform') {
    // 平台首頁：節目遊戲的總覽。目前能玩的只有 Wall Go，用 hasPart 指過去
    return {
      '@context': 'https://schema.org',
      '@graph': [
        ...base,
        {
          '@type': 'CollectionPage',
          '@id': `${pageUrl}#webpage`,
          url: pageUrl,
          name: `${t.platform.metaTitle} | ${brandName(locale)}`,
          description: platformDescription(locale),
          isPartOf: { '@id': id('website') },
          about: { '@id': id('series') },
          hasPart: { '@id': id('game') },
          // CollectionPage 是 WebPage 的子型別。代表圖用 16:9 那張，image 三種比例都給（分享圖另外是 og:image）
          primaryImageOfPage: BRAND_COVERS[2],
          image: BRAND_COVERS,
          inLanguage: locale,
        },
      ],
    };
  }

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
          primaryImageOfPage: { '@type': 'ImageObject', url: ogImageUrl(locale, '/wall-go'), ...OG_SIZE },
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

/** 第 3 季頁現在能推薦的遊戲：前兩季做好的（第 3 季自己的遊戲之後列在格子裡，不算進「先玩前兩季」） */
export function earlierPlayable() {
  return SEASONS.filter((s) => s.id !== 's3').flatMap((s) => s.games).filter((g) => g.playable && g.look);
}

/** 第 3 季頁的常見問題：{n}、{games} 換成前兩季做好的遊戲，畫面與 FAQPage 讀同一份 */
export function season3Faq(locale: Locale) {
  const games = earlierPlayable();
  const fill = (a: string) => a.replace('{n}', String(games.length)).replace('{games}', games.map((g) => gameName(g, locale)).join(getMessages(locale).platform.listSep));
  return SEASON3_TEXT[locale].faq.map((f) => ({ q: f.q, a: fill(f.a) }));
}

/**
 * 第 3 季頁（docs/season3-page.md）：頁面節點直接是 FAQPage（同規則頁的寫法），about 指向節目，
 * dateModified 跟頁面上的「最後更新」同一個值 —— 開播後每次整理新的一批就改 content/season3.ts 的 SEASON3_UPDATED。
 */
export function season3Graph(locale: Locale) {
  const p = getMessages(locale).platform;
  const pageUrl = SITE + localePath(locale, season('3'));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationNode(locale),
      websiteNode(locale),
      seriesNode(locale),
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: p.seasonMetaTitle.replace('{season}', p.s3),
        description: SEASON3_TEXT[locale].intro,
        isPartOf: { '@id': id('website') },
        about: { '@id': id('series') },
        dateModified: SEASON3_UPDATED,
        inLanguage: locale,
        mainEntity: season3Faq(locale).map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };
}

/**
 * 騎士巡遊規則頁：頁面節點是 FAQPage（同 Wall Go 規則頁的寫法），問答跟畫面上的常見問題同一份（text.ts 的 faq）。
 * 11/7 加「騎士能走完再回到起點嗎」（docs/puzzle-reels.md B），英文帶 closed knight's tour。
 */
export function knightsTourRulesGraph(locale: Locale) {
  const t = KT_TEXT[locale];
  const pageUrl = SITE + localePath(locale, trialRules(KNIGHTS_TOUR));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationNode(locale),
      websiteNode(locale),
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: t.rulesMetaTitle,
        description: t.rulesMetaDescription,
        isPartOf: { '@id': id('website') },
        inLanguage: locale,
        mainEntity: t.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };
}

/** 一律走這個函式輸出，免得每個呼叫端各自寫一次 dangerouslySetInnerHTML。 */
export const ldScript = (data: unknown) => ({
  type: 'application/ld+json',
  dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
});
