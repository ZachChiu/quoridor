import { GiHouse } from 'react-icons/gi';
import TutorialBoard from '@/components/TutorialBoard';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import TransitionLink from '@/components/TransitionLink';
import { STEPS } from '@/components/tutorialSteps';
import { STEP_TEXT } from '@/i18n/content/steps';
import { FAQ_TEXT } from '@/i18n/content/faq';
import { getMessages } from '@/i18n';
import { localePath, type Locale } from '@/i18n/locales';
import { pageGraph, ldScript } from '@/i18n/jsonld';

/**
 * 規則說明頁，四語系共用。
 *
 * 規則原本只存在於遊玩方式 Modal 裡 —— JS 開起來的對話框，爬蟲看不到。
 * 抽成真實頁面之後，「牆壁圍棋怎麼玩」這類查詢才有東西可以命中。
 *
 * ── 版面 ──────────────────────────────────────────────────────
 *
 * 上一版是「浮在內容上的圓鈕 + 一長串左右分欄」，兩個問題：
 * 浮動的鈕會蓋到標題，只好把整段內容往右推，於是文字欄變窄又偏心；
 * 八個步驟一路捲下去沒有節奏，讀到第五步就不知道自己在哪。
 *
 * 改成：置頂列（不浮動，內容不必讓位）＋ 步驟卡片（每張有編號徽章與
 * 自己的底色，捲動時看得出一張一張過去）。
 *
 * 圖來自 STEPS（不分語言），文字來自 STEP_TEXT[locale]，
 * 長度由 tests/i18n/content.test.ts 鎖住。
 */

/** 破牆那一步只有三人局有，用不同的色帶標出來 —— 它不適用於所有人。 */
const THREE_PLAYER_STEP = 6;

export default function RulesView({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  const steps = STEP_TEXT[locale];
  const faq = FAQ_TEXT[locale];
  const home = localePath(locale, '/');

  return (
    <div className="min-h-dvh font-[family-name:var(--font-app)]">
      {/*
        置頂列。用 sticky 而不是 fixed：它會佔住自己的高度，
        底下的內容不必為了避開它而縮排 —— 上一版就是為了避開浮動的鈕
        把整段文字往右推，結果文字欄又窄又偏。
      */}
      <header className="bg-primary/95 sticky top-0 z-40 border-b-2 border-tile-ink/[0.07] backdrop-blur">
        <div className="mx-auto flex max-w-[46rem] items-center gap-3 px-4 py-2.5">
          <TransitionLink
            href={home}
            color="rgb(var(--tile-cream))"
            radius={24}
            aria-label={t.nav.backHome}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-50 text-xl text-tile-ink transition hover:brightness-95"
          >
            <GiHouse />
          </TransitionLink>
          <span className="min-w-0 flex-1 truncate text-sm font-black">{t.rules.metaTitle}</span>
          <LanguageSwitcher placement="down" />
        </div>
      </header>

      <div className="mx-auto max-w-[46rem] px-5 pb-[max(3rem,6dvh)] pt-8">
        <header>
          <p className="text-sm font-bold text-ink-soft">{t.rules.kicker}</p>
          <h1 className="mt-1 text-[clamp(1.75rem,7vw,3rem)] font-black leading-[1.1] tracking-tight">
            {t.rules.heading}
          </h1>
          <p className="mt-4 whitespace-pre-line text-base leading-relaxed">{t.rules.intro}</p>
        </header>

        {/* 一步一張卡片。捲動時有節奏，也看得出「還有幾張」。 */}
        <ol className="mt-8 space-y-4">
          {STEPS.map((step, i) => {
            const threeOnly = i === THREE_PLAYER_STEP;
            return (
              <li
                key={i}
                className={`rounded-2xl p-4 md:p-5 ${threeOnly ? 'bg-tile-amber/[0.18]' : 'bg-primary-50'}`}
              >
                <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-start">
                  <div className="mx-auto w-full max-w-[180px] md:mx-0">
                    <TutorialBoard {...step.board} />
                  </div>
                  <div>
                    <h2 className="flex items-start gap-2.5 text-lg font-black leading-snug md:text-xl">
                      <span
                        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs ${
                          threeOnly ? 'bg-tile-amber text-tile-ink' : 'bg-tile-ink text-tile-cream'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span>{steps[i].title}</span>
                    </h2>
                    <p className="mt-2 whitespace-pre-line text-base leading-relaxed">{steps[i].body}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <section className="mt-12">
          <h2 className="text-2xl font-black tracking-tight">{t.rules.faqHeading}</h2>
          <dl className="mt-4 space-y-3">
            {faq.map((item) => (
              <div key={item.q} className="rounded-2xl bg-primary-50 p-4 md:p-5">
                <dt className="text-base font-black leading-snug md:text-lg">{item.q}</dt>
                <dd className="mt-1.5 text-base leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 整排寬的長條。讀完一長頁之後的唯一出口，不該是一顆小按鈕。 */}
        <TransitionLink
          href={home}
          color="rgb(var(--tile-amber))"
          radius={16}
          className="mt-10 flex w-full items-center justify-center rounded-2xl bg-tile-amber px-6 py-5 text-lg font-black text-tile-ink transition hover:brightness-95 active:scale-[0.99]"
        >
          {t.rules.ctaPlay}
        </TransitionLink>

        <p className="mt-8 text-[11px] leading-relaxed text-ink-soft">
          {t.credits.prefix}{' '}
          <a className="underline" href="https://game-icons.net" target="_blank" rel="noopener noreferrer">game-icons.net</a>
          {t.credits.middle}{' '}
          <a className="underline" href="https://lucide.dev" target="_blank" rel="noopener noreferrer">Lucide</a>
          {t.credits.suffix}
        </p>

        <script {...ldScript(pageGraph(locale, 'rules'))} />
      </div>
    </div>
  );
}
