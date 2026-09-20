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
const LEVELS: { key: Difficulty; label: string; hint: string }[] = [
  { key: 'easy', label: '簡單', hint: '只看眼前一步，會犯明顯的錯' },
  { key: 'normal', label: '普通', hint: '會預判你的下一手' },
  { key: 'hard', label: '困難', hint: '每手思考一秒，會為了圍地放棄眼前的便宜' },
];

const DifficultyModal: React.FC<Props> = ({ isOpen, onClose, onPick }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="要多難？"
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
