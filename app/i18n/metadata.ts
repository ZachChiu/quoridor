import type { Metadata } from 'next';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getMessages } from './index';
import { PLAYABLE, gameName, seasonById } from '@/games/catalog';
import { brandName } from '@/brand';
import { LOCALES, DEFAULT_LOCALE, HREFLANG, OG_LOCALE, localePath, type Locale } from './locales';

const SITE = process.env.SITE_URL || 'https://quoridorgame.com';

/**
 * 網址 → 分享圖的頁面代號。多一頁要記得同時加進 scripts/build-og-images.mjs 的 PAGES。
 * `/` 是平台首頁（platform）；Wall Go 首頁搬到 `/wall-go` 後沿用代號 home，分享圖檔名不必改。
 */
const PAGE_KEY = {
  '/': 'platform',
  // 季目錄頁先用平台首頁那張分享圖（圖上是節目名＋「遊戲線上玩」，三季都說得通）
  '/season/1': 'platform', '/season/2': 'platform', '/season/3': 'platform',
  '/wall-go': 'home', '/wall-go/rules': 'rules', '/wall-go/solo': 'solo',
  '/wall-go/local': 'local', '/wall-go/online': 'online', '/wall-go/replay': 'replay',
  // Bagh Chal 的子頁先共用遊戲首頁那張分享圖（圖上是遊戲名，子頁之間差別不大）
  '/bagh-chal': 'bagh-chal', '/bagh-chal/rules': 'bagh-chal', '/bagh-chal/solo': 'bagh-chal', '/bagh-chal/local': 'bagh-chal', '/bagh-chal/online': 'bagh-chal',
} as const;
export type PagePath = keyof typeof PAGE_KEY;

/**
 * 分享圖每一頁每一語系都不同，檔案由 `npm run og:build` 產生。
 *
 * 先前六頁共用一張 `/og-image.png`，而那張圖是**中文的** —— 英日韓的人
 * 分享出去，預覽圖上是一排中文字。對局類的三頁更慘：它們根本沒有
 * og:image，連結貼進聊天室只有一行小字，而邀請連結正是這站最常被貼的東西。
 */
export const OG_SIZE = { width: 1200, height: 630 } as const;

/**
 * 那一頁那個語系的分享圖網址。JSON-LD 也吃這個，兩邊才不會各指一張。
 *
 * 網址帶圖片內容的雜湊（`?v=…`）：LINE、Facebook 這類平台依網址快取預覽圖，
 * 一放就是好幾天。檔名不變的話，改了圖聊天室裡還是舊的（Zach 在 LINE 上看到）。
 * 用內容雜湊而不是版號 —— 圖真的變了網址才變，沒變的圖不必讓平台重抓。
 * 只在建置時執行（metadata 與 JSON-LD 都是 server 端），可以直接讀檔。
 */
const ogHashes = new Map<string, string>();
function ogHash(file: string): string {
  let h = ogHashes.get(file);
  if (!h) {
    h = createHash('sha256').update(readFileSync(join(process.cwd(), 'public', 'og', file))).digest('hex').slice(0, 10);
    ogHashes.set(file, h);
  }
  return h;
}
export function ogImageUrl(locale: Locale, path: PagePath): string {
  return ogFileUrl(`${PAGE_KEY[path]}-${locale}.png`);
}

function ogFileUrl(file: string): string {
  return `${SITE}/og/${file}?v=${ogHash(file)}`;
}

/**
 * 第二批五款的分享圖：`public/og/<遊戲>-<語系>.png`（那款的分支用 scripts/og-games/<遊戲>.mjs 產生），
 * 規則頁、連線頁跟首頁同一張。還沒有的話用平台首頁那張（10/25 之前五款都是這樣）。
 */
function trialOgUrl(locale: Locale, path: string): string {
  const file = `${path.split('/')[1]}-${locale}.png`;
  return existsSync(join(process.cwd(), 'public', 'og', file)) ? ogFileUrl(file) : ogImageUrl(locale, '/');
}

function shareImage(locale: Locale, path: PagePath) {
  const t = getMessages(locale);
  const url = ogImageUrl(locale, path);
  return {
    og: [{ url, ...OG_SIZE, alt: t.meta.ogAlt }],
    twitter: [url],
  };
}

