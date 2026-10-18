import type { Metadata } from 'next';
import PlatformView from '@/views/PlatformView';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { localeMetadata } from '@/i18n/metadata';

/** 其他語系的平台首頁。generateStaticParams 不含 zh-TW（它佔住無前綴的 /）。 */
export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return localeMetadata(toLocale((await params).locale), '/');
}

export default async function LocaleHome({
  params,
}: { params: Promise<{ locale: string }> }) {
  return <PlatformView locale={toLocale((await params).locale)} />;
}
