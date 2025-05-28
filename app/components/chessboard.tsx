"use client";

import type { Player } from "@/types/chessboard.ts";
import React, { useCallback, useEffect, useState } from "react";

 type Move = {
  row: number, col: number
}

type Props = {
  size: number;
  board: Player[][];
  currentPlayer: Player;
  verticalWalls: (null | 'A' | 'B')[][];
  horizontalWalls: (null | 'A' | 'B')[][];
  selectedChess: { row: number; col: number } | null;
  updateBoard: () => void;
  selectChess: (row: number, col: number) => void;
};

export default React.memo(function Chessboard({
  size,
  verticalWalls,
  horizontalWalls,
  board = [],
  currentPlayer,
  selectedChess,
  updateBoard,
  selectChess,
}: Props) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const [remainSteps, setRemainSteps] = useState(2);
  const [availableMoves, setAvailableMoves] = useState<Move[]>([]);

  const onClickSelectChess = (player: Player, row: number, col: number) => {
    if (player === currentPlayer) {
      selectChess(row, col);
    }
  };

  const checkWallBuildable = useCallback((rowIndex: number, colIndex: number, direction: 'top' | 'right' | 'bottom' | 'left'): boolean => {
    switch (direction) {
      case 'top':
        return rowIndex > 0 && !horizontalWalls[rowIndex - 1][colIndex];
      case 'right':
        return !verticalWalls[rowIndex][colIndex] && colIndex < size - 1;
      case 'bottom':
        return !horizontalWalls[rowIndex][colIndex] && rowIndex < size - 1;
      case 'left':
        return colIndex > 0 && !verticalWalls[rowIndex][colIndex - 1];
      default:
        return false;
    }
  }, [size, horizontalWalls, verticalWalls]);


  const checkDirections = useCallback((rowIndex: number, colIndex: number) => {
    const moves: Move[] = [];
    const directions = [
      { dr: -1, dc: 0 }, // 上
      { dr: 0, dc: 1 },  // 右
      { dr: 1, dc: 0 },  // 下
      { dr: 0, dc: -1 }  // 左
    ];

    directions.forEach(({ dr, dc }) => {
      // 計算相鄰位置
      const r1 = rowIndex + dr;
      const c1 = colIndex + dc;

      // 檢查是否在棋盤範圍內
      if (r1 >= 0 && r1 < size && c1 >= 0 && c1 < size) {
        // 檢查是否有牆擋住
        let hasWall = false;

        // 檢查水平牆
        if (dr === 1 && horizontalWalls[rowIndex][colIndex]) {
          hasWall = true;
        } else if (dr === -1 && rowIndex > 0 && horizontalWalls[rowIndex - 1][colIndex]) {
          hasWall = true;
        }

        // 檢查垂直牆
        if (dc === 1 && verticalWalls[rowIndex][colIndex]) {
          hasWall = true;
        } else if (dc === -1 && colIndex > 0 && verticalWalls[rowIndex][colIndex - 1]) {
          hasWall = true;
        }

        if (!hasWall) {
          // 如果相鄰位置沒有棋子，可以移動
          if (!board[r1][c1]) {
            moves.push({ row: r1, col: c1 });
          }
        }
      }
    });
    return moves;
  }, [size, horizontalWalls, verticalWalls, board]);

 // 計算可移動的位置
  const getAvailableMoves = useCallback((): Move[] => {
    if (!selectedChess) return [];

    const moves: Move[] = [];

    const { row: selectedRow, col: selectedCol } = selectedChess;

    const availableMoves = checkDirections(selectedRow, selectedCol);
    availableMoves.forEach((availableMove) => moves.push(...checkDirections(availableMove.row, availableMove.col)));
    moves.push(...availableMoves);
    return moves;
  }, [selectedChess, checkDirections]);

  useEffect(() => {
    setAvailableMoves(getAvailableMoves());
  }, [selectedChess, getAvailableMoves]);

  return (
    <div className="relative size-full">
      {/* 列座標（A-H）*/}
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

      {/* 行座標（1-8）*/}
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

            const player:Player = board?.[rowIndex]?.[colIndex];
            const hasHorizontalWallPlayer = horizontalWalls?.[rowIndex]?.[colIndex];
            const hasVerticalWall = verticalWalls?.[rowIndex]?.[colIndex];

            const isTurn = currentPlayer === player;
            const isSelecting = selectedChess?.row === rowIndex && selectedChess?.col === colIndex;

            const isAvailableMove = availableMoves.some(move => move.row === rowIndex && move.col === colIndex);

            return (
              <div
                className={`relative flex items-center justify-center ${isTurn || isAvailableMove ? 'cursor-pointer' : ''} ${isAvailableMove ? 'bg-green-100' : 'bg-white'}`}
                key={`${colIndex}-${rowIndex}`}
                onClick={() => onClickSelectChess(player,rowIndex, colIndex)}
              >
                {/* 棋子 */}
                {player && (
                  <div className={`${player === 'A' ? 'bg-primary' : 'bg-secondary'} ${isSelecting || (!isSelecting && isTurn) ? 'infinite animate-breathe transition-transform duration-1000' : ''} absolute z-20 size-1/2 rounded-full`} />
                )}
                {/* 橫牆 */}
                {hasHorizontalWallPlayer && (
                  <div className={`${hasHorizontalWallPlayer === 'A' ? 'bg-primary' : 'bg-secondary'} absolute inset-x-0 bottom-0 z-10 h-2 translate-y-1/2 rounded`} />
                )}
                {/* 直牆 */}
                {hasVerticalWall && (
                  <div className={`${hasVerticalWall === 'A' ? 'bg-primary' : 'bg-secondary'} absolute inset-y-0 right-0 z-10 w-2 translate-x-1/2 rounded`} />
                )}

                {/* 建立牆 */}
                {isSelecting && (
                <>
                  {checkWallBuildable(rowIndex, colIndex, 'top') && (
                    <div className={`absolute top-0 z-10 h-2 w-3/4 -translate-y-1/2 cursor-pointer rounded bg-gray-700 opacity-50 hover:opacity-100`}
                        onClick={() => {/* 建立上方牆的邏輯 */}}></div>
                  )}
                  {checkWallBuildable(rowIndex, colIndex, 'bottom') && (
                    <div className={`absolute bottom-0 z-10 h-2 w-3/4 translate-y-1/2 cursor-pointer rounded bg-gray-700 opacity-50 hover:opacity-100`}
                        onClick={() => {/* 建立下方牆的邏輯 */}}></div>
                  )}
                  {checkWallBuildable(rowIndex, colIndex, 'left') && (
                    <div className={`absolute left-0 z-10 h-3/4 w-2 -translate-x-1/2 cursor-pointer rounded bg-gray-700 opacity-50 hover:opacity-100`}
                        onClick={() => {/* 建立左方牆的邏輯 */}}></div>
                  )}
                  {checkWallBuildable(rowIndex, colIndex, 'right') && (
                    <div className={`absolute right-0 z-10 h-3/4 w-2 translate-x-1/2 cursor-pointer rounded bg-gray-700 opacity-50 hover:opacity-100`}
                        onClick={() => {/* 建立右方牆的邏輯 */}}></div>
                  )}
                </>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  );
});
