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
 * 比分。每位玩家一條自己顏色的橫條，顏色本身就是資訊。
 *
 * 三條都維持滿色，不做淡化 —— 試過兩種淡法都不行：
 *   opacity-55 會讓米白字疊在淡紅／淡藍上只剩 2.4:1（門檻 4.5）；
 *   改用各自的 -100 淡色底，亮度又和頁面底幾乎相同（1.01:1），轉灰階整條消失。
 * 分數是要讀的文字，退後感不值得用可讀性換。
 *
 * 當前玩家改用「比較寬」來標示。靠右對齊，所以那一條會往左突出來，
 * 一眼就看得到。刻意不只靠呼吸動畫 —— 動畫在截圖裡不存在，
 * 對開了 prefers-reduced-motion 的人也等於沒有。
 */
export default React.memo(function GameStatus({ isLock, currentPlayer, uniqTerritories, playersNum }: Props) {
  const g = useGameText();
  const players: PlayerKey[] = playersNum === 3 ? ['A', 'B', 'C'] : ['A', 'B'];

  return (
    <div className="fixed right-5 top-5 flex flex-col items-end gap-1.5 md:top-[5dvh]">
      {players.map((p) => {
        const active = !isLock && currentPlayer === p;
        return (
          <div
            key={p}
            className={`flex items-center justify-between gap-4 rounded-xl px-4 py-2.5 text-sm font-black tabular-nums transition-all ${
              PLAYER_ON[p]
            } ${active ? 'animate-active-bar w-[8.75rem]' : 'w-[7.5rem]'}`}
            style={{ backgroundColor: playerVar(p) }}
          >
            <span>{g.status.claimed}</span>
            <span className="text-lg leading-none">{uniqTerritories[p]?.length || 0}</span>
          </div>
        );
      })}
    </div>
  )
})
