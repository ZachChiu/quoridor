import WipeLink from '@/components/WipeLink';
import GameName from '@/components/platform/GameName';
import WantButton from '@/components/platform/WantButton';
import { gameName, type CatalogGame } from '@/games/catalog';
import { localePath, type Locale } from '@/i18n/locales';
import { wantKey } from '@/utils/wants';

/**
 * 平台上的遊戲卡（首頁一排排、季目錄頁的格子共用）。寬度由呼叫的地方給：首頁是固定 240px 橫向捲動，目錄頁跟著格子走。
 * 卡片本身是 container：名字的字級跟著卡片寬度（`NAME`），首頁 240px 的卡片照舊 22px；
 * 320 寬的手機上目錄頁一格只剩 138px，固定 22px 的長名字（Time Auction、タイムオークション）換成兩行會疊到「可以玩」標籤
 */
const CARD = 'relative block aspect-video overflow-hidden rounded-xl [container-type:inline-size]';
const NAME = 'text-[clamp(15px,12cqw,22px)] font-black leading-none';
/** 名字底下那行這款自己的字：字標高半個字、字型那行六成大 */
const SUB = { mark: 0.5, font: 'text-[0.6em]' };

export default function GameCard({ game, locale, playable, guide, want, width = 'w-[240px]' }: {
  game: CatalogGame; locale: Locale; playable: string; guide: string; want: string; width?: string;
}) {
  const name = gameName(game, locale);

  if (game.playable && game.look) {
    // 能玩的遊戲用自己的識別（主色＋主視覺），點進去擴散自己的顏色
    const { card, wipe, art, cover, doors, entrance } = game.look;
    return (
      <WipeLink href={localePath(locale, game.playable)} color={wipe} doors={doors} entrance={entrance} data-game={game.playable} aria-label={name} className={`${CARD} ${width} ${card}`}>
        {cover ? (
          <>
            {/* 橫幅主視覺鋪滿；名字壓在底部的黑色漸層上 */}
            {/* eslint-disable-next-line @next/next/no-img-element -- 同上 */}
            <img src={art} alt="" loading="lazy" className="pointer-events-none absolute inset-0 size-full object-cover" />
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/80 to-transparent" />
            <span className={`absolute inset-x-3 bottom-2.5 ${NAME} text-white`}><GameName game={game} locale={locale} sub={SUB} swap={0.95} /></span>
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- 同上 */}
            <img src={art} alt="" className="pointer-events-none absolute right-[-70px] top-[-50px] w-[230px] rotate-[-14deg]" />
            {/* 名字壓在主視覺上會看不清楚，墊一塊卡片同色的底 */}
            <span className={`absolute bottom-2 left-2 rounded-md px-1.5 py-1 ${NAME} ${card}`}>{name}</span>
          </>
        )}
        {/* 窄卡片上往角落靠（240px 的卡片照舊 12px），兩行的名字才不會貼著它 */}
        <span className="absolute left-[min(12px,5cqw)] top-[min(12px,5cqw)] rounded-md bg-brand-red px-2 py-0.5 text-xs font-black text-white">▶ {playable}</span>
      </WipeLink>
    );
  }

  return (
    <div className={`${CARD} ${width} flex flex-col justify-end bg-plat-surface p-3.5`}>
      {/* 左上角「想玩」（11/1 Zach）；flex-1 把名字推回底下 */}
      <div className="relative flex flex-1 flex-col"><WantButton wantKey={wantKey(game.name)} label={want} name={name} /></div>
      {/* 角落是平台的骰子惡魔（Zach 10/24：規則整理中的空白卡要換上骰子惡魔）：卡片同色系的淡剪影、點數挖空，跟左上的 logo 同一個形 */}
      <span aria-hidden="true" className="plat-soon-mark absolute -right-4 -top-1 size-[124px] rotate-12 bg-plat-raised" />
      <span className="relative text-base font-black leading-tight">{name}</span>
      <span className="relative text-xs font-bold text-plat-muted">{guide}</span>
    </div>
  );
}
