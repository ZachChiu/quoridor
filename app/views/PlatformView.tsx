import Link from 'next/link';
import { GiHourglass } from 'react-icons/gi';
import { LuInfo, LuPlay } from 'react-icons/lu';
import WipeLink from '@/components/WipeLink';
import PlatformLanguageMenu from '@/components/platform/PlatformLanguageMenu';
import PlatformContact from '@/components/platform/PlatformContact';
import HeroPicker from '@/components/platform/HeroPicker';
import CardRow from '@/components/platform/CardRow';
import { BRAND } from '@/brand';
import PlatformMark from '@/components/PlatformMark';
import { NEWEST, PLAYABLE, SEASONS, gameName, playableFirst, type CatalogGame } from '@/games/catalog';
import { getMessages } from '@/i18n';
import { localePath, type Locale } from '@/i18n/locales';
import { BAGH_CHAL, WALL_GO, wallGo } from '@/i18n/routes';
import { pageGraph, ldScript } from '@/i18n/jsonld';

/**
 * 平台首頁（`/`）：《魔鬼的計謀》節目遊戲總覽，六個語系共用。
 *
 * 外殼是 Netflix 式的深色＋紅（Zach 指定），上面一個推薦作品的大區塊，下面依季一排一排橫向捲動，
 * 播出中（或即將播出）的那一季排最上面。**各遊戲保留自己的視覺**：Wall Go 的主視覺是
 * 它自己的藍底與棋盤，點進 /wall-go/ 之後就是原本的平塗撞色。
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
        <Link href={localePath(locale, '/')} aria-label={BRAND} title={BRAND} className="transition hover:brightness-110">
          <PlatformMark />
        </Link>
        {/* 平台自己的元件（components/platform/），不是 Wall Go 的圓鈕與奶油底 Modal。
            聯絡我們放到頁尾當文字連結 */}
        <PlatformLanguageMenu />
      </header>

      <main className="mx-auto flex max-w-[1360px] flex-col gap-9 px-4 pb-14">
        <h1 className="sr-only">{p.heading}</h1>

        {/* 推薦作品：預設是最新上線的那一款，使用者點過哪一款就換成那一款（10/24 Zach）。
            每一款能玩的都有一張在 HTML 裡，外層的 data-hero-pick 決定露出哪張；換的那段在 HeroPicker。
            suppressHydrationWarning：data-hero-pick 會在 hydrate 之前被內嵌 script 換掉 */}
        <div data-hero-pick={NEWEST?.playable} suppressHydrationWarning>
          <style dangerouslySetInnerHTML={{ __html: PLAYABLE.map((g) => `[data-hero-pick="${g.playable}"]>[data-slide]:not([data-slide="${g.playable}"]){display:none}`).join('') }} />
          {PLAYABLE.map((game) => game.playable === WALL_GO
            ? <WallGoHero key={game.name} locale={locale} />
            : <GameHero key={game.name} game={game} locale={locale} />)}
          <HeroPicker />
        </div>

        {/* 現在就能玩：已經做成線上版的遊戲集中一排（各季那幾排裡也有，Netflix 的排與排本來就會重複） */}
        <section id="play-now" className="flex flex-col gap-3">
          <h2 className="text-[21px] font-black">{p.heroBadge}</h2>
          <CardRow>
            {PLAYABLE.map((game) => (
              <li key={game.name} className="shrink-0">
                <GameCard game={game} locale={locale} playable={p.playable} guide={p.guide} />
              </li>
            ))}
          </CardRow>
        </section>

        {SEASONS.map((season) => (
          <section key={season.id} id={`season-${season.id.slice(1)}`} className="flex flex-col gap-3">
            <h2 className="flex flex-wrap items-center gap-2.5 text-[21px] font-black">
              {seasonTitle[season.id]}
              {season.id === 's3' && (
                <span className="rounded-md bg-brand-red px-2.5 py-0.5 text-[13px] font-black text-white">{p.s3Badge}</span>
              )}
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
                    <GameCard game={game} locale={locale} playable={p.playable} guide={p.guide} />
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
    </div>
  );
}

/**
 * 大卡片的高度（10/24 Zach：上面的大卡片縮小一點點 —— 原本手機 680、桌機最高 640）。
 * 手機上文字區塊幾乎跟畫面一樣寬，區塊要夠高主視覺才露得出來。
 */
const HERO = 'relative flex min-h-[600px] overflow-hidden rounded-3xl md:min-h-[min(560px,max(460px,48vw))]';

/** Wall Go 的大卡片：它自己的藍底，棋盤放大、斜擺、裁出畫面右上角 */
function WallGoHero({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  const p = t.platform;
  return (
    <section data-slide={WALL_GO} className={`${HERO} items-end bg-tile-blue`}>
      {/* 主視覺：Wall Go 的棋盤放大、斜擺、裁出畫面右上角 */}
      {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出、SVG，不需要 next/image */}
      <img
        src="/games/wall-go/key-art.svg"
        alt=""
        loading="lazy"
        className="pointer-events-none absolute right-[clamp(-240px,-8vw,-60px)] top-[clamp(-110px,-6vw,-40px)] w-[clamp(500px,56vw,780px)] rotate-[-14deg]"
      />
      <div className="relative flex max-w-[560px] flex-col gap-4 rounded-tr-3xl bg-tile-blue p-[clamp(24px,4vw,56px)]">
        <span className="self-start rounded-md bg-brand-red px-2.5 py-0.5 text-[13px] font-black text-white">{p.heroBadge}</span>
        <h2 className="text-[clamp(44px,6vw,84px)] font-black leading-[0.95] tracking-tight">
          {t.home.titleLine1}
          {t.home.titleLine2 && <><br />{t.home.titleLine2}</>}
        </h2>
        <p className="text-[15px] font-bold">{p.heroMeta}</p>
        {/* 19px 粗體算大字：米白在藍底上 4.4:1，大字的門檻是 3:1 */}
        <p className="text-[19px] font-bold leading-relaxed">{p.heroBody}</p>
        <div className="flex flex-wrap gap-3 pt-1">
          <WipeLink href={localePath(locale, wallGo())} color={WALL_GO_BLUE} data-game={WALL_GO} className="flex h-[54px] items-center gap-2.5 rounded-xl bg-tile-cream px-7 text-lg font-black text-tile-ink">
            <LuPlay aria-hidden="true" className="fill-current" />{p.play}
          </WipeLink>
          {/* 規則頁的頂部是森綠，轉場就擴散森綠（跟 Wall Go 首頁「遊戲規則」磁磚同色） */}
          <WipeLink href={localePath(locale, wallGo('/rules'))} color={RULES_GREEN} className="flex h-[54px] items-center gap-2.5 rounded-xl bg-plat-bg px-6 text-lg font-black text-tile-cream">
            <LuInfo aria-hidden="true" />{p.rules}
          </WipeLink>
        </div>
      </div>
    </section>
  );
}

/** 其他遊戲的大卡片：大圖鋪滿，字壓在黑色漸層上（跟下面的卡片同一個做法）。各款的說明在 platform 文案裡，沒有就只放名字 */
function GameHero({ game, locale }: { game: CatalogGame; locale: Locale }) {
  const p = getMessages(locale).platform;
  const look = game.look!;
  const copy = game.playable === BAGH_CHAL ? [p.baghHeroMeta, p.baghHeroBody] : null;
  return (
    <section data-slide={game.playable} className={`${HERO} flex-col bg-black md:flex-row md:items-end`}>
      {/* 手機：圖整張放在上面、字接在下面的黑底上（10/24 Zach：手機只看得到老虎 —— 先前圖鋪在字後面，羊被字蓋住）；
          有方圖就用方圖。桌機：橫幅鋪滿、字在左邊 */}
      <div className={`relative w-full shrink-0 md:absolute md:inset-0 md:aspect-auto md:h-full ${look.heroSquare ? 'aspect-square' : 'aspect-[4/3]'}`}>
        <picture>
          {look.heroSquare && <source media="(max-width: 767px)" srcSet={look.heroSquare} />}
          <img src={look.hero ?? look.art} alt="" loading="lazy" className="pointer-events-none absolute inset-0 size-full object-cover" />
        </picture>
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black to-transparent md:hidden" />
      </div>
      <span aria-hidden="true" className="absolute inset-0 hidden bg-gradient-to-r from-black/85 from-0% via-black/45 via-40% to-transparent to-100% md:block" />
      <div className="relative flex max-w-[560px] flex-col gap-4 p-[clamp(24px,4vw,56px)]">
        <span className="self-start rounded-md bg-brand-red px-2.5 py-0.5 text-[13px] font-black text-white">{p.heroBadge}</span>
        <h2 className="text-[clamp(44px,6vw,84px)] font-black leading-[0.95] tracking-tight">{gameName(game, locale)}</h2>
        {copy && <p className="text-[15px] font-bold">{copy[0]}</p>}
        {copy && <p className="text-[19px] font-bold leading-relaxed">{copy[1]}</p>}
        <div className="flex flex-wrap gap-3 pt-1">
          <WipeLink href={localePath(locale, game.playable!)} color={look.wipe} doors={look.doors} entrance={look.entrance} data-game={game.playable}
            className="flex h-[54px] items-center gap-2.5 rounded-xl bg-tile-cream px-7 text-lg font-black text-tile-ink">
            <LuPlay aria-hidden="true" className="fill-current" />{p.play}
          </WipeLink>
          {look.rules && (
            <WipeLink href={localePath(locale, look.rules)} color={look.wipe} doors={look.doors} entrance={look.entrance}
              className="flex h-[54px] items-center gap-2.5 rounded-xl bg-plat-bg/80 px-6 text-lg font-black text-tile-cream">
              <LuInfo aria-hidden="true" />{p.rules}
            </WipeLink>
          )}
        </div>
      </div>
    </section>
  );
}

const CARD = 'relative block aspect-video w-[240px] overflow-hidden rounded-xl';

/** 進 Wall Go 的轉場顏色：它的主視覺與卡片都是這個藍 */
const WALL_GO_BLUE = 'rgb(var(--tile-blue))';
/** 進規則頁的轉場顏色：規則頁頂部與 Wall Go 首頁「遊戲規則」磁磚的森綠 */
const RULES_GREEN = 'rgb(var(--tile-forest))';

function GameCard({ game, locale, playable, guide }: {
  game: CatalogGame; locale: Locale; playable: string; guide: string;
}) {
  const name = gameName(game, locale);

  if (game.playable && game.look) {
    // 能玩的遊戲用自己的識別（主色＋主視覺），點進去擴散自己的顏色
    const { card, wipe, art, cover, doors, entrance } = game.look;
    return (
      <WipeLink href={localePath(locale, game.playable)} color={wipe} doors={doors} entrance={entrance} data-game={game.playable} aria-label={name} className={`${CARD} ${card}`}>
        {cover ? (
          <>
            {/* 橫幅主視覺鋪滿；名字壓在底部的黑色漸層上 */}
            {/* eslint-disable-next-line @next/next/no-img-element -- 同上 */}
            <img src={art} alt="" loading="lazy" className="pointer-events-none absolute inset-0 size-full object-cover" />
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/80 to-transparent" />
            <span className="absolute inset-x-3 bottom-2.5 text-[22px] font-black leading-none text-white">{name}</span>
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- 同上 */}
            <img src={art} alt="" className="pointer-events-none absolute right-[-70px] top-[-50px] w-[230px] rotate-[-14deg]" />
            {/* 名字壓在主視覺上會看不清楚，墊一塊卡片同色的底 */}
            <span className={`absolute bottom-2 left-2 rounded-md px-1.5 py-1 text-[22px] font-black leading-none ${card}`}>{name}</span>
          </>
        )}
        <span className="absolute left-3 top-3 rounded-md bg-brand-red px-2 py-0.5 text-xs font-black text-white">▶ {playable}</span>
      </WipeLink>
    );
  }

  return (
    <div className={`${CARD} flex flex-col justify-end bg-plat-surface p-3.5`}>
      {/* 角落是平台的骰子惡魔（Zach 10/24：規則整理中的空白卡要換上骰子惡魔）：卡片同色系的淡剪影、點數挖空，跟左上的 logo 同一個形 */}
      <span aria-hidden="true" className="plat-soon-mark absolute -right-4 -top-1 size-[124px] rotate-12 bg-plat-raised" />
      <span className="relative text-base font-black leading-tight">{name}</span>
      <span className="relative text-xs font-bold text-plat-muted">{guide}</span>
    </div>
  );
}
