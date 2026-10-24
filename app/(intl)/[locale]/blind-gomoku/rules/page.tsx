import type { Metadata } from 'next';
import RulesPage from '@/components/blind-gomoku/RulesPage';
import { pickText } from '@/i18n/gameText';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { trialGameMetadata } from '@/i18n/metadata';
import { BLIND_GOMOKU, trialRules } from '@/i18n/routes';
import { TEXT } from '@/games/blind-gomoku/text';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = pickText(TEXT, locale);
  return trialGameMetadata(locale, trialRules(BLIND_GOMOKU), t.rulesMetaTitle, t.rulesMetaDescription);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <RulesPage locale={toLocale((await params).locale)} />;
}
