import type { Metadata } from 'next';
import BaghOnline from '@/components/bagh-chal/BaghOnline';
import { playMetadata } from '@/i18n/metadata';

export const metadata: Metadata = playMetadata('zh-TW', '/bagh-chal/online');

export default function Page() {
  return <BaghOnline locale="zh-TW" />;
}
