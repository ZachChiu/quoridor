'use client';
import { useEffect, useRef, useState } from 'react';
import { useScrollLock } from './useScrollLock';

/*
  開著對話框時，頁面本身的底色也跟著遮罩一起變暗（11/1 Zach 回報：手機上彈窗打開，最下面一條沒有變暗）。
  iPhone 上工具列收起來時、頁面拉過頭時露出來的那條，畫的是 html 的底色（WebKit 的 under-page 底色），
  不是頁面上的東西 —— fixed 的遮罩再怎麼往外多蓋（.cover-viewport）也蓋不到。所以開著時把 html／body 的底色
  換成「原本的底色疊上遮罩那層黑」，關掉時還原。好幾個對話框疊著開時只在第一個開、最後一個關時動。
  只動 html、不動 body：body 也變暗的話，遮罩底下的頁面會被暗兩次，跟那條對不上（第一版就這樣，Zach 截圖抓到）。
*/
let dimmed = 0;
let restoreRoot: (() => void) | null = null;

function dimRoot(backdrop: HTMLElement | null) {
  if (dimmed++ > 0 || !backdrop) return;
  const alpha = /rgba?\([^)]*?,\s*([\d.]+)\)/.exec(getComputedStyle(backdrop).backgroundColor)?.[1];
  const root = document.documentElement;
  const base = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(root).backgroundColor);
  if (!alpha || !base) return;
  const keep = 1 - Number(alpha);
  const color = `rgb(${base.slice(1).map((v) => Math.round(Number(v) * keep)).join(',')})`;
  const prev = root.style.backgroundColor;
  root.style.backgroundColor = color;
  restoreRoot = () => { root.style.backgroundColor = prev; };
}

function undimRoot() {
  if (--dimmed > 0) return;
  dimmed = 0;
  restoreRoot?.();
  restoreRoot = null;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

/**
 * 對話框的行為（不含長相）：背景捲動鎖、Esc 關閉、焦點鎖、開關時移交焦點、portal 時機。
 *
 * Wall Go 的 Modal（奶油底、色帶）與平台的 PlatformDialog（深色）長得完全不一樣，
 * 但這些行為必須一模一樣 —— 拆成兩份的話，修了一邊另一邊不會跟著好。
 * 先前四個 Modal 各寫各的殼，值就是這樣漂開的（見 Modal.tsx 的開頭）。
 */
export function useDialog(isOpen: boolean, onClose: () => void, onKeyDown?: (e: KeyboardEvent) => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  /** 遮罩那層：讀它的透明度，把頁面底色調成一樣暗（dimRoot） */
  const backdropRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // 打開時鎖住背景捲動 —— 手機上不鎖的話，滑動會穿透到後面的頁面。
  useScrollLock(isOpen);

  /*
    一律傳送到 <body> 底下渲染（portal）。

    fixed 定位只在「沒有祖先建立新的包含區塊」時才相對於視窗。只要某個祖先有
    backdrop-filter、filter、transform 之類的屬性，fixed 就改成相對那個祖先 ——
    規則頁的頂部列是毛玻璃（backdrop-blur），語言選單放在它裡面，
    整個 Modal 就被塞進那一條 60px 高的列裡（Zach 回報）。
    傳送到 body 之後，不管對話框被寫在哪個元件裡都不受祖先影響。

    第一次 render 仍然就地輸出，掛載後才換到 body：靜態 HTML 沒有 document，
    而且 hydration 時兩邊的結構必須一致。對話框在那時都是關著的，換位置看不出來。
  */
  const [portalReady, setPortalReady] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- 只在掛載時切一次，hydration 之後才有 document.body
  useEffect(() => setPortalReady(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      // 焦點鎖在對話框內。沒有這段的話 Tab 會跑到背後的頁面上，
      // 使用者會在一個看不見的畫面裡操作。
      if (e.key === 'Tab' && panelRef.current) {
        const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
          .filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault(); first.focus();
        }
        return;
      }
      onKeyDown?.(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // 開啟時把焦點移進來，關閉時還給原本那顆按鈕。
  useEffect(() => {
    if (isOpen) {
      restoreRef.current = document.activeElement as HTMLElement | null;
      panelRef.current?.focus();
    } else {
      restoreRef.current?.focus?.();
      restoreRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    dimRoot(backdropRef.current);
    return undimRoot;
  }, [isOpen]);

  return { panelRef, backdropRef, portalReady };
}
