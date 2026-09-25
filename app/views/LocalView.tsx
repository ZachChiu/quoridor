import PlayClient from '@/components/PlayClient';
import { getMessages } from '@/i18n';
import type { Locale } from '@/i18n/locales';

/**
 * 本機對戰畫面，四語系共用。
 *
 * 人數由路由給（`/local/3`），不是從 GameContext 讀 —— context 的值
 * 重整就沒了，而且伺服器端不知道，靜態 HTML 會先畫一次兩人盤。
 * 走路由的話建置時就定了，第一幀就是對的。
 */
export default function LocalView({ locale, playersNum = 2 }: { locale: Locale; playersNum?: 2 | 3 }) {
  const t = getMessages(locale);
  return (
    <div className="flex min-h-dvh items-center justify-center gap-16 overflow-hidden font-[family-name:var(--font-app)]">
      <main className="flex flex-1 items-center justify-center gap-8 self-stretch">
        <h1 className="sr-only">{t.local.srHeading}</h1>
        <PlayClient playersNum={playersNum} />
      </main>
    </div>
  );
}
