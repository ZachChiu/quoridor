import React, { useMemo } from "react";
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

/** 玩家色上該用什麼文字色。紅／藍偏暗用米白，黃偏亮用墨。 */
const ON: Record<'A' | 'B' | 'C', string> = {
  A: 'text-tile-cream', B: 'text-tile-cream', C: 'text-tile-ink',
};

/**
 * 操作提示。
 *
 * 這塊唯一在講的事情是「現在輪到誰、他該做什麼」，所以整塊就染成那位玩家的顏色 ——
 * 比原本「深墨底 + 一顆彩色小圓點」直接得多，而且每回合都會換色，
 * 畫面不會從頭到尾都是同一塊黑。遊戲結束沒有當前玩家，才回到深墨。
 */
export default React.memo(function GameTips({ isPlacingChess, currentPlayer, winingStatus, breakWallCountObj }: Props) {
  const { gameState } = useGame();
  const over = winingStatus.length > 0;
  const p = currentPlayer as 'A' | 'B' | 'C' | null;

  const tipText = useMemo(() => {
    if (over) {
      const names = winingStatus.map(w => PLAYER_MAP[w as Exclude<Player, null>]).filter(Boolean);
      return winingStatus[0] === 'draw' ? '遊戲結束！' : `遊戲結束！${names.join('、')}勝利！`;
    }
    const who = p ? PLAYER_MAP[p] : '';
    return isPlacingChess ? `${who} · 放置棋子` : `${who} · 移動棋子`;
  }, [isPlacingChess, over, winingStatus, p]);

  const breakWallText = useMemo(() => {
    if (over || isPlacingChess || gameState.playersNum !== 3 || !p) return null;
    return breakWallCountObj?.[p] > 0 ? '還有一次破牆機會' : '沒有破牆機會';
  }, [isPlacingChess, over, gameState.playersNum, breakWallCountObj, p]);

  return (
    <div
      className={`fixed bottom-5 right-5 flex flex-col gap-1 rounded-2xl px-4 py-3 text-sm font-black lg:bottom-[5dvh] ${
        over || !p ? 'bg-tile-ink text-tile-cream' : ON[p]
      }`}
      style={over || !p ? undefined : { backgroundColor: `var(--player-${p})` }}
    >
      <span className="text-md">{tipText}</span>
      {breakWallText && <span className="text-xs opacity-80">{breakWallText}</span>}
    </div>
  )
})
