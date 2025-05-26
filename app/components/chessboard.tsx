"use client";

import type { Player } from "@/types/chessboard.ts";
import React from "react";
 
type Props = { 
  size: number;   
  board: Player[][]; 
  currentPlayer: Player;   
  verticalWalls: (null | 'A' | 'B')[][];
  horizontalWalls: (null | 'A' | 'B')[][];
};

export default React.memo(function Chessboard({ size, verticalWalls, horizontalWalls, board = [], currentPlayer }: Props) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  return (
    <div className="chessboard-container relative size-[80dvh]">
      {/* 列座標（A-H） */}
      <div className="absolute -bottom-5 left-0 flex w-full">
        {Array.from({ length: size }, (_, i) => (
          <div
            className="flex-1 text-center text-xs"
            key={`col-label-${i}`}
          >
            {letters[i]}
          </div>
        ))}
      </div>

      {/* 行座標（1-8） */}
      <div className="absolute -left-5 top-0 flex h-full flex-col justify-center">
        {Array.from({ length: size }, (_, i) => (
          <div
            className="flex h-full items-center justify-center text-xs"
            style={{ height: `${100 / size}%` }}
            key={`row-label-${i}`}
          >
            {size - i}
          </div>
        ))}
      </div>

      {/* 棋盤 */}
      <div className={`grid-cols-${size} grid size-full gap-[2px] overflow-hidden rounded-lg border-8 bg-gray-200`}>
        {Array.from({ length: size }, (_, rowIndex) =>
          Array.from({ length: size }, (_, colIndex) => {

            const player = board?.[rowIndex]?.[colIndex];
            const hasHorizontalWallPlayer = horizontalWalls?.[rowIndex]?.[colIndex];
            const hasVerticalWall = verticalWalls?.[rowIndex]?.[colIndex];

            const isTurn = currentPlayer === player;

            return <div
              className={`relative flex items-center justify-center bg-white ${isTurn ? 'cursor-pointer' : ''}`}
              key={`${colIndex}-${rowIndex}`}
            >
              {/* 棋子 */}
              {player && ['A', 'B'].includes(player) && (
                <div className={`bg-${player === 'A' ? 'primary' : 'secondary'} absolute z-20 size-1/2 rounded-full`} />
              )}
              {/* 橫牆 */}
              {hasHorizontalWallPlayer && (
                <div className={`bg-${hasHorizontalWallPlayer === 'A' ? 'primary' : 'secondary'} absolute inset-x-0 bottom-0 z-10 h-2 translate-y-1/2 rounded`} />
              )}
              {/* 直牆 */}
              {hasVerticalWall && (
                <div className={`bg-${hasVerticalWall === 'A' ? 'primary' : 'secondary'} absolute inset-y-0 right-0 z-10 w-2 translate-x-1/2 rounded`} />
              )}
            </div>
          })
        )}
      </div>
    </div>
  );
});
