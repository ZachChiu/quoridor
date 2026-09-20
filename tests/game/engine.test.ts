import { describe, expect, it } from 'vitest';
import {
  advancePlayer,
  breakWall,
  createGame,
  legalBreaks,
  legalMoves,
  legalWalls,
  movePiece,
  openingOrder,
  placeOpeningPiece,
  placeWall,
  replay,
  selectPiece,
  shouldSkipTurn,
  toWgf,
} from '@/game/engine';
import { computeTerritories } from '@/game/territory';
import { evaluate } from '@/game/score';
import type { GameState, PlayerKey } from '@/game/types';

/** 依序擺放開局棋子，回傳進入對弈階段的狀態。 */
function runOpening(state: GameState, cells: [number, number][]): GameState {
  return cells.reduce((s, [row, col]) => placeOpeningPiece(s, row, col), state);
}

describe('createGame', () => {
  it('兩人模式預置 4 顆棋於節目原版的位置', () => {
    const s = createGame(2);
    expect(s.board[1][1]).toBe('A');
    expect(s.board[5][5]).toBe('A');
    expect(s.board[1][5]).toBe('B');
    expect(s.board[5][1]).toBe('B');
    expect(s.initPositions).toHaveLength(4);
  });

  it('兩人模式的開局擺放順序為 A B B A（蛇形）', () => {
    expect(openingOrder(2)).toEqual(['A', 'B', 'B', 'A']);
  });

  it('三人模式無預置棋子，順序為 A B C C B A', () => {
    const s = createGame(3);
    expect(s.board.flat().filter(Boolean)).toHaveLength(0);
    expect(s.initPositions).toHaveLength(0);
    expect(openingOrder(3)).toEqual(['A', 'B', 'C', 'C', 'B', 'A']);
  });

  it('三人模式結束開局後每人各有 2 顆棋', () => {
    const s = runOpening(createGame(3), [
      [0, 0], [0, 6], [6, 0], [6, 6], [3, 0], [3, 6],
    ]);
    expect(s.openingStep).toHaveLength(0);
    for (const p of ['A', 'B', 'C'] as PlayerKey[]) {
      expect(s.pieceIndex[p]).toHaveLength(2);
    }
  });
});

describe('legalMoves', () => {
  it('空曠處兩步可達 8 格（直線 4 + L 形 4）', () => {
    let s = createGame(2);
    s = runOpening(s, [[3, 3], [0, 0], [0, 6], [6, 3]]);
    s = selectPiece(s, 3, 3);
    // 兩步內可達：正交距離 1 的 4 格 + 距離 2 的 8 格 = 12
    const moves = legalMoves(s);
    expect(moves).toHaveLength(12);
    // 不含起點本身
    expect(moves.some((m) => m.row === 3 && m.col === 3)).toBe(false);
  });

  it('牆會擋住移動', () => {
    let s = createGame(2);
    s = runOpening(s, [[3, 3], [0, 0], [0, 6], [6, 3]]);
    s = selectPiece(s, 3, 3);
    const before = legalMoves(s).length;

    // 在 (3,3) 下方蓋牆後，往下的路徑被切斷
    s = { ...s, horizontalWalls: s.horizontalWalls.map((r, i) => (i === 3 ? r.map((c, j) => (j === 3 ? 'A' : c)) : r)) };
    const after = legalMoves(s).length;
    expect(after).toBeLessThan(before);
    // 失去的是 (4,3)，以及只能經由它抵達的 (5,3)，共 2 格
    expect(after).toBe(before - 2);
  });

  it('已有棋子的格子不可停留', () => {
    let s = createGame(2);
    s = runOpening(s, [[3, 3], [3, 4], [0, 6], [6, 3]]);
    s = selectPiece(s, 3, 3);
    expect(legalMoves(s).some((m) => m.row === 3 && m.col === 4)).toBe(false);
  });

  it('未選取棋子時沒有合法手', () => {
    const s = createGame(2);
    expect(legalMoves(s)).toEqual([]);
  });
});

describe('legalWalls', () => {
  it('盤面中央有四面可蓋的牆', () => {
    let s = createGame(2);
    s = runOpening(s, [[3, 3], [0, 0], [0, 6], [6, 3]]);
    s = selectPiece(s, 3, 3);
    expect(legalWalls(s)).toHaveLength(4);
  });

  it('角落只有兩面（棋盤邊界不可蓋牆）', () => {
    let s = createGame(2);
    s = runOpening(s, [[0, 0], [3, 3], [0, 6], [6, 3]]);
    s = selectPiece(s, 0, 0);
    expect(legalWalls(s)).toHaveLength(2);
  });
});

