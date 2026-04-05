import React from "react";
import SectionShadow from "./SectionShadow";
import type { Player } from "@/types/chessboard";

interface Props {
  isLock: boolean;
  currentPlayer: Player;
  uniqTerritories: { A: string[]; B: string[], C?: string[] };
  playersNum: number;
}

export default React.memo(function GameStatus({ isLock, currentPlayer, uniqTerritories, playersNum }: Props) {
  return (
    <div className="fixed right-5 top-5 md:top-[5dvh]">
      <SectionShadow>
        <div className="relative flex size-full flex-col gap-3 rounded-xl border-2 border-gray-900 bg-white p-3">
          <div className="flex items-center gap-3">
            <div className={`size-6 rounded-full bg-player-A ${!isLock && currentPlayer === 'A' ? 'animate-pulse-shine' : ''}`}></div>
            <span className="text-md">已佔領：{uniqTerritories['A']?.length || 0}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`size-6 rounded-full bg-player-B ${!isLock && currentPlayer === 'B' ? 'animate-pulse-shine' : ''}`}></div>
            <span className="text-md">已佔領：{uniqTerritories['B']?.length || 0}</span>
          </div>
          {playersNum === 3 && <div className="flex items-center gap-3">
            <div className={`size-6 rounded-full bg-player-C ${!isLock && currentPlayer === 'C' ? 'animate-pulse-shine' : ''}`}></div>
            <span className="text-md">已佔領：{uniqTerritories['C']?.length || 0}</span>
          </div>}
        </div>
      </SectionShadow>
    </div>
  )
})