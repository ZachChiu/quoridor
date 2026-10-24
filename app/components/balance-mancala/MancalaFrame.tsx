import type React from 'react';
import { CLOTH, INK } from './palette';

/**
 * 均衡曼卡拉的整頁畫框：整頁是一塊阿坎（今迦納）的 Adinkra 印花布 —— 布色的底，最外緣一圈蓋了印的布邊（.mcl-frame）。
 * 布邊照 1825 年那塊 Adinkra 布上隔開方格的帶子：兩側各兩道梳子畫的細線，中間一排同一個符號的印章。
 * 上下是寶螺殼（Nsirewa：財富，也是播下去的種子）、左右是曲折（Nkyimkyim：人生的路彎彎曲曲、隨機應變）、
 * 四角是連在一起的心（Akoma ntoaso：同心、協議 —— 一桌人輪流下）。符號的意思寫在說明彈窗的出處裡。
 * 不用 Rattray 圖版上的 #11（Aban，王權）、#12（形似卍字）、#3／#16（Epa，手銬）。
 *
 * 裝飾只有最外緣這一圈（虎羊棋的教訓）；裡面的盤面是一塊圓的木頭、主視覺是三件黃金砝碼，都不再加花紋。
 *
 * frame.png 的做法（要重做時照這個）：Wikimedia Commons〈Adinkra Rattray.JPG〉（803×1302）裡 #2、#4、#5 三個符號
 * 門檻 120 化成墨、只留最大的連通區塊（去掉編號與雜點），塗成墨色 #201211；1x 單位（CSS px）是
 * 帶寬 28、一個印章的間距 22、印章高 15，梳線在 1.2–2.0、3.4–4.2 與對稱的內側，輸出 3 倍（234×234，slice 84）。
 */
export default function MancalaFrame({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="mcl-root flex min-h-dvh flex-col font-[family-name:var(--font-app)]" style={{ background: CLOTH, color: INK }}>
      <div className={`mcl-frame flex flex-1 flex-col ${className}`}>{children}</div>
    </div>
  );
}