describe('回合流程', () => {
  it('蓋牆會結束回合並輪給下一位玩家', () => {
    let s = createGame(2);
    s = runOpening(s, [[3, 3], [0, 0], [0, 6], [6, 3]]);
    expect(s.currentPlayer).toBe('A');

    s = selectPiece(s, 3, 3);
    s = movePiece(s, 3, 2);
    expect(s.remainSteps).toBe(1);

    s = placeWall(s, 3, 2, 'H');
    expect(s.currentPlayer).toBe('B');
    expect(s.remainSteps).toBe(2);
    expect(s.selected).toBeNull();
    expect(s.turns).toHaveLength(1);
    // 一個 move + 一個 placeWall
    expect(s.turns[0]).toHaveLength(2);
  });

  it('零步移動（只蓋牆）也是合法的一回合', () => {
    let s = createGame(2);
    s = runOpening(s, [[3, 3], [0, 0], [0, 6], [6, 3]]);
    s = selectPiece(s, 3, 3);
    s = placeWall(s, 3, 3, 'V');
    expect(s.turns[0]).toHaveLength(1);
    expect(s.currentPlayer).toBe('B');
  });

  it('三人模式破牆會扣次數且不結束回合', () => {
    let s = createGame(3);
    s = runOpening(s, [[3, 3], [0, 0], [0, 6], [6, 0], [6, 6], [3, 6]]);
    s = selectPiece(s, 3, 3);
    s = placeWall(s, 3, 3, 'H');           // A 蓋牆，輪到 B
    s = selectPiece(s, 0, 0);
    s = placeWall(s, 0, 0, 'H');           // B
    s = selectPiece(s, 0, 6);
    s = placeWall(s, 0, 6, 'H');           // C，輪回 A

    expect(s.currentPlayer).toBe('A');
    s = selectPiece(s, 3, 3);
    expect(legalBreaks(s).some((w) => w.row === 3 && w.col === 3 && w.dir === 'H')).toBe(true);

    const broken = breakWall(s, 3, 3, 'H');
    expect(broken.breakWallCount.A).toBe(0);
    expect(broken.horizontalWalls[3][3]).toBeNull();
    expect(broken.currentPlayer).toBe('A'); // 回合未結束
    expect(legalBreaks(broken)).toEqual([]); // 次數用完
  });

  it('兩人模式沒有破牆機會', () => {
    let s = createGame(2);
    s = runOpening(s, [[3, 3], [0, 0], [0, 6], [6, 3]]);
    s = selectPiece(s, 3, 3);
    expect(legalBreaks(s)).toEqual([]);
  });
});

describe('領地計算', () => {
  it('用牆把角落封死即為該玩家的領地', () => {
    let s = createGame(2);
    s = runOpening(s, [[0, 0], [6, 6], [6, 5], [1, 1]]);

    // 以牆將 (0,0)、(0,1)、(1,0)、(1,1) 圍成 2×2 的 A 區
    s = {
      ...s,
      verticalWalls: s.verticalWalls.map((r, i) =>
        i <= 1 ? r.map((c, j) => (j === 1 ? 'A' : c)) : r
      ),
      horizontalWalls: s.horizontalWalls.map((r, i) =>
        i === 1 ? r.map((c, j) => (j <= 1 ? 'A' : c)) : r
      ),
    };

    const t = computeTerritories(s);
    expect(t.owned.A.sort()).toEqual(['0,0', '0,1', '1,0', '1,1']);
    expect(t.ownerByCell['0,0']).toBe('A');
  });

  it('區域內同時有雙方棋子時不計入任何人，且歸類為「爭奪中」而非「中立」', () => {
    let s = createGame(2);
    s = runOpening(s, [[3, 3], [3, 4], [0, 0], [6, 6]]);
    const t = computeTerritories(s);
    // 全盤連通且含 A、B 棋子 → 勝負未定，無人得分
    expect(t.owned.A).toEqual([]);
    expect(t.owned.B).toEqual([]);
    expect(t.contested).toHaveLength(49);
    // 中立區專指「已封閉且完全沒有棋子」的格子，與爭奪中的區域語意不同
    expect(t.neutral).toEqual([]);
    expect(t.settled).toBe(false);
  });

  it('沒有棋子的封閉區算中立，不計入任何人', () => {
    let s = createGame(2);
    s = runOpening(s, [[0, 0], [6, 6], [6, 5], [0, 1]]);

    // 把 (3,3) 四面封死，形成一個無人的孤立格
    s = {
      ...s,
      horizontalWalls: s.horizontalWalls.map((r, i) =>
        i === 2 || i === 3 ? r.map((c, j) => (j === 3 ? 'A' : c)) : r
      ),
      verticalWalls: s.verticalWalls.map((r, i) =>
        i === 3 ? r.map((c, j) => (j === 2 || j === 3 ? 'A' : c)) : r
      ),
    };

    const t = computeTerritories(s);
    expect(t.neutral).toContain('3,3');
    expect(t.ownerByCell['3,3']).toBeUndefined();
  });
});

