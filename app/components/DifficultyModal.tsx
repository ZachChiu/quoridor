'use client'
import React from 'react';
import { GiBrain } from 'react-icons/gi';
import Modal from './Modal';
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
/*
  用「級」而不是簡單／普通／困難：這是圍棋衍生的遊戲，數字級距比形容詞中性，
  也不必替每一級想一個聽起來不尷尬的名字。

  不附說明文字 —— 級距本身已經表達了順序，再寫「僅評估當前一手」這類描述
  只是要玩家在選之前先讀三行字。真正的差別打一局就知道。
*/
const LEVELS: { key: Difficulty }[] = [
  { key: 'easy' },
  { key: 'normal' },
  { key: 'hard' },
];

const DifficultyModal: React.FC<Props> = ({ isOpen, onClose, onPick }) => {
  const t = useMessages();
  const labels = [t.solo.level1, t.solo.level2, t.solo.level3];
  return (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={t.ui.pickLevel}
    kicker={t.home.solo}
    icon={GiBrain}
    band={{ className: 'bg-tile-orange', fg: 'text-tile-ink' }}
  >
    <div className="flex flex-col gap-3">
      {LEVELS.map(({ key }, i) => (
        <button
          key={key}
          type="button"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            onPick(key, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
          }}
          className="rounded-xl bg-primary-50 px-5 py-4 text-lg font-black transition hover:brightness-95 active:scale-[0.99]"
        >
          {labels[i]}
        </button>
      ))}
    </div>
  </Modal>
  );
};

export default DifficultyModal;
