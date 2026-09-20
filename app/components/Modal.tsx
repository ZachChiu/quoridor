'use client'
import React, { useEffect, useRef } from 'react';
import { GiCancel } from 'react-icons/gi';
import type { IconType } from 'react-icons';

/**
 * 所有 Modal 的共用外殼。
 *
 * 抽出來的原因是四個 Modal 原本各寫各的殼，值已經漂開了：圓角有 xl 有 2xl、
 * 寬度有 `max-w-md` 有 `min-w-80 max-w-md`，冠軍 Modal 還漏了 `inset-0`
 * 所以整塊定位是錯的。視覺要能「一起動」，殼就只能有一份。
 *
 * `band` 是標題列的底色，對應首頁磁磚的配色：規則森綠、連線靛藍、破牆磚紅、
 * 冠軍用勝方的顏色。顏色因此帶有意義 —— 一眼知道自己在哪一塊功能裡。
 */
interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** 標題列圖示 */
  icon?: IconType;
  /** 標題上方的小字，例如「遊玩方式 · 3 / 7」 */
  kicker?: string;
  /** 標題列底色。`bg` 吃 Tailwind class 或 CSS 色值，`fg` 是文字色的 class。 */
  band: { className?: string; style?: React.CSSProperties; fg: string };
  children: React.ReactNode;
  /** 底部按鈕列。省略時不留空間。 */
  footer?: React.ReactNode;
  /** 額外的鍵盤處理，例如教學的左右方向鍵。 */
  onKeyDown?: (e: KeyboardEvent) => void;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

const Modal: React.FC<Props> = ({
  isOpen, onClose, title, icon: Icon, kicker, band, children, footer, onKeyDown,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      // 焦點鎖在對話框內。沒有這段的話 Tab 會跑到背後的棋盤上，
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

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      } transition-opacity duration-300`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      /*
        關閉時要真的「不存在」。原本只有 opacity-0 + pointer-events-none ——
        那兩個都**不會**把內容從無障礙樹移除，所以螢幕閱讀器使用者一進遊戲頁
        就會聽到七步教學、破牆警告、結算文字全部混在一起（四個 Modal 都常駐 DOM）。
        inert 會一併擋掉焦點與讀屏；aria-hidden 是給還不支援 inert 的瀏覽器的保險。
      */
      {...(isOpen ? {} : { inert: true, 'aria-hidden': true })}
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-primary font-[family-name:var(--font-app)] outline-none"
      >
        {/* 色帶做成滿版（面板 overflow-hidden 負責切圓角），
            留白會讓它退化成一條「有底色的標題」，力道差很多。 */}
        <div
          className={`flex items-start justify-between gap-3 px-6 py-5 ${band.className ?? ''} ${band.fg}`}
          style={band.style}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className="shrink-0 text-4xl" aria-hidden="true" />}
            <div>
              {kicker && <p className="text-xs font-bold tracking-widest opacity-80">{kicker}</p>}
              <h2 className="text-2xl font-black leading-tight">{title}</h2>
            </div>
          </div>
          <button
            type="button"
            aria-label="關閉"
            onClick={onClose}
            className="-mr-2 -mt-1 shrink-0 rounded-full p-2 text-2xl opacity-70 transition hover:opacity-100"
          >
            <GiCancel />
          </button>
        </div>

        <div className="p-6">{children}</div>

        {footer && <div className="flex gap-3 px-6 pb-6">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
