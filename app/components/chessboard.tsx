"use client";

import type { Player, Move, Direction } from "@/types/chessboard.ts";
import React, { useCallback, useEffect, useState } from "react";

type Props = {
  size: number;
  board: Player[][];
  currentPlayer: Player;
  verticalWalls: (null | 'A' | 'B')[][];
  horizontalWalls: (null | 'A' | 'B')[][];
  selectedChess: Move | null;
  remainSteps: number;
  flattenTerritoriesObj: Record<string, Player>;
  isLock: boolean;
  selectChess: (row: number, col: number) => void;
  selectWall: (row: number, col: number, direction: Direction) => void;
  selectCell: (row: number, col: number) => void;
};

export default React.memo(function Chessboard({
  size,
  verticalWalls,
  horizontalWalls,
  board = [],
  currentPlayer,
  selectedChess,
  remainSteps,
  flattenTerritoriesObj,
  isLock,
  selectChess,
  selectWall,
  selectCell
}: Props) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const [availableMoves, setAvailableMoves] = useState<Move[]>([]);

  const onClickSelectChess = (selectedPlayer: Player, row: number, col: number, isAvailableMove: boolean) => {
    if (selectedPlayer === currentPlayer) {
      selectChess(row, col);
    } else if (isAvailableMove) {
      selectCell(row, col);
    }
  };

  const checkWallBuildable = useCallback((rowIndex: number, colIndex: number, direction: Direction): boolean => {
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

 /**
  * 計算可移動的位置
  * @param rowIndex - 行索引
  * @param colIndex - 列索引
  * @param steps - 剩餘步數
  * @param visited - 已訪問的位置
  * @returns {Move[]} 可移動的位置
  */
  const getAvailableMovesRecursive = useCallback((
    rowIndex: number,
    colIndex: number,
    steps: number,
    visited: Set<string> = new Set()
  ): Move[] => {
    // 如果步數為 0 或位置已訪問，返回空數組
    if (steps <= 0) return [];

    const posKey = `${rowIndex},${colIndex}`;
    if (visited.has(posKey)) return [];

    // 標記當前位置為已訪問
    const newVisited = new Set(visited);
    newVisited.add(posKey);

    const directions = [
      { dr: -1, dc: 0 }, // 上
      { dr: 0, dc: 1 },  // 右
      { dr: 1, dc: 0 },  // 下
      { dr: 0, dc: -1 }  // 左
    ];

    const currentMoves: Move[] = [];
    const nextMoves: Move[] = [];

    for (const { dr, dc } of directions) {
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
            const move = { row: r1, col: c1 };
            currentMoves.push(move);

            // 遞迴計算下一步可移動的位置
            if (steps > 1) {
              const furtherMoves = getAvailableMovesRecursive(r1, c1, steps - 1, newVisited);
              nextMoves.push(...furtherMoves);
            }
          }
        }
      }
    }

    // 合併當前步和下一步的所有可移動位置
    return [...currentMoves, ...nextMoves];
  }, [size, horizontalWalls, verticalWalls, board]);

 /**
  * 計算可移動的位置
  * @returns {Move[]} 可移動的位置
  */
  const getAvailableMoves = useCallback((): Move[] => {
    if (!selectedChess) return [];
    const { row: selectedRow, col: selectedCol } = selectedChess;

    if (remainSteps === 0) return [];

    // 使用遞迴函式計算所有可能的移動位置
    return getAvailableMovesRecursive(selectedRow, selectedCol, remainSteps);
  }, [selectedChess, remainSteps, getAvailableMovesRecursive]);

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

      {/* 行座標（1-7）*/}
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
            const player: Player = board?.[rowIndex]?.[colIndex];
            const hasHorizontalWallPlayer = horizontalWalls?.[rowIndex]?.[colIndex];
            const hasVerticalWall = verticalWalls?.[rowIndex]?.[colIndex];
            const isTurn = currentPlayer === player;
            const isSelecting = selectedChess?.row === rowIndex && selectedChess?.col === colIndex;
            const isAvailableMove = availableMoves.some(move => move.row === rowIndex && move.col === colIndex);
            const territory = flattenTerritoriesObj?.[`${rowIndex},${colIndex}`];

            const cellBgMapping = {
              'A': 'bg-primary-50',
              'B': 'bg-secondary-50',
            }

            let cellBg = '';
            if (isAvailableMove) {
              cellBg = 'bg-green-100';
            } else if (territory) {
              cellBg = cellBgMapping[territory];
            } else {
              cellBg = 'bg-white';
            }

            return (
              <div
                className={`relative flex items-center justify-center ${isTurn || isAvailableMove ? 'cursor-pointer' : ''} ${cellBg}`}
                key={`${rowIndex}-${colIndex}`}
                onClick={() => onClickSelectChess(player, rowIndex, colIndex, isAvailableMove)}
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

                {/* 可選擇的牆 */}
                {isSelecting && (
                <>
                  {checkWallBuildable(rowIndex, colIndex, 'top') && (
                    <div className={`absolute top-0 z-10 h-2 w-3/4 -translate-y-1/2 cursor-pointer rounded bg-gray-700 opacity-50 hover:opacity-100`}
                        onClick={() => selectWall(rowIndex - 1, colIndex , 'top')}></div>
                  )}
                  {checkWallBuildable(rowIndex, colIndex, 'bottom') && (
                    <div className={`absolute bottom-0 z-10 h-2 w-3/4 translate-y-1/2 cursor-pointer rounded bg-gray-700 opacity-50 hover:opacity-100`}
                        onClick={() => selectWall(rowIndex, colIndex, 'bottom')}></div>
                  )}
                  {checkWallBuildable(rowIndex, colIndex, 'left') && (
                    <div className={`absolute left-0 z-10 h-3/4 w-2 -translate-x-1/2 cursor-pointer rounded bg-gray-700 opacity-50 hover:opacity-100`}
                        onClick={() => selectWall(rowIndex , colIndex - 1, 'left')}></div>
                  )}
                  {checkWallBuildable(rowIndex, colIndex, 'right') && (
                    <div
                      className={`absolute right-0 z-10 h-3/4 w-2 translate-x-1/2 cursor-pointer rounded bg-gray-700 opacity-50 hover:opacity-100`}
                      onClick={() => selectWall(rowIndex, colIndex, 'right')}
                    ></div>
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
