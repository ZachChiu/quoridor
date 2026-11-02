import { useEffect } from 'react';

/**
 * Modal 打開時鎖住背景捲動。
 *
 * 用 html／body 的 overflow: hidden ＋ overscroll-behavior: none（iOS 16 起的 Safari 會遵守），
 * 不再把 body 變成 position: fixed —— 先前是因為舊版 iOS Safari 只選擇性遵守 overflow: hidden。
 * fixed 的 body 在 iOS 26 的 Safari 不會畫到工具列後面，彈窗一開，最下面那條就只剩 html 的底色、
 * 遮罩也蓋不到（11/1 Zach 回報，見 useDialog 的 placeBackdrop）。捲動位置也不必再記、再還原。
 *
 * 但 iPhone 上 overflow: hidden 擋不住手指（11/1 Zach：「外面滾動他就會被卡在上面」—— 遮罩定在頁面上，頁面一捲遮罩就跟著走），
 * 所以鎖著時另外擋 touchmove：只放行對話框裡真的捲得動、而且還沒捲到底的那一塊（規則這類長內容），
 * 捲到頂再往下拉、捲到底再往上推也擋掉，不讓它把捲動傳給後面的頁面。
 *
 * 桌機另外補上捲軸寬度的 padding，不然鎖住的瞬間整個版面會往右跳一下。
 *
 * 用計數而不是布林：同時開兩個 Modal（例如破牆確認疊在規則上）時，
 * 關掉其中一個不能把鎖一起解掉。
 */
let locks = 0;
let startY = 0;

/** 手指底下、對話框裡捲得動的那一塊（往外找到 [role=dialog] 為止）；沒有就是 null */
function scrollableUnder(target: EventTarget | null): HTMLElement | null {
  let el = target instanceof Element ? target : null;
  while (el && el !== document.body) {
    if (el instanceof HTMLElement && el.scrollHeight > el.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) return el;
    if (el.getAttribute('role') === 'dialog') return null;
    el = el.parentElement;
  }
  return null;
}

const onTouchStart = (e: TouchEvent) => { startY = e.touches[0]?.clientY ?? 0; };
const onTouchMove = (e: TouchEvent) => {
  if (e.touches.length > 1) return; // 雙指縮放照舊
  const box = scrollableUnder(e.target);
  const dy = (e.touches[0]?.clientY ?? 0) - startY;
  const atTop = !box || box.scrollTop <= 0;
  const atBottom = !box || box.scrollTop + box.clientHeight >= box.scrollHeight - 1;
  if (!box || (dy > 0 && atTop) || (dy < 0 && atBottom)) e.preventDefault();
};
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
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false });
}

function unlock() {
  if (--locks > 0) return;
  locks = 0;
  document.removeEventListener('touchstart', onTouchStart);
  document.removeEventListener('touchmove', onTouchMove);
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
