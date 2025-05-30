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