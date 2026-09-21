import React, { useMemo } from "react";
import { PLAYER_ON, playerVar, type PlayerKey } from "@/config/players";
import type { Player } from "@/types/chessboard";
import { useGame } from "@/contexts/GameContext";
import { useGameText } from '@/i18n/LocaleProvider';
import { fmt } from '@/i18n/content/game';

interface Props {
  isPlacingChess: boolean;
  currentPlayer: Player;
  winingStatus: (Player | 'draw')[];
  breakWallCountObj: Record<Exclude<Player, null>, number>;
  /** AI 正在想。困難難度每手要一秒多，沒有提示會讓人以為當掉了。 */
  aiThinking?: boolean;
  /** 手機的築牆控制盤正在畫面底部，膠囊要往上讓位 */
  shiftUp?: boolean;
}



/**
 * 操作提示。
 *
 * 這塊唯一在講的事情是「現在輪到誰、他該做什麼」，所以整塊就染成那位玩家的顏色 ——
 * 比原本「深墨底 + 一顆彩色小圓點」直接得多，而且每回合都會換色，
 * 畫面不會從頭到尾都是同一塊黑。遊戲結束沒有當前玩家，才回到深墨。
 */
export default React.memo(function GameTips({ isPlacingChess, currentPlayer, winingStatus, breakWallCountObj, aiThinking, shiftUp }: Props) {
  const g = useGameText();
  const { gameState } = useGame();
  const over = winingStatus.length > 0;
  const p = currentPlayer as PlayerKey | null;

  const tipText = useMemo(() => {
    if (over) {
      const names = winingStatus.map(w => g.players[w as PlayerKey]).filter(Boolean);
      return winingStatus[0] === 'draw' ? g.tips.over : fmt(g.tips.overWin, { names: names.join('、') });
    }
    const who = p ? g.players[p] : '';
    if (aiThinking) return fmt(g.tips.thinking, { who });
    return isPlacingChess ? fmt(g.tips.placing, { who }) : fmt(g.tips.moving, { who });
  }, [isPlacingChess, over, winingStatus, p, aiThinking, g]);

  const breakWallText = useMemo(() => {
    if (over || isPlacingChess || gameState.playersNum !== 3 || !p) return null;
    return breakWallCountObj?.[p] > 0 ? g.tips.breakLeft : g.tips.breakNone;
  }, [isPlacingChess, over, gameState.playersNum, breakWallCountObj, p, g]);

  return (
    <div
      className={`fixed right-5 flex flex-col gap-1 rounded-2xl px-4 py-3 text-sm font-black ${
        // 手機築牆時，底部會升起方向控制盤。膠囊得讓位，不然會被壓在後面。
        shiftUp
          ? 'bottom-[calc(var(--wall-pad-h)+0.75rem)] landscape:bottom-5 landscape:right-[calc(var(--wall-pad-w)+1.25rem)]'
          : 'bottom-5 lg:bottom-[5dvh]'
      } ${over || !p ? 'bg-tile-ink text-tile-cream' : PLAYER_ON[p]}`}
      style={over || !p ? undefined : { backgroundColor: playerVar(p) }}
    >
      <span className="text-md">{tipText}</span>
      {breakWallText && <span className="text-xs opacity-80">{breakWallText}</span>}
    </div>
  )
})
