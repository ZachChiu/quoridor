import { KT } from './palette';

/**
 * 騎士的樣子（2026-10-25 Zach：「騎士希望可以優化好看一點」）。三種給 Zach 挑，挑完把另外兩種刪掉、KNIGHT_STYLE 一起拿掉：
 *
 * - engraved（銅版畫）：一枚 Staunton 騎士，紙色本體、墨線外框，背光那一側（胸前、下顎底下、底座右邊）
 *   用跟棋盤深格同一種 45° 斜線排線 —— 像跟棋盤從同一塊銅版印出來的。
 * - medallion（墨色圓章）：舊版墨色圓底的升級 —— 裡面多一道紙色細圈（同銅版雙線框），騎士自己畫、
 *   眼睛與鬃毛刻成墨線。三種裡最好認，跟舊版最像。
 * - sanguine（紅粉筆的馬）：比較有個性的一隻 —— 兩隻耳朵豎著、鬃毛分三綹往後飄、沒有底座，脖子像素描一樣收掉；
 *   整隻是紅粉筆（同走過的路徑，像是牠自己畫出那條線），外面一圈紙色描邊，站在走錯時整格塗紅的那一格上也看得到。
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
  /** 先平移再縮放：[x, y, 倍數]（圓章裡的騎士縮小放在圓心） */
  at?: readonly [number, number, number];
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

const ENGRAVED: KnightArt = [
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

/** 圓章裡的騎士：縮成 0.78 倍、放在圓心偏上一點（底座才不會壓到裡面那道細圈） */
const INSET = [11, 10, 0.78] as const;
const CIRCLE = 'M50 0 A50 50 0 1 1 50 100 A50 50 0 1 1 50 0 Z';
const MEDALLION: KnightArt = [
  { d: CIRCLE, fill: KT.ink },
  { d: 'M50 5 A45 45 0 1 1 50 95 A45 45 0 1 1 50 5 Z', stroke: KT.paper, width: 1.6, opacity: 0.75 },
  { d: STAUNTON, fill: KT.paper, at: INSET },
  { d: MANE, stroke: KT.ink, width: 3, at: INSET },
  { d: EYE, fill: KT.ink, at: INSET },
  { d: NOSTRIL, stroke: KT.ink, width: 2.6, at: INSET },
  { d: 'M17 87 H81', stroke: KT.ink, width: 2.6, at: INSET },
  { d: 'M21 80 H73', stroke: KT.ink, width: 2.2, at: INSET },
];

/** 紅粉筆的馬（面向右）：鬃毛在後頸分三綹往後下方飄、兩隻耳朵豎著、脖子底下收成一道微彎的線 */
const HORSE = 'M25 95 C21 87 19 79 19 71 C14 74 10 78 6 84 C8 75 12 66 18 60 C12 61 7 63 3 66 C7 56 13 48 21 44 '
  + 'C15 43 10 43 6 45 C11 33 20 25 31 21 C33 18 36 16 39 15 L41 3 C45 7 47 11 48 14 '
  + 'L55 2 C58 7 59 12 58 17 C63 20 67 24 70 28 L85 43 C90 47 91 53 87 56 L80 56.5 L85 59.5 C84 63 80 64 76 64 '
  + 'C69 64 62 61 57 55 C60 64 67 70 70 78 C72 84 72 90 70 95 C55 97 40 97 25 95 Z';
const SANGUINE: KnightArt = [
  // 外面一圈紙色：站在紅粉筆塗滿的格子上（走錯、卡住）也分得出來
  { d: HORSE, stroke: KT.paper, width: 5 },
  { d: HORSE, fill: KT.chalk },
  // 鬃毛與額頭的幾道淡紅粉筆（素描裡筆觸輕的地方）
  { d: 'M34 24 C27 33 23 44 21 56 M39 26 C32 38 28 52 27 70 M44 30 C38 44 35 62 36 84', stroke: KT.chalkLight, width: 1.8, clip: [HORSE] },
  { d: 'M60 22 C66 30 66 40 62 50', stroke: KT.chalkLight, width: 2, clip: [HORSE] },
  { d: 'M57 31 C60 28 64 28 66 31.5 C63 33.5 60 33.5 57 31 Z', fill: KT.paper },
  { d: 'M64.2 31 A1.7 1.7 0 1 1 60.8 31 A1.7 1.7 0 1 1 64.2 31 Z', fill: KT.ink },
  { d: 'M81 46.5 C83.5 46 85.5 48 84.5 50.5', stroke: KT.paper, width: 2.4 },
];

export const KNIGHT_STYLES = { engraved: ENGRAVED, medallion: MEDALLION, sanguine: SANGUINE } as const;
export type KnightStyle = keyof typeof KNIGHT_STYLES;
/** 現在用哪一種（對局、規則圖、結算分享圖都跟著它） */
export const KNIGHT_STYLE: KnightStyle = 'engraved';
export const KNIGHT_ART: KnightArt = KNIGHT_STYLES[KNIGHT_STYLE];
/** 畫著騎士時，最後一步的紅粉筆停在離騎士中心這麼遠的地方（格子邊長的比例）：不畫進騎士身上沒蓋到的空隙（耳朵旁邊） */
export const KNIGHT_GAP = 0.42;
/** 騎士佔格子多大（邊長的比例）：有圓底的留一點邊，沒有圓底的畫滿整格（線條本身比較細，太小在手機上沒份量） */
export const KNIGHT_SIZE: number = { engraved: 1, medallion: 0.88, sanguine: 1 }[KNIGHT_STYLE];

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
    if (layer.at) {
      ctx.translate(layer.at[0], layer.at[1]);
      ctx.scale(layer.at[2], layer.at[2]);
    }
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
