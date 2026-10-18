import BaghChalClient from '@/components/bagh-chal/BaghChalClient';
import { getMessages } from '@/i18n';
import type { Locale } from '@/i18n/locales';

/**
 * Bagh Chal 的頁面（六個語系共用）。遊戲本體是 client 元件；
 * 下面的「怎麼玩」是給搜尋引擎與第一次玩的人的靜態文字（「bagh chal rules」這類詞要有落地內容）。
 */
export default function BaghChalView({ locale }: { locale: Locale }) {
  const b = getMessages(locale).baghChal;
  return (
    <div className="font-[family-name:var(--font-app)]">
      <BaghChalClient locale={locale} />
      <section className="mx-auto max-w-[520px] px-5 pb-16">
        <h2 className="text-xl font-black">{b.rulesHeading}</h2>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
          {b.rules.map((r) => <li key={r}>{r}</li>)}
        </ol>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">{b.showNote}</p>
      </section>
    </div>
  );
}
