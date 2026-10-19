import type { IconBaseProps } from 'react-icons';
import { SHAPE_OF, type Shape, type Side, type StoneColor } from '@/games/blind-gomoku/engine';

/**
 * 棋子的畫法：盲棋的「彩色面」（顏色＋形狀）與底面的「黑白面」。
 *
 * 七個顏色都量過（scratch 腳本，WCAG 相對亮度與 OKLCH）：
 * - 疊在棋盤底 #faf7f0 上都 ≥ 3:1（WCAG 圖形元件）；子上的米白形狀對比同一個數字
 * - OKLCH 彩度都 ≥ 0.125（CLAUDE.md 的下限）
 * - 黃色用不了亮黃：亮黃在米白上不到 2:1，只能壓成金黃（3.2:1）。形狀才是真正的身分，顏色是輔助
 *
 *   紅 #d03a35 4.5:1 · 橙 #c86400 3.7:1 · 黃 #a68800 3.2:1 · 綠 #0e8142 4.6:1
 *   藍 #2463c7 5.3:1 · 紫 #8a4cc0 5.1:1 · 粉紅 #c8337c 4.7:1
 *
 * 白子在米白棋盤上沒有對比，所以多一圈細的深色邊（不是粗描邊：約 1.5px）。
 */
export const STONE_HEX: Record<StoneColor, string> = {
  red: '#d03a35',
  orange: '#c86400',
  yellow: '#a68800',
  green: '#0e8142',
  blue: '#2463c7',
  purple: '#8a4cc0',
  pink: '#c8337c',
};

/** 這款遊戲的主色（平台卡片同一個粉紅）。米白字只有 3.5:1，上面一律放深墨字（5.0:1） */
export const KEY_HEX = '#e8457f';
const INK = '#141010';
const CREAM = '#faf7f0';
const EDGE = '#3a322c';

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = (-90 + i * 36) * (Math.PI / 180);
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}
const STAR = starPoints(50, 53, 27, 11);

/** 形狀，畫在 100×100 的座標裡、置中，大約佔子的一半 */
export function ShapeMark({ shape, fill }: { shape: Shape; fill: string }) {
  switch (shape) {
    case 'circle': return <circle cx="50" cy="50" r="19" fill={fill} />;
    case 'triangle': return <polygon points="50,25 74,67 26,67" fill={fill} />;
    case 'square': return <rect x="31" y="31" width="38" height="38" rx="3" fill={fill} />;
    case 'diamond': return <polygon points="50,24 76,50 50,76 24,50" fill={fill} />;
    case 'star': return <polygon points={STAR} fill={fill} />;
    case 'heart': return <path d="M50 74C27 58 23 41 33 33c7-6 15-3 17 4c2-7 10-10 17-4c10 8 6 25-17 41z" fill={fill} />;
    case 'cross': return <path d="M42 26h16v16h16v16H58v16H42V58H26V42h16z" fill={fill} />;
  }
}

/** 盲棋看到的那一面：顏色＋形狀 */
export function ColorFace({ color, className = 'size-full' }: { color: StoneColor; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="50" fill={STONE_HEX[color]} />
      <ShapeMark shape={SHAPE_OF[color]} fill={CREAM} />
    </svg>
  );
}

/** 底面：真正的黑白 */
export function SideFace({ side, className = 'size-full' }: { side: Side; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {side === 'black'
        ? <circle cx="50" cy="50" r="50" fill={INK} />
        : <circle cx="50" cy="50" r="46" fill="#ffffff" stroke={EDGE} strokeWidth="8" />}
    </svg>
  );
}

/** Modal 標題列用的棋子圖示（Modal 的 icon 吃 react-icons 的 IconType） */
export function BlackStoneIcon(props: IconBaseProps) {
  return (
    <svg viewBox="0 0 100 100" width="1em" height="1em" className={props.className} aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill={INK} stroke={CREAM} strokeWidth="6" />
    </svg>
  );
}
export function WhiteStoneIcon(props: IconBaseProps) {
  return (
    <svg viewBox="0 0 100 100" width="1em" height="1em" className={props.className} aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="#ffffff" stroke={EDGE} strokeWidth="7" />
    </svg>
  );
}
/** 和局、說明的標題圖示：一黑一白兩顆子 */
export function PairStonesIcon(props: IconBaseProps) {
  return (
    <svg viewBox="0 0 100 100" width="1em" height="1em" className={props.className} aria-hidden="true">
      <circle cx="34" cy="50" r="26" fill={INK} />
      <circle cx="68" cy="50" r="24" fill="#ffffff" stroke={EDGE} strokeWidth="6" />
    </svg>
  );
}
