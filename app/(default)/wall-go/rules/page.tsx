import type { Metadata } from 'next';
import RulesView from '@/views/RulesView';
import { localeMetadata } from '@/i18n/metadata';

export const metadata: Metadata = localeMetadata('zh-TW', '/wall-go/rules');

export default function RulesPage() {
  return <RulesView locale="zh-TW" />;
}
