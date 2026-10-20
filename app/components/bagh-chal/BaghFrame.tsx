import type React from 'react';
import { BAGH } from './palette';

/**
 * 虎羊棋的整頁畫框（2026-10-20 Zach 選的「整頁圖騰」平均版）：
 * 番紅花底、上下各一條老虎追羊的飾帶（AI 畫的，public/games/bagh-chal/frieze.webp）、
 * 兩側一列小花飾（跟棋盤交叉點同一個圖案），中間是紙色面板。虎羊棋的每一頁都包在這裡面。
 *
 * - hub：遊戲首頁。飾帶粗、兩側有花飾列；上緣兩端留給平台 logo 與聯絡／語言圓鈕（PlatformCorner 是 fixed，疊在這兩塊上）
 * - play：對局、選邊、連線。飾帶收窄、沒有花飾列，把寬度讓給棋盤（提案裡「對局時上下飾帶收窄」）
 * - page：規則頁。跟 hub 一樣，但上緣不留角落（規則頁的按鈕在面板裡的置頂列）
 *
 * 底色寫在 .bagh-root 上，globals.css 依它把 html／body 也換成番紅花，捲到底或回彈時才不會露出奶油色。
 */
export default function BaghFrame({ variant = 'hub', className = '', children }: {
  variant?: 'hub' | 'play' | 'page';
  className?: string;
  children: React.ReactNode;
}) {
  const tall = variant !== 'play';
  const band = tall ? 'h-[clamp(36px,5.6dvh,52px)]' : 'h-[clamp(22px,3.2dvh,32px)]';
  return (
    <div className="bagh-root flex min-h-dvh flex-col bg-[#e3a43c] p-[5px] font-[family-name:var(--font-app)] text-tile-ink">
      <div className="flex flex-1 flex-col overflow-hidden rounded-[18px] border-[3px] border-[#5b6620]">
        <div className={`flex ${band} shrink-0`}>
          {/* 上緣兩端：平台 logo（左 40px）、聯絡＋語言（右兩顆 40px）疊在這兩塊上 */}
          {variant === 'hub' && <CornerBlock className="w-[52px]" />}
          <Frieze className="h-full flex-1" />
          {variant === 'hub' && <CornerBlock className="w-[96px]" />}
        </div>
        <div className="flex flex-1">
          {tall && <RosetteColumn />}
          <div className={`flex min-w-0 flex-1 flex-col rounded-xl border-[3px] border-[#5b6620] bg-[#fbf4e1] ${tall ? '' : 'mx-1.5'} ${className}`}>
            {children}
          </div>
          {tall && <RosetteColumn />}
        </div>
        {/* 下緣左右鏡射：上面往右追、下面往左追，繞著頁面轉一圈 */}
        <Frieze className={`${band} shrink-0`} flip />
      </div>
    </div>
  );
}

/** 一條老虎追羊的飾帶。round：整數段，兩端不會切到半隻動物 */
export function Frieze({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <div aria-hidden="true" className={`bg-[url('/games/bagh-chal/frieze.webp')] bg-[length:auto_100%] bg-center [background-repeat:round_no-repeat] ${className}`}
      style={flip ? { transform: 'scaleX(-1)' } : undefined} />
  );
}

const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** 小花：四瓣深褐、四瓣陶紅、紙色花心 —— 跟棋盤交叉點同一個圖案 */
const ROSETTE = `<g transform='translate(11 18) scale(7.2)'>${
  [0, 90, 180, 270].map((a) => `<path transform='rotate(${a})' d='M0-1C.28-.5.24-.18 0 0C-.24-.18-.28-.5 0-1Z' fill='${BAGH.brown}'/>`).join('')
}${
  [45, 135, 225, 315].map((a) => `<path transform='rotate(${a})' d='M0-.72C.22-.4.18-.16 0 0C-.18-.16-.22-.4 0-.72Z' fill='${BAGH.terracotta}'/>`).join('')
}<circle r='.2' fill='${BAGH.paper}'/></g>`;
const ROSETTE_TILE = svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 22 36'>${ROSETTE}</svg>`);

function RosetteColumn() {
  return (
    <div aria-hidden="true" className="w-[22px] shrink-0"
      style={{ backgroundImage: ROSETTE_TILE, backgroundSize: '22px 36px', backgroundRepeat: 'no-repeat round', backgroundPosition: 'center' }} />
  );
}

/** 上緣兩端的橘色方塊（印刷棋盤四角那種），中間一朵花 */
function CornerBlock({ className }: { className: string }) {
  return (
    <div aria-hidden="true" className={`shrink-0 bg-[#d9822b] ${className}`}
      style={{ backgroundImage: ROSETTE_TILE, backgroundSize: '22px 36px', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
  );
}

/** 達卡織紋（尼泊爾的 dhaka 布）：深底上紅色菱形、米白內菱、綠色角 —— 用在按鈕邊條與對局頁最下面一條 */
export const WEAVE_TILE = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' fill='#1e1410'/>`
  + `<path d='M8 2L14 8L8 14L2 8Z' fill='#c4372d'/><path d='M8 5L11 8L8 11L5 8Z' fill='#f6efe0'/>`
  + `<path d='M0 0H3L0 3ZM16 0H13L16 3ZM0 16H3L0 13ZM16 16H13L16 13Z' fill='#3f7a3a'/></svg>`,
);

export function WeaveStrip({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`shrink-0 ${className}`} style={{ backgroundImage: WEAVE_TILE, backgroundSize: 'auto 100%', backgroundRepeat: 'round no-repeat' }} />;
}
