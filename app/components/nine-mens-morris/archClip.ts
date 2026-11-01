'use client';
import { useLayoutEffect, type RefObject } from 'react';

/**
 * 選單大按鈕左邊的首字：上緣順著按鈕的拱往下滑（11/1 Zach：「左邊跟著外面的按鈕滑下去」）。
 *
 * 拱是 border-radius 的橢圓角，水平半徑是按鈕寬的一半，所以弧度跟著按鈕寬度變，CSS 量不到首字落在弧上的哪一段 ——
 * 這裡量出首字在按鈕裡的位置，用 clip-path 把首字的上緣裁成跟拱平行、往內縮 GAP 的那條弧（朱紅線在拱內 5px，再留 2px；
 * 首字的左邊、下面也離外緣 GAP，見 globals.css）。
 * 尺寸一變（換語言、轉向、視窗縮放）就重量。
 */
const GAP = 7;
const STEPS = 24;

/** 「50% 38.4px」→ [水平, 垂直]（px） */
function radius(el: HTMLElement): [number, number] {
  const [h, v = h] = getComputedStyle(el).borderTopLeftRadius.split(' ');
  const px = (x: string, of: number) => (x.endsWith('%') ? (parseFloat(x) / 100) * of : parseFloat(x));
  return [px(h, el.offsetWidth), px(v, el.offsetHeight)];
}

function clip(icon: HTMLElement) {
  const arch = icon.closest<HTMLElement>('.nmm-arch');
  if (!arch) return;
  const [rx, ry] = radius(arch);
  const a = arch.getBoundingClientRect();
  const b = icon.getBoundingClientRect();
  const ix = b.left - a.left, iy = b.top - a.top;
  const ex = rx - GAP, ey = ry - GAP;
  if (ex <= 0 || ey <= 0) return;
  // 首字上緣每一點：內縮那條弧在這個 x 的高度（換成首字自己的座標），弧外（再左邊）就整條裁掉
  const top = (x: number) => {
    const dx = (rx - (ix + x)) / ex;
    if (dx <= 0) return 0;
    // 弧已經接到直的側邊（首字最左那一點剛好在這裡）
    if (dx >= 1) return Math.max(0, ry - iy);
    return Math.max(0, ry - ey * Math.sqrt(1 - dx * dx) - iy);
  };
  const pts = Array.from({ length: STEPS + 1 }, (_, i) => {
    const x = (b.width * i) / STEPS;
    return `${x.toFixed(2)} ${top(x).toFixed(2)}`;
  });
  if (pts.every((p) => p.endsWith(' 0.00'))) { icon.style.clipPath = ''; return; }
  icon.style.clipPath = `path('M ${pts.join(' L ')} L ${b.width} ${b.height} L 0 ${b.height} Z')`;
}

export function useArchClip(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const icons = [...el.querySelectorAll<HTMLElement>('.nmm-row .nmm-initial, .nmm-ai-head .nmm-initial')];
    const run = () => icons.forEach(clip);
    run();
    const ro = new ResizeObserver(run);
    icons.forEach((i) => { const arch = i.closest('.nmm-arch'); if (arch) ro.observe(arch); });
    // 字型換好、版面又動一下
    document.fonts?.ready.then(run).catch(() => {});
    return () => ro.disconnect();
  }, [root]);
}
