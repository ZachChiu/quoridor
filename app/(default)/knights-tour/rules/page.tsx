import type { Metadata } from 'next';
import KnightsTourRulesView from '@/views/KnightsTourRulesView';
import { pickText } from '@/i18n/gameText';
import { trialGameMetadata } from '@/i18n/metadata';
import { KNIGHTS_TOUR, trialRules } from '@/i18n/routes';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';

const t = pickText<KnightsText>(TEXT, 'zh-TW');
export const metadata: Metadata = trialGameMetadata('zh-TW', trialRules(KNIGHTS_TOUR), t.rulesMetaTitle, t.rulesMetaDescription);

export default function Page() {
  return <KnightsTourRulesView locale="zh-TW" />;
}
