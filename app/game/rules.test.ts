import { describe, expect, it } from 'vitest';
import {
  applyTurn,
  createGame,
  isGameOver,
  legalTurns,
  legalWalls,
  placeOpeningPiece,
  selectPiece,
  undoTurn,
} from './engine';
import { computeTerritories } from './territory';
import { getWinners } from './score';
import type { GameState, Player, PlayerKey } from './types';

function runOpening(state: GameState, cells: [number, number][]): GameState {
  return cells.reduce((s, [row, col]) => placeOpeningPiece(s, row, col), state);
}

/** 依 (row,col,dir) 清單設定牆。 */
function withWalls(
  state: GameState,
  walls: { row: number; col: number; dir: 'H' | 'V'; by?: PlayerKey }[]
): GameState {
  const h = state.horizontalWalls.map((r) => [...r]);
  const v = state.verticalWalls.map((r) => [...r]);
  for (const w of walls) {
    (w.dir === 'H' ? h : v)[w.row][w.col] = (w.by ?? 'A') as Player;
  }
  return { ...state, horizontalWalls: h, verticalWalls: v };
}

describe('零步移動的合法性', () => {
  it('棋子還走得動時，原地蓋牆是合法的一回合', () => {
    const s = runOpening(createGame(2), [[3, 3], [0, 0], [0, 6], [6, 3]]);
    const stays = legalTurns(s).filter(
      (t) => t.from.row === 3 && t.from.col === 3 && t.to.row === 3 && t.to.col === 3
    );
    expect(stays.length).toBeGreaterThan(0);
  });

  it('棋子被完全封死時不可被選取（零步移動需能離開再回來）', () => {
    let s = runOpening(createGame(2), [[3, 3], [0, 0], [0, 6], [6, 3]]);
    // 把 (3,3) 四面封死
    s = withWalls(s, [
      { row: 2, col: 3, dir: 'H' },
      { row: 3, col: 3, dir: 'H' },
      { row: 3, col: 2, dir: 'V' },
      { row: 3, col: 3, dir: 'V' },
    ]);

    const fromTrapped = legalTurns(s).filter((t) => t.from.row === 3 && t.from.col === 3);
    expect(fromTrapped).toEqual([]);

    // 其他棋子仍可正常行動
    expect(legalTurns(s).length).toBeGreaterThan(0);
  });
});

describe('牆必須相鄰於棋子所在格', () => {
  it('可蓋的牆只出現在選取棋子的四邊', () => {
    let s = runOpening(createGame(2), [[3, 3], [0, 0], [0, 6], [6, 3]]);
    s = selectPiece(s, 3, 3);

    for (const w of legalWalls(s)) {
      const adjacentToPiece =
        (w.dir === 'H' && w.col === 3 && (w.row === 3 || w.row === 2)) ||
        (w.dir === 'V' && w.row === 3 && (w.col === 3 || w.col === 2));
      expect(adjacentToPiece).toBe(true);
    }
  });
});

describe('平手決勝：比最大單一領地', () => {
  const sizes = (a: number[], b: number[]) => ({ A: a, B: b, C: [] } as Record<PlayerKey, number[]>);

  it('總分不同時直接由高分者勝', () => {
    expect(getWinners({ A: 12, B: 8, C: 0 }, 2, sizes([12], [8]))).toEqual(['A']);
  });

  it('總分相同時，領地圍得較完整的一方勝', () => {
    // 同為 10 格：A 是一整塊，B 切成兩塊 5 格
    expect(getWinners({ A: 10, B: 10, C: 0 }, 2, sizes([10], [5, 5]))).toEqual(['A']);
    expect(getWinners({ A: 10, B: 10, C: 0 }, 2, sizes([4, 3, 3], [10]))).toEqual(['B']);
  });

  it('總分與最大單一領地都相同才是平手', () => {
    expect(getWinners({ A: 10, B: 10, C: 0 }, 2, sizes([5, 5], [5, 5]))).toEqual(['draw']);
  });

  it('三人局中兩人並列最高時，由最大單一領地決出單一勝者', () => {
    const s = { A: [9], B: [5, 4], C: [3] } as Record<PlayerKey, number[]>;
    expect(getWinners({ A: 9, B: 9, C: 3 }, 3, s)).toEqual(['A']);
  });
});

