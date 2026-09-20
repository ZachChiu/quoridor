'use client'
import React, { useEffect, useRef } from 'react';

interface Props {
  /** 動畫播完（或被跳過）時呼叫。呼叫端負責卸載本元件。 */
  onDone: () => void;
}

/*
  色帶由上而下掃過。用玩家色與介面色，不另外引入新色相。

  磁磚色要包一層 rgb()：那幾個變數存的是 RGB 通道值（如 `233 175 76`）
  而不是完整色彩 —— 那是為了讓 Tailwind 的 /opacity 修飾詞能用。
  直接餵給 background 會是無效值，而且**不會報錯，只會什麼都不畫**。
*/
const BARS = [
  'var(--player-A)',
  'var(--player-B)',
  'rgb(var(--tile-amber))',
  'rgb(var(--tile-forest))',
];

/**
 * 開局動畫。
 *
 * anime.js 走動態 import：它 tree-shake 後約 15 KB gzip，而這個動畫一局只播
 * 一次。開局擺棋階段有好幾秒，足夠在背景把它載完，等於不佔首屏。
 *
 * 尊重 prefers-reduced-motion —— 開了就直接跳過，不是把動畫放慢。
 * 對前庭系統敏感的人來說，「慢的大位移」比「快的」更難受。
 */
const GameStartOverlay: React.FC<Props> = ({ onDone }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  // 用 ref 接住 onDone，主 effect 才能只跑一次（否則呼叫端每次 render
  // 換一個新的 onDone，動畫就會被重啟）。同步放在 effect 裡而不是 render 期間 ——
  // render 期間改 ref 是 react-hooks/refs 擋的事，而且在並行渲染下不安全。
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      doneRef.current();
      return;
    }

    let cancelled = false;
    let timeline: { pause: () => void } | null = null;

    (async () => {
      const { createTimeline, stagger } = await import('animejs');
      if (cancelled) return;

      const bars = root.querySelectorAll<HTMLElement>('[data-bar]');
      const title = root.querySelector<HTMLElement>('[data-title]');
      if (!title || bars.length === 0) {
        doneRef.current();
        return;
      }

      const tl = createTimeline({
        defaults: { ease: 'inOut(3)' },
        onComplete: () => { if (!cancelled) doneRef.current(); },
      });

      tl.add(bars, { translateX: ['-101%', '0%'], duration: 420, delay: stagger(70) })
        .add(title, { opacity: [0, 1], scale: [0.86, 1], duration: 340 }, '-=120')
        .add(title, { opacity: [1, 0], duration: 200 }, '+=420')
        .add(bars, { translateX: ['0%', '101%'], duration: 380, delay: stagger(60) }, '-=120');

      timeline = tl;
    })();

    return () => {
      cancelled = true;
      timeline?.pause();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[60] overflow-hidden"
      // 純裝飾：讀屏不需要念它，而且底下的盤面已經有完整的文字提示
      aria-hidden="true"
      // 點一下就跳過。動畫再短，看第二次都是在擋路。
      onClick={() => doneRef.current()}
    >
      {BARS.map((color, i) => (
        <div
          key={color}
          data-bar
          className="absolute inset-x-0 -translate-x-full"
          style={{
            background: color,
            top: `${(i * 100) / BARS.length}%`,
            height: `${100 / BARS.length}%`,
          }}
        />
      ))}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          data-title
          className="font-[family-name:var(--font-app)] text-6xl font-black tracking-tight text-tile-cream opacity-0 md:text-8xl"
        >
          遊戲開始
        </span>
      </div>
    </div>
  );
};

export default GameStartOverlay;
