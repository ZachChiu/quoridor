'use client'
import React, { useEffect } from 'react';
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

const Modal: React.FC<Props> = ({
  isOpen, onClose, title, icon: Icon, kicker, band, children, footer, onKeyDown,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      onKeyDown?.(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      } transition-opacity duration-300`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-primary font-[family-name:var(--font-app)]">
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
