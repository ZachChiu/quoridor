import type React from 'react';
import './gameFont.css';

/**
 * 騎士巡遊的整頁版面：一張印了銅版插圖的紙 —— 紙邊留白，裡面是銅版的雙線框（外粗內細，.kt-frame），
 * 右下角刻著圖版的編號（版畫插圖頁的「Tab. I.」；規則頁是第二張圖版「Tab. II.」）。裝飾只有最外緣這一圈（虎羊棋的教訓）。
 * 字：整頁是 Noto Serif（跟名字字標同一套，gameFont.css 由 scripts/build-game-fonts.mjs 產生），拉丁字與數字用舊式襯線（.kt-serif，系統字型）。
 */
export default function KtFrame({ className = '', tab = 'Tab. I.', children }: { className?: string; tab?: string; children: React.ReactNode }) {
  return (
    <div className="kt-root flex min-h-dvh flex-col bg-[#edddc7] p-[clamp(6px,1.6vw,14px)] font-[family-name:var(--font-app)] text-[#322e2a]">
      <div className={`kt-frame relative flex flex-1 flex-col ${className}`}>
        {children}
        <span aria-hidden="true" className="kt-serif pointer-events-none absolute bottom-1.5 right-3 text-xs italic tracking-wide opacity-70">{tab}</span>
      </div>
    </div>
  );
}
