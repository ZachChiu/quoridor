import { Suspense } from 'react';
import MatchClient from '@/(default)/match/MatchClient';
import { getMessages } from '@/i18n';
import type { Locale } from '@/i18n/locales';

/** 連線對戰畫面，四語系共用。 */
export default function MatchView({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  return (
    <div className="flex min-h-dvh items-center justify-center gap-16 overflow-hidden font-[family-name:var(--font-app)]">
      <main className="flex flex-1 items-center justify-center gap-8">
        <h1 className="sr-only">{t.match.srHeading}</h1>
        {/* MatchClient 使用 useSearchParams()，需要自己的 Suspense 邊界。
            /match 本來就不該被索引，這裡走 client 渲染沒有 SEO 代價。 */}
        <Suspense fallback={null}>
          <MatchClient />
        </Suspense>
      </main>
    </div>
  );
}
