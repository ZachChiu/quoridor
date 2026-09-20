'use client';
import React, { useMemo } from 'react';
import { ownerByCellFor } from '@/game/territory';
import type { Player } from '@/game/types';

/**
 * 教學用的小棋盤。
 *
 * 刻意重畫一份而不是複用 `Chessboard`：那個元件綁著整局的狀態
 * （選取、合法手、回合、破牆次數…），教學只需要「畫出一個靜態盤面」。
 * 硬要複用就得替它造一份假的對局狀態，比重畫還脆弱。
 *
 * 視覺語彙必須與真正的棋盤一致 —— 同樣的深褐格線、奶油格子、
 * 9px 圓端的牆、灰色可達點。教學裡看到的形狀，進遊戲要認得出來。
 */
export type TPlayer = 'A' | 'B' | 'C';
type Cell = [row: number, col: number];

const PLAYER_VAR: Record<TPlayer, string> = {
  A: 'var(--player-A)',
  B: 'var(--player-B)',
  C: 'var(--player-C)',
};

export interface TutorialBoardProps {
  size?: number;
  /** 棋子 */
  pieces?: { at: Cell; player: TPlayer }[];
  /** 橫牆：畫在該格的下緣 */
  hWalls?: { at: Cell; player: TPlayer }[];
  /** 直牆：畫在該格的右緣 */
  vWalls?: { at: Cell; player: TPlayer }[];
  /** 可移動的落點（灰色圓點） */
  dots?: Cell[];
  /** 可築牆的預覽 */
  ghosts?: { at: Cell; side: 'top' | 'bottom' | 'left' | 'right'; player: TPlayer }[];
  /** 選取中的格子（底色微染） */
  selected?: { at: Cell; player: TPlayer };
}

const key = ([r, c]: Cell) => `${r},${c}`;

export default function TutorialBoard({
  size = 4, pieces = [], hWalls = [], vWalls = [], dots = [], ghosts = [], selected,
}: TutorialBoardProps) {
  const pieceMap = new Map(pieces.map((p) => [key(p.at), p.player]));
  const hMap = new Map(hWalls.map((w) => [key(w.at), w.player]));
  const vMap = new Map(vWalls.map((w) => [key(w.at), w.player]));
  const dotSet = new Set(dots.map(key));

  /*
    領地**由規則算出來**，不是手寫座標。

    原本是在每一步的資料裡手填 territory，結果第 7 步畫成紅 5 : 藍 3，
    但依規則實際是 8:8 的平局 —— 手寫的圖跟它想教的規則對不上，
    那比沒有圖更糟。改成用 engine 的同一份掃描函式推導。
  */
  const terrMap = useMemo(() => {
    const board: Player[][] = Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => pieceMap.get(`${r},${c}`) ?? null)
    );
    const blank = () => Array.from({ length: size }, () => Array<Player>(size).fill(null));
    const horizontalWalls = blank();
    const verticalWalls = blank();
    for (const w of hWalls) horizontalWalls[w.at[0]][w.at[1]] = w.player;
    for (const w of vWalls) verticalWalls[w.at[0]][w.at[1]] = w.player;
    return new Map(Object.entries(ownerByCellFor(board, { horizontalWalls, verticalWalls })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, pieces, hWalls, vWalls]);
  const selKey = selected ? key(selected.at) : null;

  const TERR: Record<TPlayer, string> = {
    A: 'bg-player-A-50', B: 'bg-player-B-50', C: 'bg-player-C-50',
  };

  return (
    <div
      className="grid aspect-square w-full gap-[var(--board-gap)] overflow-hidden rounded-xl bg-board-line"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, '--board-gap': '3px' } as React.CSSProperties}
      aria-hidden="true"
    >
      {Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => {
          const k = `${r},${c}`;
          const piece = pieceMap.get(k);
          const terr = terrMap.get(k);
          const h = hMap.get(k);
          const v = vMap.get(k);
          const sideGhosts = ghosts.filter((g) => key(g.at) === k);

          return (
            <div key={k} className={`relative flex items-center justify-center ${terr ? TERR[terr] : 'bg-primary-50'}`}>
              {selKey === k && (
                <div className="absolute inset-0 opacity-[0.16]" style={{ backgroundColor: PLAYER_VAR[selected!.player] }} />
              )}
              {piece && (
                <div className="absolute z-20 size-3/5 rounded-full" style={{ backgroundColor: PLAYER_VAR[piece] }} />
              )}
              {dotSet.has(k) && !piece && (
                <div className="absolute z-10 size-1/4 rounded-full bg-tile-ink/30" />
              )}
              {h && (
                <div className="absolute inset-x-[-2px] bottom-[calc(var(--board-gap)*-0.5)] z-20 h-[7px] translate-y-1/2 rounded-full"
                     style={{ backgroundColor: PLAYER_VAR[h] }} />
              )}
              {v && (
                <div className="absolute inset-y-[-2px] right-[calc(var(--board-gap)*-0.5)] z-20 w-[7px] translate-x-1/2 rounded-full"
                     style={{ backgroundColor: PLAYER_VAR[v] }} />
              )}
              {sideGhosts.map((g) => (
                <div
                  key={g.side}
                  className={`absolute z-20 rounded-full opacity-75 ${
                    g.side === 'top' ? 'inset-x-[-2px] top-[calc(var(--board-gap)*-0.5)] h-[7px] -translate-y-1/2'
                    : g.side === 'bottom' ? 'inset-x-[-2px] bottom-[calc(var(--board-gap)*-0.5)] h-[7px] translate-y-1/2'
                    : g.side === 'left' ? 'inset-y-[-2px] left-[calc(var(--board-gap)*-0.5)] w-[7px] -translate-x-1/2'
                    : 'inset-y-[-2px] right-[calc(var(--board-gap)*-0.5)] w-[7px] translate-x-1/2'
                  }`}
                  style={{ backgroundColor: PLAYER_VAR[g.player] }}
                />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
