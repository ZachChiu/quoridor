import type React from 'react';

/**
 * 虎羊棋的整頁畫框（2026-10-20 Zach 選的「整頁圖騰」平均版）：
 * 番紅花底、四邊都是 AI 畫的老虎追羊飾帶，中間是紙色面板。虎羊棋的每一頁都包在這裡面。
 *
 * 四邊繞著頁面順時針追：上邊往右、右邊往下、下邊往左（鏡射）、左邊往上；
 * 左右兩邊用事先轉好的圖（frieze-left／right.webp），地面都朝內。原本兩側是一列小花飾，
 * Zach 要拿掉、改成上下那條插畫延伸到左右（像那張印刷棋盤）。
 *
 * - hub：遊戲首頁、page：規則頁 —— 飾帶粗
 * - play：對局、選邊、連線 —— 飾帶收窄，把寬度讓給棋盤
 *
 * 平台 logo 與聯絡／語言不疊在畫框上（Zach：不要直接埋在哪裡），放在面板裡的頂列（BaghHeader）。
 * 底色寫在 .bagh-root 上，globals.css 依它把 html／body 也換成番紅花，捲到底或回彈時才不會露出奶油色。
 */
export default function BaghFrame({ variant = 'hub', className = '', children }: {
  variant?: 'hub' | 'play' | 'page';
  className?: string;
  children: React.ReactNode;
}) {
  const play = variant === 'play';
  const band = play ? 'h-[clamp(22px,3.2dvh,32px)]' : 'h-[clamp(34px,5.4dvh,50px)]';
  const side = play ? 'w-[clamp(16px,3.6vw,32px)]' : 'w-[clamp(26px,7vw,50px)]';
  return (
    <div className="bagh-root flex min-h-dvh flex-col bg-[#e3a43c] p-[5px] font-[family-name:var(--font-app)] text-tile-ink">
      <div className="flex flex-1 flex-col overflow-hidden rounded-[18px] border-[3px] border-[#5b6620]">
        <Frieze className={`${band} shrink-0`} />
        <div className="flex flex-1">
          <SideFrieze side="left" className={side} />
          <div className={`flex min-w-0 flex-1 flex-col rounded-xl border-[3px] border-[#5b6620] bg-[#fbf4e1] ${className}`}>
            {children}
          </div>
          <SideFrieze side="right" className={side} />
        </div>
        <Frieze className={`${band} shrink-0`} flip />
      </div>
    </div>
  );
}

/** 一條橫的老虎追羊飾帶。round：整數段，兩端不會切到半隻動物 */
export function Frieze({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <div aria-hidden="true" className={`bg-[url('/games/bagh-chal/frieze.webp')] bg-[length:auto_100%] bg-center [background-repeat:round_no-repeat] ${className}`}
      style={flip ? { transform: 'scaleX(-1)' } : undefined} />
  );
}

/** 左右兩邊的直飾帶：同一條插畫轉 90°，高度方向取整數段 */
function SideFrieze({ side, className }: { side: 'left' | 'right'; className: string }) {
  return (
    <div aria-hidden="true" className={`shrink-0 bg-[length:100%_auto] bg-center [background-repeat:no-repeat_round] ${className}`}
      style={{ backgroundImage: `url(/games/bagh-chal/frieze-${side}.webp)` }} />
  );
}
