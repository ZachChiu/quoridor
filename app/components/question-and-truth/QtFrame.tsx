import type React from 'react';
import './gameFont.css';

/**
 * 提問與真相的整頁畫框：交際花的珍珠項鍊當最外緣一圈（globals.css 的 .qt-frame），裡面是〈方塊 A 的老千〉背景那片黑。
 * 裝飾只有這一圈；配色是 .qt-root 上的 CSS 變數（palette.ts 有一份說明）。
 */
export default function QtFrame({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="qt-root flex min-h-dvh flex-col font-[family-name:var(--font-app)]">
      <div className={`qt-frame flex flex-1 flex-col bg-[var(--qt-page)] text-[var(--qt-fg)] ${className}`}>{children}</div>
    </div>
  );
}
