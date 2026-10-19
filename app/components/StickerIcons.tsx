import type { CSSProperties, ReactNode } from 'react';
import type { IconBaseProps, IconType } from 'react-icons';

/**
 * Wall Go 首頁磁磚的貼紙風圖示（2026-10-20 試做，Zach 給的參考圖是粗黑框＋往右下偏移的硬影子）。
 *
 * 每顆都是：一層深墨剪影往右下偏移當影子，上面一層平塗＋深墨描邊。整組共用一道影子，
 * 前面的棋子不會在後面的棋子身上投影 —— 像一張剪好的貼紙，而不是好幾個物件疊在一起。
 *
 * 顏色一律寫在 style 上：globals.css 有一條 `.tile-icon path { fill: … }` 把剪影圖示染成磁磚的配色，
 * 寫成 fill 屬性會被那條規則蓋掉，inline style 才贏得過。
 * 棋子的顏色挑跟磁磚撞色的那幾個，不硬套玩家色 —— 藍棋子放在藍磁磚上只剩一圈黑框。
 *
 * 跟 react-icons 同一個介面（IconType），GameTile 與換頁轉場不用改就能用。
 */
const INK = 'rgb(var(--tile-ink))';
const CREAM = 'rgb(var(--tile-cream))';
const AMBER = 'rgb(var(--tile-amber))';
const RED = 'var(--player-A)';
const BLUE = 'var(--player-B)';
const GREEN = 'var(--player-C)';

/** 描邊寬度與影子位移（viewBox 48） */
const SW = 2.3;
const DROP = 2.5;

/** 給一個顏色，回傳那塊形狀的樣式；影子那層不管給什麼都是深墨。scale 是所在群組的縮放，描邊要反過來補 */
type Paint = (color: string, scale?: number) => CSSProperties;

function sticker(draw: (p: Paint, shadow: boolean) => ReactNode): IconType {
  function Sticker({ size, className, style }: IconBaseProps) {
    const solid: Paint = (_c, s = 1) => ({ fill: INK, stroke: INK, strokeWidth: SW / s, strokeLinejoin: 'round' });
    const color: Paint = (c, s = 1) => ({ fill: c, stroke: INK, strokeWidth: SW / s, strokeLinejoin: 'round' });
    return (
      <svg viewBox="0 0 48 48" width={size ?? '1em'} height={size ?? '1em'} className={className} style={style} aria-hidden="true">
        <g transform={`translate(${DROP} ${DROP})`}>{draw(solid, true)}</g>
        {draw(color, false)}
      </svg>
    );
  }
  return Sticker;
}

/** 細節線（高光、文字行）：只畫在上層 */
const detail = (color: string, width: number): CSSProperties => ({ fill: 'none', stroke: color, strokeWidth: width, strokeLinecap: 'round' });

/** 一顆棋子：圓頭、喇叭形身體、圓角底座。原點在底座上緣中央，高約 30 */
function Pawn({ x, y, s = 1, c, p, shadow }: { x: number; y: number; s?: number; c: string; p: Paint; shadow: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-5.2-12.5C-4.4-8.5-7.2-3.2-9.4.5H9.4C7.2-3.2 4.4-8.5 5.2-12.5Z" style={p(c, s)} />
      <rect x="-10.6" y=".5" width="21.2" height="5.6" rx="2.4" style={p(c, s)} />
      <circle cy="-17.6" r="6" style={p(c, s)} />
      {!shadow && <path d="M-3.4-19.6a3.8 3.8 0 0 1 2.6-2.2" style={detail(CREAM, 1.5 / s)} />}
    </g>
  );
}

/** 地球：圓、赤道、兩條緯線、一條經線（橢圓） */
function Globe({ cx, cy, r, c, p, shadow }: { cx: number; cy: number; r: number; c: string; p: Paint; shadow: boolean }) {
  const lat = r * 0.48;
  const half = Math.sqrt(r * r - lat * lat);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} style={p(c)} />
      {!shadow && (
        <g style={detail(INK, 1.6)}>
          <ellipse cx={cx} cy={cy} rx={r * 0.42} ry={r} />
          <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} />
          <line x1={cx - half} y1={cy - lat} x2={cx + half} y2={cy - lat} />
          <line x1={cx - half} y1={cy + lat} x2={cx + half} y2={cy + lat} />
        </g>
      )}
    </g>
  );
}

