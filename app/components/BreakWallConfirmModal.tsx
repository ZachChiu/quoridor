"use client"
import React from 'react';
import { GiHammerBreak } from "react-icons/gi";
import Modal from './Modal';
import Button from './Button';
import { useGameText } from '@/i18n/LocaleProvider';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCheck: () => void;
}

/**
 * 破牆確認。
 *
 * 色帶用磚紅 —— 這是整局唯一不可逆的一手（每人只有一次），色彩本身就是警告。
 * 圖示用 GiHammerBreak，與盤面上那顆可破牆的標記是同一個。
 */
const BreakWallConfirmModal: React.FC<Props> = ({ isOpen, onClose, onCheck }) => {
  const g = useGameText();
  return (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={g.breakWall.heading}
    kicker={g.breakWall.kicker}
    icon={GiHammerBreak}
    band={{ className: 'bg-tile-red', fg: 'text-tile-cream' }}
    footer={
      <>
        <Button color="text-ink-soft hover:bg-tile-ink/[0.06] bg-transparent" handleClickEvent={onClose}>{g.breakWall.cancel}</Button>
        <Button color="bg-tile-red text-tile-cream" handleClickEvent={onCheck}>{g.breakWall.confirm}</Button>
      </>
    }
  >
    <p className="text-sm leading-relaxed">
      {g.breakWall.body}
    </p>
  </Modal>
  );
};

export default BreakWallConfirmModal;
