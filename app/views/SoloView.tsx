import Link from 'next/link';
import SoloClient from '@/(default)/solo/SoloClient';
import { getMessages } from '@/i18n';
import { localePath, type Locale } from '@/i18n/locales';
import { breadcrumbLd, ldScript } from '@/i18n/jsonld';

/** 單人對戰頁，四語系共用。 */
export default function SoloView({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  return (
    <div className="flex min-h-dvh items-center justify-center overflow-hidden font-[family-name:var(--font-app)]">
      {/* 可見的麵包屑。BreadcrumbList 的標記應該對得上畫面上真的存在的
          導覽 —— 只寫 JSON-LD 而畫面沒有，屬於「標記與內容不符」。 */}
      <nav aria-label={t.crumb.home} className="fixed left-5 top-5 z-40 text-sm font-bold text-ink-soft">
        <Link href={localePath(locale, '/')} className="underline hover:opacity-70">
          {t.crumb.home}
        </Link>
        <span className="mx-2 opacity-50">/</span>
        <span aria-current="page">{t.solo.metaTitle}</span>
      </nav>

      <main className="flex flex-1 items-center justify-center">
        <h1 className="sr-only">{t.solo.srHeading}</h1>
        <SoloClient />
      </main>

      <script {...ldScript(breadcrumbLd(locale, [{ name: t.solo.metaTitle, path: '/solo' }]))} />
    </div>
  );
}
