import type { EntranceScene } from '@/components/entrances';
import type { WipePhase } from '@/components/WipeOverlay';
import { LD } from './palette';

/**
 * 大話骰的進場：披風胸前的階梯方格從畫面正中間往外一圈一圈織出來 —— 6 欄的方格，黃與靛藍交錯、
 * 胭脂蟲紅的格線，每格中間一顆「眼」；離中心越遠越晚出現，蓋滿就是一整片披風的胸口。
 * 換好頁再從外往內收回去，底下就是遊戲。只動 opacity 與 transform（見 components/entrances.ts）。
 */
const COLS = 6;
const ROWS = 10;
const STEP_MS = 55;

function Scene({ phase }: { phase: WipePhase }) {
  const covered = phase === 'uncover';
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const gold = (r + c) % 2 === 0;
      cells.push(
        <div key={`${r}-${c}`} data-cell data-ring={Math.max(Math.abs(c - (COLS - 1) / 2), Math.abs(r - (ROWS - 1) / 2) * 0.6)}
          className="grid place-items-center"
          style={{ backgroundColor: gold ? LD.gold : LD.indigo, boxShadow: `inset 0 0 0 3px ${LD.red}`, opacity: covered ? 1 : 0 }}>
          <span className="block h-[22%] w-[9%] rounded-[50%]" style={{ backgroundColor: gold ? LD.red : LD.gold }} />
        </div>,
      );
    }
  }
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>{cells}</div>
      {/* 轉場層在 iOS 26 Safari 會多蓋到狀態列、工具列底下（WipeOverlay 的 --bleed）：上下接一截羊毛色 */}
      {(['bottom', 'top'] as const).map((anchor) => (
        <div key={anchor} data-bleed className="absolute inset-x-0"
          style={{ [anchor]: '100%', height: 'var(--bleed, 0px)', backgroundColor: LD.wool, opacity: covered ? 1 : 0 }} />
      ))}
    </div>
  );
}

function play(root: HTMLElement, phase: WipePhase): Animation[] {
  const cells = [...root.querySelectorAll<HTMLElement>('[data-cell]')];
  if (!cells.length) return [];
  const maxRing = Math.max(...cells.map((c) => Number(c.dataset.ring)));
  const anims: Animation[] = [];
  const total = (maxRing + 1) * STEP_MS + 160;
  root.querySelectorAll<HTMLElement>('[data-bleed]').forEach((strip) => {
    anims.push(strip.animate(phase === 'cover' ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }], { duration: total, fill: 'both' }));
  });
  for (const cell of cells) {
    const ring = Number(cell.dataset.ring);
    if (phase === 'cover') {
      anims.push(cell.animate(
        [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }],
        { duration: 160, delay: ring * STEP_MS, easing: 'ease-out', fill: 'both' },
      ));
    } else {
      anims.push(cell.animate(
        [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.6)' }],
        { duration: 160, delay: 60 + (maxRing - ring) * STEP_MS, easing: 'ease-in', fill: 'both' },
      ));
    }
  }
  return anims;
}

const entrance: EntranceScene = { Scene, play };
export default entrance;
