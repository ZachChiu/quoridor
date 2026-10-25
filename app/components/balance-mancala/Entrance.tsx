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

/** 第 i 塊的中線是幾度：0 是正上方，順時針（第 0 塊是最上面那格） */
const midOf = (i: number) => i * SPAN;
/** 盤子的顏色：最上（0）與最下（7）是特殊格，其餘紅藍綠輪流 */
const dishOf = (i: number) => (i % 7 === 0 ? WOOD : DISH_BG[((i < 7 ? i - 1 : i - 2) % 3) as 0 | 1 | 2]);
/** 盤子那一圈的半徑與盤子大小，用畫面短邊（vmin）算，手機上左右兩個盤子才不會被畫面邊緣切掉 */
const RING = 38;
const DISH = 11;
/** 相鄰兩塊各多疊一點點（度），墨色的縫才不會在交界處反鋸齒出一條亮線 */
const OVERLAP = 0.3;
/** 布比扇形窄多少（度）：兩邊露出墨色的縫，越往外越寬 */
const SEAM = 0.7;
const tan = (deg: number) => Math.tan((deg * Math.PI) / 180);
/** 布在長條頂端左右各退多少（%）：扇形與布都是從中心放射出去的，退的比例處處相同 */
const CLOTH_INSET = ((1 - tan(SPAN / 2 - SEAM) / tan(SPAN / 2 + OVERLAP)) * 50).toFixed(2);

/**
 * 扇形要伸多遠：14 塊拼成一個正十四邊形，中心到每一邊的距離要蓋過畫面最遠的角，
 * 畫面要算上上下多蓋的那兩截（WipeOverlay 的 bleedOf，iOS 26 Safari 的狀態列、工具列底下）。
 * 那兩截 render 時還量不到，照 bleedOf 的上限估（多蓋一點無妨）。
 */
function reach(): number {
  if (typeof window === 'undefined') return 1000;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const bleed = Math.max(h * 0.25, 192);
  return Math.ceil(Math.hypot(w / 2, h / 2 + bleed)) + 4;
}

/**
 * 每一塊是一條剛好包住那塊扇形的長條：底邊中點釘在畫面正中央、朝上，用 rotate 轉到自己的角度，
 * clip-path 切成三角形。先前是 14 塊各自一整個 150vmax 的正方形再切，14 張比畫面大好幾倍的圖層，
 * iPhone 上的 Chrome 一進來就被砍掉分頁（10/25 Zach：「Chrome 進去網頁會壞掉」）。長條只有那塊扇形那麼大。
 */
function Scene({ phase }: { phase: WipePhase }) {
  const covered = phase === 'uncover';
  const r = reach();
  const width = Math.ceil(2 * r * tan(SPAN / 2 + OVERLAP));
  return (
    <div className="absolute left-1/2 top-1/2">
      {Array.from({ length: CELLS }, (_, i) => (
        <div
          key={i}
          data-cell={i}
          className="absolute bottom-0"
          style={{
            width, height: r, left: -width / 2,
            clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
            backgroundColor: INK,
            transformOrigin: '50% 100%',
            rotate: `${midOf(i)}deg`,
            // 第一格就給對：播之前一塊都沒有、收之前一圈都在（見 EntranceScene 的說明）
            opacity: covered ? 1 : 0,
          }}
        >
          {/* 布：比扇形窄一點，兩邊露出墨色的縫 */}
          <div className="absolute inset-0" style={{ clipPath: `polygon(50% 100%, ${CLOTH_INSET}% 0%, ${100 - Number(CLOTH_INSET)}% 0%)`, backgroundColor: i % 2 ? CLOTH : CLOTH_LIGHT }} />
          <div
            className="absolute left-1/2 rounded-full"
            style={{
              width: `${DISH}vmin`, height: `${DISH}vmin`,
              marginLeft: `${-DISH / 2}vmin`, bottom: `${RING - DISH / 2}vmin`,
              background: dishOf(i),
              boxShadow: `inset 0 0 0 3px ${INK}, inset 0 0 0 6px rgb(255 255 255 / 0.18)`,
            }}
          />
        </div>
      ))}
      {/* 中間的黃銅：嵌一圈木邊 */}
      <div
        data-brass
        className="absolute left-0 top-0 size-[16vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
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
