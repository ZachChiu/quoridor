import type { Metadata } from 'next';
import KnightsTourRulesView from '@/views/KnightsTourRulesView';
import { pickText } from '@/i18n/gameText';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { launchedGameMetadata } from '@/i18n/metadata';
import { KNIGHTS_TOUR, trialRules } from '@/i18n/routes';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = pickText<KnightsText>(TEXT, locale);
  return launchedGameMetadata(locale, trialRules(KNIGHTS_TOUR), t.rulesMetaTitle, t.rulesMetaDescription);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <KnightsTourRulesView locale={toLocale((await params).locale)} />;
}
