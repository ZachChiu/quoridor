import { SHAPE_OF, type Shape, type Side, type StoneColor } from '@/games/blind-gomoku/engine';
import type { BlindGomokuText } from '@/games/blind-gomoku/text';

/**
 * 棋子的畫法：盲棋的「彩色面」（顏色＋形狀）與底面的「黑白面」。
 *
 * 七個顏色取自 19 世紀朝鮮拼布包袱巾（조각보，芝加哥藝術博物館 145403，公有領域）的布塊 ——
 * 彩色的棋子就是一塊塊布，結算時翻開露出黑白。疊在白絲棋盤 #f2e4c9 上的對比（WCAG 相對亮度）：
 *
 *   絳紅 #983c4a 5.3:1 · 珊瑚 #b35e40 3.7:1 · 檸檬黃 #dfda24 1.1:1 · 青綠 #046161 5.7:1
 *   深藍 #0b2859 9.9:1 · 紫 #46246b 9:1 · 桃紅 #be3479 4.1:1
 *
 * 黃色是包袱巾裡的檸檬黃，本來就亮：每顆子都有一圈黑絲細邊，黃子靠這圈邊站在盤上，
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

// ─── 原石（11/1 Zach 從五種石頭／方塊裡挑的 D「天然原石」）────────────────────
/*
  每顆子是一塊不規則的七邊形原石：從偏上的一點往七個角切成七個切面，一面亮一面暗，外緣一圈黑絲線、底下一點影子。
  切面的明暗只用那顆子自己的顏色混白、混黑絲（不加新色）。外形照 seed（盤上的位置）決定 ——
  同一點每次畫都一樣、相鄰的子不會長得一模一樣；不用 Math.random。分享圖（shareCard.ts）讀同一份外形。
  形狀標記照原本的大小（約 ±27）：外形最窄也有 40，標記整個落在石頭裡。
*/
/** 每個切面往白（正）或往黑絲（負）混多少 */
const FACET_TINT = [0.22, -0.18, 0.1, -0.3, 0.15, -0.08, 0.05];
const CORNERS = 7;

function rng(seed: number) {
  let a = (seed * 2654435761 + 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type RockShape = { corners: [number, number][]; apex: [number, number] };

const rocks = new Map<number, RockShape>();
/** seed 這顆原石的外形（100×100 座標），算過的記起來 */
export function rockShape(seed: number): RockShape {
  const hit = rocks.get(seed);
  if (hit) return hit;
  const rnd = rng(seed);
  const corners = Array.from({ length: CORNERS }, (_, i): [number, number] => {
    const a = (i / CORNERS) * Math.PI * 2 - Math.PI / 2 + (rnd() - 0.5) * 0.35;
    const r = 41 + rnd() * 7;
    return [50 + Math.cos(a) * r, 50 + Math.sin(a) * r * 0.94];
  });
  const rock: RockShape = { corners, apex: [47 + rnd() * 6, 43 + rnd() * 6] };
  rocks.set(seed, rock);
  return rock;
}

function mix(a: string, b: string, t: number): string {
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  return '#' + [1, 3, 5].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t).toString(16).padStart(2, '0')).join('');
}

/** 第 i 個切面的顏色。黑子往黑混不出差別，只有亮的那幾面；白子跟棋盤一樣亮，亮面多混一點 */
export function facetColor(base: string, i: number): string {
  const t = FACET_TINT[i % FACET_TINT.length];
  if (t > 0) return mix(base, '#ffffff', base === WHITE_FACE ? t * 1.6 : t);
  return mix(base, INK, -t * (base === INK ? 1.5 : 1));
}

const pt = ([x, y]: [number, number]) => `${x.toFixed(1)},${y.toFixed(1)}`;

function Rock({ base, seed }: { base: string; seed: number }) {
  const { corners, apex } = rockShape(seed);
  return (
    <>
      <ellipse cx="51" cy="93" rx="34" ry="4.5" fill={INK} opacity="0.18" />
      {corners.map((p, i) => (
        <polygon key={i} points={`${pt(apex)} ${pt(p)} ${pt(corners[(i + 1) % CORNERS])}`} fill={facetColor(base, i)} stroke={facetColor(base, i)} strokeWidth="0.6" />
      ))}
      <polygon points={corners.map(pt).join(' ')} fill="none" stroke={EDGE} strokeWidth="3" strokeLinejoin="round" />
    </>
  );
}

/** 顏色沒給 seed 時（選單、圖示）每個顏色固定一塊 */
export const COLOR_SEED: Record<StoneColor, number> = { red: 301, orange: 302, yellow: 303, green: 304, blue: 305, purple: 306, pink: 307 };

/** 盲棋看到的那一面：顏色＋形狀。seed＝盤上的位置，同一點的兩面同一塊石頭 */
export function ColorFace({ color, seed = COLOR_SEED[color], className = 'size-full' }: { color: StoneColor; seed?: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <Rock base={STONE_HEX[color]} seed={seed} />
      <ShapeMark shape={SHAPE_OF[color]} fill={LIGHT.has(color) ? INK : CREAM} />
    </svg>
  );
}

/** 底面：真正的黑白 */
export function SideFace({ side, seed = side === 'black' ? 401 : 402, className = 'size-full' }: { side: Side; seed?: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <Rock base={side === 'black' ? INK : WHITE_FACE} seed={seed} />
    </svg>
  );
}

/** 讀屏與 title 用的顏色名：「紅 圓形」 */
export function colorName(t: BlindGomokuText, c: StoneColor): string {
  return `${t.colors[c]} ${t.shapes[SHAPE_OF[c]]}`;
}
