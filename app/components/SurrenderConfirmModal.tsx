"use client"
import React from 'react';
import { GiTruce } from "react-icons/gi";
import Modal from './Modal';
import Button from './Button';
import { useGameText } from '@/i18n/LocaleProvider';
import { PLAYER_ON, playerVar, type PlayerKey } from '@/config/players';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** 三人局要多講一句：剩下兩人怎麼分勝負。兩人局講這個只會讓人困惑。 */
  playersNum: 2 | 3;
  /** 按下投降的是誰 —— 色帶用他的顏色，一眼看出「是我在投降」。 */
  player: PlayerKey;
}

/**
 * 投降的確認。
 *
 * 色帶用**投降那一方**的顏色：本機是兩三個人輪流拿同一台裝置，
 * 固定的磚紅看不出現在是誰要投降；用他的顏色，按下去的人一眼就知道
 * 「這是在替我投降」（Zach 要求）。
 * 色帶已經帶了一個色相，主要按鈕就改用深墨 —— 一個面板一個色相（CLAUDE.md）。
 * 不可逆的警告由標題與「投降就算輸」這句承擔。
 *
 * 投降就是輸（見 game/score.ts 的 resignOutcome）。內文要講清楚三人局的情形：
 * 投降的人判負，剩下兩人照目前的地盤決勝負 —— 這一點使用者猜不到。
 */
const SurrenderConfirmModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, playersNum, player }) => {
  const g = useGameText();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={g.surrender.heading}
      kicker={g.surrender.kicker}
      icon={GiTruce}
      band={{ style: { backgroundColor: playerVar(player) }, fg: PLAYER_ON[player] }}
      footer={
        <>
          <Button color="text-ink-soft hover:bg-tile-ink/[0.06] bg-transparent" handleClickEvent={onClose}>
            {g.surrender.cancel}
          </Button>
          <Button color="bg-tile-ink text-tile-cream" handleClickEvent={onConfirm}>
            {g.surrender.confirm}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed">{playersNum === 3 ? g.surrender.bodyThree : g.surrender.body}</p>
    </Modal>
  );
};

export default SurrenderConfirmModal;
