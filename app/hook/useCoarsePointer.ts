import { useSyncExternalStore } from 'react';

/**
 * 主要輸入裝置是不是手指（`pointer: coarse`）。
 *
 * 用 media query 而不是 UA 判斷：真正決定操作方式的是「指標精不精準」，
 * 不是作業系統。平板接鍵鼠會變 fine、筆電有觸控螢幕但主要指標仍是 fine，
 * 兩種都判對。
 *
 * 用 useSyncExternalStore 而不是 useEffect + setState：靜態匯出的
 * 首次 render 發生在伺服器端，getServerSnapshot 回 false（桌機行為，
 * 也是比較保守的那個），瀏覽器接手時同一輪就拿到正確值，不會先閃一次。
 */
const QUERY = '(pointer: coarse)';

const subscribe = (onChange: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};

export function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}
