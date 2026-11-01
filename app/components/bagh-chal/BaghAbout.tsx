import Link from 'next/link';
import { getMessages } from '@/i18n';
import { localePath, type Locale } from '@/i18n/locales';
import { baghChal } from '@/i18n/routes';

/**
 * 首頁第一屏以下的一小段介紹（11/1 大腦筋，docs/platform-keywords.md）：是什麼、怎麼贏、兩三個技巧，最後連到規則頁。
 * 給搜「bagh chal」「tigers and goats」的人一段讀得到的字；完整規則照舊只在規則頁，這裡不重複（重複的段落 Google 當成內容少）。
 * 樣子跟面板同一張紙：細線隔開、字是墨色，不另外加框。
 */
export default function BaghAbout({ locale }: { locale: Locale }) {
  const b = getMessages(locale).baghChal;
  return (
    <section className="mx-auto w-full max-w-screen-sm border-t border-tile-ink/15 px-5 pb-10 pt-8 text-tile-ink">
      <h2 className="text-xl font-black">{b.aboutHeading}</h2>
      <p className="mt-3 text-[15px] font-medium leading-relaxed">{b.aboutWhat}</p>
      <p className="mt-3 text-[15px] font-bold leading-relaxed">{b.aboutWin}</p>
      <h3 className="mt-6 text-base font-black">{b.aboutTipsTitle}</h3>
      <ul className="mt-2 flex flex-col gap-2">
        {b.aboutTips.map((tip) => (
          <li key={tip} className="flex gap-2.5 text-[15px] font-medium leading-relaxed">
            <span aria-hidden="true" className="mt-[0.55em] size-2 shrink-0 rounded-full bg-[#5b6620]" />
            {tip}
          </li>
        ))}
      </ul>
      <Link href={localePath(locale, baghChal('/rules'))} className="mt-6 inline-block text-sm font-black underline decoration-2 underline-offset-4">
        {b.aboutMore} ›
      </Link>
    </section>
  );
}
