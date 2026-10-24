import HomeClient from '@/HomeClient';
import PlatformCorner from '@/components/PlatformCorner';
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
      <div className="flex h-dvh min-h-dvh flex-col items-center justify-center px-5 py-[max(1rem,3svh)] font-[family-name:var(--font-app)]">
        {/*
          左上平台 logo、右上聯絡我們＋語言（PlatformCorner）。
          放角落而不是磁磚底下：這些東西不能放進流程裡多吃一列高度，
          首頁的目標是「整頁塞得進一個螢幕」（iPhone 14 Pro 網址列展開時 393x659）。
        */}
        <PlatformCorner locale={locale} />
        {/* 讓出角落那排（logo 與圓鈕）的留白（只在直式）。flex-shrink：畫面夠高時撐滿 3.5rem，
            把置中的標題推到角落下面；不夠高時自己先縮到 0 —— 不會把整頁撐出一個畫面、
            冒出捲軸（Zach 不要捲軸），磁磚也維持原本的大小（Zach：不要把磁磚變窄）。
            縮到 0 時標題會貼到頂，左上的 logo 在矮畫面上會跟著縮小讓開（見 PlatformCorner）。
            容器因此是固定的 h-dvh，shrink 才有作用。 */}
        <div aria-hidden="true" className="hidden h-14 w-px shrink portrait:block" />
        <main className="home-main flex w-full max-w-[420px] flex-col items-center">
          <header className="text-center">
            {/* 直式又很矮（640–680 高的舊手機）時字縮一點：那時留白縮到 0、標題貼到頂，
                右上角的圓鈕會碰到第一行的最後一個字。 */}
            <h1 className="mt-1 text-[clamp(2.25rem,7svh,3.75rem)] font-black leading-[0.95] tracking-tight [@media(orientation:portrait)_and_(max-height:680px)]:text-[clamp(2.25rem,6.5svh,3.75rem)]">
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
