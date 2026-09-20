import type { Metadata } from 'next';
import LocalView from '@/views/LocalView';
import { getMessages } from '@/i18n';

export const metadata: Metadata = { title: getMessages('zh-TW').local.metaTitle };

export default function LocalPage() {
  return <LocalView locale="zh-TW" />;
}
