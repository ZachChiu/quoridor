'use client'
import React, { useEffect, useRef } from 'react';

export type WipePhase = 'cover' | 'uncover';

interface Props {
  phase: WipePhase;
  /** 覆蓋完成時顯示的字。省略則只做掃場，不停留。 */
  title?: string;
  onDone: () => void;
}

/*
  色帶。用玩家色與介面色，不另外引入色相。

  磁磚色要包一層 rgb()：那幾個變數存的是 RGB 通道值（如 `233 175 76`）而不是
  完整色彩 —— 那是為了讓 Tailwind 的 /opacity 修飾詞能用。直接餵給 background
  會是無效值，而且**不會報錯，只會什麼都不畫**。
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
 * 兩個階段分開驅動：`cover` 把畫面蓋滿（蓋滿後呼叫端才切路由），
 * `uncover` 把色帶掃走露出新頁面。中間那段路由切換由呼叫端負責，
 * 所以這個元件必須掛在 layout —— 放在頁面裡換頁時會跟著被卸載。
 *
 * anime.js 走動態 import：tree-shake 後約 15 KB gzip，而它只在換頁時用得到。
 */
const WipeOverlay: React.FC<Props> = ({ phase, title, onDone }) => {
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

      const bars = root.querySelectorAll<HTMLElement>('[data-bar]');
      const label = root.querySelector<HTMLElement>('[data-title]');
      if (bars.length === 0) {
        doneRef.current();
        return;
      }

      const tl = createTimeline({
        defaults: { ease: 'inOut(3)' },
        onComplete: () => { if (!cancelled) doneRef.current(); },
      });

      if (phase === 'cover') {
        tl.add(bars, { translateX: ['-101%', '0%'], duration: 420, delay: stagger(70) });
        if (label) tl.add(label, { opacity: [0, 1], scale: [0.86, 1], duration: 300 }, '-=140');
      } else {
        if (label) tl.add(label, { opacity: [1, 0], duration: 200 });
        tl.add(bars, { translateX: ['0%', '101%'], duration: 380, delay: stagger(60) }, label ? '-=80' : 0);
      }

      timeline = tl;
    })();

    return () => {
      cancelled = true;
      timeline?.pause();
    };
  }, [phase]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[60] overflow-hidden"
      // 純裝飾，而且它蓋住整個畫面 —— 讀屏不該念它，也不該讓焦點跑進來
      aria-hidden="true"
    >
      {BARS.map((color, i) => (
        <div
          key={color}
          data-bar
          className={`absolute inset-x-0 ${phase === 'cover' ? '-translate-x-full' : ''}`}
          style={{
            background: color,
            top: `${(i * 100) / BARS.length}%`,
            height: `${100 / BARS.length}%`,
          }}
        />
      ))}
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
