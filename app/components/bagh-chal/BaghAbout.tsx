import { getMessages } from '@/i18n';
import type { Locale } from '@/i18n/locales';

/**
 * 規則頁步驟底下的一小段介紹（11/1 大腦筋，docs/platform-keywords.md）：是什麼、兩三個技巧（怎麼贏就是上面第 4 步，不重複）。
 * 給搜「bagh chal」「tigers and goats」的人一段讀得到的字。原本放在首頁第一屏以下、最後連到規則頁，同一天 Zach 要搬進規則頁。
 * 樣子跟面板同一張紙：細線隔開、字是墨色，不另外加框。
 */
export default function BaghAbout({ locale }: { locale: Locale }) {
  const b = getMessages(locale).baghChal;
  return (
    <section className="border-t border-tile-ink/15 pt-8 text-tile-ink">
      <h2 className="text-xl font-black">{b.aboutHeading}</h2>
      <p className="mt-3 text-[15px] font-medium leading-relaxed">{b.aboutWhat}</p>
      <h3 className="mt-6 text-base font-black">{b.aboutTipsTitle}</h3>
      <ul className="mt-2 flex flex-col gap-2">
        {b.aboutTips.map((tip) => (
          <li key={tip} className="flex gap-2.5 text-[15px] font-medium leading-relaxed">
            <span aria-hidden="true" className="mt-[0.55em] size-2 shrink-0 rounded-full bg-[#5b6620]" />
            {tip}
          </li>
        ))}
      </ul>
    </section>
  );
}
