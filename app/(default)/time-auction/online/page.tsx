import type { Metadata } from 'next';
import AuctionOnline from '@/components/time-auction/AuctionOnline';
import { pickText } from '@/i18n/gameText';
import { trialGameMetadata } from '@/i18n/metadata';
import { TIME_AUCTION, trialOnline } from '@/i18n/routes';
import { TEXT } from '@/games/time-auction/text';

const t = pickText(TEXT, 'zh-TW');
export const metadata: Metadata = trialGameMetadata('zh-TW', trialOnline(TIME_AUCTION), `${t.title} · ${t.onlineTitle}`, t.metaDescription);

export default function Page() {
  return <AuctionOnline locale="zh-TW" />;
}
