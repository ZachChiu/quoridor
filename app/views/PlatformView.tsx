import Link from 'next/link';
import { GiHourglass } from 'react-icons/gi';
import { LuChevronRight, LuInfo, LuPlay } from 'react-icons/lu';
import WipeLink from '@/components/WipeLink';
import PlatformLanguageMenu from '@/components/platform/PlatformLanguageMenu';
import PlatformContact from '@/components/platform/PlatformContact';
import HeroPicker from '@/components/platform/HeroPicker';
import CardRow from '@/components/platform/CardRow';
import GameCard from '@/components/platform/GameCard';
import SelectGameTracker from '@/components/platform/SelectGameTracker';
import GameName from '@/components/platform/GameName';
import { brandName } from '@/brand';
import PlatformMark from '@/components/PlatformMark';
import { HERO_DEFAULT, PLAYABLE, SEASONS, SEASON_OF, playableFirst, type CatalogGame } from '@/games/catalog';
import { getMessages } from '@/i18n';
import { localePath, type Locale } from '@/i18n/locales';
import { BAGH_CHAL, WALL_GO, season as seasonPath, type SeasonNumber } from '@/i18n/routes';
import { BLURBS } from '@/games/blurbs';
import { pageGraph, ldScript } from '@/i18n/jsonld';

/**
 * 平台首頁（`/`）：《魔鬼的計謀》節目遊戲總覽，六個語系共用。
 *
 * 外殼是 Netflix 式的深色＋紅（Zach 指定），上面一個推薦作品的大區塊，下面依季一排一排橫向捲動，
 * 播出中（或即將播出）的那一季排最上面。**各遊戲保留自己的視覺**：Wall Go 的主視覺是
 * 它自己頁面底色（#e8e1d7）上的棋盤，點進 /wall-go/ 之後就是原本的平塗撞色。
 *
 * 只有做成線上版的遊戲是有顏色、可以點的卡片；其他是深色卡片、不是連結 ——
 * 規則整理頁還沒做，給一個點了沒東西的連結比不給更糟。
 *
 * 不用 Netflix 的「N」標誌、字標與專屬字型：版面形式可以參考，品牌識別不能借。
 */
