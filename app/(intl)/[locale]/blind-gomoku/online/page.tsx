import type { Metadata } from 'next';
import GomokuOnline from '@/components/blind-gomoku/GomokuOnline';
import { pickText } from '@/i18n/gameText';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { trialGameMetadata } from '@/i18n/metadata';
import { BLIND_GOMOKU, trialOnline } from '@/i18n/routes';
import { TEXT } from '@/games/blind-gomoku/text';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = pickText(TEXT, locale);
  return trialGameMetadata(locale, trialOnline(BLIND_GOMOKU), t.metaTitle, t.metaDescription);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <GomokuOnline locale={toLocale((await params).locale)} />;
}
