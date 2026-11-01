import type { Metadata } from 'next';
import MorrisOnline from '@/components/nine-mens-morris/MorrisOnline';
import { pickText } from '@/i18n/gameText';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { trialGameMetadata } from '@/i18n/metadata';
import { NINE_MENS_MORRIS, trialOnline } from '@/i18n/routes';
import { TEXT } from '@/games/nine-mens-morris/text';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = pickText(TEXT, locale);
  return trialGameMetadata(locale, trialOnline(NINE_MENS_MORRIS), `${t.title} · ${t.online}`, t.metaDescription);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <MorrisOnline locale={toLocale((await params).locale)} />;
}
