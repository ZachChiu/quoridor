import React, { useMemo } from "react";
import SectionShadow from "./SectionShadow";
import type { Player } from "@/types/chessboard";
import { useGame } from "@/contexts/GameContext";

interface Props {
  isPlacingChess: boolean;
  currentPlayer: Player;
  winingStatus: (Player | 'draw')[];
  breakWallCountObj: Record<Exclude<Player, null>, number>;
}

const PLAYER_MAP: Record<Exclude<Player, null>, string> = {
  A: '紅方',
  B: '藍方',
  C: '黃方',
};

export default React.memo(function GameStatus({ isPlacingChess, currentPlayer, winingStatus, breakWallCountObj }: Props) {
   const { gameState } = useGame();
    const tipText = useMemo(() => {
      if (isPlacingChess) {
        return (
          <>請{<div className={`bg-player-${currentPlayer} animate-pulse-shine inline-block size-6 rounded-full `}></div>}放置棋子</>
        );
      } else if (winingStatus.length) {
        const names = winingStatus.map(w => PLAYER_MAP[w as Exclude<Player, null>]).filter(Boolean);
        return (
          <>{winingStatus[0] === 'draw' ? '遊戲結束！' : `遊戲結束！${names.join('、')}勝利！`}</>
        );
      } else {
        return (
          <>請{<div className={`bg-player-${currentPlayer} animate-pulse-shine inline-block size-6 rounded-full`}></div>}移動棋子</>
        );
      }
    }, [isPlacingChess, currentPlayer, winingStatus]);

    const breakWallText = useMemo(() => {
      if (winingStatus.length || isPlacingChess || gameState.playersNum !== 3) {
        return null;
      }
      return (
        breakWallCountObj?.[currentPlayer as Exclude<Player, null>] > 0 ?
        <>還有一次破牆機會</> :
        <>沒有破牆機會</>
      );
    }, [isPlacingChess, currentPlayer, winingStatus, gameState.playersNum, breakWallCountObj]);

  return (
    <div className="fixed bottom-5 right-5 lg:bottom-[5dvh]">
      <SectionShadow>
        <div className="relative flex size-full flex-col gap-3 rounded-xl border-2 border-gray-900 bg-white p-3">
          <div className="flex items-center gap-3">
            <span className="text-md flex items-center gap-1">
              { tipText }
            </span>
          </div>
          {breakWallText && <div className="flex items-center gap-3">
            <span className="text-md flex items-center gap-1">
              { breakWallText }
            </span>
          </div>}
        </div>
      </SectionShadow>
    </div>
  )
})