import type { Metadata } from 'next';
import HideMenuScript from '@/components/question-and-truth/HideMenuScript';
import QuestionAndTruth from '@/components/question-and-truth/QuestionAndTruth';
import { pickText } from '@/i18n/gameText';
import { trialGameMetadata } from '@/i18n/metadata';
import { QUESTION_AND_TRUTH } from '@/i18n/routes';
import { TEXT } from '@/games/question-and-truth/text';

const t = pickText(TEXT, 'zh-TW');
export const metadata: Metadata = trialGameMetadata('zh-TW', QUESTION_AND_TRUTH, t.metaTitle, t.metaDescription);

export default function Page() {
  return (
    <>
      <HideMenuScript />
      <QuestionAndTruth locale="zh-TW" />
    </>
  );
}
