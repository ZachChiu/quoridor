import type { Metadata } from 'next';
import { getMessages } from './index';
import { LOCALES, DEFAULT_LOCALE, localePath, type Locale } from './locales';

const SITE = process.env.SITE_URL || 'https://quoridorgame.com';

/**
 * 每一頁每一語系的 metadata，含 hreflang。
 *
 * hreflang 必須**互相指到彼此**（包含自己），少一邊 Google 就不承認這組
 * 是同一份內容的不同語言版本，於是四個語系會被當成四個不相干的頁面
 * 互相競爭。這是多語 SEO 最常見的失敗。
 *
 * x-default 指向 /en：zh-TW 佔住了無前綴的網址，但語言對不上的訪客
 * 落在英文比落在中文合理。
 */
export function localeMetadata(locale: Locale, path: string): Metadata {
  const t = getMessages(locale);
  const languages = Object.fromEntries(
    LOCALES.map((l) => [l, SITE + localePath(l, path)])
  ) as Record<string, string>;
  languages['x-default'] = SITE + localePath('en', path);

  const page =
    path === '/rules' ? { title: t.rules.metaTitle, description: t.rules.metaDescription, ogTitle: t.rules.ogTitle, ogDescription: t.rules.ogDescription }
    : path === '/solo' ? { title: t.solo.metaTitle, description: t.solo.metaDescription, ogTitle: t.solo.ogTitle, ogDescription: t.solo.ogDescription }
    : { title: undefined, description: t.meta.description, ogTitle: t.meta.ogTitle, ogDescription: t.meta.ogDescription };

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: SITE + localePath(locale, path), languages },
    openGraph: {
      type: 'website',
      locale: locale.replace('-', '_'),
      url: SITE + localePath(locale, path),
      title: page.ogTitle,
      description: page.ogDescription,
      siteName: `${t.home.titleLine1} ${t.home.titleLine2}`.trim(),
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: t.meta.ogAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.ogTitle,
      description: page.ogDescription,
      images: ['/og-image.png'],
    },
    // 首頁在各語系用自己的完整標題，不套 template
    ...(path === '/' ? { title: { absolute: t.meta.titleDefault } } : {}),
    ...(locale === DEFAULT_LOCALE ? {} : {}),
  };
}
