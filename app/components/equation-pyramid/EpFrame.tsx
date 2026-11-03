import type React from 'react';

/**
 * 方程式金字塔的整頁版面：卓瑟王墓室的彩陶牆 —— 石灰白的底，最外緣一圈小彩陶磚（.ep-frame，唯一的裝飾）。
 * 字用全站的那套（這款還沒有自己的字，見 docs/equation-pyramid.md〈沒做的〉）。
 */
export default function EpFrame({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="ep-root flex min-h-dvh flex-col bg-[#e8ebe2] p-[clamp(5px,1.4vw,12px)] text-[#071a19]">
      <div className={`ep-frame relative flex flex-1 flex-col ${className}`}>{children}</div>
    </div>
  );
}
