import type { Metadata } from 'next';
import BaghChalView from '@/views/BaghChalView';
import { localeMetadata } from '@/i18n/metadata';

export const metadata: Metadata = localeMetadata('zh-TW', '/bagh-chal');

export default function Page() {
  return <BaghChalView locale="zh-TW" />;
}
