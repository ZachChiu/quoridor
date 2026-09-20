import React from 'react';

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
  /** 已成立的領地（淺色底） */
  territory?: { at: Cell; player: TPlayer }[];
  /** 可移動的落點（灰色圓點） */
  dots?: Cell[];
  /** 可築牆的預覽 */
  ghosts?: { at: Cell; side: 'top' | 'bottom' | 'left' | 'right'; player: TPlayer }[];
  /** 選取中的格子（底色微染） */
  selected?: { at: Cell; player: TPlayer };
}

const key = ([r, c]: Cell) => `${r},${c}`;

export default function TutorialBoard({
  size = 4, pieces = [], hWalls = [], vWalls = [], territory = [], dots = [], ghosts = [], selected,
}: TutorialBoardProps) {
  const pieceMap = new Map(pieces.map((p) => [key(p.at), p.player]));
  const hMap = new Map(hWalls.map((w) => [key(w.at), w.player]));
  const vMap = new Map(vWalls.map((w) => [key(w.at), w.player]));
  const terrMap = new Map(territory.map((t) => [key(t.at), t.player]));
  const dotSet = new Set(dots.map(key));
  const selKey = selected ? key(selected.at) : null;

  const TERR: Record<TPlayer, string> = {
    A: 'bg-player-A-50', B: 'bg-player-B-50', C: 'bg-player-C-50',
  };

  return (
    <div
      className="grid aspect-square w-full gap-[3px] overflow-hidden rounded-xl bg-board-line"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
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
                <div className="absolute inset-x-[-2px] bottom-0 z-20 h-[7px] translate-y-1/2 rounded-full"
                     style={{ backgroundColor: PLAYER_VAR[h] }} />
              )}
              {v && (
                <div className="absolute inset-y-[-2px] right-0 z-20 w-[7px] translate-x-1/2 rounded-full"
                     style={{ backgroundColor: PLAYER_VAR[v] }} />
              )}
              {sideGhosts.map((g) => (
                <div
                  key={g.side}
                  className={`absolute z-20 rounded-full opacity-75 ${
                    g.side === 'top' ? 'inset-x-[-2px] top-0 h-[7px] -translate-y-1/2'
                    : g.side === 'bottom' ? 'inset-x-[-2px] bottom-0 h-[7px] translate-y-1/2'
                    : g.side === 'left' ? 'inset-y-[-2px] left-0 w-[7px] -translate-x-1/2'
                    : 'inset-y-[-2px] right-0 w-[7px] translate-x-1/2'
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
