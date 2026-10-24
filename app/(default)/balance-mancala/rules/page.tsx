import type { Metadata } from 'next';
import MancalaRulesPage from '@/components/balance-mancala/MancalaRulesPage';
import { trialGameMetadata } from '@/i18n/metadata';
import { pickText } from '@/i18n/gameText';
import { BALANCE_MANCALA, trialRules } from '@/i18n/routes';
import { TEXT } from '@/games/balance-mancala/text';

const t = pickText(TEXT, 'zh-TW');
export const metadata: Metadata = trialGameMetadata('zh-TW', trialRules(BALANCE_MANCALA), t.rulesMetaTitle, t.rulesMetaDescription);

export default function Page() {
  return <MancalaRulesPage locale="zh-TW" />;
}
