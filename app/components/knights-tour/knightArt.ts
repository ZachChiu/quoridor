import { KT } from './palette';

/**
 * 騎士的樣子：一枚銅版畫的 Staunton 騎士（2026-10-25 Zach：「騎士希望可以優化好看一點」，從銅版畫、墨色圓章、
 * 紅粉筆的馬三種裡選了銅版畫）。紙色本體、墨線外框，背光那一側（胸前、下顎底下、底座右邊）用跟棋盤深格
 * 同一種 45° 斜線排線 —— 像跟棋盤從同一塊銅版印出來的。
 *
 * 顏色全部是 palette.ts 的（原件取樣，不自己調）。畫法是一組圖層（viewBox 0 0 100 100、面向右），
 * 對局（TourBoard 的 SVG）與結算分享圖（shareCard 的 Canvas，drawKnight）讀同一份，兩邊不會長得不一樣。
 * 往左跳的時候整隻左右翻過來（面向前進的方向），翻轉由畫的那一方做，這裡只畫面向右的。
 */
export type KnightLayer = {
  /** SVG path（可以好幾段） */
  d: string;
  fill?: string;
  stroke?: string;
  /** 線寬（viewBox 單位） */
  width?: number;
  /** 只畫在這些形狀裡面（好幾個就取交集） */
  clip?: readonly string[];
  opacity?: number;
};
export type KnightArt = readonly KnightLayer[];

/** Staunton 騎士的頭頸（面向右）：後頸拱起、耳尖往前、鼻樑直、嘴角一道缺口、下顎收進喉嚨、胸口往前鼓 */
const HEAD = 'M25 81 C20 70 18 54 22 42 C25 31 32 22 41 17 L47 3 C50 7 53 11 54 15 C59 16 63 19 66 23 L84 40 '
  + 'C88 43 89 48 86 51 L79 51.5 L84 55 C83 58 80 60 76 60 C69 60 62 58 57 53 C60 60 66 64 69 70 C71 74 71 78 69 81 Z';
const COLLAR = 'M21 80 H73 Q77 80 77 83.5 Q77 87 73 87 H21 Q17 87 17 83.5 Q17 80 21 80 Z';
const BASE = 'M13 95 Q13 88 21 87 H73 Q81 88 81 95 Z';
/** 整枚棋子（三塊同一個繞向，疊起來是聯集） */
const STAUNTON = `${HEAD} ${COLLAR} ${BASE}`;
const EYE = 'M56 27 C58.5 24.5 62 24.5 64 27.5 C61.5 29.5 58.5 29.5 56 27 Z';
const NOSTRIL = 'M80 43 C82.5 42.5 84 44.5 83 46.5';
const CHEEK = 'M50 27 C56 35 60 44 59 52';
/** 鬃毛：沿著後頸、往內一點的四道短弧線 */
const MANE = 'M41 21 C35 25 31 30 29 36 M34 33 C29 38 27 44 26 50 M30 47 C26 53 25 59 25 65 M28 61 C25 67 25 72 26 77';

/** 45° 的平行斜線蓋滿整格（跟棋盤深格同一個方向），gap 是間距 */
function hatch(gap: number): string {
  let d = '';
  for (let k = -100; k <= 100; k += gap) d += `M${k} 0L${k + 100} 100`;
  return d;
}

/** 銅版畫的背光面：胸前一道月牙、下顎底下一條、底座右邊 */
const SHADE = 'M57 53 C60 60 66 64 69 70 C71 74 71 78 69 81 L58 81 C61 76 61 70 58 64 C56 60 55 57 57 53 Z '
  + 'M86 51 L79 51.5 L84 55 C83 58 80 60 76 60 C69 60 62 58 57 53 C63 55 70 56 76 55.5 C80 55 83 53 86 51 Z '
  + 'M55 80 H90 V96 H55 Z';

/** 對局、規則圖、結算分享圖都畫這一隻 */
export const KNIGHT_ART: KnightArt = [
  // 外框：先描一圈粗墨線、再把本體蓋上去，留下的就是整枚棋子外緣的線
  { d: STAUNTON, stroke: KT.ink, width: 7 },
  { d: STAUNTON, fill: KT.paper },
  { d: hatch(4.2), stroke: KT.ink, width: 1.7, clip: [STAUNTON, SHADE] },
  { d: MANE, stroke: KT.ink, width: 2.6 },
  { d: CHEEK, stroke: KT.ink, width: 2, opacity: 0.8 },
  { d: EYE, fill: KT.ink },
  { d: NOSTRIL, stroke: KT.ink, width: 2.4 },
  { d: 'M21 87 H73', stroke: KT.ink, width: 2.4 },
];

/** 畫著騎士時，最後一步的紅粉筆停在離騎士中心這麼遠的地方（格子邊長的比例）：不畫進騎士身上沒蓋到的空隙（耳朵旁邊） */
export const KNIGHT_GAP = 0.42;

/**
 * 在 Canvas 上畫騎士（結算分享圖）：中心 (cx, cy)、邊長 size，face = -1 是面向左。
 * 圖層照順序畫，畫法同 TourBoard 的 KnightSvg（圓角線頭、clip 取交集）。
 */
export function drawKnight(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, face: 1 | -1 = 1, art: KnightArt = KNIGHT_ART) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale((face * size) / 100, size / 100);
  ctx.translate(-50, -50);
  for (const layer of art) {
    ctx.save();
    for (const c of layer.clip ?? []) ctx.clip(new Path2D(c));
    ctx.globalAlpha = layer.opacity ?? 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const p = new Path2D(layer.d);
    if (layer.fill) {
      ctx.fillStyle = layer.fill;
      ctx.fill(p);
    }
    if (layer.stroke) {
      ctx.strokeStyle = layer.stroke;
      ctx.lineWidth = layer.width ?? 1;
      ctx.stroke(p);
    }
    ctx.restore();
  }
  ctx.restore();
}
