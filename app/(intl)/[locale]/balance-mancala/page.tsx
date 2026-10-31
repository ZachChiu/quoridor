import type { Metadata } from 'next';
import BalanceMancala from '@/components/balance-mancala/BalanceMancala';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { trialGameMetadata } from '@/i18n/metadata';
import { pickText } from '@/i18n/gameText';
import { BALANCE_MANCALA } from '@/i18n/routes';
import { TEXT } from '@/games/balance-mancala/text';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = pickText(TEXT, locale);
  return trialGameMetadata(locale, BALANCE_MANCALA, t.metaTitle, t.metaDescription);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <BalanceMancala locale={toLocale((await params).locale)} />;
}
