import type { Metadata } from 'next';
import HideMenuScript from '@/components/liars-dice/HideMenuScript';
import LiarsDice from '@/components/liars-dice/LiarsDice';
import { pickText } from '@/i18n/gameText';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { trialGameMetadata } from '@/i18n/metadata';
import { LIARS_DICE } from '@/i18n/routes';
import { TEXT } from '@/games/liars-dice/text';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = pickText(TEXT, locale);
  return trialGameMetadata(locale, LIARS_DICE, t.metaTitle, t.metaDescription);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <>
      <HideMenuScript />
      <LiarsDice locale={toLocale((await params).locale)} />
    </>
  );
}
