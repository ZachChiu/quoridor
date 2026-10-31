import type { Metadata } from 'next';
import MorrisGame from '@/components/nine-mens-morris/MorrisGame';
import { pickText } from '@/i18n/gameText';
import { trialGameMetadata } from '@/i18n/metadata';
import { NINE_MENS_MORRIS } from '@/i18n/routes';
import { TEXT } from '@/games/nine-mens-morris/text';

const t = pickText(TEXT, 'zh-TW');
export const metadata: Metadata = trialGameMetadata('zh-TW', NINE_MENS_MORRIS, t.metaTitle, t.metaDescription);

export default function Page() {
  return <MorrisGame locale="zh-TW" />;
}
