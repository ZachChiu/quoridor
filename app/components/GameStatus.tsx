import React from "react";
import { PLAYER_ON, playerVar, type PlayerKey } from "@/config/players";
import type { Player } from "@/types/chessboard";
import { useGameText } from '@/i18n/LocaleProvider';

interface Props {
  isLock: boolean;
  currentPlayer: Player;
  uniqTerritories: { A: string[]; B: string[], C?: string[] };
  playersNum: number;
}

/**
 * 比分。每位玩家一塊自己顏色的磚，顏色本身就是資訊。
 *
 * 都維持滿色，不做淡化 —— 試過兩種淡法都不行：
 *   opacity-55 會讓米白字疊在淡紅／淡藍上只剩 2.4:1（門檻 4.5）；
 *   改用各自的 -100 淡色底，亮度又和頁面底幾乎相同（1.01:1），轉灰階整塊消失。
 * 分數是要讀的文字，退後感不值得用可讀性換。
 *
 * 當前玩家那一塊比較大。刻意不只靠呼吸動畫 ——
 * 動畫在截圖裡不存在，對開了 prefers-reduced-motion 的人也等於沒有。
 *
 * ── 數字要往上推 0.08em ───────────────────────────────────────────
 * `line-height: 1` 配 flex 置中，置中的是**行框**不是字。Noto Sans TC 的
 * ascent/descent 不對稱（基線落在行框 0.8 的位置），所以數字的墨跡中心
 * 比容器中心低 —— 實測 88px 字級低 7px，也就是 0.0795em，不論字級都一樣。
 * 只在手機那種「格子裡只有一個數字」的情況補；桌機的長條是「已佔領 9」，
 * 兩段文字一起偏，彼此反而是對齊的，補了才會歪。
 *
 * ── 三種形狀，全部由斷點決定 ──────────────────────────────────────
 * 桌機（pointer: fine）—— 右上直排，長條寫著「已佔領 9」。
 * 手指直式 —— 右上橫排，只留數字：幾塊膠囊並排寫同一個詞，重複的部分
 *             佔掉的正是數字要用的寬度，而顏色已經說明了那是誰的。
 * 手指橫式 —— **左下**直排。右側整條被控制盤佔住、棋盤又貼著控制盤，
 *             左下那塊是唯一剩下的空地；擺回右上就會夾在兩者中間。
 *
 * 用 CSS 斷點而不是 prop，是因為這站是靜態匯出：JS 判斷裝置要等
 * hydration 之後才成立，手機重整會先畫一次桌機版再跳。
 */
export default React.memo(function GameStatus({ isLock, currentPlayer, uniqTerritories, playersNum }: Props) {
  const g = useGameText();
  const players: PlayerKey[] = playersNum === 3 ? ['A', 'B', 'C'] : ['A', 'B'];

  return (
    <div
      className="fixed right-5 top-5 z-40 flex flex-col items-end gap-2
                 coarse:flex-row coarse:items-center
                 coarse-land:bottom-5 coarse-land:left-5 coarse-land:right-auto coarse-land:top-auto
                 coarse-land:flex-col coarse-land:items-start coarse-land:gap-1.5"
    >
      {players.map((p) => {
        const active = !isLock && currentPlayer === p;
        return (
          <div
            key={p}
            className={`flex items-center justify-between gap-4 rounded-2xl px-[18px] py-3 text-[15px]
                        font-black tabular-nums transition-all
                        coarse:justify-center coarse:gap-0 coarse:rounded-[14px] coarse:p-0
                        coarse-land:h-12 coarse-land:w-[52px]
                        ${PLAYER_ON[p]} ${active ? 'animate-active-bar' : ''} ${
              active ? 'w-40 coarse:h-12 coarse:w-14' : 'w-[8.75rem] coarse:h-11 coarse:w-12'
            }`}
            style={{ backgroundColor: playerVar(p) }}
          >
            <span className="coarse:hidden">{g.status.claimed}</span>
            <span className={`leading-none coarse:m-auto coarse:translate-y-[-0.08em]
                              coarse-land:text-[22px] ${active ? 'text-[22px]' : 'text-xl'}`}>
              {uniqTerritories[p]?.length || 0}
            </span>
          </div>
        );
      })}
    </div>
  )
})
