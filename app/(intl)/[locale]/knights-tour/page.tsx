import type { Metadata } from 'next';
import KnightsTour from '@/components/knights-tour/KnightsTour';
import { pickText } from '@/i18n/gameText';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { trialGameMetadata } from '@/i18n/metadata';
import { KNIGHTS_TOUR } from '@/i18n/routes';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = pickText<KnightsText>(TEXT, locale);
  return trialGameMetadata(locale, KNIGHTS_TOUR, t.metaTitle, t.metaDescription);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <KnightsTour locale={toLocale((await params).locale)} />;
}
