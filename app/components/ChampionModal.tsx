'use client'
import React, { useMemo } from 'react';
import SectionShadow from './SectionShadow';
import { Player } from '@/types/chessboard';
import { MdClose } from 'react-icons/md';
import Button from './Button';
import IconButton from './IconButton';

interface ChampionModalProps {
  winners: (Player | 'draw')[];
  isOpen: boolean;
  uniqTerritories: { A: string[]; B: string[]; C?: string[] };
  onClose: () => void;
  onRestart: () => void;
}

const PLAYER_MAP: Record<Exclude<Player, null>, string> = {
  A: '紅方',
  B: '藍方',
  C: '黃方',
};

const getWinnerText = (winners: (Player | 'draw')[]) => {
  if (!winners || winners.length === 0 || winners[0] === 'draw') return '平局！';
  const names = winners.map(w => PLAYER_MAP[w as Exclude<Player, null>]).filter(Boolean);
  return `${names.join('、')}勝利！`;
};

const getMessageText = (
  winners: (Player | 'draw')[],
  uniqTerritories: { A: string[]; B: string[]; C?: string[] }
) => {
  if (!winners || winners.length === 0 || winners[0] === 'draw') {
    return '玩家們佔領的地盤數量相同，遊戲結果為平局！';
  }
  const names = winners.map(w => PLAYER_MAP[w as Exclude<Player, null>]).filter(Boolean);
  const count = uniqTerritories[winners[0] as Exclude<Player, null>]?.length ?? 0;
  return `恭喜${names.join('、')}${winners.length > 1 ? '各' : ''}佔領惹 ${count} 個地盤`;
};

const ChampionModal: React.FC<ChampionModalProps> = ({ winners, isOpen, uniqTerritories, onClose, onRestart }) => {
  // 用已定義的 getWinnerText/getMessageText 取代重複邏輯
  const title = useMemo(() => getWinnerText(winners), [winners]);
  const message = useMemo(() => getMessageText(winners, uniqTerritories), [winners, uniqTerritories]);

  return (
    <div className={`fixed z-50 flex w-full max-w-md items-center justify-center p-4 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'} transition-opacity duration-300`}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <SectionShadow>
        <div className={`relative w-full rounded-xl border-2 border-gray-900 bg-primary p-6 font-[family-name:var(--font-geist-sans)]`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{title}</h2>
            <div className='group cursor-pointer'>
              <IconButton
                handleClickEvent={onClose}
              >
                <MdClose />
              </IconButton>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-lg">{message}</p>
          </div>

          {winners[0] !== 'draw' &&
            <div className="mb-6 flex justify-center gap-4">{
              winners.map(w => <div className={`bg-player-${w} animate-pulse-shine size-14 rounded-full`} key={w}></div>)
            }
          </div>

          }

          <div className="flex justify-center gap-4">
            <Button
              color='bg-primary-500'
              handleClickEvent={onRestart}
            >
              重新開始
            </Button>
            <Button
              color='bg-primary-400'
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
