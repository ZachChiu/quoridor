import { SHAPE_OF, type Shape, type Side, type StoneColor } from '@/games/blind-gomoku/engine';

/**
 * 棋子的畫法：盲棋的「彩色面」（顏色＋形狀）與底面的「黑白面」。
 *
 * 七個顏色取自 19 世紀朝鮮拼布包袱巾（조각보，芝加哥藝術博物館 145403，公有領域）的布塊 ——
 * 彩色的棋子就是一塊塊布，結算時翻開露出黑白。疊在白絲棋盤 #f2e4c9 上的對比（WCAG 相對亮度）：
 *
 *   絳紅 #983c4a 5.3:1 · 珊瑚 #b35e40 3.7:1 · 檸檬黃 #dfda24 1.1:1 · 青綠 #046161 5.7:1
 *   深藍 #0b2859 9.9:1 · 紫 #46246b 9:1 · 桃紅 #be3479 4.1:1
 *
 * 黃色是包袱巾裡的檸檬黃，本來就亮：每顆子都有一圈黑絲細邊（像布塊之間的縫線），黃子靠這圈邊站在盤上，
 * 形狀也改用黑絲色。形狀才是真正的身分（色盲用），顏色是輔助。
 * 翻開後的白子是包袱巾裡最亮的白絲 #ebe1cf，跟棋盤差不多亮，靠一圈黑絲邊分出來。
 */
export const STONE_HEX: Record<StoneColor, string> = {
  red: '#983c4a',
  orange: '#b35e40',
  yellow: '#dfda24',
  green: '#046161',
  blue: '#0b2859',
  purple: '#46246b',
  pink: '#be3479',
};

/** 這款遊戲的主色：包袱巾裡最多的青綠布。白絲字放在上面 5.7:1 */
export const KEY_HEX = '#046161';
/** 黑絲 */
export const INK = '#2a2525';
/** 白絲 */
export const CREAM = '#f2e4c9';
/** 翻開後的白子：包袱巾裡最亮的白絲 */
export const WHITE_FACE = '#ebe1cf';
const EDGE = '#2a2525';
/** 亮的布（黃）上面的形狀用黑絲色，其他用白絲色 */
export const LIGHT: ReadonlySet<StoneColor> = new Set(['yellow']);

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

/** 形狀的路徑（同 ShapeMark，100×100 座標），分享圖用 canvas 的 Path2D 畫同一個形狀 */
export function shapePath(shape: Shape): string {
  switch (shape) {
    case 'circle': return 'M69 50A19 19 0 1 1 31 50A19 19 0 1 1 69 50Z';
    case 'triangle': return 'M50 25L74 67L26 67Z';
    case 'square': return 'M31 31H69V69H31Z';
    case 'diamond': return 'M50 24L76 50L50 76L24 50Z';
    case 'star': return `M${STAR.replace(/ /g, 'L')}Z`;
    case 'heart': return 'M50 74C27 58 23 41 33 33c7-6 15-3 17 4c2-7 10-10 17-4c10 8 6 25-17 41z';
    case 'cross': return 'M42 26h16v16h16v16H58v16H42V58H26V42h16z';
  }
}

/** 盲棋看到的那一面：顏色＋形狀 */
export function ColorFace({ color, className = 'size-full' }: { color: StoneColor; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="47.5" fill={STONE_HEX[color]} stroke={EDGE} strokeWidth="5" />
      <ShapeMark shape={SHAPE_OF[color]} fill={LIGHT.has(color) ? INK : CREAM} />
    </svg>
  );
}

/** 底面：真正的黑白 */
export function SideFace({ side, className = 'size-full' }: { side: Side; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {side === 'black'
        ? <circle cx="50" cy="50" r="50" fill={INK} />
        : <circle cx="50" cy="50" r="46" fill={WHITE_FACE} stroke={EDGE} strokeWidth="8" />}
    </svg>
  );
}
