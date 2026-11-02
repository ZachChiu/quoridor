import type { Metadata } from 'next';
import GomokuOnline from '@/components/blind-gomoku/GomokuOnline';
import { pickText } from '@/i18n/gameText';
import { trialGameMetadata } from '@/i18n/metadata';
import { BLIND_GOMOKU, trialOnline } from '@/i18n/routes';
import { TEXT } from '@/games/blind-gomoku/text';

const t = pickText(TEXT, 'zh-TW');
export const metadata: Metadata = trialGameMetadata('zh-TW', trialOnline(BLIND_GOMOKU), t.metaTitle, t.metaDescription);

export default function Page() {
  return <GomokuOnline locale="zh-TW" />;
}
