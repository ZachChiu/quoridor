'use client';
import { GiExitDoor } from 'react-icons/gi';
import Modal from '@/components/Modal';
import { useGameText } from '@/i18n/LocaleProvider';
import { BAND_INK, MODAL_PANEL } from './styles';

/**
 * 走到一半要回選單時先問（hook/useLeaveGuard.ts，房子鈕、返回鍵、電腦版關分頁都是它）。
 * 跟這款其他彈窗一樣是銅版圖版：「繼續」淡墨、「離開」紅粉筆。
 */
export default function LeaveModal({ leave }: { leave: { open: boolean; cancel: () => void; confirm: () => void } }) {
  const g = useGameText();
  return (
    <Modal isOpen={leave.open} onClose={leave.cancel} title={g.leave.heading} kicker={g.leave.kicker}
      icon={GiExitDoor} band={BAND_INK} panelClassName={MODAL_PANEL}
      footer={<>
        <button type="button" className="kt-plate flex-1 py-3.5 font-black" onClick={leave.cancel}>{g.leave.cancel}</button>
        <button type="button" className="kt-chalk flex-1 py-3.5 font-black" onClick={leave.confirm}>{g.leave.confirm}</button>
      </>}>
      <p className="text-sm font-bold leading-relaxed">{g.leave.body}</p>
    </Modal>
  );
}
