import type { Metadata } from 'next';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getMessages, siteName } from './index';
import { LOCALES, DEFAULT_LOCALE, HREFLANG, OG_LOCALE, localePath, type Locale } from './locales';

const SITE = process.env.SITE_URL || 'https://quoridorgame.com';

/** 網址 → 分享圖的頁面代號。多一頁要記得同時加進 scripts/build-og-images.mjs 的 PAGES。 */
const PAGE_KEY = {
  '/': 'home', '/rules': 'rules', '/solo': 'solo',
  '/local': 'local', '/online': 'online', '/replay': 'replay',
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
  const file = `${PAGE_KEY[path]}-${locale}.png`;
  return `${SITE}/og/${file}?v=${ogHash(file)}`;
}

function shareImage(locale: Locale, path: PagePath) {
  const t = getMessages(locale);
  const url = ogImageUrl(locale, path);
  return {
    og: [{ url, ...OG_SIZE, alt: t.meta.ogAlt }],
    twitter: [url],
  };
}

function copy(locale: Locale, path: PagePath) {
  const t = getMessages(locale);
  switch (path) {
    case '/rules':
      return { title: t.rules.metaTitle, description: t.rules.metaDescription, ogTitle: t.rules.ogTitle, ogDescription: t.rules.ogDescription };
    case '/solo':
      return { title: t.solo.metaTitle, description: t.solo.metaDescription, ogTitle: t.solo.ogTitle, ogDescription: t.solo.ogDescription };
    case '/replay':
      return { title: t.replay.metaTitle, description: t.replay.metaDescription, ogTitle: t.replay.metaTitle, ogDescription: t.replay.metaDescription };
    case '/local':
      return { title: t.local.metaTitle, description: t.meta.description, ogTitle: t.local.metaTitle, ogDescription: t.meta.ogDescription };
    case '/online':
      return { title: t.online.metaTitle, description: t.meta.description, ogTitle: t.online.metaTitle, ogDescription: t.meta.ogDescription };
    default:
      return { title: undefined, description: t.meta.description, ogTitle: t.meta.ogTitle, ogDescription: t.meta.ogDescription };
  }
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
      siteName: siteName(locale),
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
    // 首頁在各語系用自己的完整標題，不套 template
    ...(path === '/' ? { title: { absolute: t.meta.titleDefault } } : {}),
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
  return {
    title: copy(locale, path).title,
    robots: { index: false, follow: true },
    ...openGraph(locale, path),
  };
}
