import { getMessages } from './index';
import { localePath, type Locale } from './locales';

const SITE = process.env.SITE_URL || 'https://quoridorgame.com';

/**
 * 結構化資料。
 *
 * ── 先講清楚哪些會有效果、哪些不會 ──────────────────────────────
 *
 * Google 的 rich results gallery 目前列的是 Article、Breadcrumb、Event、
 * Product、Video、Organization、Software app… 等二十來種。**VideoGame
 * 與 FAQPage 都不在裡面。**
 *
 * - **FAQPage**：2023 年起 rich result 只留給「知名且權威的政府／醫療網站」。
 *   我們掛了也不會長出摺疊式問答。留著的理由是它仍然被拿去理解頁面主題，
 *   AI 問答類的服務也在讀 —— 但**不要期待搜尋結果的外觀有變化**。
 * - **VideoGame**：沒有對應的 rich result，純粹是給知識圖譜與語意理解用的。
 *   成本是零，留著。
 * - **BreadcrumbList**：**這個真的會顯示**，把結果頁的網址列換成階層。
 *   我們原本沒有，這是唯一一個「加了會在畫面上看得到」的。
 * - **Organization**：支援，影響的是站台識別與 logo。
 *
 * ── 一條刻意沒做的 ──────────────────────────────────────────
 *
 * `SoftwareApplication` 配 `aggregateRating` 可以在結果頁長出星等，
 * 那是這裡唯一還能拿到的顯眼 rich result。**但我們沒有真實評分。**
 * 編一個出來就是偽造評價，違反 Google 的規範（會被整站降權），
 * 也不是我該幫你做的事。哪天真的收集到玩家評分再說。
 */

/** 站台本身。只放在首頁 —— 這是「整個網站是什麼」而不是「這一頁是什麼」。 */
export function organizationLd(locale: Locale) {
  const t = getMessages(locale);
  const name = `${t.home.titleLine1} ${t.home.titleLine2}`.trim();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    alternateName: 'Wall Go',
    url: SITE + localePath(locale, '/'),
    inLanguage: locale,
    publisher: {
      '@type': 'Organization',
      name,
      url: SITE,
      logo: { '@type': 'ImageObject', url: SITE + '/icon-192.png', width: 192, height: 192 },
    },
  };
}

/**
 * 麵包屑。
 *
 * `position` 從 1 開始，而且要連續 —— 跳號或從 0 開始會讓整組不被採用。
 * 最後一層仍然要給 item（自己的網址），Google 對「省略最後一層 item」
 * 的容忍度時好時壞，給了就不用賭。
 */
export function breadcrumbLd(locale: Locale, trail: { name: string; path: string }[]) {
  const t = getMessages(locale);
  const all = [{ name: t.crumb.home, path: '/' }, ...trail];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: SITE + localePath(locale, c.path),
    })),
  };
}

/** 一律走這個函式輸出，免得每個呼叫端各自寫一次 dangerouslySetInnerHTML。 */
export const ldScript = (data: unknown) => ({
  type: 'application/ld+json',
  dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
});
