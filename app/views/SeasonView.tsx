import Link from 'next/link';
import { LuChevronLeft } from 'react-icons/lu';
import PlatformLanguageMenu from '@/components/platform/PlatformLanguageMenu';
import PlatformContact from '@/components/platform/PlatformContact';
import GameCard from '@/components/platform/GameCard';
import SelectGameTracker from '@/components/platform/SelectGameTracker';
import PlatformMark from '@/components/PlatformMark';
import { brandName } from '@/brand';
import { SEASON_OF, playableFirst, seasonById } from '@/games/catalog';
import { getMessages } from '@/i18n';
import { SEASON3_TEXT, SEASON3_UPDATED } from '@/i18n/content/season3';
import { earlierPlayable, ldScript, season3Faq, season3Graph } from '@/i18n/jsonld';
import { localePath, type Locale } from '@/i18n/locales';
import { SEASON_NUMBERS, season as seasonPath, type SeasonNumber } from '@/i18n/routes';

/**
 * 季目錄頁（`/season/1`、`/season/2`、`/season/3`）：那一季的全部遊戲排成格子（2026-10-25 Zach：
 * 「點進每一季可以看遊戲的目錄」，Netflix 的分類頁）。外殼跟平台首頁同一套（深色＋紅、同一個頁首頁尾）。
 *
 * 能玩的排前面、其他照節目播出順序（跟首頁各季那排同一個 `playableFirst`）。原本整頁照播出順序，
 * 能玩的散在格子裡，10/25 Zach：「可以玩的遊戲要往上面排」。
 * 上方一排三顆切換各季（目前這季實心），手機上也點得到，不必回首頁。按鈕只寫「第 N 季」：
 * 原本寫完整季名，手機上擠成兩行、選中那顆又跟底下的大標題同一句（10/25 Zach 從三種排法挑了 A；
 * 另兩種是標題下一條分頁線、標題本身當選單）。
 *
 * 第 3 季頁開播前多四塊（docs/season3-page.md，11/3）：介紹、先玩前兩季的遊戲、開播後怎麼更新、常見問題（＋FAQPage）。
 * 原本只有「敬請期待」，但已經有人在搜第 3 季、點進來沒東西看。文案在 content/season3.ts，開播後每次整理改那一份。
 * 其他季的切換鈕上，第 3 季那顆帶上線日期（11/10 上線），從前兩季也找得到。
 */
const H2 = 'text-[21px] font-black';
const BODY = 'max-w-[68ch] text-[16px] font-medium leading-relaxed text-tile-cream/85';

