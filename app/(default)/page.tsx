import type { Metadata } from 'next';
import PlatformView from '@/views/PlatformView';
import { localeMetadata } from '@/i18n/metadata';

/** zh-TW 的平台首頁（節目遊戲總覽）。Wall Go 搬到 /wall-go/。 */
export const metadata: Metadata = localeMetadata('zh-TW', '/');

export default function Home() {
  return <PlatformView locale="zh-TW" />;
}