export default function PlatformView({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  const p = t.platform;
  const seasonTitle = { s1: p.s1, s2: p.s2, s3: p.s3 } as const;

  return (
    <div className="platform-root min-h-dvh bg-plat-bg font-[family-name:var(--font-app)] text-tile-cream">
      <header className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 p-4">
        {/* 只放骰子 logo、不放平台名（Zach：有 LOGO 了）。跟遊戲首頁左上那顆同一個圖示、同一個位置 */}
        <Link href={localePath(locale, '/')} aria-label={brandName(locale)} title={brandName(locale)} className="transition hover:brightness-110">
          <PlatformMark />
        </Link>
        {/* 平台自己的元件（components/platform/），不是 Wall Go 的圓鈕與奶油底 Modal。
            聯絡我們放到頁尾當文字連結 */}
        <PlatformLanguageMenu />
      </header>

      <main className="mx-auto flex max-w-[1360px] flex-col gap-9 px-4 pb-14">
        <h1 className="sr-only">{p.heading}</h1>

        {/* 推薦作品：預設是 HERO_DEFAULT（現在是 Wall Go，見 catalog；原本是最新上線的那款），使用者點過哪一款就換成那一款（10/24 Zach）。
            每一款能玩的都有一張在 HTML 裡，外層的 data-hero-pick 決定露出哪張；換的那段在 HeroPicker。
            suppressHydrationWarning：data-hero-pick 會在 hydrate 之前被內嵌 script 換掉 */}
        <div data-hero-pick={HERO_DEFAULT?.playable} data-select-location="home_hero" suppressHydrationWarning>
          <style dangerouslySetInnerHTML={{ __html: PLAYABLE.map((g) => `[data-hero-pick="${g.playable}"]>[data-slide]:not([data-slide="${g.playable}"]){display:none}`).join('') }} />
          {PLAYABLE.map((game) => <GameHero key={game.name} game={game} locale={locale} />)}
          <HeroPicker />
        </div>

        {/* 現在就能玩：已經做成線上版的遊戲集中一排（各季那幾排裡也有，Netflix 的排與排本來就會重複） */}
        <section id="play-now" data-select-location="home_grid" className="flex flex-col gap-3">
          <h2 className="text-[21px] font-black">{p.heroBadge}</h2>
          <CardRow>
            {PLAYABLE.map((game) => (
              <li key={game.name} className="shrink-0">
                <GameCard game={game} locale={locale} playable={p.playable} guide={p.guide} want={p.want} />
              </li>
            ))}
          </CardRow>
        </section>

        {SEASONS.map((season) => (
          <section key={season.id} id={`season-${season.id.slice(1)}`} data-select-location="home_grid" className="flex flex-col gap-3">
            {/* 標題連到這一季的目錄頁（10/25 Zach：每一季一個目錄頁）。「看全部」一直看得到 —— 手機沒有 hover */}
            <h2 className="flex flex-wrap items-center gap-2.5 text-[21px] font-black">
              <Link href={localePath(locale, seasonPath(season.id.slice(1) as SeasonNumber))} className="group flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {seasonTitle[season.id]}
                {season.id === 's3' && (
                  <span className="rounded-md bg-brand-red px-2.5 py-0.5 text-[13px] font-black text-white">{p.s3Badge}</span>
                )}
                <span className="flex items-center text-[14px] font-bold text-plat-muted transition fine:group-hover:text-tile-cream">
                  {p.seeAll}<LuChevronRight aria-hidden="true" className="text-[18px] transition fine:group-hover:translate-x-0.5" />
                </span>
              </Link>
            </h2>
            {season.games.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-plat-surface px-5 py-6 text-[15px] font-bold text-plat-muted">
                <GiHourglass aria-hidden="true" className="shrink-0 text-3xl text-brand-red" />
                {p.s3Empty}
              </div>
            ) : (
              <CardRow>
                {playableFirst(season.games).map((game) => (
                  <li key={game.name} className="shrink-0">
                    <GameCard game={game} locale={locale} playable={p.playable} guide={p.guide} want={p.want} />
                  </li>
                ))}
              </CardRow>
            )}
          </section>
        ))}

        <footer className="flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-tile-cream/15 pt-5 text-[13px] font-medium leading-relaxed text-plat-muted">
          <span>{p.disclaimer}</span>
          <PlatformContact />
        </footer>
      </main>

      <script {...ldScript(pageGraph(locale, 'platform'))} />
      {/* 點了哪一區的哪張卡（GA 的 select_game）：上面幾區的 data-select-location */}
      <SelectGameTracker seasons={SEASON_OF} />
    </div>
  );
}

/**
 * 大卡片的高度（10/24 Zach：上面的大卡片縮小一點點 —— 原本手機 680、桌機最高 640）。
 * 手機上文字區塊幾乎跟畫面一樣寬，區塊要夠高主視覺才露得出來。
 */
const HERO = 'relative flex min-h-[600px] overflow-hidden rounded-3xl md:min-h-[min(560px,max(460px,48vw))]';

/**
 * 大卡片：大圖鋪滿，字壓在黑色漸層上（跟下面的卡片同一個做法）。各款的說明：Wall Go、虎棋在 platform 文案裡，第二批五款在 games/blurbs.ts，沒有就只放名字。
 * Wall Go 原本有自己的一張（藍底、字放在藍色色塊上），10/25 Zach 要它跟虎羊棋一樣：底色用 Wall Go 自己的頁面底色、字壓黑色漸層
 */
