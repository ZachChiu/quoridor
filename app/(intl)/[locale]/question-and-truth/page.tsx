import type { Metadata } from 'next';
import HideMenuScript from '@/components/question-and-truth/HideMenuScript';
import QuestionAndTruth from '@/components/question-and-truth/QuestionAndTruth';
import { pickText } from '@/i18n/gameText';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { trialGameMetadata } from '@/i18n/metadata';
import { QUESTION_AND_TRUTH } from '@/i18n/routes';
import { TEXT } from '@/games/question-and-truth/text';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const t = pickText(TEXT, locale);
  return trialGameMetadata(locale, QUESTION_AND_TRUTH, t.metaTitle, t.metaDescription);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <>
      <HideMenuScript />
      <QuestionAndTruth locale={toLocale((await params).locale)} />
    </>
  );
}
