import PlayClient from '@/components/PlayClient';
import { getMessages } from '@/i18n';
import type { Locale } from '@/i18n/locales';

/** 本機對戰畫面，四語系共用。 */
export default function LocalView({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  return (
    <div className="flex min-h-dvh items-center justify-center gap-16 overflow-hidden font-[family-name:var(--font-app)]">
      <main className="flex flex-1 items-center justify-center gap-8">
        <h1 className="sr-only">{t.local.srHeading}</h1>
        <PlayClient />
      </main>
    </div>
  );
}
