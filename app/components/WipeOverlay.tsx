'use client'
import React, { useEffect, useRef } from 'react';

export type WipePhase = 'cover' | 'uncover';

/**
 * 轉場的形式。三種模式各一種 —— 轉場本身就是「你進了哪個模式」的訊號。
 *
 *   bars   四條色帶由左掃入（連線）
 *   grow   你按的那塊磁磚從原位放大鋪滿畫面（本機）
 *   circle 從按下的位置擴散出一個圓（單人）
 */
export type Wipe =
  | { kind: 'bars' }
  | { kind: 'grow'; rect: { x: number; y: number; w: number; h: number }; color: string }
  | { kind: 'circle'; x: number; y: number; color: string };

interface Props {
  phase: WipePhase;
  wipe: Wipe;
  /** 覆蓋完成時顯示的字。省略則只掃場，不停留。 */
  title?: string;
  onDone: () => void;
}

/*
  色帶用玩家色與介面色。磁磚色要包一層 rgb()：那幾個變數存的是 RGB 通道值
  （如 `233 175 76`）而不是完整色彩 —— 那是為了讓 Tailwind 的 /opacity 能用。
  直接餵給 background 是無效值，而且**不會報錯，只會什麼都不畫**。
*/
const BARS = [
  'var(--player-A)',
  'var(--player-B)',
  'rgb(var(--tile-amber))',
  'rgb(var(--tile-forest))',
];

/**
 * 換頁的掃場動畫。
 *
 * 兩個階段分開驅動：`cover` 蓋滿（蓋滿後呼叫端才切路由），`uncover` 讓開。
 * 中間的路由切換由呼叫端負責，所以這個元件必須掛在 layout ——
 * 放在頁面裡換頁時會跟著被卸載。
 *
 * anime.js 走動態 import：tree-shake 後約 15 KB gzip，只在換頁時用得到。
 */
const WipeOverlay: React.FC<Props> = ({ phase, wipe, title, onDone }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;
    let timeline: { pause: () => void } | null = null;

    (async () => {
      const { createTimeline, stagger } = await import('animejs');
      if (cancelled) return;

      const label = root.querySelector<HTMLElement>('[data-title]');
      const tl = createTimeline({
        defaults: { ease: 'inOut(3)' },
        onComplete: () => { if (!cancelled) doneRef.current(); },
      });

      if (wipe.kind === 'bars') {
        const bars = root.querySelectorAll<HTMLElement>('[data-bar]');
        if (bars.length === 0) { doneRef.current(); return; }
        if (phase === 'cover') {
          tl.add(bars, { translateX: ['-101%', '0%'], duration: 420, delay: stagger(70) });
          if (label) tl.add(label, { opacity: [0, 1], scale: [0.86, 1], duration: 300 }, '-=140');
        } else {
          if (label) tl.add(label, { opacity: [1, 0], duration: 200 });
          tl.add(bars, { translateX: ['0%', '101%'], duration: 380, delay: stagger(60) }, label ? '-=80' : 0);
        }
      } else {
        const shape = root.querySelector<HTMLElement>('[data-shape]');
        if (!shape) { doneRef.current(); return; }
        if (phase === 'cover') {
          // 起點的尺寸已寫在 style 上，這裡只負責放大到蓋滿
          const scale = coverScale(wipe);
          tl.add(shape, {
            scale: [1, scale],
            ...(wipe.kind === 'grow' ? { borderRadius: ['16px', '0px'] } : {}),
            duration: 520,
          });
          if (label) tl.add(label, { opacity: [0, 1], duration: 280 }, '-=200');
        } else {
          // 讓開時淡出而不是縮回：縮回的終點在舊頁面上，對新頁面沒有意義
          if (label) tl.add(label, { opacity: [1, 0], duration: 180 });
          tl.add(shape, { opacity: [1, 0], duration: 320 }, '-=60');
        }
      }

      timeline = tl;
    })();

    return () => {
      cancelled = true;
      timeline?.pause();
    };
  }, [phase, wipe]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[60] overflow-hidden"
      // 純裝飾，而且它蓋住整個畫面 —— 讀屏不該念它，焦點也不該跑進來
      aria-hidden="true"
    >
      {wipe.kind === 'bars'
        ? BARS.map((color, i) => (
            <div
              key={color}
              data-bar
              className={`absolute inset-x-0 ${phase === 'cover' ? '-translate-x-full' : ''}`}
              style={{ background: color, top: `${(i * 100) / BARS.length}%`, height: `${100 / BARS.length}%` }}
            />
          ))
        : (
          <div
            data-shape
            className="absolute"
            style={
              wipe.kind === 'grow'
                ? {
                    background: wipe.color,
                    left: wipe.rect.x, top: wipe.rect.y,
                    width: wipe.rect.w, height: wipe.rect.h,
                    borderRadius: phase === 'cover' ? 16 : 0,
                    transform: phase === 'cover' ? undefined : `scale(${coverScale(wipe)})`,
                  }
                : {
                    background: wipe.color,
                    borderRadius: '50%',
                    left: wipe.x - CIRCLE_R, top: wipe.y - CIRCLE_R,
                    width: CIRCLE_R * 2, height: CIRCLE_R * 2,
                    transform: phase === 'cover' ? 'scale(0.001)' : `scale(${coverScale(wipe)})`,
                  }
            }
          />
        )}
      {title && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            data-title
            className={`font-[family-name:var(--font-app)] text-6xl font-black tracking-tight text-tile-cream md:text-8xl ${
              phase === 'cover' ? 'opacity-0' : ''
            }`}
          >
            {title}
          </span>
        </div>
      )}
    </div>
  );
};

/** 圓形的基準半徑。用固定值再靠 scale 放大，避免每次都重算 layout。 */
const CIRCLE_R = 40;

/** 要蓋滿整個視窗需要放大幾倍。乘 1.15 是留給圓角與次像素的餘裕。 */
function coverScale(wipe: Wipe): number {
  if (typeof window === 'undefined') return 40;
  const { innerWidth: w, innerHeight: h } = window;
  if (wipe.kind === 'grow') {
    return Math.max(w / wipe.rect.w, h / wipe.rect.h) * 1.15;
  }
  if (wipe.kind === 'circle') {
    // 圓心到最遠角落的距離才是需要的半徑
    const dx = Math.max(wipe.x, w - wipe.x);
    const dy = Math.max(wipe.y, h - wipe.y);
    return (Math.hypot(dx, dy) / CIRCLE_R) * 1.05;
  }
  return 1;
}

export default WipeOverlay;
