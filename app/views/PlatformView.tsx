import Link from 'next/link';
import { GiDevilMask, GiHourglass } from 'react-icons/gi';
import { LuInfo, LuPlay } from 'react-icons/lu';
import WipeLink from '@/components/WipeLink';
import PlatformLanguageMenu from '@/components/platform/PlatformLanguageMenu';
import PlatformContact from '@/components/platform/PlatformContact';
import { BRAND } from '@/brand';
import { SEASONS, gameName, type CatalogGame } from '@/games/catalog';
import { getMessages, siteName } from '@/i18n';
import { localePath, type Locale } from '@/i18n/locales';
import { wallGo } from '@/i18n/routes';
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
        <Link href={localePath(locale, '/')} className="text-2xl font-black tracking-tight text-brand-red">
          {BRAND}
        </Link>
        {/* 平台自己的元件（components/platform/），不是 Wall Go 的圓鈕與奶油底 Modal。
            聯絡我們放到頁尾當文字連結 */}
        <PlatformLanguageMenu />
      </header>

      <main className="mx-auto flex max-w-[1360px] flex-col gap-9 px-4 pb-14">
        <h1 className="sr-only">{p.heading}</h1>

        {/* 推薦作品：目前唯一能玩的 Wall Go。
            大小以「一個畫面看得完整張卡片、底下還露出下一排」為準（Zach：大卡片偏大看不到全貌）：
            手機上說明句收掉、兩顆按鈕並排；桌機限高。 */}
        <section className="relative flex min-h-[440px] items-end overflow-hidden rounded-2xl bg-tile-blue md:min-h-[min(520px,max(400px,40vw))]">
          {/* 主視覺：Wall Go 的棋盤放大、斜擺、裁出畫面右上角 */}
          {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出、SVG，不需要 next/image */}
          <img
            src="/games/wall-go/key-art.svg"
            alt=""
            className="pointer-events-none absolute right-[clamp(-220px,-6vw,-60px)] top-[clamp(-110px,-6vw,-60px)] w-[clamp(440px,52vw,720px)] rotate-[-14deg]"
          />
          <div className="relative flex max-w-[520px] flex-col gap-3 rounded-tr-2xl bg-tile-blue p-6 md:gap-4 md:p-[clamp(28px,3.5vw,48px)]">
            <span className="self-start rounded-md bg-brand-red px-2.5 py-0.5 text-[13px] font-black text-white">{p.heroBadge}</span>
            <h2 className="text-[clamp(40px,5.5vw,76px)] font-black leading-[0.95] tracking-tight">
              {t.home.titleLine1}
              {t.home.titleLine2 && <><br />{t.home.titleLine2}</>}
            </h2>
            <p className="text-[15px] font-bold">{p.heroMeta}</p>
            {/* 19px 粗體算大字：米白在藍底上 4.4:1，大字的門檻是 3:1。手機上收掉，卡片才不會比畫面高 */}
            <p className="hidden text-[19px] font-bold leading-relaxed md:block">{p.heroBody}</p>
            <div className="flex flex-wrap gap-2.5 pt-1 md:gap-3">
              <WipeLink href={localePath(locale, wallGo())} color={WALL_GO_BLUE} className="flex h-12 items-center gap-2 rounded-xl bg-tile-cream px-5 text-base font-black text-tile-ink md:h-[52px] md:px-7 md:text-lg">
                <LuPlay aria-hidden="true" className="fill-current" />{p.play}
              </WipeLink>
              {/* 規則頁的頂部是森綠，轉場就擴散森綠（跟 Wall Go 首頁「遊戲規則」磁磚同色） */}
              <WipeLink href={localePath(locale, wallGo('/rules'))} color={RULES_GREEN} className="flex h-12 items-center gap-2 rounded-xl bg-plat-bg px-5 text-base font-black text-tile-cream md:h-[52px] md:px-6 md:text-lg">
                <LuInfo aria-hidden="true" />{p.rules}
              </WipeLink>
            </div>
          </div>
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
              <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
                {season.games.map((game) => (
                  <li key={game.name} className="shrink-0">
                    <GameCard game={game} locale={locale} playable={p.playable} guide={p.guide} wallGoName={siteName(locale)} />
                  </li>
                ))}
              </ul>
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

const CARD = 'relative block aspect-video w-[240px] overflow-hidden rounded-xl';

/** 進 Wall Go 的轉場顏色：它的主視覺與卡片都是這個藍 */
const WALL_GO_BLUE = 'rgb(var(--tile-blue))';
/** 進規則頁的轉場顏色：規則頁頂部與 Wall Go 首頁「遊戲規則」磁磚的森綠 */
const RULES_GREEN = 'rgb(var(--tile-forest))';

function GameCard({ game, locale, playable, guide, wallGoName }: {
  game: CatalogGame; locale: Locale; playable: string; guide: string; wallGoName: string;
}) {
  const name = gameName(game, locale);

  if (game.playable) {
    return (
      <WipeLink href={localePath(locale, game.playable)} color={WALL_GO_BLUE} aria-label={wallGoName} className={`${CARD} bg-tile-blue text-tile-cream`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 同上 */}
        <img src="/games/wall-go/key-art.svg" alt="" className="pointer-events-none absolute right-[-70px] top-[-50px] w-[230px] rotate-[-14deg]" />
        <span className="absolute left-3 top-3 rounded-md bg-brand-red px-2 py-0.5 text-xs font-black text-white">▶ {playable}</span>
        {/* 名字壓在棋盤圖上會看不清楚，墊一塊藍底 */}
        <span className="absolute bottom-2 left-2 rounded-md bg-tile-blue px-1.5 py-1 text-[22px] font-black leading-none">{name}</span>
      </WipeLink>
    );
  }

  return (
    <div className={`${CARD} flex flex-col justify-end bg-plat-surface p-3.5`}>
      <GiDevilMask aria-hidden="true" className="absolute -right-6 -top-5 text-[150px] text-plat-raised" />
      <span className="relative text-base font-black leading-tight">{name}</span>
      <span className="relative text-xs font-bold text-plat-muted">{guide}</span>
    </div>
  );
}
