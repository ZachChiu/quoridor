import type React from 'react';
import type { EntranceScene } from '@/components/entrances';
import type { WipePhase } from '@/components/WipeOverlay';

/**
 * 盲眼五子棋的進場：用包袱巾（보자기）把畫面包起來，再攤開 —— 四個三角形的布角從畫面四邊往中間折進來
 * （上、下、左、右，像包東西時先折對角），蓋滿之後換頁，再照相反的順序一塊塊攤開，底下就是遊戲。
 *
 * 布角是拼布（조각보）：每塊是五道平行底邊的布條，條與條之間一道白絲縫線。條寬用百分比，
 * 四塊折在一起時每一道剛好在斜縫上接齊，就是包袱巾常見的「同心方框、斜角拼接」。
 * 顏色同 palette.ts 與 Stone.tsx 的布色（19 世紀朝鮮拼布包袱巾，芝加哥藝術博物館 145403）。
 * 不用首頁那張照片：只有 750px，鋪滿手機或桌機都會糊。只動 transform／opacity（見 components/entrances.ts）。
 */

const TEAL = '#046161';
const PINK = '#be3479';
const SILK = '#f2e4c9';
const RAMIE = '#c2c7b9';
const BLUE = '#0b2859';
const YELLOW = '#dfda24';
const RED = '#983c4a';
const PURPLE = '#46246b';

type Side = 'top' | 'bottom' | 'left' | 'right';

/** 由外往內五道布條；相鄰兩塊同一圈的布不同色（像 log cabin 那樣在斜縫換布） */
const RINGS: Record<Side, string[]> = {
  top: [TEAL, SILK, PINK, BLUE, YELLOW],
  bottom: [BLUE, SILK, YELLOW, TEAL, PINK],
  left: [PURPLE, RAMIE, RED, SILK, TEAL],
  right: [PINK, RAMIE, TEAL, PURPLE, SILK],
};

/**
 * 每圈的外緣與內緣（布角從邊到中心是 0–50%）。寬窄不一：等寬的話手機上像一條隧道的錯覺，
 * 不像手縫的拼布。四塊用同一組，斜縫上才接得齊。
 */
const STOPS = [0, 8, 19, 27, 38, 50];

/** 布條：圈與圈之間 2px 白絲縫線 */
function bands(side: Side): string {
  const dir = { top: 'to bottom', bottom: 'to top', left: 'to right', right: 'to left' }[side];
  const stops = RINGS[side].flatMap((c, i) => {
    const a = STOPS[i], b = STOPS[i + 1];
    const start = i === 0 ? '0%' : `calc(${a}% + 1px)`;
    return [`${c} ${start} calc(${b}% - 1px)`, `${SILK} calc(${b}% - 1px) calc(${b}% + 1px)`];
  });
  return `linear-gradient(${dir}, ${stops.join(', ')})`;
}

const CLIP: Record<Side, string> = {
  top: 'polygon(0 0, 100% 0, 50% 50%)',
  bottom: 'polygon(0 100%, 100% 100%, 50% 50%)',
  left: 'polygon(0 0, 0 100%, 50% 50%)',
  right: 'polygon(100% 0, 100% 100%, 50% 50%)',
};
const HINGE: Record<Side, string> = { top: '50% 0', bottom: '50% 100%', left: '0 50%', right: '100% 50%' };
/**
 * 還沒折進來（攤開）的樣子：布角立起來朝著觀眾、再多轉一點（背面朝外，backface-visibility 讓它消失）。
 * 正負號讓尖端一律往觀眾那邊翻，不是往畫面裡倒。
 */
const OPEN: Record<Side, string> = {
  top: 'rotateX(95deg)',
  bottom: 'rotateX(-95deg)',
  left: 'rotateY(-95deg)',
  right: 'rotateY(95deg)',
};
/** 折好、平貼在畫面上。跟 OPEN 用同一種旋轉函式，動畫才會沿著同一個軸轉（函式不同會改用矩陣內插，可能轉錯邊） */
const FOLDED: Record<Side, string> = { top: 'rotateX(0deg)', bottom: 'rotateX(0deg)', left: 'rotateY(0deg)', right: 'rotateY(0deg)' };
/** 折的順序：先上下、再左右（包袱巾先折對角）；攤開時倒過來 */
const ORDER: Side[] = ['top', 'bottom', 'left', 'right'];
/** 立起來的布角有多暗 */
const SHADE = 0.4;

function Scene({ phase }: { phase: WipePhase }) {
  const covered = phase === 'uncover';
  return (
    <div className="absolute inset-0" style={{ perspective: 'calc(max(100vw, 100vh) * 2)' }}>
      {ORDER.map((side) => (
        <div
          key={side}
          data-flap={side}
          className="absolute inset-0"
          style={{
            clipPath: CLIP[side],
            backgroundImage: bands(side),
            transformOrigin: HINGE[side],
            backfaceVisibility: 'hidden',
            willChange: 'transform',
            // 第一格就給對：包之前攤開、攤開之前包好（見 EntranceScene 的說明）
            transform: covered ? FOLDED[side] : OPEN[side],
          } as React.CSSProperties}
        >
          <div data-shade className="absolute inset-0 bg-[#2a2525]" style={{ opacity: covered ? 0 : SHADE }} />
        </div>
      ))}
      {/* 上下再接一截最外圈的布，跟著上、下那塊布角一起出現：轉場層在 iOS 26 Safari 會多蓋到狀態列、
          工具列底下（WipeOverlay 的 --bleed），布角本身照舊折在看得到的那一段 */}
      {(['top', 'bottom'] as const).map((side) => (
        <div
          key={side}
          data-bleed={side}
          className="absolute inset-x-0"
          style={{
            [side === 'top' ? 'bottom' : 'top']: '100%',
            height: 'var(--bleed, 0px)',
            backgroundColor: RINGS[side][0],
            opacity: covered ? 1 : 0,
          }}
        />
      ))}
    </div>
  );
}

function play(root: HTMLElement, phase: WipePhase): Animation[] {
  const anims: Animation[] = [];
  const cover = phase === 'cover';
  const order = cover ? ORDER : [...ORDER].reverse();
  order.forEach((side, i) => {
    const flap = root.querySelector<HTMLElement>(`[data-flap="${side}"]`);
    const shade = flap?.querySelector<HTMLElement>('[data-shade]');
    if (!flap || !shade) return;
    const o: KeyframeAnimationOptions = cover
      // 折進來：一塊接一塊，每塊翻下來時加速、貼平前收住
      ? { duration: 360, delay: i * 90, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'both' }
      // 攤開：一塊塊掀起來，掀得比折慢一點
      : { duration: 420, delay: 60 + i * 80, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', fill: 'both' };
    anims.push(flap.animate(cover ? [{ transform: OPEN[side] }, { transform: FOLDED[side] }] : [{ transform: FOLDED[side] }, { transform: OPEN[side] }], o));
    anims.push(shade.animate(cover ? [{ opacity: SHADE }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: SHADE }], o));
    const bleed = root.querySelector<HTMLElement>(`[data-bleed="${side}"]`);
    if (bleed) anims.push(bleed.animate(cover ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }], o));
  });
  return anims;
}

const entrance: EntranceScene = { Scene, play };
export default entrance;
