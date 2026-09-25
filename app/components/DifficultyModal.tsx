'use client'
import React from 'react';
import { GiBrain } from 'react-icons/gi';
import Modal from './Modal';
import DifficultyButtons from './DifficultyButtons';
import type { Difficulty } from '@/game/ai';
import { useMessages } from '@/i18n/LocaleProvider';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** 第二個參數是按下的位置 —— 單人模式的轉場要從那裡擴散出去。 */
  onPick: (difficulty: Difficulty, at: { x: number; y: number }) => void;
}

/**
 * 單人對戰的難度選擇。
 *
 * 做成 Modal 而不是首頁上再開三塊磁磚：難度是一次性的決定，
 * 常駐在首頁只會讓「一眼看完所有選擇」變成「八個選項要讀」。
 *
 * 色帶用陶橘 —— 它是唯一還沒被指派意義的磁磚色（琥珀＝本機、
 * 靛藍與磚紅＝連線、森綠＝規則、紫＝三人）。
 */
const DifficultyModal: React.FC<Props> = ({ isOpen, onClose, onPick }) => {
  const t = useMessages();
  return (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={t.ui.pickLevel}
    kicker={t.home.solo}
    icon={GiBrain}
    band={{ className: 'bg-tile-orange', fg: 'text-tile-ink' }}
  >
    <DifficultyButtons onPick={onPick} />
  </Modal>
  );
};

export default DifficultyModal;
