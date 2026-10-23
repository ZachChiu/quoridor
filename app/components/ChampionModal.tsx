'use client'
import React, { useMemo } from 'react';
import { GiLaurelCrown, GiScales } from "react-icons/gi";
import Modal from './Modal';
import Button from './Button';
import { PLAYER_ON, playerVar, type PlayerKey } from '@/config/players';
import { ResultCardPreview, useResultCard, type ShareCardInput } from './ResultCard';

import { Player } from '@/types/chessboard';
import { useGameText } from '@/i18n/LocaleProvider';

interface ChampionModalProps {
  winners: (Player | 'draw')[];
  isOpen: boolean;
  uniqTerritories: { A: string[]; B: string[]; C?: string[] };
  onClose: () => void;
  /** 省略時不顯示「再來一局」。連線模式沒有本地重開 —— 重開要雙方同意。 */
  onRestart?: () => void;
  /** 打開回饋表單。剛玩完是唯一還記得剛剛發生什麼的時刻。 */
  onFeedback?: () => void;
  /** 分享圖要畫的東西（見 ResultCard） */
  card: ShareCardInput;
  /** 各方累計的思考時間，排好版的字（3:12）。圖上有，這裡給螢幕報讀用 */
  times?: Partial<Record<PlayerKey, string>>;
}

/**
 * 結算。
 *
 * **結算畫面就是分享圖**（Zach 10/23：「是不是可以直接顯示這個分享畫面，結合成一個」）。
 * 先前是一排名次＋「分享戰績」再開一個視窗看圖 —— 圖上本來就有勝方、比分、盤面、思考時間，
 * 等於同樣的東西看兩次；「看看棋盤」也拿掉了（圖上就是終局盤面，要看真的棋盤按右上角關掉）。
 *
 * 標題列照舊滿版染成勝方的顏色；並列冠軍或平局沒有單一勝方，色帶回到深墨。
 * 圖是 Canvas 畫的，名次另外放一份給螢幕報讀（sr-only）。
 */
const ChampionModal: React.FC<ChampionModalProps> = ({
  winners, isOpen, uniqTerritories, onClose, onRestart, onFeedback, card, times,
}) => {
  const g = useGameText();
  const share = useResultCard(isOpen, card);
  const isDraw = !winners?.length || winners[0] === 'draw';
  const winnerKeys = useMemo(
    () => (isDraw ? [] : (winners as PlayerKey[])),
    [isDraw, winners]
  );

  // 勝方一律排最上面，其次才看地盤大小（投降的人地可能比較多，但他輸了）
  const ranking = useMemo(() => {
    const keys = (['A', 'B', 'C'] as PlayerKey[])
      .filter((p) => uniqTerritories[p] !== undefined);
    const won = (p: PlayerKey) => (winnerKeys.includes(p) ? 1 : 0);
    return keys
      .map((p) => ({ player: p, count: uniqTerritories[p]?.length ?? 0 }))
      .sort((a, b) => won(b.player) - won(a.player) || b.count - a.count);
  }, [uniqTerritories, winnerKeys]);

  // 單一勝方才用他的顏色；並列或平局沒有代表色，回到深墨。
  const solo = !isDraw && winnerKeys.length === 1 ? winnerKeys[0] : null;

  const shareLabel = share.canShareFile ? g.share.shareImage : g.share.save;
  const onShare = share.canShareFile ? share.shareFile : share.save;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={share.title}
      icon={isDraw ? GiScales : GiLaurelCrown}
      kicker={`${g.champion.matchOver} · ${card.modeLabel}`}
      band={solo
        ? { style: { backgroundColor: playerVar(solo) }, fg: PLAYER_ON[solo] }
        : { className: 'bg-tile-ink', fg: 'text-tile-cream' }}
      /*
        兩排：次要的左右並排，主要動作自己一整條在下面 —— 寬度就是層級，不必再靠顏色去喊。
        本機／單人：主要是「再來一局」，分享退一階成次要灰；連線沒有再來一局，分享就是主要動作。
        深墨不屬於任何玩家，放在勝方色帶旁邊永遠不會撞色。
      */
      footer={
        <div className="flex w-full flex-col gap-3">
          <div className="flex gap-3">
            {/* 回饋放在最左邊、樣式最輕 —— 它不該和主要動作搶，但也不能藏到別的頁面去 */}
            {onFeedback && (
              <Button color="text-ink-soft hover:bg-tile-ink/[0.06] bg-transparent" handleClickEvent={onFeedback}>
                {g.champion.feedback}
              </Button>
            )}
            {onRestart && (
              <Button color="bg-tile-ink/[0.07] text-tile-ink" handleClickEvent={onShare} disabled={!share.ready}>{shareLabel}</Button>
            )}
          </div>
          {onRestart
            ? <Button handleClickEvent={onRestart}>{g.champion.playAgain}</Button>
            : <Button handleClickEvent={onShare} disabled={!share.ready}>{shareLabel}</Button>}
        </div>
      }
    >
      <ResultCardPreview
        card={share}
        // 比分享圖自己那組再矮一點：底下多一排按鈕。iPhone SE（667 高）上整個要放得下、不用捲
        boxH={{
          story: 'h-[min(58dvh,calc(100dvh_-_25.5rem),600px)]',
          poster: 'h-[min(46dvh,calc(100dvh_-_25.5rem),480px)]',
          square: 'h-[min(46dvh,calc(100dvh_-_25.5rem),480px)]',
        }}
      />
      <ol className="sr-only">
        {ranking.map(({ player, count }) => (
          <li key={player}>
            {!isDraw && winnerKeys.includes(player) && `${g.champion.winner} `}
            {g.players[player]} {count} {g.champion.squares}
            {times?.[player] && `, ${g.clock.label} ${times[player]}`}
          </li>
        ))}
      </ol>
    </Modal>
  );
};

export default ChampionModal;
