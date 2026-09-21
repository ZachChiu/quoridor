import Link from 'next/link';
import HomeClient from '@/HomeClient';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getMessages } from '@/i18n';
import { localePath, type Locale } from '@/i18n/locales';
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
        <main className="flex w-full max-w-[420px] flex-col items-center">
          <header className="text-center">
            <h1 className="mt-1 text-[clamp(2.25rem,7dvh,3.75rem)] font-black leading-[0.95] tracking-tight">
              {t.home.titleLine1}
              <br />
              {t.home.titleLine2}
            </h1>
            <p className="mt-[max(0.5rem,1.5dvh)] text-sm font-bold text-ink-soft md:text-base">
              {t.home.tagline}
            </p>
          </header>

          <div
            className="mt-[max(1rem,3dvh)] w-full"
            style={{ maxWidth: 'min(380px, calc(100dvh - 22rem))' }}
          >
            <HomeClient />
          </div>

          {/* 規則頁的連結要是真的 <a>，爬蟲才走得過去 ——
              首頁那塊「遊戲規則」磁磚開的是 Modal，對爬蟲等於不存在。 */}
          <div className="mt-[max(0.75rem,2dvh)] flex flex-col items-center gap-2">
            <Link href={localePath(locale, '/rules')} className="text-sm font-bold text-ink-soft underline">
              {t.rules.heading}
            </Link>
            <LanguageSwitcher />
          </div>
        </main>

        <script {...ldScript(pageGraph(locale, 'home'))} />
      </div>
  );
}
