import { useEffect } from 'react';

/**
 * Modal 打開時鎖住背景捲動。
 *
 * 用 html／body 的 overflow: hidden ＋ overscroll-behavior: none（iOS 16 起的 Safari 會遵守），
 * 不再把 body 變成 position: fixed —— 先前是因為舊版 iOS Safari 只選擇性遵守 overflow: hidden。
 * fixed 的 body 在 iOS 26 的 Safari 不會畫到工具列後面，彈窗一開，最下面那條就只剩 html 的底色、
 * 遮罩也蓋不到（11/1 Zach 回報，見 useDialog 的 placeBackdrop）。捲動位置也不必再記、再還原。
 *
 * 桌機另外補上捲軸寬度的 padding，不然鎖住的瞬間整個版面會往右跳一下。
 *
 * 用計數而不是布林：同時開兩個 Modal（例如破牆確認疊在規則上）時，
 * 關掉其中一個不能把鎖一起解掉。
 */
let locks = 0;
let saved: { htmlOverflow: string; htmlOverscroll: string; overflow: string; paddingRight: string } | null = null;

function lock() {
  if (locks++ > 0) return;
  const html = document.documentElement;
  const body = document.body;
  saved = {
    htmlOverflow: html.style.overflow, htmlOverscroll: html.style.overscrollBehavior,
    overflow: body.style.overflow, paddingRight: body.style.paddingRight,
  };
  const scrollbar = window.innerWidth - html.clientWidth;
  html.style.overflow = 'hidden';
  html.style.overscrollBehavior = 'none';
  body.style.overflow = 'hidden';
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
}

function unlock() {
  if (--locks > 0) return;
  locks = 0;
  if (!saved) return;
  const html = document.documentElement;
  const body = document.body;
  html.style.overflow = saved.htmlOverflow;
  html.style.overscrollBehavior = saved.htmlOverscroll;
  body.style.overflow = saved.overflow;
  body.style.paddingRight = saved.paddingRight;
  saved = null;
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
