"use client"
import React from 'react';
import { GiHammerBreak } from "react-icons/gi";
import Modal from './Modal';
import Button from './Button';

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
const BreakWallConfirmModal: React.FC<Props> = ({ isOpen, onClose, onCheck }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="要打破這面牆嗎"
    kicker="每人只有一次"
    icon={GiHammerBreak}
    band={{ className: 'bg-tile-red', fg: 'text-tile-cream' }}
    footer={
      <>
        <Button color="text-ink-soft hover:bg-tile-ink/[0.06] bg-transparent" handleClickEvent={onClose}>
          取消
        </Button>
        <Button color="bg-tile-red text-tile-cream" handleClickEvent={onCheck}>
          破牆
        </Button>
      </>
    }
  >
    <p className="text-sm leading-relaxed">
      打破後這顆棋子可以繼續移動，但你的破牆機會會歸零 —— 這一局不會再有第二次。
    </p>
  </Modal>
);

export default BreakWallConfirmModal;