describe('凍結的爭奪區域', () => {
  it('無人能動的爭奪區域視為已定局，且不計入任何人的分數', () => {
    // A 與 B 各一顆棋相鄰，四周封死 —— 兩顆都無路可走
    let s = createGame(2);
    s = {
      ...s,
      board: s.board.map((row) => row.map(() => null)),
      pieceIndex: { A: [], B: [], C: [] },
      openingStep: [],
      initPositions: [],
    };
    const board = s.board.map((r) => [...r]);
    board[0][0] = 'A';
    board[0][1] = 'B';
    board[6][6] = 'A';
    board[6][5] = 'B';
    s = {
      ...s,
      board,
      pieceIndex: { A: [{ row: 0, col: 0 }, { row: 6, col: 6 }], B: [{ row: 0, col: 1 }, { row: 6, col: 5 }], C: [] },
    };
    // 把 (0,0)+(0,1) 與 (6,5)+(6,6) 各自封成 2 格區域
    s = withWalls(s, [
      { row: 0, col: 0, dir: 'H' },
      { row: 0, col: 1, dir: 'H' },
      { row: 0, col: 1, dir: 'V' },
      { row: 5, col: 5, dir: 'H' },
      { row: 5, col: 6, dir: 'H' },
      { row: 6, col: 4, dir: 'V' },
    ]);

    const t = computeTerritories(s);
    // 兩個區域都是爭奪中，但都凍結 → 已定局
    expect(t.contested.length).toBe(4);
    expect(t.settled).toBe(true);
    expect(t.owned.A).toEqual([]);
    expect(t.owned.B).toEqual([]);
    expect(isGameOver(s)).toBe(true);
  });
});

describe('悔棋', () => {
  const opened = () => runOpening(createGame(2), [[3, 3], [3, 1], [3, 5], [1, 3]]);

  it('回退一個回合並還原盤面與輪次', () => {
    const start = opened();
    const afterOne = applyTurn(start, legalTurns(start)[0]);
    expect(afterOne.turns).toHaveLength(1);
    expect(afterOne.currentPlayer).toBe('B');

    const undone = undoTurn(afterOne);
    expect(undone.turns).toHaveLength(0);
    expect(undone.currentPlayer).toBe('A');
    expect(undone.board).toEqual(start.board);
    expect(undone.horizontalWalls).toEqual(start.horizontalWalls);
    expect(undone.verticalWalls).toEqual(start.verticalWalls);
  });

  it('沒有任何回合時回退不做事', () => {
    const start = opened();
    expect(undoTurn(start)).toBe(start);
  });

  it('untilPlayer 會一路退到輪回指定玩家（單人模式用）', () => {
    let s = opened();
    s = applyTurn(s, legalTurns(s)[0]); // A
    s = applyTurn(s, legalTurns(s)[0]); // B
    expect(s.turns).toHaveLength(2);
    expect(s.currentPlayer).toBe('A');

    s = applyTurn(s, legalTurns(s)[0]); // A 再走一手 → 輪到 B
    expect(s.currentPlayer).toBe('B');

    // 單人模式按一次悔棋：要退回輪到 A，而非停在 AI 剛走完的局面
    const undone = undoTurn(s, 'A');
    expect(undone.currentPlayer).toBe('A');
    expect(undone.turns).toHaveLength(2);
  });

  it('連續回退可一路退回開局狀態', () => {
    let s = opened();
    for (let i = 0; i < 4; i++) s = applyTurn(s, legalTurns(s)[0]);
    expect(s.turns).toHaveLength(4);

    for (let i = 0; i < 4; i++) s = undoTurn(s);
    expect(s.turns).toHaveLength(0);
    expect(s.board).toEqual(opened().board);
  });
});
