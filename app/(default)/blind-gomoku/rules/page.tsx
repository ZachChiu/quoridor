import type { Metadata } from 'next';
import RulesPage from '@/components/blind-gomoku/RulesPage';
import { pickText } from '@/i18n/gameText';
import { trialGameMetadata } from '@/i18n/metadata';
import { BLIND_GOMOKU, trialRules } from '@/i18n/routes';
import { TEXT } from '@/games/blind-gomoku/text';

const t = pickText(TEXT, 'zh-TW');
export const metadata: Metadata = trialGameMetadata('zh-TW', trialRules(BLIND_GOMOKU), t.rulesMetaTitle, t.rulesMetaDescription);

export default function Page() {
  return <RulesPage locale="zh-TW" />;
}
