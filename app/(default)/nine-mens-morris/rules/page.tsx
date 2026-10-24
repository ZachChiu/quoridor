import type { Metadata } from 'next';
import MorrisRulesPage from '@/components/nine-mens-morris/MorrisRulesPage';
import { pickText } from '@/i18n/gameText';
import { trialGameMetadata } from '@/i18n/metadata';
import { NINE_MENS_MORRIS, trialRules } from '@/i18n/routes';
import { TEXT } from '@/games/nine-mens-morris/text';

const t = pickText(TEXT, 'zh-TW');
export const metadata: Metadata = trialGameMetadata('zh-TW', trialRules(NINE_MENS_MORRIS), t.rulesMetaTitle, t.rulesMetaDescription);

export default function Page() {
  return <MorrisRulesPage locale="zh-TW" />;
}
