import HomeClient from '@/HomeClient';
import GameHomeBar from '@/components/GameHomeBar';
import { getMessages } from '@/i18n';
import type { Locale } from '@/i18n/locales';
import { pageGraph, ldScript } from '@/i18n/jsonld';


/**
 * 首頁的版面，四個語系共用。
 *
 * zh-TW 走 /（app/page.tsx），其餘走 /{locale}（app/[locale]/page.tsx），
 * 兩邊都只是薄殼。把版面複製兩份的話，改一個字要記得改兩個地方，
 * 而忘記的那一份不會壞、只會默默過時。
 */
export default function HomeView({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  // 直式（手機）放不下就往下捲；橫式（桌機、橫放手機）照舊固定一屏 ——
  // 1280x720 的桌機靠吃掉一點上下留白剛好塞得下，放開會多出一小段捲動。
  return (
      <div className="flex min-h-dvh flex-col items-center px-5 pb-[max(1rem,3svh)] pt-2.5 font-[family-name:var(--font-app)] landscape:h-dvh">
        {/* 最上面一列：平台 logo、聯絡我們＋語言（GameHomeBar），跟內容同寬、排在流裡
            （11/3 Zach：跟時間拍賣一樣、不要浮著）。先前釘在角落，直式要另外留 3.5rem 閃它。
            畫面不夠高就往下捲（10/25 Zach：「不用這麼執著一定要塞在手機版小小的畫面內」）。 */}
        <GameHomeBar locale={locale} className="home-bar max-w-[420px]" />
        <main className="home-main my-auto flex w-full max-w-[420px] flex-col items-center pt-3 landscape:pt-0">
          <header className="text-center">
            <h1 className="mt-1 text-[clamp(2.25rem,7svh,3.75rem)] font-black leading-[0.95] tracking-tight">
              {t.home.titleLine1}
              {/* 第二行是各語系的另一個叫法（中文配 Wall Go、日文配 Wall Go…）。
                  英文沒有第二個叫法，空字串時連換行一起省掉 ——
                  留著 <br> 會在標題下面多撐出一行空白。 */}
              {t.home.titleLine2 && <><br />{t.home.titleLine2}</>}
            </h1>
            <p className="mt-[max(0.5rem,1.5svh)] text-sm font-bold text-ink-soft md:text-base">
              {t.home.tagline}
            </p>
          </header>

          <div className="home-grid mt-[max(1rem,3svh)] w-full">
            <HomeClient />
          </div>


        </main>

        <script {...ldScript(pageGraph(locale, 'home'))} />
      </div>
  );
}
