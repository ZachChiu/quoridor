import type { Metadata } from 'next';
import ReplayView from '@/views/ReplayView';
import { getMessages } from '@/i18n';

export const metadata: Metadata = {
  title: getMessages('zh-TW').replay.metaTitle,
  // 每個回放網址都是某一局的棋譜，內容由 hash 決定 —— 對搜尋引擎而言
  // 是無限多個「同一頁」，不該進索引。
  robots: { index: false, follow: true },
};

export default function ReplayPage() {
  return <ReplayView locale="zh-TW" />;
}
