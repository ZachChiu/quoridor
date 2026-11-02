import type { EntranceScene } from '@/components/entrances';
import type { WipePhase } from '@/components/WipeOverlay';
import { HX } from './palette';

/**
 * 六角數字盤的進場：一面磁磚牆從畫面中間往外一塊一塊翻上來（跟對局翻面同一個 rotateY），
 * 翻滿之後底下的釉白補滿磁磚之間的縫；換好頁再從外往內翻回去，底下就是遊戲。
 * 磁磚跟盤面同一套：鈷藍釉邊、青綠細線、釉白（palette.ts）。只動 transform 與 opacity（見 components/entrances.ts）。
 */
const COLS = 9;
const ROWS = 13;
const S = 'max(16vw, 12vh)';

const TILES = Array.from({ length: ROWS * COLS }, (_, k) => {
  const r = Math.floor(k / COLS), c = k % COLS;
  const dx = c - (COLS - 1) / 2 + (r % 2 ? 0.5 : 0);
  const dy = (r - (ROWS - 1) / 2) * 0.866;
  return { dx, dy, dist: Math.hypot(dx, dy) };
});
const MAX = Math.max(...TILES.map((t) => t.dist));
const HEX = 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)';

function Scene({ phase }: { phase: WipePhase }) {
  const covered = phase === 'uncover';
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div data-fill className="absolute inset-x-0" style={{ top: 'calc(-1 * var(--bleed, 0px))', bottom: 'calc(-1 * var(--bleed, 0px))', background: HX.glaze, opacity: covered ? 1 : 0 }} />
      {TILES.map(({ dx, dy }, k) => (
        <div key={k} data-tile={k} className="absolute"
          style={{
            width: S, height: `calc(${S} * 1.1547)`,
            left: `calc(50% + (${dx} - 0.5) * ${S})`, top: `calc(50% + (${dy} - 0.577) * ${S})`,
            opacity: covered ? 1 : 0,
          }}>
          <div className="absolute inset-[2%]" style={{ clipPath: HEX, background: HX.cobalt }} />
          <div className="absolute inset-[8%]" style={{ clipPath: HEX, background: HX.teal }} />
          <div className="absolute inset-[10%]" style={{ clipPath: HEX, background: HX.glaze }} />
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
  const span = 420;
  tiles.forEach((el, k) => {
    const d = (TILES[k].dist / MAX) * span;
    anims.push(phase === 'cover'
      ? el.animate([{ opacity: 0, transform: 'perspective(600px) rotateY(90deg)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: d, easing: 'ease-out', fill: 'both' })
      : el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'perspective(600px) rotateY(-90deg)' }], { duration: 220, delay: 120 + (span - d), easing: 'ease-in', fill: 'both' }));
  });
  anims.push(phase === 'cover'
    ? fill.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: span + 60, fill: 'both' })
    : fill.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'both' }));
  return anims;
}

const entrance: EntranceScene = { Scene, play };
export default entrance;
