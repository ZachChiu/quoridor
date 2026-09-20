import type { Metadata } from 'next';
import RulesView from '@/views/RulesView';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { localeMetadata } from '@/i18n/metadata';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return localeMetadata(toLocale((await params).locale), '/rules');
}

export default async function LocaleRules({
  params,
}: { params: Promise<{ locale: string }> }) {
  return <RulesView locale={toLocale((await params).locale)} />;
}
