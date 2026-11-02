import type React from 'react';
import { CLOTH, INK } from './palette';

/**
 * 均衡曼卡拉的整頁畫框：整頁是一頁 1430 年代法蘭德斯時禱書的羊皮紙 —— 紙色的底，最外緣一圈頁邊的裝飾（.mcl-frame）。
 * 頁邊照克里夫蘭美術館那頁〈最後的審判〉（1999.130，CC0）：墨線藤蔓上掛金色常春藤葉、金點，內側一道金線、一道墨線，
 * 四角一朵群青＋朱紅的五瓣花。11/3 Zach 從 Adinkra 印花布、桑吉巴木雕、祈禱書三種裡選了祈禱書。
 *
 * 裝飾只有最外緣這一圈（虎羊棋的教訓）；裡面的盤面是插圖背景那種墨底金格紋、主視覺是同一頁的聖米迦勒秤靈魂，都不再加花紋。
 * 頁邊是 public/games/balance-mancala/frame.svg（scripts/balance-mancala/build-frame.mjs 畫的，84×84、slice 28）。
 */
export default function MancalaFrame({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="mcl-root flex min-h-dvh flex-col font-[family-name:var(--font-app)]" style={{ background: CLOTH, color: INK }}>
      <div className={`mcl-frame flex flex-1 flex-col ${className}`}>{children}</div>
    </div>
  );
}
