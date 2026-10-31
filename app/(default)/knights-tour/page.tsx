import type { Metadata } from 'next';
import KnightsTour from '@/components/knights-tour/KnightsTour';
import { pickText } from '@/i18n/gameText';
import { launchedGameMetadata } from '@/i18n/metadata';
import { KNIGHTS_TOUR } from '@/i18n/routes';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';

const t = pickText<KnightsText>(TEXT, 'zh-TW');
export const metadata: Metadata = launchedGameMetadata('zh-TW', KNIGHTS_TOUR, t.metaTitle, t.metaDescription);

export default function Page() {
  return <KnightsTour locale="zh-TW" />;
}
