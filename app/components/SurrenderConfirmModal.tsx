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
}

/**
 * 投降結算的確認。
 *
 * 和破牆一樣用磚紅色帶 —— 這兩件事是對局裡僅有的兩個不可逆操作，
 * 色彩本身就是警告。按下去之後盤面立刻定案，沒有回頭路，
 * 所以主要按鈕也用磚紅（而不是平常的深墨）：它不是「繼續」，是「結束」。
 *
 * 內文必須講清楚計分方式。「投降」在多數遊戲裡等於「對手獲勝」，
 * 但這裡是圍地遊戲，投降＝就此收手、照目前盤面算分 ——
 * 不講的話使用者會以為自己按下去就是直接判輸。
 */
const SurrenderConfirmModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
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
      <p className="text-sm leading-relaxed">{g.surrender.body}</p>
    </Modal>
  );
};

export default SurrenderConfirmModal;
