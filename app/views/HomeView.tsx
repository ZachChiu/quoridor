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
      <div className="flex min-h-dvh items-center justify-center px-5 py-[max(1rem,3dvh)] font-[family-name:var(--font-app)]">
        {/* 地球鈕放右上角而不是磁磚底下 —— 它在流程裡會多吃掉一列高度，
            而首頁的目標是「整頁塞得進一個螢幕」。實測 iPhone 14 Pro
            在網址列展開時（393x659）就是被這一列擠到溢出 46px。 */}
        {/* 右上角直排：語言切換在上、聯絡我們在下，同一種圓鈕。
            並排（橫的）會壓到置中的標題 —— 第二顆落在標題的寬度範圍裡；
            拆到左上角又不好看（Zach）。直排兩顆都在同一欄，那一欄在任何
            手機寬度下都在標題右邊，不會重疊。 */}
        <div className="fixed right-5 top-5 z-40 flex flex-col gap-2">
          <LanguageSwitcher />
          <ContactButton />
        </div>
        <main className="home-main flex w-full max-w-[420px] flex-col items-center">
          <header className="text-center">
            <h1 className="mt-1 text-[clamp(2.25rem,7dvh,3.75rem)] font-black leading-[0.95] tracking-tight">
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