function GameHero({ game, locale }: { game: CatalogGame; locale: Locale }) {
  const t = getMessages(locale);
  const p = t.platform;
  const look = game.look!;
  const wallGoGame = game.playable === WALL_GO;
  const blurb = BLURBS[game.playable!]?.[locale];
  const copy = wallGoGame ? [p.heroMeta, p.heroBody] : game.playable === BAGH_CHAL ? [p.baghHeroMeta, p.baghHeroBody] : blurb ? [blurb.meta, blurb.body] : null;
  // Wall Go 的標題照舊是首頁那兩行（中文名＋Wall Go）；規則頁頂部是森綠，進規則頁就擴散森綠
  const title = wallGoGame ? <>{t.home.titleLine1}{t.home.titleLine2 && <><br />{t.home.titleLine2}</>}</> : <GameName game={game} locale={locale} sub={{ mark: 0.42, font: 'text-[0.5em]' }} swap={0.9} />;
  const rulesWipe = wallGoGame ? RULES_GREEN : look.wipe;
  return (
    <section data-slide={game.playable} className={`${HERO} flex-col bg-black md:flex-row md:items-end`}>
      {/* 手機：方圖放在上面，字往上蓋住圖的下半、壓在黑色漸層上（10/25 Zach 給了 Netflix 手機版的截圖：「資訊往上蓋沒關係」）。
          10/24 先改成過字整段接在圖下面 —— 那時圖是橫幅，鋪在字後面只剩老虎；現在是方圖，蓋掉下面一截也看得到整盤。
          桌機：橫幅鋪滿、字在左邊 */}
      <div className={`relative w-full shrink-0 md:absolute md:inset-0 md:aspect-auto md:h-full ${look.heroSquare ? 'aspect-square' : 'aspect-[4/3]'}`}>
        <picture>
          {look.heroSquare && <source media="(max-width: 767px)" srcSet={look.heroSquare} />}
          <img src={look.hero ?? look.art} alt="" loading="lazy" className="pointer-events-none absolute inset-0 size-full object-cover" />
        </picture>
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black from-25% via-black/70 to-transparent md:hidden" />
      </div>
      <span aria-hidden="true" className="absolute inset-0 hidden bg-gradient-to-r from-black/85 from-0% via-black/45 via-40% to-transparent to-100% md:block" />
      <div className="relative mt-[-38%] flex max-w-[560px] flex-col gap-4 p-[clamp(24px,4vw,56px)] md:mt-0">
        <span className="self-start rounded-md bg-brand-red px-2.5 py-0.5 text-[13px] font-black text-white">{p.heroBadge}</span>
        <h2 className="text-[clamp(44px,6vw,84px)] font-black leading-[0.95] tracking-tight">{title}</h2>
        {copy && <p className="text-[15px] font-bold">{copy[0]}</p>}
        {copy && <p className="text-[19px] font-bold leading-relaxed">{copy[1]}</p>}
        {/* 手機：兩顆按鈕一顆一列、拉滿寬（10/25 Zach：「開始玩跟規則那個可以寬滿版拉長」，跟 Netflix 手機版一樣）；桌機照舊並排 */}
        <div className="flex flex-col gap-2.5 pt-1 md:flex-row md:flex-wrap md:gap-3">
          <WipeLink href={localePath(locale, game.playable!)} color={look.wipe} doors={look.doors} entrance={look.entrance} data-game={game.playable}
            className="flex h-[54px] items-center justify-center gap-2.5 rounded-xl bg-tile-cream px-7 text-lg font-black text-tile-ink md:justify-start">
            <LuPlay aria-hidden="true" className="fill-current" />{p.play}
          </WipeLink>
          {look.rules && (
            <WipeLink href={localePath(locale, look.rules)} color={rulesWipe} doors={look.doors} entrance={look.entrance}
              className="flex h-[54px] items-center justify-center gap-2.5 rounded-xl bg-white/15 px-6 text-lg font-black text-tile-cream md:justify-start md:bg-plat-bg/80">
              <LuInfo aria-hidden="true" />{p.rules}
            </WipeLink>
          )}
        </div>
      </div>
    </section>
  );
}

/** 進規則頁的轉場顏色：規則頁頂部與 Wall Go 首頁「遊戲規則」磁磚的森綠 */
const RULES_GREEN = 'rgb(var(--tile-forest))';
