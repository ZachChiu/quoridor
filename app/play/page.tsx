'use client'
import { useState, useEffect, useMemo, useCallback } from "react";
import Chessboard from "../components/chessboard";
import type { Player, Direction, Move } from "@/types/chessboard.ts";

export default function Play() {
  const [size, setSize] = useState(0);
  const [board, setBoard] = useState<Player[][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('A');
  const [verticalWalls, setVerticalWalls] = useState<(null | 'A' | 'B')[][]>([]);
  const [horizontalWalls, setHorizontalWalls] = useState<(null | 'A' | 'B')[][]>([]);
  const [selectedChess, setSelectedChess] = useState<{ row: number; col: number } | null>(null);
  const [remainSteps, setRemainSteps] = useState(2);

  // 棋盤
  const mockBoard: Player[][] = useMemo(() => [
    [null, null, 'A', null, null, null, null],
    [null, null, null, null, null, 'A', null],
    [null, 'A', null,  null, 'B',null, null],
    [null, null, null, 'A', null, null, null],
    [null, 'B', null, null, null, 'B', null],
    [null, null, null, null, null, null, null],
    [null, null, 'B', null, null, null, null],
  ], []);

  // 直牆：verticalWalls[row][col] 表示 (row, col) 右側有牆，值可為 'A'、'B' 或 null
  const mockVerticalWalls: (null | 'A' | 'B')[][] = useMemo(() => [
    [null, 'A', null, null, null, 'A', null],
    [null, 'B', null, null, null, null, null],
    [null, null, null, 'A', null, null, null],
    ['B', 'B', null, null, null, null, null],
    [null, null, null, null, 'B', 'B', null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
  ], []);

  // 橫牆：horizontalWalls[row][col] 表示 (row, col) 下方有牆，值可為 'A'、'B' 或 null
  const mockHorizontalWalls: (null | 'A' | 'B')[][] = useMemo(() => [
    [null, null, null, 'B', null, null, null],
    [null, null, 'A', 'A', null, null, null],
    ['A', null, 'A', 'A', null, null, null],
    [null, 'A', null, null, null, 'B', null],
    [null, null, null, null, null, 'B', null],
    [null, 'A', null, null, null, null, null],
    [null, null, null, null, null, null, null],
  ], []);

  useEffect(() => {
    setSize(7);
    setBoard(mockBoard);
    setCurrentPlayer('B');
    setVerticalWalls(mockVerticalWalls);
    setHorizontalWalls(mockHorizontalWalls);
  }, [mockBoard, mockVerticalWalls, mockHorizontalWalls]);

  const updateBoard = () => {}

  const selectChess = (row: number, col: number) => {
    if (remainSteps < 2) {
      return;
    }
    if (row === selectedChess?.row && col === selectedChess?.col) {
      setSelectedChess(null);
      return;
    }
    setSelectedChess({ row, col });
  }

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


  /**
  * 計算可移動的位置
  * @param rowIndex - 行索引
  * @param colIndex - 列索引
  * @param player - 棋子所屬玩家
  * @param maxSteps - 最大步數
  * @returns {Move[]} 可移動的位置
  */
  const getAvailableMovesRecursive = useCallback((
    rowIndex: number,
    colIndex: number,
    player: Player,
    maxSteps: number = 100
  ): Move[] => {
    // 使用 BFS (廣度優先搜索) 來找出所有可到達的位置
    const queue: { row: number, col: number, steps: number }[] = [{ row: rowIndex, col: colIndex, steps: 0 }];
    const visited = new Set<string>();
    const moves: Move[] = [];
    
    // 標記起始位置為已訪問
    visited.add(`${rowIndex},${colIndex}`);
    
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
                moves.push({ row: r1, col: c1 });
                queue.push({ row: r1, col: c1, steps: steps + 1 });
              } else if (cellPlayer === player) {
                // 同陣營棋子，加入地盤但不能走到這個位置
                moves.push({ row: r1, col: c1 });
                queue.push({ row: r1, col: c1, steps: steps + 1 });
              }
              // 如果是敵方棋子，則不加入地盤也不繼續搜索
            }
          }
        }
      }
    }
    
    return moves;
  }, [size, horizontalWalls, verticalWalls, board]);

  /**
   * 計算指定棋子的地盤（所有可以到達的位置）
   * @param chessRow - 棋子的行索引
   * @param chessCol - 棋子的列索引
   * @param player - 棋子的所屬玩家
   * @returns {Move[]} 棋子的地盤（所有可以到達的位置）
   */
  const calculateChessTerritory = useCallback((
    chessRow: number,
    chessCol: number,
    player: Player
  ): Move[] => {
    if (player === null || !board.length) return [];
    
    // 使用 BFS 計算所有可能的移動位置，包括同陣營棋子
    const territory = getAvailableMovesRecursive(chessRow, chessCol, player);
    
    // 將棋子位置加入地盤（如果還沒加入的話）
    if (!territory.some(pos => pos.row === chessRow && pos.col === chessCol)) {
      territory.push({ row: chessRow, col: chessCol });
    }
    
    return territory;
  }, [board, getAvailableMovesRecursive]);

  /**
   * 計算所有棋子的地盤
   * @returns {{ A: Move[][], B: Move[][] }} 每個玩家的所有棋子地盤，每顆棋子一個陣列
   */
  const calculateAllTerritories = useCallback((): { A: Move[][], B: Move[][] } => {
    const territories = {
      A: [] as Move[][],
      B: [] as Move[][]
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

  console.dir(calculateAllTerritories());
  // console.dir(calculateChessTerritory(4,5,'B'));
  // console.dir(calculateChessTerritory(0,2,'A'));

  return (
    <div className="flex min-h-screen items-center justify-center gap-16 overflow-hidden font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-1 items-center justify-center gap-8 px-5">
        <div className="fixed left-5 flex flex-col gap-2 rounded-md border-2 p-2">
          <div className={`size-5 rounded-full bg-primary ${currentPlayer === 'A' ? 'animate-breathe' : ''}`}></div>
          <div className={`size-5 rounded-full bg-secondary ${currentPlayer === 'B' ? 'animate-breathe' : ''}`}></div>
        </div>
        <div className="chessboard-container size-[90dvw] md:size-[90dvh]">
          <Chessboard
            size={size}
            board={board}
            verticalWalls={verticalWalls}
            horizontalWalls={horizontalWalls}
            currentPlayer={currentPlayer}
            selectedChess={selectedChess}
            remainSteps={remainSteps}
            updateBoard={updateBoard}
            selectChess={selectChess}
            selectWall={selectWall}
            selectCell={selectCell}
          ></Chessboard>
        </div>
      </main>
    </div>
  );
}