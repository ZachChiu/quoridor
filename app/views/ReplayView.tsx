import ReplayClient from '@/components/ReplayClient';
import { getMessages } from '@/i18n';
import type { Locale } from '@/i18n/locales';

/** 棋譜回放畫面，四語系共用。 */
export default function ReplayView({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  return (
    <div className="flex min-h-dvh items-center justify-center overflow-hidden font-[family-name:var(--font-app)]">
      <main className="flex flex-1 items-center justify-center">
        <h1 className="sr-only">{t.replay.srHeading}</h1>
        <ReplayClient />
      </main>
    </div>
  );
}
