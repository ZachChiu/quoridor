import type React from 'react';

/**
 * 盲眼五子棋的整頁畫框：照朝鮮拼布包袱巾（조각보）的外圈 —— 最外緣一圈布條拼成的寬邊
 * （上下是直條、左右是橫條、四角是對角拼的三角，布塊之間一條細縫線），裡面是奶油白絲的頁面。
 *
 * 裝飾只有最外緣這一圈（虎羊棋的教訓）；彩色的就只有它和棋子 —— 七色棋子本來就是一塊塊布，
 * 結算時翻開露出黑白，像把包袱巾攤開。配色見 palette.ts。
 */
export default function GomokuFrame({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="gmk-root flex min-h-dvh flex-col font-[family-name:var(--font-app)]">
      <div className={`gmk-frame flex flex-1 flex-col bg-[#e4d6bb] text-[#2a2525] ${className}`}>{children}</div>
    </div>
  );
}
