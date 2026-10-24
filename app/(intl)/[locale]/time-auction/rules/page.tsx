import type { Metadata } from 'next';
import TimeAuctionRulesView from '@/views/TimeAuctionRulesView';
import { pickText } from '@/i18n/gameText';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { trialGameMetadata } from '@/i18n/metadata';
import { TIME_AUCTION, trialRules } from '@/i18n/routes';
import { TEXT } from '@/games/time-auction/text';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = pickText(TEXT, locale);
  return trialGameMetadata(locale, trialRules(TIME_AUCTION), t.rulesTitle, t.rulesMetaDescription);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <TimeAuctionRulesView locale={toLocale((await params).locale)} />;
}
