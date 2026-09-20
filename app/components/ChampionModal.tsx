'use client'
import React, { useMemo } from 'react';
import { GiLaurelCrown, GiScales } from "react-icons/gi";
import Modal from './Modal';
import Button from './Button';
import { PLAYER_NAME, PLAYER_ON, playerVar, type PlayerKey } from '@/config/players';

import { Player } from '@/types/chessboard';

interface ChampionModalProps {
  winners: (Player | 'draw')[];
  isOpen: boolean;
  uniqTerritories: { A: string[]; B: string[]; C?: string[] };
  onClose: () => void;
  /** 省略時不顯示「再來一局」。連線模式沒有本地重開 —— 重開要雙方同意。 */
  onRestart?: () => void;
  /** 打開回饋表單。剛玩完是唯一還記得剛剛發生什麼的時刻。 */
  onFeedback?: () => void;
}

/**
 * 結算。
 *
 * 這是整局的回報畫面，所以做成全站最重的一塊：標題列滿版染成勝方的顏色。
 * 內容則是把最終比分排成名次 —— 沿用遊戲中比分條的樣子，色彩即資訊，
 * 不必再用文字解釋誰是誰。並列冠軍或平局沒有單一勝方，色帶回到深墨。
 */
const ChampionModal: React.FC<ChampionModalProps> = ({
  winners, isOpen, uniqTerritories, onClose, onRestart, onFeedback,
}) => {
  const isDraw = !winners?.length || winners[0] === 'draw';
  const winnerKeys = useMemo(
    () => (isDraw ? [] : (winners as PlayerKey[])),
    [isDraw, winners]
  );

  // 名次由高到低。結算畫面的重點就是排名，維持 A/B/C 原序反而要讀者自己比。
  const ranking = useMemo(() => {
    const keys = (['A', 'B', 'C'] as PlayerKey[])
      .filter((p) => uniqTerritories[p] !== undefined);
    return keys
      .map((p) => ({ player: p, count: uniqTerritories[p]?.length ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [uniqTerritories]);

  const title = isDraw
    ? '平局'
    : `${winnerKeys.map((w) => PLAYER_NAME[w]).join('、')}勝利`;

  const message = isDraw
    ? '大家佔領的地盤一樣多，這局不分高下。'
    : `恭喜${winnerKeys.map((w) => PLAYER_NAME[w]).join('、')}${
        winnerKeys.length > 1 ? '並列第一' : '拿下這局'
      }。`;

  // 單一勝方才用他的顏色；並列或平局沒有代表色，回到深墨。
  const solo = !isDraw && winnerKeys.length === 1 ? winnerKeys[0] : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={isDraw ? GiScales : GiLaurelCrown}
      kicker="對局結束"
      band={solo
        ? { style: { backgroundColor: playerVar(solo) }, fg: PLAYER_ON[solo] }
        : { className: 'bg-tile-ink', fg: 'text-tile-cream' }}
      footer={
        <>
          {/* 回饋放在最左邊、樣式最輕 —— 它不該和「再來一局」搶主要動作，
              但也不能藏到別的頁面去：離開這個畫面就沒人會回頭找它了。 */}
          {onFeedback && (
            <Button color="text-ink-soft hover:bg-tile-ink/[0.06] bg-transparent" handleClickEvent={onFeedback}>
              給點意見
            </Button>
          )}
          <Button color="text-ink-soft hover:bg-tile-ink/[0.06] bg-transparent" handleClickEvent={onClose}>
            看看棋盤
          </Button>
          {/* 深墨而非琥珀：三人局的黃方比分條就是琥珀，緊鄰著放會被讀成同一件事。
              深墨不屬於任何玩家，在這面彩色的板子上永遠不會撞色。 */}
          {onRestart && (
            <Button color="bg-tile-ink text-tile-cream" handleClickEvent={onRestart}>再來一局</Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-2">
        {ranking.map(({ player, count }) => {
          // 平局時沒有輸家，一律不調暗；否則整面都是灰的，看起來像大家都輸了
          const won = isDraw || winnerKeys.includes(player);
          return (
            <div
              key={player}
              // 全部滿色，不淡化：淡化會把文字對比壓到 2.4:1。
              // 名次改用「高度」表示 —— 勝方那條比較厚，像頒獎台，
              // 而且不靠動畫也不靠顏色深淺，轉灰階一樣讀得出來。
              className={`flex items-center gap-3 rounded-xl px-4 font-black tabular-nums ${
                PLAYER_ON[player]
              } ${won ? 'py-4 text-base' : 'py-2.5 text-sm'}`}
              style={{ backgroundColor: playerVar(player) }}
            >
              {won && !isDraw && <GiLaurelCrown className="shrink-0 text-2xl" aria-label="勝方" />}
              <span className="flex-1">{PLAYER_NAME[player]}</span>
              <span className={`leading-none ${won ? 'text-2xl' : 'text-lg'}`}>{count}</span>
              <span className="text-xs font-bold opacity-80">格</span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">{message}</p>
    </Modal>
  );
};

export default ChampionModal;
