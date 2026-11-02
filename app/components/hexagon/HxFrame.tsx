import type React from 'react';
import './gameFont.css';

/**
 * 六角數字盤的整頁版面：一面藍白磁磚牆 —— 釉白的底，最外緣一圈鈷藍邊磚、上面一串釉白小六角（.hx-frame，唯一的裝飾）。
 * 字：整頁是 gameFont.css 的那套（scripts/game-fonts/hexagon.mjs）。
 */
export default function HxFrame({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="hx-root flex min-h-dvh flex-col bg-[#f5e5d3] p-[clamp(5px,1.4vw,12px)] font-[family-name:var(--font-app)] text-[#22283b]">
      <div className={`hx-frame relative flex flex-1 flex-col ${className}`}>{children}</div>
    </div>
  );
}
