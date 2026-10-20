import type { CSSProperties, ReactNode } from 'react';
import type { IconBaseProps, IconType } from 'react-icons';

/**
 * Wall Go 對局畫面的貼紙風圖示（2026-10-20 試做，Zach 給的參考圖是粗黑框＋往右下偏移的硬影子）。
 * 一開始放在首頁磁磚上，Zach 看過要復原首頁、改試在對局頁的按鈕上 —— 所以這組是給
 * 左上的房子／規則圓鈕與手機控制盤用的。
 *
 * 每顆都是：一層深墨剪影往右下偏移當影子，上面一層平塗＋深墨描邊。整組共用一道影子
 * （影子的位移在旋轉外面，箭頭轉向之後影子仍然朝右下）。
 * 尺寸只有 24–28px，所以 viewBox 用 32、描邊 2.2，縮小後線條仍在 1.6px 以上。
 *
 * 顏色一律寫在 style 上：globals.css 有一條 `.tile-icon path { fill: … }`，寫成 fill 屬性會被蓋掉。
 * 跟 react-icons 同一個介面（IconType），換頁轉場那些只收圖示元件的地方也能用。
 */
const INK = 'rgb(var(--tile-ink))';
const CREAM = 'rgb(var(--tile-cream))';
const AMBER = 'rgb(var(--tile-amber))';
const RED = 'var(--player-A)';
const BLUE = 'var(--player-B)';
const WOOD = '#c27a3e';
const STEEL = '#cfd5dc';

const BOX = 32;
const SW = 2.2;
const DROP = 2;

/** 給一個顏色，回傳那塊形狀的樣式；影子那層不管給什麼都是深墨。scale 是所在群組的縮放，描邊要反過來補 */
type Paint = (color: string, scale?: number) => CSSProperties;

function sticker(draw: (p: Paint, shadow: boolean) => ReactNode): IconType {
  function Sticker({ size, className, style }: IconBaseProps) {
    const solid: Paint = (_c, s = 1) => ({ fill: INK, stroke: INK, strokeWidth: SW / s, strokeLinejoin: 'round' });
    const color: Paint = (c, s = 1) => ({ fill: c, stroke: INK, strokeWidth: SW / s, strokeLinejoin: 'round' });
    return (
      <svg viewBox={`0 0 ${BOX} ${BOX}`} width={size ?? '1em'} height={size ?? '1em'} className={className} style={style} aria-hidden="true">
        <g transform={`translate(${DROP} ${DROP})`}>{draw(solid, true)}</g>
        {draw(color, false)}
      </svg>
    );
  }
  return Sticker;
}

/** 細節線（窗格、文字行）：只畫在上層 */
const detail = (color: string, width: number): CSSProperties => ({ fill: 'none', stroke: color, strokeWidth: width, strokeLinecap: 'round' });

/** 回首頁：紅屋頂的小房子 */
export const StickerHome = sticker((p, shadow) => (
  <>
    <rect x="7" y="14" width="18" height="14" rx="1.5" style={p(CREAM)} />
    <path d="M3.5 15.5L16 4.5L28.5 15.5Z" style={p(RED)} />
    <rect x="13.5" y="19" width="5.5" height="9" rx="1" style={p(AMBER)} />
    {!shadow && <path d="M9.5 18.5h2.5" style={detail(INK, 1.6)} />}
  </>
));

/** 規則：攤開的書，夾一條書籤 */
export const StickerRules = sticker((p, shadow) => (
  <>
    <path d="M2.5 10V26.5C7.5 25.2 12.3 25.4 16 27.5C19.7 25.4 24.5 25.2 29.5 26.5V10Z" style={p(AMBER)} />
    <path d="M16 10.3C12.7 7.7 8 7.3 4 8.7V24C8 22.8 12.7 23.1 16 25.3Z" style={p(CREAM)} />
    <path d="M16 10.3C19.3 7.7 24 7.3 28 8.7V24C24 22.8 19.3 23.1 16 25.3Z" style={p(CREAM)} />
    <path d="M20.5 8V15.5L22.4 13.8L24.3 15.5V7.6" style={p(RED)} />
    {!shadow && (
      <g style={detail(INK, 1.3)}>
        <path d="M6.8 13C8.8 12.4 11 12.5 13.2 13.3" />
        <path d="M6.8 16.5C8.8 15.9 11 16 13.2 16.8" />
        <path d="M18.8 18.5C20.8 17.8 23.2 17.8 25.4 18.3" />
      </g>
    )}
  </>
));

/** 投降：一面白旗 */
export const StickerFlag = sticker((p) => (
  <>
    <path d="M10.5 7C16 3.5 20 10 27 6.5V18C20 21.5 16 15 10.5 18.5Z" style={p(CREAM)} />
    <rect x="6.5" y="3.5" width="4" height="25.5" rx="2" style={p(WOOD)} />
  </>
));

/** 重來：逆時針的粗箭頭（描邊靠兩層粗細不同的線疊出來） */
export const StickerRestart = sticker((_p, shadow) => {
  const arc = 'M6.5 17A9.5 9.5 0 1 0 16 7.5';
  const head = 'M9.5 7.5L17 2.5V12.5Z';
  if (shadow) {
    return (
      <>
        <path d={arc} style={{ fill: 'none', stroke: INK, strokeWidth: 7, strokeLinecap: 'round' }} />
        <path d={head} style={{ fill: INK, stroke: INK, strokeWidth: SW, strokeLinejoin: 'round' }} />
      </>
    );
  }
  return (
    <>
      <path d={arc} style={{ fill: 'none', stroke: INK, strokeWidth: 7, strokeLinecap: 'round' }} />
      <path d={arc} style={{ fill: 'none', stroke: BLUE, strokeWidth: 2.8, strokeLinecap: 'round' }} />
      <path d={head} style={{ fill: BLUE, stroke: INK, strokeWidth: SW, strokeLinejoin: 'round' }} />
    </>
  );
});

/** 破牆：一把槌子 */
export const StickerHammer = sticker((p) => (
  <g transform="rotate(-40 16 16)">
    <rect x="14" y="12" width="4.5" height="17" rx="2.2" style={p(WOOD)} />
    <rect x="7" y="5" width="18.5" height="8" rx="1.8" style={p(STEEL)} />
  </g>
));

/** 走一步：粗箭頭。上下左右是同一個形狀轉向 */
const ARROW = 'M16 3.5L27.5 15H20.5V27.5H11.5V15H4.5Z';
function arrow(deg: number): IconType {
  return sticker((p) => <path transform={`rotate(${deg} 16 16)`} d={ARROW} style={p(CREAM)} />);
}
export const StickerArrowUp = arrow(0);
export const StickerArrowRight = arrow(90);
export const StickerArrowDown = arrow(180);
export const StickerArrowLeft = arrow(270);

/**
 * 完成：放在深墨按鈕上，所以不能用深墨描邊（會融進底色）。
 * 改成金色粗勾、外面一圈米白當描邊，不打影子。
 */
export function StickerCheck({ size, className, style }: IconBaseProps) {
  const d = 'M6 16.5L13 23.5L26.5 9';
  return (
    <svg viewBox={`0 0 ${BOX} ${BOX}`} width={size ?? '1em'} height={size ?? '1em'} className={className} style={style} aria-hidden="true">
      <path d={d} style={{ fill: 'none', stroke: CREAM, strokeWidth: 8.5, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
      <path d={d} style={{ fill: 'none', stroke: AMBER, strokeWidth: 4.5, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
    </svg>
  );
}
