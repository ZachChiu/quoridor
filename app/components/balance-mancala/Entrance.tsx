import type { EntranceScene } from '@/components/entrances';
import type { WipePhase } from '@/components/WipeOverlay';
import { BRASS, CLOTH, CLOTH_LIGHT, DISH_BG, INK, WOOD } from './palette';

/**
 * 均衡曼卡拉的進場：播種 —— 畫面從中心切成 14 塊扇形（棋盤是 14 格繞一圈），照規則的方向（順時針、從最上面那格起）
 * 一塊一塊播下去，每塊帶著一個盤子；播滿一圈就蓋滿了。換好頁之後繼續順時針一塊一塊收走，最後收掉中間的黃銅。
 *
 * 扇形是印花布的兩種布色交替，塊與塊之間一道墨色的縫（越往外越寬，像梳子畫出去的線）；盤子是紅、藍、綠三色，
 * 最上、最下兩格是木頭色（棋盤上那兩格特殊格）；中間一塊嵌木邊的黃銅。顏色同 palette.ts。
 * 只動 transform／opacity（見 components/entrances.ts）。
 */

const CELLS = 14;
const SPAN = 360 / CELLS;
/** 每一塊播下去隔幾毫秒：一圈約 0.47 秒 */
const STEP_MS = 36;

/**
 * 扇形畫在一個比畫面大很多的正方形裡（150vmax，置中，超出的被轉場層裁掉），百分比座標才是真的角度。
 * 正方形邊長 1.5vmax、畫面對角線最多 1.414vmax，所以畫面四角都在 47% 半徑以內；三角形的頂點放在 72%，
 * 弦離中心最近 72%·cos(角寬/2) ≈ 70%，扇形一定蓋得到畫面最遠的角。
 */
const R = 72;
const pt = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(50 + r * Math.cos(a)).toFixed(2)}% ${(50 + r * Math.sin(a)).toFixed(2)}%`;
};
const wedge = (from: number, to: number) => `polygon(50% 50%, ${pt(from, R)}, ${pt(to, R)})`;

/** 第 i 塊從幾度開始：0 是最上面那格的正中間，順時針（CSS 的角度是順時針，-90° 是正上方） */
const startOf = (i: number) => -90 - SPAN / 2 + i * SPAN;
/** 盤子的顏色：最上（0）與最下（7）是特殊格，其餘紅藍綠輪流 */
const dishOf = (i: number) => (i % 7 === 0 ? WOOD : DISH_BG[((i < 7 ? i - 1 : i - 2) % 3) as 0 | 1 | 2]);
/**
 * 盤子那一圈的半徑與盤子大小，用畫面短邊（vmin）算：正方形是照長邊（vmax）開的，用它的百分比的話，
 * 手機上左右兩個盤子會被畫面邊緣切掉一半（錄影看到的）。
 */
const RING = 38;
const DISH = 11;

function Scene({ phase }: { phase: WipePhase }) {
  const covered = phase === 'uncover';
  return (
    <div className="absolute left-1/2 top-1/2 size-[150vmax] -translate-x-1/2 -translate-y-1/2">
      {Array.from({ length: CELLS }, (_, i) => {
        const a0 = startOf(i);
        const mid = a0 + SPAN / 2;
        const m = (mid * Math.PI) / 180;
        return (
          <div
            key={i}
            data-cell={i}
            className="absolute inset-0"
            style={{
              clipPath: wedge(a0, a0 + SPAN),
              backgroundColor: INK,
              transformOrigin: '50% 50%',
              willChange: 'transform, opacity',
              // 第一格就給對：播之前一塊都沒有、收之前一圈都在（見 EntranceScene 的說明）
              opacity: covered ? 1 : 0,
            }}
          >
            {/* 布：比扇形窄一點，兩邊露出墨色的縫 */}
            <div className="absolute inset-0" style={{ clipPath: wedge(a0 + 0.7, a0 + SPAN - 0.7), backgroundColor: i % 2 ? CLOTH : CLOTH_LIGHT }} />
            <div
              className="absolute rounded-full"
              style={{
                width: `${DISH}vmin`, height: `${DISH}vmin`,
                left: `calc(50% + ${(RING * Math.cos(m) - DISH / 2).toFixed(2)}vmin)`, top: `calc(50% + ${(RING * Math.sin(m) - DISH / 2).toFixed(2)}vmin)`,
                background: dishOf(i),
                boxShadow: `inset 0 0 0 3px ${INK}, inset 0 0 0 6px rgb(255 255 255 / 0.18)`,
              }}
            />
          </div>
        );
      })}
      {/* 中間的黃銅：嵌一圈木邊 */}
      <div
        data-brass
        className="absolute left-1/2 top-1/2 size-[16vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: BRASS, boxShadow: `0 0 0 6px ${WOOD}, inset 0 0 0 3px rgb(32 18 17 / 0.28)`, opacity: covered ? 1 : 0 }}
      />
    </div>
  );
}

function play(root: HTMLElement, phase: WipePhase): Animation[] {
  const cells = root.querySelectorAll<HTMLElement>('[data-cell]');
  const brass = root.querySelector<HTMLElement>('[data-brass]');
  if (cells.length !== CELLS || !brass) return [];
  const anims: Animation[] = [];
  if (phase === 'cover') {
    // 先放黃銅，再從最上面那格順時針一塊塊播下去：每塊從中心往外長一點點、同時出現
    anims.push(brass.animate([{ opacity: 0, transform: 'translate(-50%, -50%) scale(0.2)' }, { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }],
      { duration: 180, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.2)', fill: 'both' }));
    cells.forEach((cell, i) => {
      anims.push(cell.animate([{ opacity: 0, transform: 'scale(0.86)' }, { opacity: 1, transform: 'scale(1)' }],
        { duration: 170, delay: 60 + i * STEP_MS, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)', fill: 'both' }));
    });
  } else {
    // 繼續順時針：從最上面那格起一塊塊收走，最後收掉中間的黃銅
    cells.forEach((cell, i) => {
      anims.push(cell.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.06)' }],
        { duration: 160, delay: 80 + i * STEP_MS, easing: 'ease-in', fill: 'both' }));
    });
    anims.push(brass.animate([{ opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }, { opacity: 0, transform: 'translate(-50%, -50%) scale(0.2)' }],
      { duration: 200, delay: 80 + CELLS * STEP_MS, easing: 'ease-in', fill: 'both' }));
  }
  return anims;
}

const entrance: EntranceScene = { Scene, play };
export default entrance;
