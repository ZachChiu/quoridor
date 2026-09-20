'use client'
import React, { useEffect, useRef } from 'react';

export type WipePhase = 'cover' | 'uncover';

/**
 * 轉場的起點與顏色。
 *
 * 只有一種形式：從你按下的那個東西擴散出一個圓。變的是起點與顏色 ——
 * 按本機雙人就是琥珀從那塊磁磚長出來，按回首頁就是紙色從那顆鈕長出來。
 * 一開始做了四種（色帶／快門／磁磚放大／圓形擴散），但同一套動作配上
 * 「起點來自你按的東西」就已經能表達所有情境，多的形式只是多的規則。
 */
export type Wipe = { x: number; y: number; color: string };

interface Props {
  phase: WipePhase;
  wipe: Wipe;
  /** 覆蓋完成時顯示的字。省略則只掃場，不停留。 */
  title?: string;
  onDone: () => void;
}

/** 圓的基準半徑。用固定值再靠 scale 放大，避免每次重算 layout。 */
const BASE_R = 40;

/** 要蓋滿整個視窗需要放大幾倍 —— 圓心到最遠角落的距離才是需要的半徑。 */
function coverScale({ x, y }: Wipe): number {
  if (typeof window === 'undefined') return 40;
  const dx = Math.max(x, window.innerWidth - x);
  const dy = Math.max(y, window.innerHeight - y);
  return (Math.hypot(dx, dy) / BASE_R) * 1.05;
}

/**
 * 換頁的掃場動畫。
 *
 * 兩個階段分開驅動：`cover` 蓋滿（蓋滿後呼叫端才切路由），`uncover` 讓開。
 * 中間的路由切換由呼叫端負責，所以這個元件必須掛在 layout ——
 * 放在頁面裡換頁時會跟著被卸載，動畫只會播一半。
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
      const { createTimeline } = await import('animejs');
      if (cancelled) return;

      const shape = root.querySelector<HTMLElement>('[data-shape]');
      if (!shape) { doneRef.current(); return; }
      const label = root.querySelector<HTMLElement>('[data-title]');

      const tl = createTimeline({
        defaults: { ease: 'inOut(3)' },
        onComplete: () => { if (!cancelled) doneRef.current(); },
      });

      if (phase === 'cover') {
        tl.add(shape, { scale: [0.001, coverScale(wipe)], duration: 520 });
        if (label) tl.add(label, { opacity: [0, 1], duration: 280 }, '-=200');
      } else {
        // 讓開時淡出而不是縮回：縮回的終點在舊頁面上，對新頁面沒有意義
        if (label) tl.add(label, { opacity: [1, 0], duration: 180 });
        tl.add(shape, { opacity: [1, 0], duration: 320 }, label ? '-=60' : 0);
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
      <div
        data-shape
        className="absolute rounded-full"
        style={{
          background: wipe.color,
          left: wipe.x - BASE_R,
          top: wipe.y - BASE_R,
          width: BASE_R * 2,
          height: BASE_R * 2,
          transform: phase === 'cover' ? 'scale(0.001)' : `scale(${coverScale(wipe)})`,
        }}
      />
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

export default WipeOverlay;
