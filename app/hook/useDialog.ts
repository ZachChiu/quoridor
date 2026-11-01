'use client';
import { useEffect, useRef, useState } from 'react';
import { useScrollLock } from './useScrollLock';

/*
  遮罩不用 fixed，改成 absolute、定在目前的捲動位置、上下各多蓋一截（11/1 Zach：手機上彈窗打開，最下面一條沒有變暗）。
  iOS 26 的 Safari（與 iPhone 上的 Chrome）把頁面一路畫到工具列後面，但只畫跟著頁面捲的內容，fixed 的層不畫 ——
  fixed 的遮罩再怎麼往外多蓋（.cover-viewport）那一截都是 html 的底色。換頁轉場（WipeOverlay）也是同一個做法。
  捲動鎖因此也不能再把 body 變成 fixed（useScrollLock），不然整頁都不畫在那一截。
*/
const BLEED = (h: number) => Math.round(Math.max(h * 0.25, 192));

function placeBackdrop(el: HTMLElement) {
  const h = Math.max(window.innerHeight, window.visualViewport?.height ?? 0);
  const bleed = BLEED(h);
  el.style.top = `${window.scrollY - bleed}px`;
  el.style.height = `${Math.ceil(h) + 2 * bleed}px`;
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
  /** 遮罩那層：absolute，打開時定到目前的捲動位置（placeBackdrop） */
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
    const el = backdropRef.current;
    if (!isOpen || !el) return;
    placeBackdrop(el);
    // 轉向、工具列伸縮時重量；頁面萬一還是捲了（捲動鎖擋不到的情況），遮罩也跟著過去
    const onResize = () => placeBackdrop(el);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, { passive: true });
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, [isOpen, portalReady]);

  return { panelRef, backdropRef, portalReady };
}