/**
 * 平台首頁的描述，結尾列出現在能玩的遊戲（10/25 大腦：寫上線當天真的能玩的，每上一款就補上去）。
 * 從 catalog 的 PLAYABLE 帶出來 —— 各款的分支打開自己那一行就自動列進來，不必五條分支都改同一句文案。
 * **Wall Go 一定排第一個**：搬家前九成的搜尋點擊是找 Wall Go 的。名字寫當地叫法＋英文（牆壁圍棋 Wall Go）。
 */
export function platformDescription(locale: Locale): string {
  const games = [...PLAYABLE].sort((a, b) => Number(b.name === 'Wall Go') - Number(a.name === 'Wall Go'));
  const names = games.map((g) => {
    const local = gameName(g, locale);
    return local === g.name ? g.name : `${local} ${g.name}`;
  });
  return getMessages(locale).platform.metaDescription.replace('{games}', joinNames(locale, names));
}

/**
 * 中日文用頓號、韓文用逗號；英文、泰文照 Intl 的列舉。泰文的連接詞 Intl 不留空格，跟英文名黏成「Wall GoและBagh Chal」，
 * 所以前後補空格（連接詞不寫在程式碼裡：寫了字型子集會把泰文字算進繁中那份）
 */
function joinNames(locale: Locale, names: string[]): string {
  if (locale === 'en') return new Intl.ListFormat('en', { type: 'conjunction' }).format(names);
  if (locale === 'th') {
    return new Intl.ListFormat('th', { type: 'conjunction' }).formatToParts(names)
      .map((p) => (p.type === 'element' ? p.value : p.value.trim() ? ` ${p.value.trim()} ` : ', '))
      .join('');
  }
  if (locale === 'ko') return names.join(', ');
  return names.join('、');
}

function copy(locale: Locale, path: PagePath) {
  const t = getMessages(locale);
  switch (path) {
    case '/':
      return { title: undefined, description: platformDescription(locale), ogTitle: t.platform.ogTitle, ogDescription: t.platform.ogDescription };
    case '/season/1':
    case '/season/2':
    case '/season/3':
      return seasonCopy(locale, path.slice(-1) as '1' | '2' | '3');
    case '/bagh-chal':
      return { title: t.baghChal.metaTitle, description: t.baghChal.metaDescription, ogTitle: t.baghChal.ogTitle, ogDescription: t.baghChal.ogDescription };
    case '/bagh-chal/rules':
      return { title: t.baghChal.rulesMetaTitle, description: t.baghChal.rulesMetaDescription, ogTitle: t.baghChal.rulesMetaTitle, ogDescription: t.baghChal.rulesMetaDescription };
    case '/bagh-chal/solo':
      return { title: `${t.baghChal.title} · ${t.baghChal.vsAi}`, description: t.baghChal.metaDescription, ogTitle: t.baghChal.ogTitle, ogDescription: t.baghChal.ogDescription };
    case '/bagh-chal/online':
      return { title: `${t.baghChal.title} · ${t.baghChal.onlineTitle}`, description: t.baghChal.metaDescription, ogTitle: t.baghChal.ogTitle, ogDescription: t.baghChal.ogDescription };
    case '/bagh-chal/local':
      return { title: `${t.baghChal.title} · ${t.baghChal.local}`, description: t.baghChal.metaDescription, ogTitle: t.baghChal.ogTitle, ogDescription: t.baghChal.ogDescription };
    case '/wall-go/rules':
      return { title: t.rules.metaTitle, description: t.rules.metaDescription, ogTitle: t.rules.ogTitle, ogDescription: t.rules.ogDescription };
    case '/wall-go/solo':
      return { title: t.solo.metaTitle, description: t.solo.metaDescription, ogTitle: t.solo.ogTitle, ogDescription: t.solo.ogDescription };
    case '/wall-go/replay':
      return { title: t.replay.metaTitle, description: t.replay.metaDescription, ogTitle: t.replay.metaTitle, ogDescription: t.replay.metaDescription };
    case '/wall-go/local':
      return { title: t.local.metaTitle, description: t.meta.description, ogTitle: t.local.metaTitle, ogDescription: t.meta.ogDescription };
    case '/wall-go/online':
      return { title: t.online.metaTitle, description: t.meta.description, ogTitle: t.online.metaTitle, ogDescription: t.meta.ogDescription };
    default:
      return { title: undefined, description: t.meta.description, ogTitle: t.meta.ogTitle, ogDescription: t.meta.ogDescription };
  }
}

