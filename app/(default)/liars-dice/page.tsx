import type { Metadata } from 'next';
import HideMenuScript from '@/components/liars-dice/HideMenuScript';
import LiarsDice from '@/components/liars-dice/LiarsDice';
import { pickText } from '@/i18n/gameText';
import { trialGameMetadata } from '@/i18n/metadata';
import { LIARS_DICE } from '@/i18n/routes';
import { TEXT } from '@/games/liars-dice/text';

const t = pickText(TEXT, 'zh-TW');
export const metadata: Metadata = trialGameMetadata('zh-TW', LIARS_DICE, t.metaTitle, t.metaDescription);

export default function Page() {
  return (
    <>
      <HideMenuScript />
      <LiarsDice locale="zh-TW" />
    </>
  );
}
