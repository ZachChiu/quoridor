import type React from 'react';

/**
 * 換頁轉場用的一扇木窗門（紐瓦爾木窗：中間是斜格的 tikijhya 窗櫺，上下兩塊雕花板，內側一個銅環）。
 * 從平台卡片進虎羊棋的那一下是「兩扇窗門關上、換好頁再往外推開」（2026-10-20 Zach 指定，見 WipeOverlay 的 doors）；虎羊棋裡面換頁不播（10-22）。
 *
 * 全部用 CSS＋SVG 小圖塊鋪：門會被拉成手機的細長比例或桌機的寬比例，整張插畫會變形，
 * 鋪圖塊的窗櫺不管多高多寬都一樣好看。純裝飾，整個轉場層本來就是 aria-hidden。
 */
const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

const WOOD = '#3a1d0f';
const DARK = '#1c0d06';
const SAFFRON = '#e3a43c';
const TERRACOTTA = '#b8471f';

/** 斜格窗櫺：兩道交叉的木條，每個交會點一顆番紅花色的木釘 */
const LATTICE = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'><rect width='36' height='36' fill='#24110a'/>`
  + `<path d='M0 0L36 36M36 0L0 36' stroke='#6e3a1e' stroke-width='8'/>`
  + `<path d='M0 0L36 36M36 0L0 36' stroke='#9a5a32' stroke-width='1.4'/>`
  + [[18, 18], [0, 0], [36, 0], [0, 36], [36, 36]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='4.2' fill='${SAFFRON}'/><circle cx='${x}' cy='${y}' r='1.6' fill='${DARK}'/>`).join('')
  + `</svg>`,
);

/** 雕花板：木底上一朵朵上了彩的花（跟棋盤交叉點同一個圖案） */
const CARVE = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' fill='${WOOD}'/><g transform='translate(20 20) scale(12)'>`
  + [0, 90, 180, 270].map((a) => `<path transform='rotate(${a})' d='M0-1C.28-.5.24-.18 0 0C-.24-.18-.28-.5 0-1Z' fill='${SAFFRON}'/>`).join('')
  + [45, 135, 225, 315].map((a) => `<path transform='rotate(${a})' d='M0-.72C.22-.4.18-.16 0 0C-.18-.16-.22-.4 0-.72Z' fill='${TERRACOTTA}'/>`).join('')
  + `<circle r='.2' fill='${DARK}'/></g></svg>`,
);

export default function Door({ side }: { side: 'left' | 'right' }) {
  const panel = (style: React.CSSProperties, bg: string, size: string) => (
    <div className="absolute rounded-sm" style={{ left: 20, right: 20, border: `3px solid ${DARK}`, backgroundImage: bg, backgroundSize: size, backgroundPosition: 'center', ...style }} />
  );
  return (
    <div className="absolute inset-0" style={{ background: WOOD, border: `3px solid ${DARK}` }}>
      {/* 上了彩的內框線 */}
      <div className="absolute inset-[10px] rounded-md border-2" style={{ borderColor: SAFFRON }} />
      {panel({ top: 20, height: '15%', backgroundRepeat: 'round' }, CARVE, '40px 40px')}
      {panel({ top: 'calc(15% + 30px)', bottom: 'calc(15% + 30px)' }, LATTICE, '36px 36px')}
      {panel({ bottom: 20, height: '15%', backgroundRepeat: 'round' }, CARVE, '40px 40px')}
      {/* 銅環：在兩扇門相接的那一側 */}
      <div className="absolute top-1/2 size-[30px] -translate-y-1/2 rounded-full border-[5px] border-[#c9a24a]"
        style={side === 'left' ? { right: 8 } : { left: 8 }} />
    </div>
  );
}
