import Link from 'next/link';
import TutorialBoard from '@/components/TutorialBoard';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { STEPS } from '@/components/tutorialSteps';
import { STEP_TEXT } from '@/i18n/content/steps';
import { FAQ_TEXT } from '@/i18n/content/faq';
import { getMessages } from '@/i18n';
import { localePath, type Locale } from '@/i18n/locales';
import { pageGraph, ldScript } from '@/i18n/jsonld';

/**
 * 規則說明頁，四語系共用。
 *
 * 規則原本只存在於遊玩方式 Modal 裡 —— 那是 JS 開起來的對話框，
 * 爬蟲看不到。抽成真實頁面之後，「牆壁圍棋怎麼玩」這類查詢才有東西可以命中。
 *
 * 圖來自 STEPS（不分語言），文字來自 STEP_TEXT[locale]。兩邊的長度
 * 由 tests/i18n/content.test.ts 鎖住，對不上就會在測試裡爆，
 * 而不是在某個語系的頁面上開天窗。
 */
export default function RulesView({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  const steps = STEP_TEXT[locale];
  const faq = FAQ_TEXT[locale];

  return (
      <div className="mx-auto max-w-[46rem] px-5 py-[max(2rem,5dvh)] font-[family-name:var(--font-app)]">
        <header>
          <p className="text-sm font-bold text-ink-soft">{t.rules.kicker}</p>
          <h1 className="mt-1 text-[clamp(1.75rem,7vw,3rem)] font-black leading-[1.1] tracking-tight">
            {t.rules.heading}
          </h1>
          <p className="mt-4 text-base leading-relaxed">{t.rules.intro}</p>
        </header>

        <ol className="mt-10 space-y-10">
          {STEPS.map((step, i) => (
            <li key={i} className="grid gap-5 md:grid-cols-[200px_1fr] md:items-start">
              <div className="mx-auto w-full max-w-[200px]">
                <TutorialBoard {...step.board} />
              </div>
              <div>
                <h2 className="text-xl font-black leading-snug">
                  <span className="mr-2 text-ink-soft">{i + 1}.</span>
                  {steps[i].title}
                </h2>
                <p className="mt-2 text-base leading-relaxed">{steps[i].body}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-14">
          <h2 className="text-2xl font-black tracking-tight">{t.rules.faqHeading}</h2>
          <dl className="mt-5 space-y-6">
            {faq.map((item) => (
              <div key={item.q}>
                <dt className="text-lg font-black leading-snug">{item.q}</dt>
                <dd className="mt-1.5 text-base leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href={localePath(locale, '/')}
                className="rounded-2xl bg-tile-amber px-6 py-4 text-lg font-black text-tile-ink transition hover:brightness-95">
            {t.rules.ctaPlay}
          </Link>
          <Link href={localePath(locale, '/solo')}
                className="rounded-2xl bg-tile-orange px-6 py-4 text-lg font-black text-tile-ink transition hover:brightness-95">
            {t.rules.ctaSolo}
          </Link>
        </div>

        <div className="mt-10 flex flex-col items-start gap-3">
          <LanguageSwitcher />
          <p className="text-[11px] leading-relaxed text-ink-soft">
            {t.credits.prefix}{' '}
            <a className="underline" href="https://game-icons.net" target="_blank" rel="noopener noreferrer">game-icons.net</a>
            {t.credits.middle}{' '}
            <a className="underline" href="https://lucide.dev" target="_blank" rel="noopener noreferrer">Lucide</a>
            {t.credits.suffix}
          </p>
        </div>

        <script {...ldScript(pageGraph(locale, 'rules'))} />
      </div>
  );
}