/** 「最後更新：11/3」：日期照各語系的寫法（en、th 用月份縮寫） */
function updatedLabel(locale: Locale) {
  const date = new Date(`${SEASON3_UPDATED}T00:00:00`);
  const month = locale === 'en' || locale === 'th' ? 'short' : 'numeric';
  return SEASON3_TEXT[locale].updated.replace('{date}', new Intl.DateTimeFormat(locale, { month, day: 'numeric' }).format(date));
}
export default function SeasonView({ locale, n }: { locale: Locale; n: SeasonNumber }) {
  const p = getMessages(locale).platform;
  const s = seasonById(n);
  const title = { s1: p.s1, s2: p.s2, s3: p.s3 } as const;
  const playable = s.games.filter((g) => g.playable).length;

  return (
    <div className="platform-root min-h-dvh bg-plat-bg font-[family-name:var(--font-app)] text-tile-cream">
      <header className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 p-4">
        <Link href={localePath(locale, '/')} aria-label={brandName(locale)} title={brandName(locale)} className="transition hover:brightness-110">
          <PlatformMark />
        </Link>
        <PlatformLanguageMenu />
      </header>

      <main className="mx-auto flex max-w-[1360px] flex-col gap-6 px-4 pb-14">
        <nav className="flex flex-col gap-4">
          <Link href={localePath(locale, '/')} className="flex items-center gap-1 self-start text-[15px] font-bold text-plat-muted transition fine:hover:text-tile-cream">
            <LuChevronLeft aria-hidden="true" className="text-[20px]" />{p.allGames}
          </Link>
          {/* 320 寬的手機上英文、日文三顆擠不下：字與內距跟著畫面縮，真的還放不下才換行（不超出畫面） */}
          <ul className="flex flex-wrap gap-2">
            {SEASON_NUMBERS.map((m) => (
              <li key={m}>
                <Link href={localePath(locale, seasonPath(m))} aria-current={m === n ? 'page' : undefined}
                  className={`flex h-10 items-center whitespace-nowrap rounded-full px-[clamp(10px,3.5vw,16px)] text-[clamp(13px,4vw,15px)] font-black transition ${m === n ? 'bg-tile-cream text-tile-ink' : 'bg-plat-surface text-tile-cream fine:hover:bg-plat-raised'}`}>
                  {p.seasonShort.replace('{n}', m)}
                  {m === '3' && n !== '3' && (
                    <span className="ms-2 rounded bg-brand-red px-1.5 py-px text-[12px] font-black text-white">{p.s3Badge}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-2">
          <h1 className="flex flex-wrap items-center gap-3 text-[clamp(32px,5vw,52px)] font-black leading-tight">
            {title[s.id]}
            {s.id === 's3' && (
              <span className="rounded-md bg-brand-red px-2.5 py-0.5 text-[15px] font-black text-white">{p.s3Badge}</span>
            )}
          </h1>
          <p className="text-[15px] font-bold text-plat-muted">
            {[String(s.year), ...(s.games.length ? [p.seasonCount.replace('{n}', String(s.games.length))] : []), ...(playable ? [p.seasonPlayable.replace('{n}', String(playable))] : [])].join(' · ')}
          </p>
          {s.id === 's3' && (
            <>
              <p className={`${BODY} mt-2`}>{SEASON3_TEXT[locale].intro}</p>
              <p className="text-[13px] font-bold text-plat-muted">
                <time dateTime={SEASON3_UPDATED}>{updatedLabel(locale)}</time>
              </p>
            </>
          )}
        </div>

        {/* 只有還沒播的第 3 季是空的：它的位置由下面的介紹與「先玩前兩季」接住，不放「敬請期待」 */}
        {s.games.length > 0 && (
          <ul data-select-location="season" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {playableFirst(s.games).map((game) => (
              <li key={game.name}>
                <GameCard game={game} locale={locale} playable={p.playable} guide={p.guide} want={p.want} width="w-full" />
              </li>
            ))}
          </ul>
        )}

        {s.id === 's3' && <Season3Sections locale={locale} />}

        <footer className="mt-3 flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-tile-cream/15 pt-5 text-[13px] font-medium leading-relaxed text-plat-muted">
          <span>{p.disclaimer}</span>
          <PlatformContact />
        </footer>
      </main>
      <SelectGameTracker seasons={SEASON_OF} />
      {s.id === 's3' && <script {...ldScript(season3Graph(locale))} />}
    </div>
  );
}

/** 第 3 季頁開播前的三塊：先玩前兩季的遊戲、開播後怎麼更新、常見問題 */
function Season3Sections({ locale }: { locale: Locale }) {
  const p = getMessages(locale).platform;
  const t = SEASON3_TEXT[locale];
  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className={H2}>{t.playTitle}</h2>
        <p className={BODY}>{t.playNote}</p>
        <ul data-select-location="season" className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {earlierPlayable().map((game) => (
            <li key={game.name} className="flex flex-col gap-2">
              <GameCard game={game} locale={locale} playable={p.playable} guide={p.guide} want={p.want} width="w-full" />
              {game.playable && t.lines[game.playable] && (
                <p className="text-[14px] font-medium leading-snug text-plat-muted">{t.lines[game.playable]}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={H2}>{t.updateTitle}</h2>
        <p className={BODY}>{t.updateBody}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={H2}>{t.faqTitle}</h2>
        <dl className="flex max-w-[68ch] flex-col gap-3">
          {season3Faq(locale).map((f) => (
            <div key={f.q} className="rounded-xl bg-plat-surface px-5 py-4">
              <dt className="text-[16px] font-black">{f.q}</dt>
              <dd className="mt-1.5 text-[15px] font-medium leading-relaxed text-tile-cream/80">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
