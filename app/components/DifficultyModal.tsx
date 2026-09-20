'use client'
import React from 'react';
import { GiBrain } from 'react-icons/gi';
import Modal from './Modal';
import type { Difficulty } from '@/game/ai';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPick: (difficulty: Difficulty) => void;
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
  標籤用「級」而不是簡單／普通／困難：這是圍棋衍生的遊戲，數字級距比
  形容詞中性，也不必替每一級想一個聽起來不尷尬的名字。

  描述改為陳述搜尋行為而非擬人化的口氣（原本是「會犯明顯的錯」這類），
  一來比較準確，二來玩家看得出級距之間差在哪。
*/
const LEVELS: { key: Difficulty; label: string; hint: string }[] = [
  { key: 'easy', label: '一級', hint: '僅評估當前一手' },
  { key: 'normal', label: '二級', hint: '推算對手的回應後再決定' },
  { key: 'hard', label: '三級', hint: '每手推算約一秒，搜尋較深的變化' },
];

const DifficultyModal: React.FC<Props> = ({ isOpen, onClose, onPick }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="選擇難度"
    kicker="單人對戰"
    icon={GiBrain}
    band={{ className: 'bg-tile-orange', fg: 'text-tile-ink' }}
  >
    <div className="flex flex-col gap-3">
      {LEVELS.map(({ key, label, hint }) => (
        <button
          key={key}
          type="button"
          onClick={() => onPick(key)}
          className="flex flex-col items-start gap-1 rounded-xl bg-primary-50 px-5 py-4 text-left transition hover:brightness-95 active:scale-[0.99]"
        >
          <span className="text-lg font-black">{label}</span>
          <span className="text-xs text-ink-soft">{hint}</span>
        </button>
      ))}
    </div>
  </Modal>
);

export default DifficultyModal;
