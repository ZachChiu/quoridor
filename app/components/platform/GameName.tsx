import type React from 'react';
import LocalName, { letteringOf } from '@/components/LocalName';
import { gameName, type CatalogGame } from '@/games/catalog';
import type { Locale } from '@/i18n/locales';

/**
 * 平台上的遊戲名（小卡片、大卡片共用）：有自己的字的那幾款，名字底下多一行用那款的字寫的原名（catalog 的 look.lettering）。
 * 2026-10-25 Zach：「各遊戲不是有自己的字體嗎／遊戲平台應該要可以讓他們呈現自己的字體在他們的標題或描述上」。
 *
 * 在地的名字（中日韓）有字標的那幾款（look.lettering.local），名字本身也是那款風格的字（LocalName），跟各款首頁的標題同一份；
 * 沒有的照全站字型。泰文的名字是英文，就是那行原名。
 * 名字本身就是那行原名（英文版的 Time Auction）就不重複寫兩次，直接用那款的字當名字，跟各款首頁的做法一樣。
 *
 * sub：底下那一行的大小（字標的高度、字型的字級，都用 em，跟著名字的字級走）
 */
export default function GameName({ game, locale, sub, swap }: {
  game: CatalogGame; locale: Locale;
  /** 底下那一行：字標的高度（em）、字型那行的 class */
  sub: { mark: number; font: string };
  /** 名字就是原名、換成那款的字時：字標的高度（em） */
  swap: number;
}) {
  const name = gameName(game, locale);
  const l = game.look?.lettering;
  if (!l) return <>{name}</>;
  const same = l.spellsName && name === game.name;
  const local = letteringOf(l.local, locale, name);
  const title = local ? <><span className="sr-only">{name}</span><LocalName data={local} /></> : name;
  if ('font' in l) {
    return same
      ? <span className={l.font}>{name}</span>
      : <>{title}<span aria-hidden="true" className={`mt-[0.25em] block ${l.font} ${sub.font}`}>{game.name}</span></>;
  }
  return same
    ? <><span className="sr-only">{name}</span><Mark src={l.mark} ratio={l.ratio} height={swap} /></>
    : <>{title}<Mark src={l.mark} ratio={l.ratio} height={sub.mark} className="mt-[0.3em]" /></>;
}

/**
 * 字標：單色外框的 SVG 當遮罩、塗上文字色（bg-current），白字的卡片上就是白的。
 * 不用 <img>（塗不了色），也不內嵌路徑（九子棋的哥德字一條 12KB，小卡片與大卡片各一份、再乘上 RSC payload）。
 * 寬度照比例算、最多到整行寬，太長時跟著縮（高度由 aspect-ratio 跟著）。
 */
function Mark({ src, ratio, height, className = '' }: { src: string; ratio: number; height: number; className?: string }) {
  const mask = `url(${src}) left center / contain no-repeat`;
  const style: React.CSSProperties = { WebkitMask: mask, mask, aspectRatio: ratio, width: `min(100%, ${(ratio * height).toFixed(2)}em)` };
  return <span aria-hidden="true" className={`block bg-current ${className}`} style={style} />;
}
