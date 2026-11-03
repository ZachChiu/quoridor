import type { Metadata } from 'next';
import EquationPyramid from '@/components/equation-pyramid/EquationPyramid';
import { pickText } from '@/i18n/gameText';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { trialGameMetadata } from '@/i18n/metadata';
import { EQUATION_PYRAMID } from '@/i18n/routes';
import { TEXT, type EpText } from '@/games/equation-pyramid/text';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = pickText<EpText>(TEXT, locale);
  return trialGameMetadata(locale, EQUATION_PYRAMID, t.metaTitle, t.metaDescription);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <EquationPyramid locale={toLocale((await params).locale)} />;
}
