import type { Metadata } from 'next';
import { Shell, baseMetadata } from '@/shell';
import { siteViewport } from '@/viewport';
import { getMessages } from '@/i18n';
import { HTML_LANG, PREFIXED, toLocale } from '@/i18n/locales';

/**
 * en / ja / ko 的 root layout。
 *
 * 與 (default) 分成兩個 root layout，只為了一件事：<html lang> 要能隨語系
 * 改變。Next 一個路由樹只能有一個 <html>，而 root layout 拿不到動態
 * params —— 除非它自己就在 [locale] 底下。
 *
 * 之前 lang 一律寫死 zh-TW，連 /en /ja /ko 也是。讀屏會用中文發音去念
 * 英文與韓文，而那是不會有人回報的那種壞掉。
 */
export const viewport = siteViewport;

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = getMessages(locale);
  return {
    ...baseMetadata,
    title: { default: t.meta.titleDefault, template: t.meta.titleTemplate },
    description: t.meta.description,
    keywords: [...t.meta.keywords],
  };
}

export default async function IntlLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const locale = toLocale((await params).locale);
  return <Shell locale={locale}>{children}</Shell>;
}
