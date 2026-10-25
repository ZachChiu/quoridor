import Link from 'next/link';
import { Shell } from './shell';
import { getMessages } from '@/i18n';
import { brandName } from '@/brand';
import PlatformMark from '@/components/PlatformMark';
import { SEASON_NUMBERS, season } from '@/i18n/routes';

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
 * 外觀是平台的（深色＋紅、左上骰子惡魔）：根網址已經是平台首頁，不是 Wall Go 了。
 * 10/25 Zach 打 /season/4 看到的還是 Wall Go 的奶油底，「看看怎麼玩」也還連到搬家前的 /rules。
 * 出口是回首頁，加上三季的目錄（打錯季數、或從舊連結進來的人多半是在找遊戲）。
 *
 * 語系：這一頁接的是「不存在的網址」，沒有可靠的語系可推 ——
 * 從路徑猜會在 /xyz 這種網址上猜錯。所以用預設語系。
 */
export const metadata = {
  title: getMessages('zh-TW').notFound.title,
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const t = getMessages('zh-TW');
  const p = t.platform;
  const seasonTitle = { '1': p.s1, '2': p.s2, '3': p.s3 } as const;
  return (
    <Shell locale="zh-TW">
      <div className="platform-root flex min-h-dvh flex-col bg-plat-bg font-[family-name:var(--font-app)] text-tile-cream">
        <header className="mx-auto flex w-full max-w-[1360px] p-4">
          <Link href="/" aria-label={brandName('zh-TW')} title={brandName('zh-TW')} className="transition hover:brightness-110">
            <PlatformMark />
          </Link>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 pb-[12vh] text-center">
          <p className="text-[clamp(5rem,20vw,9rem)] font-black leading-none tracking-tight text-brand-red">404</p>
          <h1 className="text-[clamp(1.75rem,6vw,2.5rem)] font-black leading-tight">{t.notFound.title}</h1>
          <p className="max-w-[26rem] text-[17px] font-bold leading-relaxed text-plat-muted [text-wrap:balance]">{t.notFound.body}</p>
          <Link href="/" className="mt-1 flex h-[54px] items-center rounded-xl bg-tile-cream px-8 text-lg font-black text-tile-ink transition hover:brightness-95">
            {t.notFound.home}
          </Link>
          <nav aria-label={t.notFound.browse} className="mt-4 flex flex-col items-center gap-3">
            <p className="text-[14px] font-bold text-plat-muted">{t.notFound.browse}</p>
            <ul className="flex flex-wrap justify-center gap-2">
              {SEASON_NUMBERS.map((n) => (
                <li key={n}>
                  <Link href={season(n)} className="flex h-10 items-center rounded-full bg-plat-surface px-4 text-[15px] font-black transition fine:hover:bg-plat-raised">
                    {seasonTitle[n]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </main>
      </div>
    </Shell>
  );
}
