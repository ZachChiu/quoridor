import type { Metadata } from 'next';
import SeasonView from '@/views/SeasonView';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { localeMetadata } from '@/i18n/metadata';
import { SEASON_NUMBERS, season, type SeasonNumber } from '@/i18n/routes';

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED.flatMap((locale) => SEASON_NUMBERS.map((n) => ({ locale, n })));
}

type Params = { params: Promise<{ locale: string; n: SeasonNumber }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, n } = await params;
  return localeMetadata(toLocale(locale), season(n));
}

export default async function Page({ params }: Params) {
  const { locale, n } = await params;
  return <SeasonView locale={toLocale(locale)} n={n} />;
}
