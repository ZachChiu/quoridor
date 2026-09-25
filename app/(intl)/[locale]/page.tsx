import type { Metadata } from 'next';
import HomeView from '@/views/HomeView';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { localeMetadata } from '@/i18n/metadata';

/**
 * en / ja / ko 的首頁。
 *
 * generateStaticParams **不含 zh-TW** —— 產出 /zh-TW/ 會和 / 是一模一樣的
 * 內容，那是自己跟自己搶排名。zh-TW 由 app/page.tsx 佔住無前綴的網址。
 */
export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  return localeMetadata(locale, '/');
}

export default async function LocaleHome({
  params,
}: { params: Promise<{ locale: string }> }) {
  const locale = toLocale((await params).locale);
  return <HomeView locale={locale} />;
}
