"use client"
import React from 'react';
import { GiExitDoor } from "react-icons/gi";
import Modal from './Modal';
import Button from './Button';
import { useGameText } from '@/i18n/LocaleProvider';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** 連線局要講的是「對手會等你」，不是「這局不會保留」—— 房間還在，連結回得來 */
  online: boolean;
}

/**
 * 對局還沒結束就要離開時的確認（回首頁的房子鈕、瀏覽器的返回鍵）。
 *
 * 為什麼需要它：瀏覽器自己的「確定要離開嗎？」（beforeunload）只管整頁跳轉，
 * 站內換頁不會觸發；而且 iPhone 上的 Safari 與 Chrome 根本不顯示它
 * —— Zach 在手機上下到一半按返回，整局就沒了。
 *
 * 色帶用深墨：離開不屬於任何一個玩家或模式，任何磁磚色放在這裡都會被讀成
 * 「跟那個模式有關」。主要按鈕是「繼續下」以外的那顆，一樣是深墨 —— 深墨
 * 色帶配深墨按鈕仍然只有一個「色相」（沒有）。
 */
const LeaveConfirmModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, online }) => {
  const g = useGameText();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={g.leave.heading}
      kicker={g.leave.kicker}
      icon={GiExitDoor}
      band={{ className: 'bg-tile-ink', fg: 'text-tile-cream' }}
      footer={
        <>
          <Button color="text-ink-soft hover:bg-tile-ink/[0.06] bg-transparent" handleClickEvent={onClose}>
            {g.leave.cancel}
          </Button>
          <Button color="bg-tile-ink text-tile-cream" handleClickEvent={onConfirm}>
            {g.leave.confirm}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed">{online ? g.leave.bodyOnline : g.leave.body}</p>
    </Modal>
  );
};

export default LeaveConfirmModal;
