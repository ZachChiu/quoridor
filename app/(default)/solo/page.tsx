import type { Metadata } from 'next';
import SoloView from '@/views/SoloView';
import { localeMetadata } from '@/i18n/metadata';

export const metadata: Metadata = localeMetadata('zh-TW', '/solo');

export default function SoloPage() {
  return <SoloView locale="zh-TW" />;
}
