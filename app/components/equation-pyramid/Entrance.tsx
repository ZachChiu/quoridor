import type { EntranceScene } from '@/components/entrances';
import type { WipePhase } from '@/components/WipeOverlay';
import { EP } from './palette';

/**
 * 方程式金字塔的進場：一面彩陶牆從最下面一排往上一排一排砌上去（每塊磚從下面升上來、淡入），砌滿之後石灰白補滿磚縫；
 * 換好頁再從最上面一排往下拆掉，底下就是遊戲。磚跟盤面同一套（上緣圓、下緣方，上亮下深，palette.ts）。
 * 只動 transform 與 opacity（見 components/entrances.ts）。
 */
const COLS = 8;
const ROWS = 12;

const TILES = Array.from({ length: ROWS * COLS }, (_, k) => ({ r: Math.floor(k / COLS), c: k % COLS }));
const BRICK = `linear-gradient(180deg, ${EP.light} 0%, ${EP.faience} 46%, ${EP.deep} 100%)`;

function Scene({ phase }: { phase: WipePhase }) {
  const covered = phase === 'uncover';
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div data-fill className="absolute inset-x-0" style={{ top: 'calc(-1 * var(--bleed, 0px))', bottom: 'calc(-1 * var(--bleed, 0px))', background: EP.lime, opacity: covered ? 1 : 0 }} />
      {TILES.map(({ r, c }, k) => (
        <div key={k} data-tile={k} className="absolute p-[0.6%]"
          style={{ left: `${(c / COLS) * 100}%`, top: `${(r / ROWS) * 100}%`, width: `${100 / COLS}%`, height: `${100 / ROWS}%`, opacity: covered ? 1 : 0 }}>
          <div className="size-full" style={{ background: BRICK, borderRadius: '18% 18% 7% 7% / 24% 24% 9% 9%' }} />
        </div>
      ))}
    </div>
  );
}

function play(root: HTMLElement, phase: WipePhase): Animation[] {
  const tiles = root.querySelectorAll<HTMLElement>('[data-tile]');
  const fill = root.querySelector<HTMLElement>('[data-fill]');
  if (tiles.length !== TILES.length || !fill) return [];
  const anims: Animation[] = [];
  const row = 34;
  tiles.forEach((el, k) => {
    const { r, c } = TILES[k];
    const jitter = ((c * 7 + r * 3) % 5) * 8;
    anims.push(phase === 'cover'
      ? el.animate([{ opacity: 0, transform: 'translateY(40%)' }, { opacity: 1, transform: 'none' }], { duration: 200, delay: (ROWS - 1 - r) * row + jitter, easing: 'ease-out', fill: 'both' })
      : el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-30%)' }], { duration: 180, delay: 100 + r * row + jitter, easing: 'ease-in', fill: 'both' }));
  });
  const span = ROWS * row + 60;
  anims.push(phase === 'cover'
    ? fill.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, delay: span, fill: 'both' })
    : fill.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'both' }));
  return anims;
}

const entrance: EntranceScene = { Scene, play };
export default entrance;
