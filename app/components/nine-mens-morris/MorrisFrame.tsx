import type React from 'react';

/**
 * 九子棋的整頁畫框：整頁就是《遊戲之書》那幅插圖 —— 群青底撒細白點（.nmm-field），
 * 最外緣一圈插圖的朱紅框、內側一條淺線、四角是畫了白色叉的小方塊（.nmm-frame）。
 *
 * 裝飾只有最外緣這一層（虎羊棋的教訓：圖騰只能一層、在最外層）；
 * 裡面的按鈕、狀態卡是羊皮紙色、沒有框線，棋盤是木頭色 —— 跟插圖裡放在群青底上的木頭棋盤一樣。
 * html／body 在九子棋的頁面換成朱紅（globals.css），捲到底或回彈時才不會露出奶油色。
 */
export default function MorrisFrame({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="nmm-root flex min-h-dvh flex-col font-[family-name:var(--font-app)]">
      <div className={`nmm-frame nmm-field flex flex-1 flex-col text-[#eee0c4] ${className}`}>{children}</div>
    </div>
  );
}
