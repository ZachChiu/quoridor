import type { Metadata } from 'next';
import Hexagon from '@/components/hexagon/Hexagon';
import { pickText } from '@/i18n/gameText';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { trialGameMetadata } from '@/i18n/metadata';
import { HEXAGON } from '@/i18n/routes';
import { TEXT, type HexText } from '@/games/hexagon/text';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = pickText<HexText>(TEXT, locale);
  return trialGameMetadata(locale, HEXAGON, t.metaTitle, t.metaDescription);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <Hexagon locale={toLocale((await params).locale)} />;
}
