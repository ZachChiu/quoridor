import type { Metadata } from 'next';
import MorrisOnline from '@/components/nine-mens-morris/MorrisOnline';
import { pickText } from '@/i18n/gameText';
import { trialGameMetadata } from '@/i18n/metadata';
import { NINE_MENS_MORRIS, trialOnline } from '@/i18n/routes';
import { TEXT } from '@/games/nine-mens-morris/text';

const t = pickText(TEXT, 'zh-TW');
export const metadata: Metadata = trialGameMetadata('zh-TW', trialOnline(NINE_MENS_MORRIS), `${t.title} · ${t.online}`, t.metaDescription);

export default function Page() {
  return <MorrisOnline locale="zh-TW" />;
}
