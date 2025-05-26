'use client'
import { useState, useEffect, useMemo } from "react";
import Chessboard from "../components/chessboard";
import type { Player } from "@/types/chessboard.ts";

export default function Play() {
  const [size, setSize] = useState(0);
  const [board, setBoard] = useState<Player[][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('A');
  const [verticalWalls, setVerticalWalls] = useState<(null | 'A' | 'B')[][]>([]);
  const [horizontalWalls, setHorizontalWalls] = useState<(null | 'A' | 'B')[][]>([]);

  // 棋盤
  const mockBoard: Player[][] = useMemo(() => [
    [null, null, 'A', null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, 'B', null, null, null, null],
  ], []);

  // 直牆：verticalWalls[row][col] 表示 (col, row) 右側有牆，值可為 'A'、'B' 或 null
  const mockVerticalWalls: (null | 'A' | 'B')[][] = useMemo(() => [
    [null, null, null, null, null, 'A', null],
    [null, 'B', null, null, null, null, null],
    [null, null, null, null, 'A', null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, 'B', null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
  ], []);

  // 橫牆：horizontalWalls[row][col] 表示 (col, row) 下方有牆，值可為 'A'、'B' 或 null
  const mockHorizontalWalls: (null | 'A' | 'B')[][] = useMemo(() => [
    [null, null, null, 'B', null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, 'A', null, null, null, null],
    [null, null, null, null, null, 'B', null],
    [null, null, null, null, null, null, null],
    [null, 'A', null, null, null, null, null],
    [null, null, null, null, null, null, null],
  ], []);

  useEffect(() => {
    setSize(7);
    setBoard(mockBoard);
    setCurrentPlayer('A');
    setVerticalWalls(mockVerticalWalls);
    setHorizontalWalls(mockHorizontalWalls);
  }, [mockBoard, mockVerticalWalls, mockHorizontalWalls]);

  return (
    <div className="flex min-h-screen items-center justify-center gap-16 overflow-hidden font-[family-name:var(--font-geist-sans)]">
      <main className="flex h-full flex-1 items-center justify-between gap-8 px-5">
        <div className="flex flex-col gap-2  rounded-md border-2 p-2">
          <div className="size-5 rounded-full bg-primary">

          </div>
          <div className="size-5 rounded-full bg-secondary">

          </div>
        </div>
        <Chessboard
          size={size}
          walls={walls}
          board={board}
          verticalWalls={verticalWalls}
          horizontalWalls={horizontalWalls}
          currentPlayer={currentPlayer}
        ></Chessboard>
      </main>
    </div>
  );
}