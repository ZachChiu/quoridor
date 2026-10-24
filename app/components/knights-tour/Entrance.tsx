import type { EntranceScene } from '@/components/entrances';
import type { WipePhase } from '@/components/WipeOverlay';
import { EULER_TOUR } from '@/games/knights-tour/euler';
import { KT } from './palette';

/**
 * 騎士巡遊的進場：騎士把整個畫面走一遍 —— 畫面切成 8×8 格，照歐拉 1759 年那條走法一格一格落下，
 * 剛落下的格子是紅粉筆色、再褪成紙色並寫上第幾步；走完 64 步，畫面就是歐拉論文裡那張數字表。
 * 換好頁再倒著走回去，一格一格收掉，底下就是遊戲。
 *
 * 格子跟對局棋盤同一套：紙色、深格用銅版的斜線排線、舊式數字（.kt-serif）。格子跟著畫面拉成長方形
 * （手機是直的、桌機是橫的）—— 要蓋滿畫面，正方形會有一半落在畫面外。
 * 只動 opacity（見 components/entrances.ts）。
 */

/** 跟對局棋盤深格同一種斜線 */
const HATCH = 'repeating-linear-gradient(45deg, rgb(50 46 42 / 0.28) 0 1px, transparent 1px 4.5px)';
/** 每一步隔幾毫秒：64 步約 0.4 秒走完 */
const STEP_MS = 6;
/** 紅粉筆褪掉要多久：同時大約有四、五十格還帶著紅，看起來是一道紅色的足跡 */
const CHALK_MS = 280;

/** 每一格是第幾步（EULER_TOUR 反查） */
const STEP_OF: number[] = (() => {
  const a: number[] = new Array(64);
  EULER_TOUR.forEach((sq, i) => { a[sq] = i + 1; });
  return a;
})();

function Scene({ phase }: { phase: WipePhase }) {
  const covered = phase === 'uncover';
  return (
    <div className="kt-serif absolute inset-0 grid grid-cols-8 grid-rows-8">
      {STEP_OF.map((step, sq) => (
        <div
          key={sq}
          data-sq={sq}
          className="relative grid place-items-center"
          style={{
            backgroundColor: KT.paper,
            backgroundImage: (Math.floor(sq / 8) + sq) % 2 === 1 ? HATCH : undefined,
            boxShadow: 'inset 0 0 0 1px rgb(50 46 42 / 0.3)',
            color: KT.ink,
            // 第一格就給對：走之前一格都沒有、收之前全部都在（見 EntranceScene 的說明）
            opacity: covered ? 1 : 0,
          }}
        >
          <span className="leading-none" style={{ fontSize: 'min(5vw, 6vh, 34px)', fontVariantNumeric: 'oldstyle-nums' }}>{step}</span>
          <div data-chalk className="absolute inset-0" style={{ backgroundColor: KT.chalk, opacity: 0 }} />
        </div>
      ))}
    </div>
  );
}

function play(root: HTMLElement, phase: WipePhase): Animation[] {
  const cells = root.querySelectorAll<HTMLElement>('[data-sq]');
  if (cells.length !== 64) return [];
  const anims: Animation[] = [];
  EULER_TOUR.forEach((sq, i) => {
    const cell = cells[sq];
    if (phase === 'cover') {
      const delay = i * STEP_MS;
      anims.push(cell.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 90, delay, fill: 'both' }));
      const chalk = cell.querySelector<HTMLElement>('[data-chalk]');
      if (chalk) anims.push(chalk.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: CHALK_MS, delay, easing: 'ease-in', fill: 'both' }));
    } else {
      // 倒著走回去：第 64 步先收
      anims.push(cell.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 110, delay: 60 + (63 - i) * STEP_MS, fill: 'both' }));
    }
  });
  return anims;
}

const entrance: EntranceScene = { Scene, play };
export default entrance;
