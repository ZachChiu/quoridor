import type { Metadata } from 'next';
import OnlineView from '@/views/OnlineView';
import { getMessages } from '@/i18n';

export const metadata: Metadata = {
  title: getMessages('zh-TW').online.metaTitle,
  // 沒有 roomId 就是一張錯誤畫面，有 roomId 也是某兩個人的私人對局 ——
  // 兩種都不該進索引。sitemap 也排除了它，這裡是第二道。
  robots: { index: false, follow: false },
};

export default function MatchPage() {
  return <OnlineView locale="zh-TW" />;
}
