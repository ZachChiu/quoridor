import type { Metadata } from 'next';
import TimeAuctionRulesView from '@/views/TimeAuctionRulesView';
import { pickText } from '@/i18n/gameText';
import { trialGameMetadata } from '@/i18n/metadata';
import { TIME_AUCTION, trialRules } from '@/i18n/routes';
import { TEXT } from '@/games/time-auction/text';

const t = pickText(TEXT, 'zh-TW');
export const metadata: Metadata = trialGameMetadata('zh-TW', trialRules(TIME_AUCTION), t.rulesTitle, t.rulesMetaDescription);

export default function Page() {
  return <TimeAuctionRulesView locale="zh-TW" />;
}
