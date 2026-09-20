'use client'
import React from 'react';
import { GiShare } from 'react-icons/gi';
import { PLAYER_NAME, playerVar, type PlayerKey } from '@/config/players';

interface Props {
  joinedCount: number;
  totalCount: number;
  onShare: () => void;
}

const SEATS: PlayerKey[] = ['A', 'B', 'C'];

/**
 * 連線模式的等待畫面。
 *
 * 座位與邀請 Modal 是同一套語彙：已入座染該玩家的顏色，空位是虛線圈。
 * 原本只有一行「1 / 2 玩家已加入」配一顆轉圈圈 —— 轉圈圈只說明「在等」，
 * 沒說等的是誰、還差幾個，而顏色順便先讓人記住待會兒自己是哪一色。
 */
const WaitingRoom: React.FC<Props> = ({ joinedCount, totalCount, onShare }) => (
  <div className="flex flex-col items-center gap-7 px-6 text-center">
    <div>
      <p className="text-xs font-bold tracking-widest text-ink-soft">連線對戰</p>
      <h2 className="mt-1 text-3xl font-black">等朋友進來</h2>
    </div>

    <div className="flex items-start gap-5">
      {SEATS.slice(0, totalCount).map((p, i) => {
        const joined = i < joinedCount;
        return (
          <div key={p} className="flex w-16 flex-col items-center gap-2">
            <div
              className={`size-12 rounded-full ${
                joined ? '' : 'border-ink-soft/50 animate-pulse border-2 border-dashed'
              }`}
              style={joined ? { backgroundColor: playerVar(p) } : undefined}
            />
            <span className={`text-xs font-bold ${joined ? '' : 'text-ink-soft'}`}>
              {joined ? PLAYER_NAME[p] : '等待中'}
            </span>
          </div>
        );
      })}
    </div>

    <button
      type="button"
      onClick={onShare}
      className="flex items-center gap-2 rounded-2xl bg-tile-amber px-6 py-4 text-lg font-black text-tile-ink transition hover:brightness-95 active:scale-[0.98]"
    >
      <GiShare />邀請朋友加入
    </button>
  </div>
);

export default WaitingRoom;
