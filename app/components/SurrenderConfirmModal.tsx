"use client"
import React from 'react';
import { GiTruce } from "react-icons/gi";
import Modal from './Modal';
import Button from './Button';
import { useGameText } from '@/i18n/LocaleProvider';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** 三人局要多講一句：剩下兩人怎麼分勝負。兩人局講這個只會讓人困惑。 */
  playersNum: 2 | 3;
}

/**
 * 投降的確認。
 *
 * 和破牆一樣用磚紅色帶 —— 這兩件事是對局裡僅有的兩個不可逆操作，
 * 色彩本身就是警告。按下去之後盤面立刻定案，沒有回頭路，
 * 所以主要按鈕也用磚紅（而不是平常的深墨）：它不是「繼續」，是「結束」。
 *
 * 投降就是輸（見 game/score.ts 的 resignOutcome）。內文要講清楚三人局的情形：
 * 投降的人判負，剩下兩人照目前的地盤決勝負 —— 這一點使用者猜不到。
 */
const SurrenderConfirmModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, playersNum }) => {
  const g = useGameText();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={g.surrender.heading}
      kicker={g.surrender.kicker}
      icon={GiTruce}
      band={{ className: 'bg-tile-red', fg: 'text-tile-cream' }}
      footer={
        <>
          <Button color="text-ink-soft hover:bg-tile-ink/[0.06] bg-transparent" handleClickEvent={onClose}>
            {g.surrender.cancel}
          </Button>
          <Button color="bg-tile-red text-tile-cream" handleClickEvent={onConfirm}>
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
