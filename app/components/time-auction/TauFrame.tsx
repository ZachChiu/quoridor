import type React from 'react';

/**
 * 時間拍賣的整頁版面：一張維多利亞時代的拍賣傳單 —— 報紙色的紙、最外緣一圈紅色的「牛津角」框
 * （一粗一細兩條線在四角交叉、再伸出去一點，.tau-frame）。裝飾只有這一圈（虎羊棋的教訓）。
 * 配色見 theme.ts；跑秒的大數字用 Didone 襯線（.tau-display，系統字型）。
 */
export default function TauFrame({ className = '', rootClassName = '', children }: {
  className?: string;
  /** 整頁的尺寸：對局頁要鎖在一個畫面高（h-dvh），矮的橫放手機再放開 */
  rootClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`tau-root flex min-h-dvh flex-col bg-[#ebe1b8] font-[family-name:var(--font-app)] text-[#35331c] ${rootClassName}`}>
      <div className={`tau-frame flex min-h-0 flex-1 flex-col ${className}`}>{children}</div>
    </div>
  );
}
