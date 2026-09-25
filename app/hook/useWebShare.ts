import { useSyncExternalStore } from 'react';

/**
 * 這個瀏覽器能不能叫出系統分享面板。
 *
 * 用 useSyncExternalStore 而不是 useEffect + setState：靜態匯出的首次
 * render 在伺服器端，那裡沒有 navigator。getServerSnapshot 回 false
 * （只顯示複製按鈕，任何環境都成立），瀏覽器接手時同一輪換成正確值。
 *
 * 能力不會在執行期改變，所以 subscribe 是空的。
 */
const noop = () => () => {};

export function useWebShare(): boolean {
  return useSyncExternalStore(
    noop,
    () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
    () => false
  );
}

/**
 * 叫出系統分享面板。回傳有沒有真的分享出去。
 *
 * 使用者在面板上按取消會丟 AbortError —— 那不是錯誤，是一個正常結果，
 * 不能讓它變成未處理的 rejection，也不該跳任何提示。
 */
export async function share(data: ShareData): Promise<boolean> {
  try {
    await navigator.share(data);
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return false;
    throw err;
  }
}
