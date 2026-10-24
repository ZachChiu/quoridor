import type { Metadata } from 'next';
import MancalaRulesPage from '@/components/balance-mancala/MancalaRulesPage';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { trialGameMetadata } from '@/i18n/metadata';
import { pickText } from '@/i18n/gameText';
import { BALANCE_MANCALA, trialRules } from '@/i18n/routes';
import { TEXT } from '@/games/balance-mancala/text';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = pickText(TEXT, locale);
  return trialGameMetadata(locale, trialRules(BALANCE_MANCALA), t.rulesMetaTitle, t.rulesMetaDescription);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <MancalaRulesPage locale={toLocale((await params).locale)} />;
}
