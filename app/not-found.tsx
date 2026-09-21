import Link from 'next/link';
import { Shell } from './shell';
import { getMessages } from '@/i18n';

/**
 * 404。
 *
 * 在此之前這一頁是空白的，而且會用 JS 把人彈回首頁。兩個問題：
 *
 * 1. **對使用者**：畫面先閃一下白，然後莫名其妙回到首頁 —— 沒人知道
 *    剛剛發生什麼事，也不知道是自己打錯字還是網站壞了。
 * 2. **對搜尋引擎**：那是 soft 404。任何打錯的網址都回傳「有內容」
 *    然後跳轉，Google 會把它當成一個真實存在、只是內容重複的頁面。
 *    大量這種頁面會稀釋整站的評價。
 *
 * 正確的做法是回一個**真的 404**：狀態碼 404、頁面說明發生什麼事、
 * 給出去路。狀態碼要靠 CloudFront 設定（見 infra/README.md），
 * 這裡負責的是後兩者。
 *
 * 語系：這一頁接的是「不存在的網址」，沒有可靠的語系可推 ——
 * 從路徑猜會在 /xyz 這種網址上猜錯。所以用預設語系，
 * 並且兩邊出口都給，讓人自己走。
 */
export const metadata = {
  title: getMessages('zh-TW').notFound.title,
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const t = getMessages('zh-TW');
  return (
    <Shell locale="zh-TW">
      <div className="flex min-h-dvh items-center justify-center px-6 font-[family-name:var(--font-app)]">
        <main className="flex max-w-[26rem] flex-col items-center gap-5 text-center">
          <p className="text-[clamp(4rem,18vw,7rem)] font-black leading-none tracking-tight text-tile-ink/15">404</p>
          <h1 className="text-[clamp(1.5rem,6vw,2.25rem)] font-black leading-tight tracking-tight">
            {t.notFound.title}
          </h1>
          <p className="text-base leading-relaxed text-ink-soft">{t.notFound.body}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/"
                  className="rounded-2xl bg-tile-amber px-6 py-4 text-lg font-black text-tile-ink transition hover:brightness-95">
              {t.notFound.home}
            </Link>
            <Link href="/rules"
                  className="rounded-2xl bg-tile-forest px-6 py-4 text-lg font-black text-tile-cream transition hover:brightness-95">
              {t.notFound.rules}
            </Link>
          </div>
        </main>
      </div>
    </Shell>
  );
}
