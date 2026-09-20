'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '../utils/analytics';

/**
 * 頁面瀏覽追蹤。只做副作用，不渲染也不包住任何內容。
 *
 * 為什麼不再包 children：本元件使用 useSearchParams()，在靜態產生時會讓
 * 所屬的 Suspense 子樹整個退回 client 渲染。先前它包住了全站內容，
 * 導致每一頁的靜態 HTML 只有 <Suspense> 的 fallback（null）——
 * 爬蟲拿到的是空白頁面，內容全靠瀏覽器執行 JS 才出現。
 *
 * 改為葉節點後，Suspense 只需要包住它自己，頁面內容便能正常進入靜態 HTML。
 */
export default function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams?.toString();
    trackPageView(pathname + (query ? `?${query}` : ''));
  }, [pathname, searchParams]);

  return null;
}
