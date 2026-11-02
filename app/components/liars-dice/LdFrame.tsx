import type React from 'react';
import './gameFont.css';

/**
 * 大話骰的整頁畫框：披風胸前那排階梯方格當最外緣一圈（globals.css 的 .ld-frame），裡面是紫褐羊毛的頁面。
 * 裝飾只有這一圈；有顏色的就只有它、骰盅（座位色）和「開！」。配色見 palette.ts。
 */
export default function LdFrame({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="ld-root flex min-h-dvh flex-col font-[family-name:var(--font-app)]">
      <div className={`ld-frame flex flex-1 flex-col bg-[#41303a] text-[#d4b98f] ${className}`}>{children}</div>
    </div>
  );
}
