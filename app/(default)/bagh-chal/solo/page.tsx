import type { Metadata } from 'next';
import BaghSolo from '@/components/bagh-chal/BaghSolo';
import { playMetadata } from '@/i18n/metadata';

export const metadata: Metadata = playMetadata('zh-TW', '/bagh-chal/solo');

export default function Page() {
  return <BaghSolo locale="zh-TW" />;
}
