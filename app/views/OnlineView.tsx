import { Suspense } from 'react';
import OnlineClient from '@/(default)/online/OnlineClient';
import { getMessages } from '@/i18n';
import type { Locale } from '@/i18n/locales';

/** 連線對戰畫面，四語系共用。 */
export default function OnlineView({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  return (
    <div className="flex min-h-dvh items-center justify-center gap-16 overflow-hidden font-[family-name:var(--font-app)]">
      {/* self-stretch：棋盤靠 padding 讓出控制盤那一塊，再在剩下的框裡對齊，
          而 <main> 不撐滿高度的話那個框就等於棋盤自己，沒有空間可以對齊。 */}
      <main className="flex flex-1 items-center justify-center gap-8 self-stretch">
        <h1 className="sr-only">{t.online.srHeading}</h1>
        {/* MatchClient 使用 useSearchParams()，需要自己的 Suspense 邊界。
            /match 本來就不該被索引，這裡走 client 渲染沒有 SEO 代價。 */}
        <Suspense fallback={null}>
          <OnlineClient />
        </Suspense>
      </main>
    </div>
  );
}
