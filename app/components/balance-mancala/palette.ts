import { CELL_COLOUR, DEVIL, letterOf, type Colour, type Seat } from '@/games/balance-mancala/engine';

/**
 * 均衡曼卡拉的配色：一頁 1430 年代法蘭德斯的時禱書（11/3 Zach 從 Adinkra 印花布、桑吉巴木雕、祈禱書三種裡選了祈禱書）。
 * 從克里夫蘭美術館〈Leaf from a Book of Hours: The Last Judgment〉（1999.130，CC0）取樣，不自己調（k-means，scripts/balance-mancala/km.cjs）：
 * 羊皮紙 #eedec1／亮處 #f5ecd9、墨 #3f3833、褐 #68593f、金 #d2ae67／暗金 #9c7436、插圖背景金底格紋的暗部 #433828、朱紅 #ac6744
 * （頁邊另外用到的綠 #628a54、群青 #3f5063 只在外框與天使、惡魔格的小圖裡）。
 *
 * 頁面是一頁羊皮紙（MancalaFrame：最外緣一圈頁邊的藤蔓與金葉），盤面是插圖背景那種墨底金格紋的圓（hoursArt.tsx 的 BoardFace），
 * 盤子外緣一圈金。主要動作是金箔、次要動作是畫了格線的羊皮紙（globals.css 的 .mcl-*）。
 * 天使格是頁邊的小天使、惡魔格是朱紅底上的小惡魔（同一頁下方聖米迦勒秤靈魂，旁邊有個小惡魔在拉秤）。
 * 對比：墨在羊皮紙上 8.7:1、褐 5.1:1、墨在金箔上 5.5:1；金在盤面上 5.4:1、亮羊皮紙在盤面上 9.7:1；暗金在羊皮紙上 3.2:1（只用在大字）。
 *
 * 盤子的紅藍綠是規則（站上的玩家色 --player-A/B/C），盤子外緣另有一圈金圈出輪廓。
 * **座位色刻意避開紅、藍、綠**：「紅方的藍色分數」這種說法會打結，所以 7 個座位用紫、琥珀、天藍、炭黑、洋紅、橘、褐，
 * 每顆子另外印座位字母（不只靠顏色）。座位色是功能色、不是識別色。
 * 子的外圈留一道亮羊皮紙的縫，疊在任何盤子上都分得開。
 *
 * 畫面上一律用 CSS 變數（值寫在 globals.css 的 html:has(.mcl-root)，只寫一次）；Canvas 讀不懂變數，分享圖用 HEX —— 兩邊要一起改。
 * 名字沿用最早那一版（布、黃銅、木頭）：CLOTH＝羊皮紙、BRASS＝金、WOOD＝盤面的暗底。
 */
export const HEX = { CLOTH: '#eedec1', CLOTH_LIGHT: '#f5ecd9', INK: '#3f3833', INK_SOFT: '#68593f', BRASS: '#d2ae67', BRASS_DEEP: '#9c7436', WOOD: '#433828', DEVIL: '#ac6744' };
export const CLOTH = 'var(--mcl-cloth)';
export const CLOTH_LIGHT = 'var(--mcl-cloth-light)';
export const INK = 'var(--mcl-ink)';
export const INK_SOFT = 'var(--mcl-ink-soft)';
export const BRASS = 'var(--mcl-brass)';
export const BRASS_DEEP = 'var(--mcl-brass-deep)';
export const WOOD = 'var(--mcl-wood)';
export const DEVIL_BG = 'var(--mcl-devil)';
/** 座位色上的米白字（SEAT_LOOK）：全站的 tile-cream，跟 fgClass 一致 */
const CREAM = '#faf7f0';

export const DISH_BG: Record<Colour, string> = { 0: 'var(--player-A)', 1: 'var(--player-B)', 2: 'var(--player-C)' };

export type SeatLook = { bg: string; fg: string; fgClass: 'text-tile-cream' | 'text-tile-ink' };

/** 字母與底色的對比都 ≥4.8:1（米白字或深墨字，量過才配） */
export const SEAT_LOOK: SeatLook[] = [
  { bg: '#7e3fa8', fg: CREAM, fgClass: 'text-tile-cream' }, // A 紫
  { bg: '#e9af4c', fg: INK, fgClass: 'text-tile-ink' }, // B 琥珀
  { bg: '#1aa7c9', fg: INK, fgClass: 'text-tile-ink' }, // C 天藍
  { bg: '#3d3836', fg: CREAM, fgClass: 'text-tile-cream' }, // D 炭黑
  { bg: '#b8347d', fg: CREAM, fgClass: 'text-tile-cream' }, // E 洋紅
  { bg: '#e8772e', fg: INK, fgClass: 'text-tile-ink' }, // F 橘
  { bg: '#a35a1f', fg: CREAM, fgClass: 'text-tile-cream' }, // G 褐
];

export const seatLook = (seat: Seat): SeatLook => SEAT_LOOK[seat] ?? SEAT_LOOK[0];

/**
 * 格子的名字：盤子是「藍盤」，惡魔、天使是名字。
 * 不用節目的盤子編號（01–12）：盤面上沒有印編號，句子裡出現「05」反而對不起來；
 * 同色的盤子有四個，要指哪一個由盤面上的標示負責（上一手、預覽）。
 */
export function cellName(cell: number, t: { devil: string; angel: string; dishNames: string[] }): string {
  const c = CELL_COLOUR[cell];
  if (c === null) return cell === DEVIL ? t.devil : t.angel;
  return t.dishNames[c];
}

export { letterOf };

/**
 * 彈窗：一塊切角的羊皮紙 —— 標題是盤面暗底色的字，底下一道雙線（抄本畫的格線），不用色帶。
 * 介面零件本身在 globals.css 的 .mcl-*（金箔、畫了格線的羊皮紙條）。
 */
export const MCL_PANEL = '!rounded-none !bg-[var(--mcl-cloth-light)] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]';
export const MCL_BAND = { className: 'mx-6 !px-0 bg-transparent border-b-[4px] border-double border-[rgb(var(--mcl-ink-rgb)/0.55)]', fg: 'text-[var(--mcl-wood)]' };
