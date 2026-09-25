import type { Metadata } from 'next';
import { playMetadata } from '@/i18n/metadata';
import OnlineView from '@/views/OnlineView';

export const metadata: Metadata = playMetadata('zh-TW', '/online');

export default function MatchPage() {
  return <OnlineView locale="zh-TW" />;
}
