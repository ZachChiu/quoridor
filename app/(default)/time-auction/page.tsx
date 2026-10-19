import type { Metadata } from 'next';
import TimeAuctionClient from '@/components/time-auction/TimeAuctionClient';
import { pickText } from '@/i18n/gameText';
import { trialGameMetadata } from '@/i18n/metadata';
import { TIME_AUCTION } from '@/i18n/routes';
import { TEXT } from '@/games/time-auction/text';

const t = pickText(TEXT, 'zh-TW');
export const metadata: Metadata = trialGameMetadata('zh-TW', TIME_AUCTION, t.metaTitle, t.metaDescription);

export default function Page() {
  return <TimeAuctionClient locale="zh-TW" />;
}
