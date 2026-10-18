import type { Metadata } from 'next';
import HomeView from '@/views/HomeView';
import { localeMetadata } from '@/i18n/metadata';

/** zh-TW 的首頁。網址維持 `/`，不加語系前綴。 */
export const metadata: Metadata = localeMetadata('zh-TW', '/wall-go');

export default function Home() {
  return <HomeView locale="zh-TW" />;
}
