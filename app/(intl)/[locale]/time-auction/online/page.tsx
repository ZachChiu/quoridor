import type { Metadata } from 'next';
import AuctionOnline from '@/components/time-auction/AuctionOnline';
import { pickText } from '@/i18n/gameText';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { trialGameMetadata } from '@/i18n/metadata';
import { TIME_AUCTION, trialOnline } from '@/i18n/routes';
import { TEXT } from '@/games/time-auction/text';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = pickText(TEXT, locale);
  return trialGameMetadata(locale, trialOnline(TIME_AUCTION), `${t.title} · ${t.onlineTitle}`, t.metaDescription);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <AuctionOnline locale={toLocale((await params).locale)} />;
}
