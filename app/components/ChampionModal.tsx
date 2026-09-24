'use client'
import React, { useMemo } from 'react';
import { GiLaurelCrown, GiScales } from "react-icons/gi";
import Modal from './Modal';
import Button from './Button';
import { PLAYER_ON, playerVar, type PlayerKey } from '@/config/players';

import { Player } from '@/types/chessboard';
import { useGameText } from '@/i18n/LocaleProvider';
import { fmt } from '@/i18n/content/game';


interface ChampionModalProps {
  winners: (Player | 'draw')[];
  isOpen: boolean;
  uniqTerritories: { A: string[]; B: string[]; C?: string[] };
  onClose: () => void;
  /** 省略時不顯示「{g.champion.playAgain}」。連線模式沒有本地重開 —— 重開要雙方同意。 */
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
  const g = useGameText();
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
    ? g.champion.draw
    : fmt(g.champion.win, { names: winnerKeys.map((w) => g.players[w]).join('、') });

  // 單一勝方才用他的顏色；並列或平局沒有代表色，回到深墨。
  const solo = !isDraw && winnerKeys.length === 1 ? winnerKeys[0] : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={isDraw ? GiScales : GiLaurelCrown}
      kicker={g.champion.matchOver}
      band={solo
        ? { style: { backgroundColor: playerVar(solo) }, fg: PLAYER_ON[solo] }
        : { className: 'bg-tile-ink', fg: 'text-tile-cream' }}
      /*
        兩排：次要的兩顆左右並排，主要動作自己一整條在下面。

        三顆擠一排的時候每顆只剩約 95px，中文四個字剛好塞不下；而且
        「再來一局」和另外兩顆一樣寬，看不出誰才是主要動作。
        分兩排之後寬度就是層級 —— 不必再靠顏色去喊。
      */
      footer={
        <div className="flex w-full flex-col gap-3">
          <div className="flex gap-3">
            {/* 回饋放在最左邊、樣式最輕 —— 它不該和「再來一局」搶主要動作，
                但也不能藏到別的頁面去：離開這個畫面就沒人會回頭找它了。 */}
            {onFeedback && (
              <Button color="text-ink-soft hover:bg-tile-ink/[0.06] bg-transparent" handleClickEvent={onFeedback}>
                {g.champion.feedback}
              </Button>
            )}
            <Button color="text-ink-soft hover:bg-tile-ink/[0.06] bg-transparent" handleClickEvent={onClose}>
              {g.champion.seeBoard}
            </Button>
          </div>
          {/* 深墨而非琥珀：三人局的黃方比分條就是琥珀，緊鄰著放會被讀成同一件事。
              深墨不屬於任何玩家，在這面彩色的板子上永遠不會撞色。 */}
          {onRestart && (
            <Button color="bg-tile-ink text-tile-cream" handleClickEvent={onRestart}>{g.champion.playAgain}</Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        {ranking.map(({ player, count }) => {
          // 平局時沒有輸家，一律不調暗；否則整面都是灰的，看起來像大家都輸了
          const won = isDraw || winnerKeys.includes(player);
          /*
            勝方滿色、而且明顯比較大；輸的一方反灰，只留一顆小色點認得出是誰。

            先前全部滿色、只靠高度分名次 —— 三條都是飽和的紅藍黃，
            視線沒有落點，看不出誰贏。反灰不用 opacity 做：淡化會把文字對比
            壓到 2.4:1。改成中性底＋ink-soft 字，對比照樣過 4.5。
          */
          if (!won) {
            return (
              <div
                key={player}
                className="flex items-center gap-3 rounded-xl bg-tile-ink/[0.07] px-4 py-2.5 text-sm font-black tabular-nums text-ink-soft"
              >
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: playerVar(player) }} aria-hidden="true" />
                <span className="flex-1">{g.players[player]}</span>
                <span className="text-lg leading-none">{count}</span>
                <span className="text-xs font-bold">{g.champion.squares}</span>
              </div>
            );
          }
          return (
            <div
              key={player}
              className={`flex items-center gap-3 rounded-xl px-5 font-black tabular-nums ${PLAYER_ON[player]} ${
                isDraw ? 'py-4 text-base' : 'py-6 text-xl'
              }`}
              style={{ backgroundColor: playerVar(player) }}
            >
              {!isDraw && <GiLaurelCrown className="shrink-0 text-3xl" aria-label={g.champion.winner} />}
              <span className="flex-1">{g.players[player]}</span>
              <span className={`leading-none ${isDraw ? 'text-2xl' : 'text-5xl'}`}>{count}</span>
              <span className="text-xs font-bold opacity-80">{g.champion.squares}</span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default ChampionModal;