/** 季目錄頁的標題與描述：描述裡列出那一季的遊戲名（搜「魔鬼的計謀 第二季 遊戲」的人要找的就是這張清單） */
function seasonCopy(locale: Locale, n: '1' | '2' | '3') {
  const p = getMessages(locale).platform;
  const s = seasonById(n);
  const name = { s1: p.s1, s2: p.s2, s3: p.s3 }[s.id];
  const title = p.seasonMetaTitle.replace('{season}', name);
  const description = s.games.length
    ? p.seasonMetaDescription.replace('{season}', name).replace('{n}', String(s.games.length)).replace('{names}', s.games.map((g) => gameName(g, locale)).join(p.listSep))
    : p.seasonMetaDescriptionEmpty.replace('{season}', name);
  return { title, description, ogTitle: title, ogDescription: description };
}

function openGraph(locale: Locale, path: PagePath) {
  const c = copy(locale, path);
  const img = shareImage(locale, path);
  return {
    openGraph: {
      type: 'website' as const,
      locale: OG_LOCALE[locale],
      url: SITE + localePath(locale, path),
      title: c.ogTitle,
      description: c.ogDescription,
      siteName: brandName(locale),
      images: img.og,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: c.ogTitle,
      description: c.ogDescription,
      images: img.twitter,
    },
  };
}

/**
 * 一款遊戲的 favicon 一組：public/icons/<id>.svg（或 <id>-32.png）、<id>.ico、<id>-192.png。
 * 加到主畫面的圖示（apple）一律是平台的：從哪一款加，打開都是平台首頁（i18n/pwa.ts）。
 * 頁面的 icons 會整組蓋掉 layout 的，所以這裡要再寫一次，不能省略
 */
function iconSet(id: string, svg = false): Metadata['icons'] {
  return {
    icon: [
      svg ? { url: `/icons/${id}.svg`, type: 'image/svg+xml' } : { url: `/icons/${id}-32.png`, type: 'image/png', sizes: '32x32' },
      { url: `/icons/${id}.ico`, sizes: '16x16 32x32' },
      { url: `/icons/${id}-192.png`, type: 'image/png', sizes: '192x192' },
    ],
    shortcut: `/icons/${id}.ico`,
    apple: '/apple-touch-icon.png',
  };
}

/**
 * 各遊戲自己的 favicon（2026-10-24 Zach：平台版包含虎羊棋，各頁 favicon 要放好）。
 * 全站預設（shell.tsx 的 baseMetadata、/favicon.*）是平台的骰子惡魔（平面那版，16px 下立體那版糊成一團）；
 * Wall Go 沿用原本那兩個人、尼泊爾虎棋是老虎圓牌。頁面的 icons 會整組蓋掉 layout 的，所以每款給完整一組。
 * 第二批五款還沒有自己的，沿用平台的；各自的分支要換時把自己那行打開。一行一款、中間空一行：
 * 各分支只改自己那行，依序合併才不會衝突（同 catalog.ts）。
 */
const GAME_ICONS: Record<string, Metadata['icons'] | undefined> = {
  'wall-go': iconSet('wall-go', true),

  'bagh-chal': iconSet('bagh-chal'),

  'nine-mens-morris': undefined,

  'time-auction': undefined,

  'blind-gomoku': undefined,

  'knights-tour': iconSet('knights-tour', true),

  'balance-mancala': undefined,
};
function gameIcons(path: string): Pick<Metadata, 'icons'> {
  const icons = GAME_ICONS[path.split('/')[1]];
  return icons ? { icons } : {};
}

/** Wall Go 以外的遊戲：根 layout 的標題格式是「… | 牆壁圍棋 Wall Go」，改接平台名 */
function otherGameTitle(locale: Locale, path: PagePath, title: string | undefined): Metadata {
  return path.startsWith('/bagh-chal') && title ? { title: { absolute: `${title} | ${brandName(locale)}` } } : {};
}

/**
 * 會被索引的頁面（首頁、規則、單人）的 metadata，含 hreflang。
 *
 * hreflang 必須**互相指到彼此**（包含自己），少一邊 Google 就不承認這組
 * 是同一份內容的不同語言版本，於是四個語系會被當成四個不相干的頁面
 * 互相競爭。這是多語 SEO 最常見的失敗。
 *
 * x-default 指向 /en：zh-TW 佔住了無前綴的網址，但語言對不上的訪客
 * 落在英文比落在中文合理。
 */