/** 本機雙人：兩顆棋子肩並肩 */
export const StickerLocal2 = sticker((p, shadow) => (
  <>
    <Pawn x={31} y={33} s={0.95} c={RED} p={p} shadow={shadow} />
    <Pawn x={17} y={33} s={0.95} c={BLUE} p={p} shadow={shadow} />
  </>
));

/** 本機三人：後排兩顆、前排一顆 */
export const StickerLocal3 = sticker((p, shadow) => (
  <>
    <Pawn x={13.5} y={31} s={0.8} c={AMBER} p={p} shadow={shadow} />
    <Pawn x={34.5} y={31} s={0.8} c={GREEN} p={p} shadow={shadow} />
    <Pawn x={24} y={35.5} s={0.9} c={CREAM} p={p} shadow={shadow} />
  </>
));

/** 連線雙人：地球前面站兩顆棋子 */
export const StickerOnline2 = sticker((p, shadow) => (
  <>
    <Globe cx={24} cy={20} r={13} c={AMBER} p={p} shadow={shadow} />
    <Pawn x={12.5} y={38.5} s={0.62} c={RED} p={p} shadow={shadow} />
    <Pawn x={35.5} y={38.5} s={0.62} c={CREAM} p={p} shadow={shadow} />
  </>
));

/** 連線三人：地球前面站三顆棋子 */
export const StickerOnline3 = sticker((p, shadow) => (
  <>
    <Globe cx={24} cy={19.5} r={13} c={CREAM} p={p} shadow={shadow} />
    <Pawn x={10.5} y={37.5} s={0.56} c={BLUE} p={p} shadow={shadow} />
    <Pawn x={37.5} y={37.5} s={0.56} c={GREEN} p={p} shadow={shadow} />
    <Pawn x={24} y={39.5} s={0.6} c={AMBER} p={p} shadow={shadow} />
  </>
));

/** 單人對戰：電腦對手（機器人的頭） */
export const StickerSolo = sticker((p, shadow) => (
  <>
    <line x1="24" y1="14" x2="24" y2="7.5" style={{ ...p(INK), strokeLinecap: 'round' }} />
    <circle cx="24" cy="6.5" r="3.2" style={p(RED)} />
    <rect x="5" y="22" width="5" height="11" rx="2" style={p(BLUE)} />
    <rect x="38" y="22" width="5" height="11" rx="2" style={p(BLUE)} />
    <rect x="8.5" y="13.5" width="31" height="27" rx="7" style={p(BLUE)} />
    <rect x="13" y="18.5" width="22" height="16" rx="4.5" style={p(CREAM)} />
    {!shadow && (
      <>
        <circle cx="19.2" cy="25" r="2.9" style={{ fill: INK }} />
        <circle cx="28.8" cy="25" r="2.9" style={{ fill: INK }} />
        <circle cx="20.1" cy="24.1" r="0.9" style={{ fill: CREAM }} />
        <circle cx="29.7" cy="24.1" r="0.9" style={{ fill: CREAM }} />
        <path d="M20 30.5h8" style={detail(INK, 2.2)} />
      </>
    )}
  </>
));

/** 遊戲規則：攤開的書，夾一條書籤 */
export const StickerRules = sticker((p, shadow) => (
  <>
    <path d="M3.5 15V39.5C11.5 37.5 18.5 37.8 24 41C29.5 37.8 36.5 37.5 44.5 39.5V15Z" style={p(AMBER)} />
    <path d="M24 15.5C19 11.5 12 11 6 13V36C12 34.2 19 34.6 24 38Z" style={p(CREAM)} />
    <path d="M24 15.5C29 11.5 36 11 42 13V36C36 34.2 29 34.6 24 38Z" style={p(CREAM)} />
    <path d="M31 12V23.5L33.75 21L36.5 23.5V11.4" style={p(RED)} />
    {!shadow && (
      <g style={detail(INK, 1.5)}>
        <path d="M10 19.5C13 18.6 16.5 18.8 20 20" />
        <path d="M10 24.5C13 23.6 16.5 23.8 20 25" />
        <path d="M10 29.5C12 28.9 14 28.9 16 29.3" />
        <path d="M28 27C31 25.9 34.5 25.8 38 26.6" />
        <path d="M28 31.5C31 30.4 34.5 30.3 38 31.1" />
      </g>
    )}
  </>
));
