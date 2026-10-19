import type { Metadata } from 'next';
import BaghRulesView from '@/views/BaghRulesView';
import { localeMetadata } from '@/i18n/metadata';

export const metadata: Metadata = localeMetadata('zh-TW', '/bagh-chal/rules');

export default function Page() {
  return <BaghRulesView locale="zh-TW" />;
}
