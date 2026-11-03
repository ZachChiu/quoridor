import type { EntranceScene } from '@/components/entrances';
import type { WipePhase } from '@/components/WipeOverlay';
import { QT } from './palette';

/**
 * 提問與真相的進場：黑底上 8 張牌一張一張發下來（從畫面上方落到正中間一排、牌背朝上），
 * 發完最後一張，整片黑幕就是遊戲的頁面。換好頁再一張一張收走、黑幕淡掉。只動 opacity 與 transform（見 components/entrances.ts）。
 */
const N = 8;
const STEP_MS = 55;

function Scene({ phase }: { phase: WipePhase }) {
  const covered = phase === 'uncover';
  return (
    <div className="absolute inset-0">
      <div data-veil className="absolute inset-0" style={{ backgroundColor: QT.page, opacity: covered ? 1 : 0 }} />
      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center gap-[1.2vmin] px-4">
        {Array.from({ length: N }, (_, i) => (
          <span key={i} data-card={i} className="qt-back block aspect-[5/7] w-[min(10vw,72px)]"
            style={{ opacity: covered ? 1 : 0, ['--qt-paper' as string]: QT.paper, ['--qt-red' as string]: QT.red }} />
        ))}
      </div>
      {(['bottom', 'top'] as const).map((anchor) => (
        <div key={anchor} data-bleed className="absolute inset-x-0"
          style={{ [anchor]: '100%', height: 'var(--bleed, 0px)', backgroundColor: QT.page, opacity: covered ? 1 : 0 }} />
      ))}
    </div>
  );
}

function play(root: HTMLElement, phase: WipePhase): Animation[] {
  const cards = [...root.querySelectorAll<HTMLElement>('[data-card]')];
  const veils = [...root.querySelectorAll<HTMLElement>('[data-veil], [data-bleed]')];
  const total = N * STEP_MS + 260;
  const anims: Animation[] = [];
  for (const v of veils) {
    anims.push(v.animate(phase === 'cover' ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
      { duration: phase === 'cover' ? 220 : 260, delay: phase === 'cover' ? 0 : total - 200, fill: 'both' }));
  }
  cards.forEach((c, i) => {
    if (phase === 'cover') {
      anims.push(c.animate(
        [{ opacity: 0, transform: 'translateY(-40vh) rotate(-8deg)' }, { opacity: 1, transform: 'translateY(0) rotate(0deg)' }],
        { duration: 260, delay: 120 + i * STEP_MS, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' },
      ));
    } else {
      anims.push(c.animate(
        [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(30vh)' }],
        { duration: 220, delay: (N - 1 - i) * STEP_MS * 0.6, easing: 'ease-in', fill: 'both' },
      ));
    }
  });
  return anims;
}

const entrance: EntranceScene = { Scene, play };
export default entrance;
