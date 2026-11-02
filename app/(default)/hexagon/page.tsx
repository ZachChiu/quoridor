import type { Metadata } from 'next';
import Hexagon from '@/components/hexagon/Hexagon';
import { pickText } from '@/i18n/gameText';
import { trialGameMetadata } from '@/i18n/metadata';
import { HEXAGON } from '@/i18n/routes';
import { TEXT, type HexText } from '@/games/hexagon/text';

const t = pickText<HexText>(TEXT, 'zh-TW');
export const metadata: Metadata = trialGameMetadata('zh-TW', HEXAGON, t.metaTitle, t.metaDescription);

export default function Page() {
  return <Hexagon locale="zh-TW" />;
}
