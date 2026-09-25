import type { Metadata } from 'next';
import { playMetadata } from '@/i18n/metadata';
import LocalView from '@/views/LocalView';

export const metadata: Metadata = playMetadata('zh-TW', '/local');

export default function LocalPage() {
  return <LocalView locale="zh-TW" />;
}
