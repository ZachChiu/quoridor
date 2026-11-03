import type { Metadata } from 'next';
import EquationPyramid from '@/components/equation-pyramid/EquationPyramid';
import { pickText } from '@/i18n/gameText';
import { trialGameMetadata } from '@/i18n/metadata';
import { EQUATION_PYRAMID } from '@/i18n/routes';
import { TEXT, type EpText } from '@/games/equation-pyramid/text';

const t = pickText<EpText>(TEXT, 'zh-TW');
export const metadata: Metadata = trialGameMetadata('zh-TW', EQUATION_PYRAMID, t.metaTitle, t.metaDescription);

export default function Page() {
  return <EquationPyramid locale="zh-TW" />;
}
