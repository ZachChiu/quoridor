import { useEffect } from 'react';

/**
 * Modal 打開時鎖住背景捲動。
 *
 * 用 position: fixed 而不是只設 overflow: hidden —— iOS Safari 對
 * body 的 overflow: hidden 是選擇性遵守的，手指仍然滑得動背景，
 * 而且滑動時 Modal 會跟著飄。
 *
 * 代價是 position: fixed 會讓頁面瞬間捲回頂端，所以要自己記住捲動位置、
 * 解鎖時還原。桌機另外補上捲軸寬度的 padding，不然鎖住的瞬間
 * 整個版面會往右跳一下。
 *
 * 用計數而不是布林：同時開兩個 Modal（例如破牆確認疊在規則上）時，
 * 關掉其中一個不能把鎖一起解掉。
 */
let locks = 0;
let saved: { overflow: string; position: string; top: string; width: string; paddingRight: string } | null = null;
let savedScrollY = 0;

function lock() {
  if (locks++ > 0) return;
  const body = document.body;
  savedScrollY = window.scrollY;
  saved = {
    overflow: body.style.overflow, position: body.style.position,
    top: body.style.top, width: body.style.width, paddingRight: body.style.paddingRight,
  };
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  body.style.overflow = 'hidden';
  body.style.position = 'fixed';
  body.style.top = `-${savedScrollY}px`;
  body.style.width = '100%';
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
}

function unlock() {
  if (--locks > 0) return;
  locks = 0;
  if (!saved) return;
  const body = document.body;
  body.style.overflow = saved.overflow;
  body.style.position = saved.position;
  body.style.top = saved.top;
  body.style.width = saved.width;
  body.style.paddingRight = saved.paddingRight;
  saved = null;
  window.scrollTo(0, savedScrollY);
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
