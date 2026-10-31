import type { Metadata } from 'next';
import BaghRulesView from '@/views/BaghRulesView';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { localeMetadata } from '@/i18n/metadata';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return localeMetadata(toLocale((await params).locale), '/bagh-chal/rules');
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <BaghRulesView locale={toLocale((await params).locale)} />;
}
