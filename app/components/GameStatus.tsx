import React from "react";
import type { Player } from "@/types/chessboard";

interface Props {
  isLock: boolean;
  currentPlayer: Player;
  uniqTerritories: { A: string[]; B: string[], C?: string[] };
  playersNum: number;
}

/** 玩家色上該用什麼文字色。紅／藍偏暗用米白，黃偏亮用墨。 */
const ON: Record<'A' | 'B' | 'C', string> = {
  A: 'text-tile-cream', B: 'text-tile-cream', C: 'text-tile-ink',
};

/**
 * 比分面板。
 *
 * 原本是一塊深墨底，上面擺三顆彩色小圓點。但這塊面板講的就是「誰佔了多少」——
 * 讓每位玩家各自佔一條自己顏色的橫條，顏色就直接是資訊，不必再靠小圓點翻譯。
 * 順帶讓它與首頁的撞色磁磚是同一套語彙。
 */
export default React.memo(function GameStatus({ isLock, currentPlayer, uniqTerritories, playersNum }: Props) {
  const players: ('A' | 'B' | 'C')[] = playersNum === 3 ? ['A', 'B', 'C'] : ['A', 'B'];

  return (
    <div className="fixed right-5 top-5 flex flex-col gap-1.5 md:top-[5dvh]">
      {players.map((p) => (
        <div
          key={p}
          className={`flex w-[7.5rem] items-center justify-between gap-4 rounded-xl px-4 py-2.5 text-sm font-black tabular-nums ${ON[p]} ${
            // 輪到誰，誰那條發光；其餘稍微退後，一眼看得出當下是誰
            !isLock && currentPlayer === p ? 'animate-active-bar' : 'opacity-55'
          }`}
          style={{ backgroundColor: `var(--player-${p})` }}
        >
          <span>已佔領</span>
          <span className="text-lg leading-none">{uniqTerritories[p]?.length || 0}</span>
        </div>
      ))}
    </div>
  )
})
