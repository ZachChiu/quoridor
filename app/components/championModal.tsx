'use client'
import React from 'react';
import SectionShadow from './sectionShadow';
import { Player } from '@/types/chessboard';
import { MdClose } from "react-icons/md";
import Button from './button';
import IconButton from './iconButton';

interface ChampionModalProps {
  winner: Player | 'draw' | null;
  isOpen: boolean;
  uniqTerritories: { A: string[]; B: string[] };
  onClose: () => void;
  onRestart: () => void;
}

const ChampionModal: React.FC<ChampionModalProps> = ({ winner, isOpen, uniqTerritories, onClose, onRestart }) => {
  if (!isOpen || winner === null) return null;

  const getTitle = () => {
    if (winner === 'draw') return '平局！';
    return `${winner === 'A' ? '紅方' : '藍方'}勝利！`;
  };

  const getMessage = () => {
    if (winner === 'draw') {
      return '雙方佔領的地盤數量相同，遊戲結果為平局！';
    }
    return `恭喜${winner === 'A' ? '紅方' : '藍方'}佔領惹 ${(uniqTerritories?.[winner] || []).length} 個地盤`;
  };

  return (
    <div className={`fixed z-50 flex w-full max-w-md items-center justify-center p-4 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'} transition-opacity duration-300`}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <SectionShadow>
        <div className={`relative w-full rounded-xl border-2 border-gray-900 bg-tertiary p-6 font-[family-name:var(--font-geist-sans)]`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{getTitle()}</h2>
            <IconButton
              handleClickEvent={onClose}
            >
              <MdClose />
            </IconButton>
          </div>

          <div className="mb-4">
            <p className="text-lg">{getMessage()}</p>
          </div>

          {winner !== 'draw' && (
            <div className="mb-6 flex justify-center">
              <div className={`size-14 rounded-full ${winner === 'A' ? 'bg-primary' : 'bg-secondary'} animate-pulse-shine`}></div>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <Button
              color='bg-tertiary-500'
              handleClickEvent={onRestart}
            >
              重新開始
            </Button>
            <Button
              color='bg-tertiary-400'
              handleClickEvent={onClose}
            >
              關閉
            </Button>
          </div>
        </div>
      </SectionShadow>
    </div>
  );
};

export default ChampionModal;
