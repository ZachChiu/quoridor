'use client'
import React from 'react';
import SectionShadow from './sectionShadow';
import { Player } from '@/types/chessboard';

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
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="關閉"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-lg">{getMessage()}</p>
          </div>

          {winner !== 'draw' && (
            <div className="mb-6 flex justify-center">
              <div className={`size-14 rounded-full ${winner === 'A' ? 'bg-primary' : 'bg-secondary'} animate-breathe`}></div>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <SectionShadow>
              <button
                type="button"
                className="relative w-full rounded-xl border-4 border-gray-900 bg-tertiary-500 p-4 text-xl hover:-translate-x-0.5 hover:-translate-y-0.5 focus:translate-x-1 focus:translate-y-1"
                onClick={onRestart}
              >
                重新開始
              </button>
            </SectionShadow>
            <SectionShadow>
              <button
                type="button"
                className="relative w-full rounded-xl border-4 border-gray-900 bg-tertiary-400 p-4 text-xl hover:-translate-x-0.5 hover:-translate-y-0.5 focus:translate-x-1 focus:translate-y-1"
                onClick={onClose}
              >
                關閉
              </button>
            </SectionShadow>
          </div>
        </div>
      </SectionShadow>
    </div>
  );
};

export default ChampionModal;
