"use client";

import type { Player, Move, Direction } from "@/types/chessboard.ts";
import { GiHammerBreak } from "react-icons/gi";

/**
 * 玩家色以 CSS 變數取用，而不是 `bg-player-${player}` 這種動態拼接的 class。
 * Tailwind 的靜態掃描看不到拼接出來的字串，safelist 又容易漏 ——
 * 走變數就完全沒有這個問題。
 */
const PLAYER_VAR: Record<string, string> = {
  A: 'var(--player-A)',
  B: 'var(--player-B)',
  C: 'var(--player-C)',
};
import React, { useCallback, useMemo } from "react";
import SectionShadow from "./SectionShadow";

type Props = {
  size: number;
  board: Player[][];
  currentPlayer: Player;
  verticalWalls: Player[][];
  horizontalWalls: Player[][];
  selectedChess: Move | null;
  remainSteps: number;
  flattenTerritoriesObj: Record<string, Player>;
  isLock: boolean;
  isPlacingChess: boolean;
  breakWallCountObj: Record<Exclude<Player, null>, number>;
  isBreakWallAvailable: boolean;
  selectChess: (row: number, col: number) => void;
  selectWall: (row: number, col: number, direction: Direction) => void;
  selectCell: (row: number, col: number) => void;
  setChessPosition: (row: number, col: number) => void;
  onClickBreakWall: (row: number, col: number, direction: 'horizontal' | 'vertical') => void;
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
  isPlacingChess,
  selectChess,
  selectWall,
  selectCell,
  setChessPosition,
  breakWallCountObj,
  isBreakWallAvailable,
  onClickBreakWall,
}: Props) {
  // const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const breakWallCount = breakWallCountObj?.[currentPlayer as Exclude<Player, null>];

  const onClickSelectChess = (selectedPlayer: Player, row: number, col: number, isAvailableMove: boolean) => {
    if (!selectedPlayer && isPlacingChess) {
      setChessPosition(row, col);
    } else if (selectedPlayer === currentPlayer && !isPlacingChess) {
      selectChess(row, col);
    } else if (isAvailableMove && !isPlacingChess) {
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
  /**
   * 目前選中棋子的所有可移動位置。
   *
   * 原本是 useState + useEffect：除了每次多跑一輪 render，還會讓高亮慢一幀 ——
   * 點下棋子的那一幀會先畫出沒有落點的盤面，下一幀才補上。改成 useMemo 之後
   * 與選取同一幀完成。
   */
  const availableMoves = useMemo<Move[]>(() => {
    if (!selectedChess || remainSteps === 0) return [];
    return getAvailableMovesRecursive(selectedChess.row, selectedChess.col, remainSteps);
  }, [selectedChess, remainSteps, getAvailableMovesRecursive]);

  return (
    <div className="relative size-full">
      {/* 列座標（A-H）*/}
      {/* <div className="absolute -bottom-5 left-0 flex w-full">
        {Array.from({ length: size }, (_, i) => (
          <div
            className="flex-1 text-center text-xs"
            key={`col-label-${i}`}
          >
            {letters[i]}
          </div>
        ))}
      </div> */}

      {/* 行座標（1-7）*/}
      {/* <div className="absolute -left-5 top-0 flex h-full flex-col justify-center">
        {Array.from({ length: size }, (_, i) => (
          <div
            className="flex h-full items-center justify-center text-xs"
            style={{ height: `${100 / size}%` }}
            key={`row-label-${i}`}
          >
            {size - i}
          </div>
        ))}
      </div> */}

      <SectionShadow>
        {/* 棋盤。
            外圍那圈 9px 的深褐是「牆」不是裝飾邊框 —— 規則裡棋盤的外緣本身
            就算一道牆，之前它在畫面上完全不存在，格線直接切掉。厚度取 9px
            與盤內的牆一致，不是隨便挑的邊框寬度。
            順帶讓棋盤終於像一個物件：原本格線切邊，看起來像沒畫完。
            厚度用百分比不用 px —— 棋盤是 90dvw / 90dvh，尺寸會跟著視窗變，
            寫死 9px 在手機上比例會變成桌機的兩倍粗。1.25% 在 720px 時正好是 9px。 */}
        <div className="relative size-full rounded-[1.4rem] bg-board-line p-[1.25%]">
        {/* 欄數走 inline style 而不是 `grid-cols-${size}`：
            動態拼出來的 class 名稱 Tailwind 的靜態掃描看不到，之前是靠 safelist
            列舉 7/8/9 撐著 —— 盤面大小一旦改成別的值就會靜默壞掉。
            TutorialBoard 本來就是這樣寫的，兩邊統一。 */}
        <div
          className="grid size-full gap-[var(--board-gap)] overflow-hidden rounded-xl bg-board-line"
          style={
            {
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              // 格縫寬度。牆的位移由它算出來（見下方 WALL_* 常數）——
              // 兩個值必須連動，分開寫死遲早會漂掉。
              '--board-gap': '4px',
            } as React.CSSProperties
          }
        >
          {Array.from({ length: size }, (_, rowIndex) =>
            Array.from({ length: size }, (_, colIndex) => {
              const cellPlayer: Player = board?.[rowIndex]?.[colIndex];
              const hasHorizontalWallPlayer = horizontalWalls?.[rowIndex]?.[colIndex];
              const hasVerticalWall = verticalWalls?.[rowIndex]?.[colIndex];
              const isTurn = currentPlayer === cellPlayer;
              const isSelecting = selectedChess?.row === rowIndex && selectedChess?.col === colIndex;
              const isAvailableMove = availableMoves.some(move => move.row === rowIndex && move.col === colIndex);
              const territory = flattenTerritoriesObj?.[`${rowIndex},${colIndex}`];

              const cellBgMapping = {
                'A': 'bg-player-A-50',
                'B': 'bg-player-B-50',
                'C': 'bg-player-C-50',
              }

              const cellClass = [];
              if (isPlacingChess) {
                cellClass.push('bg-primary-50');
              } else if (territory) {
                cellClass.push(cellBgMapping[territory]);
              } else {
                cellClass.push('bg-primary-50');
              }

              if (!isLock && (isPlacingChess && !cellPlayer)) {
                cellClass.push('cursor-pointer');
              } else if (!isLock && !isPlacingChess && (isTurn || isAvailableMove)) {
                cellClass.push('cursor-pointer');
              }

              const isPieceActive =
                isSelecting || (!selectedChess && isTurn && !isLock && !isPlacingChess);

              // 在每一格內
              let isHorizontalWallBreakable = false;
              let isVerticalWallBreakable = false;

              if (isBreakWallAvailable && breakWallCount > 0 && selectedChess) {
                // 下方橫牆（自己這格 or 上面那格）
                if (
                  (rowIndex === selectedChess.row && colIndex === selectedChess.col) ||
                  (rowIndex === selectedChess.row - 1 && colIndex === selectedChess.col)
                ) {
                  isHorizontalWallBreakable = true;
                }
                // 右側直牆（自己這格 or 左邊那格）
                if (
                  (rowIndex === selectedChess.row && colIndex === selectedChess.col) ||
                  (rowIndex === selectedChess.row && colIndex === selectedChess.col - 1)
                ) {
                  isVerticalWallBreakable = true;
                }
              }

              return (
                <div
                  className={`group relative flex items-center justify-center ${
                    isSelecting ? 'z-10 ring ring-inset ring-tile-ink' : ''
                  } ${cellClass.join(' ')}`}
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => onClickSelectChess(cellPlayer, rowIndex, colIndex, isAvailableMove)}
                >
                  {/* 選取中的格子。
                      原本是深墨外框，但框線和築牆預覽佔在同一條邊上互相搶 ——
                      框一重，45% 的預覽就被壓掉了。改成整格微染玩家色：
                      標示得出「選的是這格」，邊線則完全讓給預覽。 */}
                  {isSelecting && currentPlayer && (
                    <div
                      className="pointer-events-none absolute inset-0 opacity-[0.16]"
                      style={{ backgroundColor: PLAYER_VAR[currentPlayer] }}
                    />
                  )}

                  {/* 棋子 */}
                  {cellPlayer && (
                    <div
                      className={`absolute z-20 size-3/5 rounded-full ${isPieceActive ? 'animate-pulse-shine' : ''}`}
                      style={{ backgroundColor: PLAYER_VAR[cellPlayer] }}
                    />
                  )}

                  {/* 放置時的預覽棋子 */}
                  {!cellPlayer && isPlacingChess && currentPlayer && (
                    <div
                      className="absolute z-20 hidden size-3/5 rounded-full opacity-55 group-hover:block"
                      style={{ backgroundColor: PLAYER_VAR[currentPlayer] }}
                    />
                  )}

                  {/* 可移動的落點。
                      原本是整格染成淡綠，但淡色疊在奶油格上很弱，
                      而且會跟領地底色打架。改成置中的圓點 —— 不吃底色，
                      也不會跟「這格屬於誰」的資訊互相干擾。 */}
                  {isAvailableMove && !cellPlayer && (
                    <div className="absolute z-10 size-1/4 rounded-full bg-tile-ink/30 transition-colors group-hover:bg-tile-ink/55" />
                  )}

                  {/* 開局可放置的位置。
                      原本開局是一整面空棋盤，只有把游標移到某格才會冒出半透明棋子 ——
                      等於要先猜對地方才知道那裡能放。改成所有可放的格子一開始就點上灰點，
                      與對局中的「可移動落點」用同一個記號，學一次就通用。
                      條件刻意與上面 cursor-pointer 那條一字不差：能點的就有點，
                      兩者分開寫遲早會不一致。游標移上去時讓位給預覽棋子。 */}
                  {!isLock && isPlacingChess && !cellPlayer && (
                    <div className="absolute z-10 size-1/4 rounded-full bg-tile-ink/20 transition-opacity group-hover:opacity-0" />
                  )}

                  {/*
                    牆。
                    格縫是 4px 的深墨線，牆原本也是 4px 且畫在同一個位置 ——
                    一道牆和一條空格線的差別只有顏色，盤面一複雜就難掃視。
                    改成 9px、兩端圓角、並向左右各突出 3px：牆因此比格線厚、
                    也蓋過交叉點，讀起來是「放上去的東西」而不是「被上色的格線」。
                  */}
                  {hasHorizontalWallPlayer && (
                    <div
                      className="absolute inset-x-[-3px] bottom-[calc(var(--board-gap)*-0.5)] z-20 h-[9px] translate-y-1/2 rounded-full"
                      style={{ backgroundColor: PLAYER_VAR[hasHorizontalWallPlayer] }}
                    >
                      {isHorizontalWallBreakable && (
                        <button
                          type="button"
                          aria-label="破壞下方的牆"
                          className="animate-shine absolute left-1/2 top-1/2 z-30 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-tile-ink text-sm text-tile-cream ring-2 ring-primary-50"
                          onClick={(e) => { e.stopPropagation(); onClickBreakWall(rowIndex, colIndex, 'horizontal'); }}
                        >
                          <GiHammerBreak />
                        </button>
                      )}
                    </div>
                  )}
                  {hasVerticalWall && (
                    <div
                      className="absolute inset-y-[-3px] right-[calc(var(--board-gap)*-0.5)] z-20 w-[9px] translate-x-1/2 rounded-full"
                      style={{ backgroundColor: PLAYER_VAR[hasVerticalWall] }}
                    >
                      {isVerticalWallBreakable && (
                        <button
                          type="button"
                          aria-label="破壞右方的牆"
                          className="animate-shine absolute left-1/2 top-1/2 z-30 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-tile-ink text-sm text-tile-cream ring-2 ring-primary-50"
                          onClick={(e) => { e.stopPropagation(); onClickBreakWall(rowIndex, colIndex, 'vertical'); }}
                        >
                          <GiHammerBreak />
                        </button>
                      )}
                    </div>
                  )}

                  {/*
                    可築牆的位置。
                    原本是灰色半透明的方條 —— 灰色在奶油底上發濁，而且跟「真的牆」
                    是同一種形狀，差別只有深淺。改成當前玩家色的半透明預覽，
                    形狀與尺寸都跟築好之後一模一樣：看到的就是會得到的。
                  */}
                  {isSelecting && currentPlayer && (
                    <>
                      {checkWallBuildable(rowIndex, colIndex, 'top') && (
                        <button
                          type="button"
                          aria-label="在上方築牆"
                          className="absolute inset-x-[18%] top-[calc(var(--board-gap)*-0.5)] z-20 h-[9px] -translate-y-1/2 rounded-full opacity-70 transition hover:inset-x-[-3px] hover:opacity-100"
                          style={{ backgroundColor: PLAYER_VAR[currentPlayer] }}
                          onClick={(e) => { e.stopPropagation(); selectWall(rowIndex - 1, colIndex, 'top'); }}
                        />
                      )}
                      {checkWallBuildable(rowIndex, colIndex, 'bottom') && (
                        <button
                          type="button"
                          aria-label="在下方築牆"
                          className="absolute inset-x-[18%] bottom-[calc(var(--board-gap)*-0.5)] z-20 h-[9px] translate-y-1/2 rounded-full opacity-70 transition hover:inset-x-[-3px] hover:opacity-100"
                          style={{ backgroundColor: PLAYER_VAR[currentPlayer] }}
                          onClick={(e) => { e.stopPropagation(); selectWall(rowIndex, colIndex, 'bottom'); }}
                        />
                      )}
                      {checkWallBuildable(rowIndex, colIndex, 'left') && (
                        <button
                          type="button"
                          aria-label="在左方築牆"
                          className="absolute inset-y-[18%] left-[calc(var(--board-gap)*-0.5)] z-20 w-[9px] -translate-x-1/2 rounded-full opacity-70 transition hover:inset-y-[-3px] hover:opacity-100"
                          style={{ backgroundColor: PLAYER_VAR[currentPlayer] }}
                          onClick={(e) => { e.stopPropagation(); selectWall(rowIndex, colIndex - 1, 'left'); }}
                        />
                      )}
                      {checkWallBuildable(rowIndex, colIndex, 'right') && (
                        <button
                          type="button"
                          aria-label="在右方築牆"
                          className="absolute inset-y-[18%] right-[calc(var(--board-gap)*-0.5)] z-20 w-[9px] translate-x-1/2 rounded-full opacity-70 transition hover:inset-y-[-3px] hover:opacity-100"
                          style={{ backgroundColor: PLAYER_VAR[currentPlayer] }}
                          onClick={(e) => { e.stopPropagation(); selectWall(rowIndex, colIndex, 'right'); }}
                        />
                      )}
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
        </div>
      </SectionShadow>
    </div>
  );
});
