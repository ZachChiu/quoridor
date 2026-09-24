'use client';
import { GiBrokenWall } from 'react-icons/gi';
import type { Messages } from '@/i18n';
import { localePath, type Locale } from '@/i18n/locales';

/**
 * 執行期錯誤的畫面（俗稱 500）。兩個地方用：
 *
 * - 各語系 layout 底下的 `error.tsx` —— 錯誤發生在頁面裡，layout（字型、
 *   語系 Provider）還活著，這是絕大多數的情況
 * - `global-error.tsx` —— 連 root layout 都掛了，只剩這一層
 *
 * 在此之前兩者都是 Next 預設的「Application error: a client-side exception
 * has occurred」：英文、沒樣式，看起來像網站整個壞掉了。
 *
 * 版面跟 404 同一套（大字 + 標題 + 說明 + 兩個出口），圖示用裂開的牆 ——
 * 按鈕只用深墨（主要）與中性灰（次要），不帶色相：畫面上唯一的顏色是那道牆。
 * 這個遊戲裡「牆」就是一切，牆裂了是最直接的比喻。
 *
 * 「重新整理」用整頁重新載入而不是只重繪這一段：錯誤多半來自某個
 * 壞掉的狀態（或過期的 chunk），留在同一個 JS 環境裡重試很可能再壞一次。
 */
export default function ErrorScreen({ t, locale, onRetry }: {
  t: Messages['error'];
  locale: Locale;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-primary-50 px-6 font-[family-name:var(--font-app)] text-tile-ink">
      <main className="flex max-w-[26rem] flex-col items-center gap-5 text-center">
        <GiBrokenWall className="text-[clamp(4rem,18vw,7rem)] text-tile-red" aria-hidden="true" />
        <h1 className="text-[clamp(1.5rem,6vw,2.25rem)] font-black leading-tight tracking-tight">{t.title}</h1>
        <p className="text-base leading-relaxed text-ink-soft">{t.body}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => (onRetry ? onRetry() : window.location.reload())}
            className="rounded-2xl bg-tile-ink px-6 py-4 text-lg font-black text-tile-cream transition hover:brightness-110 active:scale-[0.98]"
          >
            {t.retry}
          </button>
          {/* 用 <a> 而不是 next/link：這裡的 client 狀態已經不可信，整頁載入最保險 */}
          <a
            href={localePath(locale, '/')}
            className="rounded-2xl bg-tile-ink/[0.07] px-6 py-4 text-lg font-black text-tile-ink transition hover:bg-tile-ink/[0.12]"
          >
            {t.home}
          </a>
        </div>
      </main>
    </div>
  );
}