describe('WGF 往返', () => {
  it('序列化後重播可還原完全相同的盤面', () => {
    let s = createGame(2);
    s = runOpening(s, [[3, 3], [0, 0], [0, 6], [6, 3]]);
    s = selectPiece(s, 3, 3);
    s = movePiece(s, 3, 2);
    s = placeWall(s, 3, 2, 'H');
    s = selectPiece(s, 0, 0);
    s = movePiece(s, 0, 1);
    s = placeWall(s, 0, 1, 'V');

    const restored = replay(toWgf(s));

    expect(restored.board).toEqual(s.board);
    expect(restored.horizontalWalls).toEqual(s.horizontalWalls);
    expect(restored.verticalWalls).toEqual(s.verticalWalls);
    expect(restored.currentPlayer).toBe(s.currentPlayer);
    expect(restored.openingStep).toEqual(s.openingStep);
    // 盤面、牆、輪次全部一致
    expect(restored.turns).toHaveLength(s.turns.length);
    expect(restored.turns.map((t) => t.map((a) => a.type))).toEqual(
      s.turns.map((t) => t.map((a) => a.type))
    );
  });

  it('WGF 的牆 token 刻意省略棋子編號（已知且可接受的有損）', () => {
    let s = createGame(2);
    s = runOpening(s, [[3, 3], [0, 0], [0, 6], [6, 3]]);
    s = selectPiece(s, 3, 3);
    s = movePiece(s, 3, 2);
    s = placeWall(s, 3, 2, 'H');

    const wall = s.turns[0].find((a) => a.type === 'placeWall')!;
    const restoredWall = replay(toWgf(s)).turns[0].find((a) => a.type === 'placeWall')!;

    // 牆不隸屬於任何棋子，故格式以 `H32` 而非 `1H32` 記錄以節省空間，
    // 重播後 piece 為 0。盤面不受影響，這是格式的設計取捨。
    expect(wall.piece).toBeGreaterThan(0);
    expect(restoredWall.piece).toBe(0);
    expect(restoredWall.row).toBe(wall.row);
    expect(restoredWall.col).toBe(wall.col);
    expect(restoredWall.dir).toBe(wall.dir);
  });

  it('三人模式同樣可完整還原', () => {
    let s = createGame(3);
    s = runOpening(s, [[3, 3], [0, 0], [0, 6], [6, 0], [6, 6], [3, 6]]);
    s = selectPiece(s, 3, 3);
    s = placeWall(s, 3, 3, 'H');

    const restored = replay(toWgf(s));
    expect(restored.board).toEqual(s.board);
    expect(restored.playersNum).toBe(3);
    expect(restored.currentPlayer).toBe('B');
  });

  it('toWgf(replay(wgf)) 必須與原字串完全相同', () => {
    // 這是連線模式防止 echo 的前提：客戶端把 Firebase 上的 WGF 重播成 state 後，
    // 再序列化回去必須得到同一個字串，否則會誤判為「別人的新棋步」而無限重播。
    let s = createGame(2);
    s = runOpening(s, [[3, 3], [0, 0], [0, 6], [6, 3]]);
    s = selectPiece(s, 3, 3);
    s = movePiece(s, 3, 2);
    s = movePiece(s, 3, 1);
    s = placeWall(s, 3, 1, 'H');
    s = selectPiece(s, 0, 0);
    s = placeWall(s, 0, 0, 'V');

    const wgf = toWgf(s);
    expect(toWgf(replay(wgf))).toBe(wgf);
    // 再跑一輪確保穩定（非只是巧合的單次相等）
    expect(toWgf(replay(toWgf(replay(wgf))))).toBe(wgf);
  });

  it('upToTurn 可回退到指定回合（供悔棋使用）', () => {
    let s = createGame(2);
    s = runOpening(s, [[3, 3], [0, 0], [0, 6], [6, 3]]);
    s = selectPiece(s, 3, 3);
    s = placeWall(s, 3, 3, 'H');
    s = selectPiece(s, 0, 0);
    s = placeWall(s, 0, 0, 'H');

    const wgf = toWgf(s);
    expect(replay(wgf).turns).toHaveLength(2);
    expect(replay(wgf, 1).turns).toHaveLength(1);
    expect(replay(wgf, 1).currentPlayer).toBe('B');
    expect(replay(wgf, 0).horizontalWalls[3][3]).toBeNull();
  });
});

describe('自動跳過與勝負', () => {
  it('棋子仍能遇到對手時不跳過', () => {
    let s = createGame(2);
    s = runOpening(s, [[3, 3], [3, 4], [0, 0], [6, 6]]);
    expect(shouldSkipTurn(s)).toBe(false);
  });

  it('advancePlayer 依序輪替並重置回合狀態', () => {
    let s = createGame(3);
    s = runOpening(s, [[0, 0], [0, 6], [6, 0], [6, 6], [3, 0], [3, 6]]);
    s = selectPiece(s, 0, 0);
    const next = advancePlayer(s);
    expect(next.currentPlayer).toBe('B');
    expect(next.selected).toBeNull();
    expect(next.remainSteps).toBe(2);
  });

  it('未分出勝負時 outcome 為空', () => {
    let s = createGame(2);
    s = runOpening(s, [[3, 3], [3, 4], [0, 0], [6, 6]]);
    expect(evaluate(s).outcome).toEqual([]);
  });
});
