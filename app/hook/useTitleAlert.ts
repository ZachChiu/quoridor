'use client'
import { useEffect } from 'react';

/**
 * 分頁在背景、又輪到自己的時候，分頁標題輪流換成 `text`。
 *
 * 連線對戰常常是傳完連結就切去別的分頁等 —— 對手進來、下完一手，
 * 畫面上的變化都看不到。分頁列上會動的標題是瀏覽器裡唯一不用權限、
 * 也不用伺服器的提醒（推播要 Service Worker 加上能發送的後端，靜態站做不到）。
 *
 * 切回這個分頁就停、標題還原。手機切到別的 App 時看不到分頁標題，
 * 所以這只對電腦版有用。
 *
 * 背景分頁的計時器會被瀏覽器放慢（Chrome 背景超過 5 分鐘後一分鐘才跑一次），
 * 所以一開始就先換成提醒那一面，就算之後幾乎不動，停在那裡的也是提醒。
 */
export function useTitleAlert(on: boolean, text: string) {
  useEffect(() => {
    if (!on) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    let original = '';
    let alerting = false;

    const start = () => {
      if (timer) return;
      original = document.title;
      const flip = () => {
        alerting = !alerting;
        document.title = alerting ? `● ${text}` : original;
      };
      flip();
      timer = setInterval(flip, 1000);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = undefined;
      alerting = false;
      document.title = original;
    };
    const onVisibility = () => (document.hidden ? start() : stop());

    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, [on, text]);
}
