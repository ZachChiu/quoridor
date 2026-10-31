import type { Metadata } from 'next';
import BaghPlay from '@/components/bagh-chal/BaghPlay';
import { playMetadata } from '@/i18n/metadata';

export const metadata: Metadata = playMetadata('zh-TW', '/bagh-chal/local');

export default function Page() {
  return <BaghPlay locale="zh-TW" mode={{ kind: 'local' }} />;
}
