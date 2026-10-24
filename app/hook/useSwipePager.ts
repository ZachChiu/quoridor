'use client';
import { useCallback, useRef, useState, type CSSProperties, type TouchEvent } from 'react';

/**
 * 一步一頁、手指可以左右拖的軌道。Wall Go 的遊玩方式彈窗（RuleModal）原本的寫法，
 * 抽出來給每一款的「怎麼玩」彈窗共用（2026-10-25 Zach：「MODAL 型態的話就一樣左右可以滑動」）。
 *
 * 真正的軌道式滑動：每一頁橫排在一條軌道上，手指拖到哪裡軌道就跟到哪裡，放開才吸附到最近的一頁。
 * 先前只是「換頁時淡入並位移一點」—— 內容不跟手，滑到一半放開也沒有回彈，手感上就不像可以滑的東西。
 *
 * 用法（樣子各款自己畫，這裡只管手勢與位移）：
 *
 *   const pager = useSwipePager(steps.length, step, goTo);
 *   <div {...pager.viewport}>                       // 外框：裁掉旁邊幾頁、接手勢
 *     <div className="flex items-start" style={pager.trackStyle}>
 *       {steps.map((s) => <div className="w-full shrink-0">…</div>)}
 *     </div>
 *   </div>
 *
 * 左右方向鍵：把 `pager.onKeyDown` 交給 Modal 的 onKeyDown（Escape 由 Modal 處理）。
 */
export function useSwipePager(count: number, step: number, goTo: (n: number) => void) {
  // 目前的拖曳位移（px）。null 代表沒在拖，這時軌道走 transition 自己滑過去；拖曳中關掉 transition，不然會延遲一拍
  const [dragX, setDragX] = useState<number | null>(null);
  const startRef = useRef<{ x: number; y: number; locked: 'x' | 'y' | null } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, locked: null };
  };
  const onTouchMove = (e: TouchEvent) => {
    const st = startRef.current;
    if (!st || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - st.x;
    const dy = e.touches[0].clientY - st.y;
    // 先決定這一次手勢是橫向還是縱向，之後不再改變 —— 不鎖的話，斜著滑會在捲動與翻頁之間來回跳
    if (!st.locked) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      st.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (st.locked !== 'x') return;
    // 首尾再往外拉時阻尼掉三分之二，讓「沒有下一頁」這件事用手感表達
    const atEdge = (dx > 0 && step === 0) || (dx < 0 && step === count - 1);
    setDragX(atEdge ? dx / 3 : dx);
  };
  const onTouchEnd = () => {
    const st = startRef.current;
    startRef.current = null;
    if (!st || st.locked !== 'x' || dragX === null) { setDragX(null); return; }
    const w = ref.current?.clientWidth ?? 1;
    // 超過四分之一頁寬就翻頁，否則彈回
    if (Math.abs(dragX) > w / 4) goTo(step + (dragX < 0 ? 1 : -1));
    setDragX(null);
  };

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') goTo(step + 1);
    if (e.key === 'ArrowLeft') goTo(step - 1);
  }, [goTo, step]);

  const trackStyle: CSSProperties = {
    transform: `translateX(calc(${-step * 100}% + ${dragX ?? 0}px))`,
    transition: dragX !== null ? 'none' : 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
  };

  return {
    /** 外框：touch-pan-y 讓垂直捲動照常交給瀏覽器，只有水平歸我們處理 */
    viewport: {
      ref,
      className: 'touch-pan-y overflow-hidden',
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: onTouchEnd,
    },
    trackStyle,
    onKeyDown,
    dragging: dragX !== null,
  };
}

/** 頁碼的夾限：goTo 用這個，翻過頭不會跑出範圍 */
export function useStep(count: number) {
  const [step, setStep] = useState(0);
  const goTo = useCallback((n: number) => setStep(Math.min(Math.max(n, 0), count - 1)), [count]);
  return [step, goTo] as const;
}
