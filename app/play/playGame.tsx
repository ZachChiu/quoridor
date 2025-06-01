'use client'
import { useState, useEffect, useMemo, useCallback } from "react";
import Chessboard from "../components/chessboard";
import SectionShadow from "../components/sectionShadow";
import ChampionModal from "../components/championModal";

import type { Player, Direction } from "@/types/chessboard.ts";
import flatten from 'lodash-es/flatten';
import uniq from 'lodash-es/uniq';

export default function PlayGame() {const [size, setSize] = useState(0);
  const [board, setBoard] = useState<Player[][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('A');
  const [verticalWalls, setVerticalWalls] = useState<(null | 'A' | 'B')[][]>([]);
  const [horizontalWalls, setHorizontalWalls] = useState<(null | 'A' | 'B')[][]>([]);
  const [selectedChess, setSelectedChess] = useState<{ row: number; col: number } | null>(null);
  const [remainSteps, setRemainSteps] = useState(2);
  // const [territories, setTerritories] = useState<{ A: string[][]; B: string[][] }>({
  //   A: [],
  //   B: []
  // });
  const [uniqTerritories, setUniqTerritories] = useState<{ A: string[]; B: string[] }>({
    A: [],
    B: []
  });
  const [flattenTerritoriesObj, setFlattenTerritoriesObj] = useState<Record<string, Player>>({});
  const [winingStatus, setWiningStatus] = useState<Player | null | 'draw'>(null);
  const [openingStep, setOpeningStep] = useState<Player[]>(['A', 'B', 'B', 'A']);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isPlacingChess = useMemo(() => !!openingStep.length ,[openingStep])
  const isLock = useMemo(() => !!winingStatus, [winingStatus]);

  // window.onbeforeunload = function(){
  //   if (!confirm('遊戲尚未結束，確定要離開嗎？')) {
  //     return '按一下「取消」停留在此頁';
  //   }
  // };

  // 棋盤
  const templateBoard: Player[][] = useMemo(() => [
    [null, null, null, null, null, null, null],
    [null, 'A', null, null, null, 'B', null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, 'B', null, null, null, 'A', null],
    [null, null, null, null, null, null, null],
  ], []);

  // 直牆：verticalWalls[row][col] 表示 (row, col) 右側有牆，值可為 'A'、'B' 或 null
  const templateVerticalWalls: (null | 'A' | 'B')[][] = useMemo(() => [
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
  ], []);

  // 橫牆：horizontalWalls[row][col] 表示 (row, col) 下方有牆，值可為 'A'、'B' 或 null
  const templateHorizontalWalls: (null | 'A' | 'B')[][] = useMemo(() => [
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
  ], []);

  useEffect(() => {
    setSize(7);
    setBoard(templateBoard);
    setCurrentPlayer(openingStep[0] || 'A' as Player);
    setVerticalWalls(templateVerticalWalls);
    setHorizontalWalls(templateHorizontalWalls);
  }, [templateBoard, templateVerticalWalls, templateHorizontalWalls, openingStep]);

  const selectChess = useCallback((row: number, col: number) => {
    if (remainSteps < 2) {
      return;
    }
    if (row === selectedChess?.row && col === selectedChess?.col) {
      setSelectedChess(null);
      return;
    }
    setSelectedChess({ row, col });
  }, [selectedChess, remainSteps]);

  const selectWall = useCallback((row: number, col: number, direction: Direction) => {
    switch (direction) {
      case 'top':
      case 'bottom':
        setHorizontalWalls((prev) => {
          const newWalls = [...prev];
          newWalls[row][col] = currentPlayer;
          return newWalls;
        });
        break;
      case 'left':
      case 'right':
        setVerticalWalls((prev) => {
          const newWalls = [...prev];
          newWalls[row][col] = currentPlayer;
          return newWalls;
        });
        break;
    }
    setCurrentPlayer(currentPlayer === 'A' ? 'B' : 'A');
    setRemainSteps(2);
    setSelectedChess(null);
  }, [currentPlayer, setHorizontalWalls, setVerticalWalls]);

  const selectCell = useCallback((row: number, col: number) => {
    if (!selectedChess) return;
    setSelectedChess({ row, col });
    const gap = remainSteps - (Math.abs((selectedChess.row) - row) + Math.abs((selectedChess.col) - col));
    setRemainSteps(gap);

    setBoard((prev) => {
      const newBoard = [...prev];
      newBoard[selectedChess.row][selectedChess.col] = null;
      newBoard[row][col] = currentPlayer;
      return newBoard;
    });
  }, [selectedChess, currentPlayer, remainSteps, setSelectedChess, setBoard]);

  const setChessPosition = useCallback((row: number, col: number) => {
    setBoard((prev) => {
      const newBoard = [...prev];
      newBoard[row][col] = currentPlayer;
      return newBoard;
    });
    const newOpeningStep = [...openingStep];
    newOpeningStep.shift()
    setOpeningStep(newOpeningStep);

    setCurrentPlayer(newOpeningStep[0] || 'A');
  }, [currentPlayer, setBoard, openingStep, setCurrentPlayer]);

  /**
  * 計算可移動的位置
  * @param rowIndex - 行索引
  * @param colIndex - 列索引
  * @param player - 棋子所屬玩家
  * @param maxSteps - 最大步數
  * @returns {Move[]} 可移動的位置
  */
  const getTerritories = useCallback((
    rowIndex: number,
    colIndex: number,
    player: Player,
    maxSteps: number = 50
  ): { moves: string[], hasEnemy: boolean } => {
    // 使用 BFS (廣度優先搜索) 來找出所有可到達的位置
    const queue: { row: number, col: number, steps: number }[] = [{ row: rowIndex, col: colIndex, steps: 0 }];
    const visited = new Set<string>();
    const moves: string[] = [];
    let hasEnemy = false;

    // 將起始棋子的位置加入到 moves 陣列中
    const startPosKey = `${rowIndex},${colIndex}`;
    moves.push(startPosKey);

    // 標記起始位置為已訪問
    visited.add(startPosKey);

    while (queue.length > 0) {
      const { row, col, steps } = queue.shift()!;

      // 如果已經達到最大步數，則停止
      if (steps >= maxSteps) continue;

      // 檢查四個方向
      const directions = [
        { dr: -1, dc: 0 }, // 上
        { dr: 0, dc: 1 },  // 右
        { dr: 1, dc: 0 },  // 下
        { dr: 0, dc: -1 }  // 左
      ];

      for (const { dr, dc } of directions) {
        const r1 = row + dr;
        const c1 = col + dc;

        // 檢查是否在棋盤範圍內
        if (r1 >= 0 && r1 < size && c1 >= 0 && c1 < size) {
          // 檢查是否有牆擋住
          let hasWall = false;

          // 檢查水平牆
          if (dr === 1 && horizontalWalls[row][col]) {
            hasWall = true;
          } else if (dr === -1 && row > 0 && horizontalWalls[row - 1][col]) {
            hasWall = true;
          }

          // 檢查垂直牆
          if (dc === 1 && verticalWalls[row][col]) {
            hasWall = true;
          } else if (dc === -1 && col > 0 && verticalWalls[row][col - 1]) {
            hasWall = true;
          }

          // 如果沒有牆且位置未訪問過
          if (!hasWall) {
            const posKey = `${r1},${c1}`;

            if (!visited.has(posKey)) {
              visited.add(posKey);

              // 檢查該位置是否有棋子
              const cellPlayer = board[r1][c1];

              if (cellPlayer === null) {
                // 空格，可以移動
                moves.push(posKey);
                queue.push({ row: r1, col: c1, steps: steps + 1 });
              } else if (cellPlayer === player) {
                // 同陣營棋子，加入地盤但不能走到這個位置
                moves.push(posKey);
                queue.push({ row: r1, col: c1, steps: steps + 1 });
              } else {
                // 敵方棋子，設置標誌
                hasEnemy = true;
                break;
              }
            }
          }
        }
      }

      if (hasEnemy) break;
    }

    return { moves, hasEnemy };
  }, [size, horizontalWalls, verticalWalls, board]);

  // 在 calculateChessTerritory 函數中
  const calculateChessTerritory = useCallback((
    chessRow: number,
    chessCol: number,
    player: Player
  ): string[] => {
    if (player === null || !board.length) return [];

    // 使用 BFS 計算所有可能的移動位置，包括同陣營棋子
    const { moves, hasEnemy } = getTerritories(chessRow, chessCol, player);

    // 如果遇到敵方棋子，返回空陣列
    if (hasEnemy) {
      return [];
    }

    return moves;
  }, [board, getTerritories]);

  /**
   * 計算所有棋子的地盤
   * @returns {{ A: Move[][], B: Move[][] }} 每個玩家的所有棋子地盤，每顆棋子一個陣列
   */
  const calculateAllTerritories = useCallback((): { A: string[][], B: string[][] } => {
    const territories = {
      A: [] as string[][],
      B: [] as string[][]
    };

    // 遍歷棋盤上的每個位置
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const player = board[row][col];
        if (player) {
          // 計算該棋子的地盤
          const territory = calculateChessTerritory(row, col, player);

          // 將地盤加入到對應玩家的地盤列表中，每顆棋子一個陣列
          territories[player].push(territory);
        }
      }
    }

    return territories;
  }, [board, size, calculateChessTerritory]);

  /**
   * 當玩家改變時，重新計算地盤
   */
  useEffect(() => {
    const calculatedTerritories: { A: string[][]; B: string[][] } = calculateAllTerritories();

    const newFlattenTerritoriesObj: Record<string, Player> = {};
    const newUniqTerritories: { A: string[]; B: string[] } = {
      A: [],
      B: []
    };

    const keys = Object.keys(calculatedTerritories);
    keys.forEach(key => {
      const flattenTerritories = flatten(calculatedTerritories[key as 'A' | 'B']);
      newUniqTerritories[key as 'A' | 'B'] = uniq(flattenTerritories);
      flattenTerritories.forEach(posKey => {
        newFlattenTerritoriesObj[posKey] = key as 'A' | 'B';
      });
    });

    const isGameOver = keys.every(key => calculatedTerritories[key as 'A' | 'B'].length !== 0 && calculatedTerritories[key as 'A' | 'B'].every(arr => arr.length !== 0));
    if (isGameOver) {
      setIsModalOpen(true);
      if (newUniqTerritories['A'].length > newUniqTerritories['B'].length) {
        setWiningStatus('A');
      } else if (newUniqTerritories['A'].length < newUniqTerritories['B'].length) {
        setWiningStatus('B');
      } else if (newUniqTerritories['A'].length === newUniqTerritories['B'].length) {
        setWiningStatus('draw');
      }
    }

    setUniqTerritories(newUniqTerritories);
    setFlattenTerritoriesObj(newFlattenTerritoriesObj);
    // setTerritories(calculatedTerritories);
  }, [currentPlayer, calculateAllTerritories]);

  // 重新開始遊戲
  const restartGame = useCallback(() => {
    setSize(7);
    setBoard(templateBoard);
    setCurrentPlayer(openingStep[0] as Player);
    setVerticalWalls(templateVerticalWalls);
    setHorizontalWalls(templateHorizontalWalls);
    setSelectedChess(null);
    setRemainSteps(2);
    setWiningStatus(null);
    setOpeningStep(['A', 'B', 'B', 'A']);
    setIsModalOpen(false);
  }, [templateBoard, templateVerticalWalls, templateHorizontalWalls, openingStep]);

  // 當用戶嘗試離開頁面且遊戲尚未結束時顯示確認對話框
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (winingStatus === null) {
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [winingStatus]);

  const tipText = useMemo(() => {
    if (isPlacingChess) {
      return (
        <>請{<div className={`animate-pulse-shine inline-block size-6 rounded-full bg-primary ${currentPlayer === 'A' ? 'bg-primary' : 'bg-secondary'}`}></div>}放置棋子</>
      );
    } else if (winingStatus) {
      return (
        <>{winingStatus === 'draw' ? '遊戲結束！' : `遊戲結束！${winingStatus === 'A' ? '紅方勝利！' : '藍方勝利！'}`}</>
      );
    } else {
      return (
        <>請{<div className={`animate-pulse-shine inline-block size-6 rounded-full bg-primary ${currentPlayer === 'A' ? 'bg-primary' : 'bg-secondary'}`}></div>}移動棋子</>
      );
    }
  }, [isPlacingChess, currentPlayer, winingStatus]);
  return (
    <>
      {/* 賽況面板 */}
      <div className="fixed left-5 top-5 md:top-[5dvh]">
        <SectionShadow>
          <div className="relative flex size-full flex-col gap-3 rounded-xl border-2 border-gray-900 bg-white p-3">
            <div className="flex items-center gap-3">
              <div className={`size-6 rounded-full bg-primary ${!isLock &&currentPlayer === 'A' ? 'animate-pulse-shine' : ''}`}></div>
              <span className="text-md">已佔領：{uniqTerritories['A']?.length || 0}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`size-6 rounded-full bg-secondary ${!isLock &&currentPlayer === 'B' ? 'animate-pulse-shine' : ''}`}></div>
              <span className="text-md">已佔領：{uniqTerritories['B']?.length || 0}</span>
            </div>
          </div>
        </SectionShadow>
      </div>

      {/* 提示面板 */}
      {
        tipText && <div className="fixed bottom-5 right-5 md:bottom-auto md:left-5 md:right-auto md:top-40">
          <SectionShadow>
            <div className="relative flex size-full flex-col gap-3 rounded-xl border-2 border-gray-900 bg-white p-3">
              <div className="flex items-center gap-3">
                <span className="text-md flex items-center gap-1">
                  { tipText }
                </span>
              </div>
            </div>
          </SectionShadow>
        </div>
      }

      <div className="chessboard-container size-[90dvw] md:size-[90dvh]">
        <Chessboard
          size={size}
          board={board}
          verticalWalls={verticalWalls}
          horizontalWalls={horizontalWalls}
          currentPlayer={currentPlayer}
          selectedChess={selectedChess}
          remainSteps={remainSteps}
          flattenTerritoriesObj={flattenTerritoriesObj}
          isLock={isLock}
          isPlacingChess={isPlacingChess}
          selectChess={selectChess}
          selectWall={selectWall}
          selectCell={selectCell}
          setChessPosition={setChessPosition}
        ></Chessboard>
      </div>

      {/* 冠軍訊息 Modal */}
      <ChampionModal
        winner={winingStatus}
        uniqTerritories={uniqTerritories}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRestart={restartGame}
      />
    </>
  );
}
