import Link from 'next/link';
import { GiHourglass } from 'react-icons/gi';
import { LuChevronLeft } from 'react-icons/lu';
import PlatformLanguageMenu from '@/components/platform/PlatformLanguageMenu';
import PlatformContact from '@/components/platform/PlatformContact';
import GameCard from '@/components/platform/GameCard';
import PlatformMark from '@/components/PlatformMark';
import { brandName } from '@/brand';
import { seasonById } from '@/games/catalog';
import { getMessages } from '@/i18n';
import { localePath, type Locale } from '@/i18n/locales';
import { SEASON_NUMBERS, season as seasonPath, type SeasonNumber } from '@/i18n/routes';

/**
 * 季目錄頁（`/season/1`、`/season/2`、`/season/3`）：那一季的全部遊戲排成格子（2026-10-25 Zach：
 * 「點進每一季可以看遊戲的目錄」，Netflix 的分類頁）。外殼跟平台首頁同一套（深色＋紅、同一個頁首頁尾）。
 *
 * 照節目播出順序排，不把能玩的提到前面 —— 這一頁是「這一季有哪些遊戲」，首頁那一排才是「現在能玩什麼」。
 * 上方一排三顆切換各季（目前這季實心），手機上也點得到，不必回首頁。按鈕只寫「第 N 季」：
 * 原本寫完整季名，手機上擠成兩行、選中那顆又跟底下的大標題同一句（10/25 Zach 從三種排法挑了 A；
 * 另兩種是標題下一條分頁線、標題本身當選單）。
 */
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
        </div>

        {s.games.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-plat-surface px-5 py-6 text-[15px] font-bold text-plat-muted">
            <GiHourglass aria-hidden="true" className="shrink-0 text-3xl text-brand-red" />
            {p.s3Empty}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {s.games.map((game) => (
              <li key={game.name}>
                <GameCard game={game} locale={locale} playable={p.playable} guide={p.guide} width="w-full" />
              </li>
            ))}
          </ul>
        )}

        <footer className="mt-3 flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-tile-cream/15 pt-5 text-[13px] font-medium leading-relaxed text-plat-muted">
          <span>{p.disclaimer}</span>
          <PlatformContact />
        </footer>
      </main>
    </div>
  );
}
