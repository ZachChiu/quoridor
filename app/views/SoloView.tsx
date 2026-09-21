import SoloClient from '@/(default)/solo/SoloClient';
import { getMessages } from '@/i18n';
import type { Locale } from '@/i18n/locales';
import { pageGraph, ldScript } from '@/i18n/jsonld';

/** 單人對戰頁，四語系共用。 */
export default function SoloView({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  return (
    <div className="flex min-h-dvh items-center justify-center overflow-hidden font-[family-name:var(--font-app)]">
      <main className="flex flex-1 items-center justify-center">
        <h1 className="sr-only">{t.solo.srHeading}</h1>
        <SoloClient />
      </main>

      <script {...ldScript(pageGraph(locale, 'solo'))} />
    </div>
  );
}
