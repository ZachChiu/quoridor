import type { Metadata } from 'next';
import MatchRedirect from './MatchRedirect';

export const metadata: Metadata = {
  // 這一頁只是轉址，不該被索引；canonical 指向新網址，
  // 讓已經收錄 /match 的搜尋引擎知道該換過去。
  robots: { index: false, follow: true },
  alternates: { canonical: '/online' },
};

export default function MatchLegacy() {
  return <MatchRedirect />;
}
