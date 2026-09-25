import HomeClient from '@/HomeClient';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ContactButton from '@/components/ContactButton';
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
  return (
      <div className="flex h-dvh min-h-dvh flex-col items-center justify-center px-5 py-[max(1rem,3dvh)] font-[family-name:var(--font-app)]">
        {/* 地球鈕放右上角而不是磁磚底下 —— 它在流程裡會多吃掉一列高度，
            而首頁的目標是「整頁塞得進一個螢幕」。實測 iPhone 14 Pro
            在網址列展開時（393x659）就是被這一列擠到溢出 46px。 */}
        {/*
          右上角：聯絡我們＋語言切換，水平並排。

          矮手機（360–393 寬、640–670 高）上標題會貼到頂，原本 44px 的兩顆
          離邊 20px 並排，會跟置中的標題水平重疊 10–15px。直排不好看、把整頁
          往下推又會超出一個畫面要捲動（Zach 兩個都不要），所以改成讓這排本身窄一點：
          畫面上 40px、間距 4px、離邊 10px。觸控範圍仍是 44px（按鈕的 ::after
          往外撐 2px，透明）—— 撐出去的那一點蓋到標題也無妨，標題本來就不能點。
        */}
        <div className="fixed right-2.5 top-2.5 z-40 flex gap-1">
          <ContactButton />
          <LanguageSwitcher />
        </div>
        {/* 讓出右上角圓鈕那一列的留白（只在直式）。flex-shrink：畫面夠高時撐滿 3.5rem，
            把置中的標題推到圓鈕下面；不夠高時自己先縮到 0 —— 不會把整頁撐出一個畫面、
            冒出捲軸（Zach 不要捲軸）。容器因此是固定的 h-dvh，shrink 才有作用。 */}
        <div aria-hidden="true" className="hidden h-14 w-px shrink portrait:block" />
        <main className="home-main flex w-full max-w-[420px] flex-col items-center">
          <header className="text-center">
            {/* 直式又很矮（640–680 高的舊手機）時字縮一點：那時留白縮到 0、標題貼到頂，
                右上角的圓鈕會碰到第一行的最後一個字。 */}
            <h1 className="mt-1 text-[clamp(2.25rem,7dvh,3.75rem)] font-black leading-[0.95] tracking-tight [@media(orientation:portrait)_and_(max-height:680px)]:text-[clamp(2.25rem,6.5dvh,3.75rem)]">
              {t.home.titleLine1}
              {/* 第二行是各語系的另一個叫法（中文配 Wall Go、日文配 Wall Go…）。
                  英文沒有第二個叫法，空字串時連換行一起省掉 ——
                  留著 <br> 會在標題下面多撐出一行空白。 */}
              {t.home.titleLine2 && <><br />{t.home.titleLine2}</>}
            </h1>
            <p className="mt-[max(0.5rem,1.5dvh)] text-sm font-bold text-ink-soft md:text-base">
              {t.home.tagline}
            </p>
          </header>

          <div className="home-grid mt-[max(1rem,3dvh)] w-full">
            <HomeClient />
          </div>


        </main>

        <script {...ldScript(pageGraph(locale, 'home'))} />
      </div>
  );
}
