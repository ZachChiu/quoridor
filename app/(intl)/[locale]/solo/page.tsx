import type { Metadata } from 'next';
import SoloView from '@/views/SoloView';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { localeMetadata } from '@/i18n/metadata';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return localeMetadata(toLocale((await params).locale), '/solo');
}

export default async function LocaleSolo({
  params,
}: { params: Promise<{ locale: string }> }) {
  return <SoloView locale={toLocale((await params).locale)} />;
}
