import type { Metadata } from 'next';
import { playMetadata } from '@/i18n/metadata';
import ReplayView from '@/views/ReplayView';

export const metadata: Metadata = playMetadata('zh-TW', '/replay');

export default function ReplayPage() {
  return <ReplayView locale="zh-TW" />;
}