export function localeMetadata(locale: Locale, path: PagePath): Metadata {
  const t = getMessages(locale);
  const languages = Object.fromEntries(
    LOCALES.map((l) => [HREFLANG[l], SITE + localePath(l, path)])
  ) as Record<string, string>;
  languages['x-default'] = SITE + localePath('en', path);
  const c = copy(locale, path);

  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: SITE + localePath(locale, path), languages },
    ...openGraph(locale, path),
    // 首頁在各語系用自己的完整標題，不套 template：
    // 平台首頁是「節目遊戲整理｜平台名」，Wall Go 首頁維持原本的標題
    ...(path === '/' ? { title: { absolute: `${t.platform.metaTitle} | ${brandName(locale)}` } } : {}),
    ...(path === '/wall-go' ? { title: { absolute: t.meta.titleDefault } } : {}),
    // 季目錄頁同平台首頁：接平台名，不套 Wall Go 的標題格式
    ...(path.startsWith('/season/') ? { title: { absolute: `${c.title} | ${brandName(locale)}` } } : {}),
    // 其他遊戲不套 Wall Go 的標題格式（「… | 牆壁圍棋 Wall Go」），接平台名
    ...otherGameTitle(locale, path, c.title),
    ...gameIcons(path),
    ...(locale === DEFAULT_LOCALE ? {} : {}),
  };
}

/**
 * 對局類頁面（/local、/online、/replay）的 metadata。
 *
 * 這三頁一律 noindex —— 進去就是開局畫面，除了 sr-only 的 h1 之外沒有
 * 可讀內容，收錄了也只是空殼；`/replay` 更是每個網址都是不同的棋譜，
 * 對搜尋引擎而言是無限多個「同一頁」。
 *
 * **但它們還是要有分享圖。** noindex 管的是搜尋結果，og 管的是把連結
 * 貼進聊天室時長什麼樣，兩件事不相干 —— 而連線的邀請連結正是這站
 * 最常被貼出去的東西。
 *
 * 不給 canonical 與 hreflang：那是講「哪一頁才是正本、各語言版本在哪」，
 * 對一頁不打算被收錄的頁面沒有意義。
 *
 * follow 而不是 nofollow —— 四個語系三個頁面都要一致（先前 (default)
 * 與 (intl) 寫得不一樣，實測掃出來的）。這些頁面有回首頁與規則的連結，
 * nofollow 等於把站內連結切斷，而不索引本來就不需要連帶封鎖連結。
 */
export function playMetadata(locale: Locale, path: PagePath): Metadata {
  const title = copy(locale, path).title;
  return {
    title,
    ...otherGameTitle(locale, path, title),
    ...gameIcons(path),
    robots: { index: false, follow: true },
    ...openGraph(locale, path),
  };
}

/**
 * 試做中的遊戲頁（第二批五款）：先不讓搜尋引擎收錄。分享圖用那款自己的（見 trialOgUrl），還沒做的用平台首頁那張。
 * 標題與描述由各遊戲的文案表傳進來（不經過 messages/）。正式上線前改成 localeMetadata。
 */
export function trialGameMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  const url = trialOgUrl(locale, path);
  return {
    title: { absolute: `${title} | ${brandName(locale)}` },
    description,
    ...gameIcons(path),
    robots: { index: false, follow: true },
    openGraph: {
      type: 'website',
      locale: OG_LOCALE[locale],
      url: SITE + localePath(locale, path),
      title,
      description,
      siteName: brandName(locale),
      images: [{ url, ...OG_SIZE, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [url] },
  };
}

/**
 * 上線了的第二批遊戲頁（首頁、規則頁）：同 trialGameMetadata，但會被索引，帶 canonical 與 hreflang（同 localeMetadata，互相指到彼此、x-default 是 /en）。
 * 某一款上線時把它的頁面從 trialGameMetadata 換成這個，next-sitemap.config.js 的排除清單也要一起拿掉那款
 * （11/1 騎士巡遊上線時漏了，頁面一直是 noindex）。
 */
export function launchedGameMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  const { robots: _noindex, ...meta } = trialGameMetadata(locale, path, title, description);
  void _noindex;
  const languages = Object.fromEntries(LOCALES.map((l) => [HREFLANG[l], SITE + localePath(l, path)])) as Record<string, string>;
  languages['x-default'] = SITE + localePath('en', path);
  return { ...meta, alternates: { canonical: SITE + localePath(locale, path), languages } };
}

