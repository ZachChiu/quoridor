import { useCallback, useRef } from 'react';

/**
 * 左右滑動換頁。
 *
 * 判定刻意保守：水平位移要夠大（預設 48px），而且要明顯比垂直位移大
 * （1.4 倍）。手指本來就很難滑出純水平的一條線 —— 門檻放寬的話，
 * 想往下捲一點內容就會意外翻頁。
 *
 * 只吃單指。兩指通常是縮放，不該被當成翻頁。
 */
export function useSwipe(
  onLeft: () => void,
  onRight: () => void,
  { minDistance = 48, ratio = 1.4 } = {}
) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    start.current = e.touches.length === 1
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : null;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const from = start.current;
    start.current = null;
    if (!from || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - from.x;
    const dy = e.changedTouches[0].clientY - from.y;
    if (Math.abs(dx) < minDistance || Math.abs(dx) < Math.abs(dy) * ratio) return;
    // 往左滑 = 看下一頁，與所有輪播的方向一致
    (dx < 0 ? onLeft : onRight)();
  }, [onLeft, onRight, minDistance, ratio]);

  return { onTouchStart, onTouchEnd };
}
