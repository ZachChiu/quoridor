import type { Metadata } from 'next';
import BlindGomoku from '@/components/blind-gomoku/BlindGomoku';
import HideMenuScript from '@/components/blind-gomoku/HideMenuScript';
import { pickText } from '@/i18n/gameText';
import { trialGameMetadata } from '@/i18n/metadata';
import { BLIND_GOMOKU } from '@/i18n/routes';
import { TEXT } from '@/games/blind-gomoku/text';

const t = pickText(TEXT, 'zh-TW');
export const metadata: Metadata = trialGameMetadata('zh-TW', BLIND_GOMOKU, t.metaTitle, t.metaDescription);

export default function Page() {
  return (
    <>
      <HideMenuScript />
      <BlindGomoku locale="zh-TW" />
    </>
  );
}
