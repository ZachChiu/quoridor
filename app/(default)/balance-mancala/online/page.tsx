import type { Metadata } from 'next';
import MancalaOnline from '@/components/balance-mancala/MancalaOnline';
import { trialGameMetadata } from '@/i18n/metadata';
import { pickText } from '@/i18n/gameText';
import { BALANCE_MANCALA, trialOnline } from '@/i18n/routes';
import { TEXT } from '@/games/balance-mancala/text';

const t = pickText(TEXT, 'zh-TW');
export const metadata: Metadata = trialGameMetadata('zh-TW', trialOnline(BALANCE_MANCALA), t.metaTitle, t.metaDescription);

export default function Page() {
  return <MancalaOnline locale="zh-TW" />;
}
