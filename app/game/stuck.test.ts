import { describe, it, expect } from 'vitest';
import {
  createGame, isPlacingPhase, placeOpeningPiece, legalTurns, applyTurn,
  isGameOver, skipUnplayable, shouldSkipTurn, toWgf, replay, turnOrder,
} from './engine';
import { computeTerritories } from './territory';
import type { GameState, PlayerKey } from './types';

/**
 * 「有人動不了」的時候會怎樣。
 *
 * 三人局最擔心的情況：其中一人所有棋子都被封死，遊戲會不會就停在他身上。
 * 這裡把幾種病態盤面直接造出來驗，不靠隨機對局碰運氣 ——
 * 隨機對局幾乎走不到這些位置。
 */

const N = 7;
const grid = () => Array.from({ length: N }, () => Array(N).fill(null));

function boardState(over: Partial<GameState>): GameState {
  return {
    playersNum: 3, board: grid(), horizontalWalls: grid(), verticalWalls: grid(),
    currentPlayer: 'A', openingStep: [], breakWallCount: { A: 1, B: 1, C: 1 },
    pieceIndex: { A: [], B: [], C: [] }, selected: null, remainSteps: 2,
    currentTurnActions: [], initPositions: [], openingPlacements: [], turns: [],
    ...over,
  } as GameState;
}

describe('三人局有人動不了', () => {
  /**
   * A 與 B 各一顆棋被一起封在 {(0,0),(0,1)}，C 獨自封在右下角。
   * A、B 都無法選取棋子（零步移動需能離開再回來），等於完全不能動。
   */
  function sealed(cBreakLeft: number) {
    const board = grid(); const h = grid(); const v = grid();
    board[0][0] = 'A'; board[0][1] = 'B';
    h[0][0] = 'C'; h[0][1] = 'C'; v[0][1] = 'C';
    board[6][6] = 'C';
    h[5][5] = 'A'; h[5][6] = 'A'; v[6][4] = 'A';
    return boardState({
      board, horizontalWalls: h, verticalWalls: v,
      breakWallCount: { A: 0, B: 0, C: cBreakLeft },
      pieceIndex: { A: [{ row: 0, col: 0 }], B: [{ row: 0, col: 1 }], C: [{ row: 6, col: 6 }] },
    });
  }

  it('動不了的人會被跳過，不會卡在他身上', () => {
    const s = sealed(1);
    for (const p of ['A', 'B'] as PlayerKey[]) {
      const ps = { ...s, currentPlayer: p, selected: null, remainSteps: 2 };
      expect(legalTurns(ps)).toHaveLength(0);
      expect(shouldSkipTurn(ps)).toBe(true);
    }
    // 跳過之後應該落在還能動的人身上
    const after = skipUnplayable(s);
    expect(legalTurns(after).length).toBeGreaterThan(0);
  });

  it('兩家棋子被封在同一塊區域 → 那塊地永遠不歸任何人，算終局', () => {
    // 這是關鍵：混合區域不是「還沒分出勝負」，是「確定不會歸任何人」。
    // 少了這一條，遊戲會停在一個誰都拿不到的區域上等下去。
    expect(computeTerritories(sealed(1)).settled).toBe(true);
    expect(isGameOver(sealed(1))).toBe(true);
  });

  it('連最後一個能動的人也定局之後，仍然是結束而不是凍結', () => {
    const s = sealed(0); // C 的破牆用掉了 → C 也會被判定為已定局
    const after = skipUnplayable(s);
    // skipUnplayable 繞完一圈回到原點（seen 擋住無限迴圈），
    // 此時當前玩家確實不能動 —— 所以 isGameOver 必須為真，否則畫面就凍住了。
    expect(legalTurns(after)).toHaveLength(0);
    expect(isGameOver(after)).toBe(true);
  });
});

describe('跳過之後，重播算出來的輪次仍然正確', () => {
  /*
    這是隨機對局撞出來的真 bug（三人局 400 場中 178 場）。

    replay() 原本用 `order[turns.length % 人數]` 推算輪到誰，
    但 skipUnplayable 刻意不把跳過寫進棋譜 —— 只要中途跳過一次，
    回合索引就永久錯開一位。

    連線時的症狀特別難查：寫入方靠 lastAppliedWgf 擋掉自己的重播、
    保有正確的本地狀態，其他人卻是從棋譜重建，於是雙方對「輪到誰」
    的認知分岔，畫面上看起來像「對手不動了」。
  */
  function rng(seed: number) { let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0x100000000); }

  it('隨機三人局中，每一步的 replay(toWgf(s)) 都算出同一個當前玩家', () => {
    // 直接證明這些對局真的踩得到那個 bug：舊寫法 order[turns.length % 人數]
    // 與正確答案不一致的次數。為 0 就代表這個測試其實什麼都沒守住。
    let wouldHaveBeenWrong = 0;
    const order3 = turnOrder(3);
    for (let seed = 1; seed <= 60; seed++) {
      const rand = rng(seed);
      let state = createGame(3);
      let guard = 0;
      while (isPlacingPhase(state) && guard++ < 200) {
        const empty: [number, number][] = [];
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!state.board[r][c]) empty.push([r, c]);
        const [r, c] = empty[Math.floor(rand() * empty.length)];
        state = placeOpeningPiece(state, r, c);
      }
      for (let t = 0; t < 300; t++) {
        state = skipUnplayable(state);
        if (isGameOver(state)) break;

        if (order3[state.turns.length % order3.length] !== state.currentPlayer) wouldHaveBeenWrong++;
        expect(replay(toWgf(state)).currentPlayer).toBe(state.currentPlayer);

        const turns = legalTurns(state);
        if (turns.length === 0) break;
        state = applyTurn(state, turns[Math.floor(rand() * turns.length)]);
      }
    }
    // 測試本身要有效。跳過是在 applyTurn 內部發生的，所以不能靠
    // 「外層 skipUnplayable 有沒有換人」來偵測 —— 那時候早就跳完了。
    expect(wouldHaveBeenWrong).toBeGreaterThan(0);
  });

  it('輪次由「上一回合是誰下的」決定，而不是回合總數取模', () => {
    // 直接驗語意：最後一手是 C，下一個就是 A，不管總共下了幾手。
    const order = turnOrder(3);
    expect(order).toEqual(['A', 'B', 'C']);
    // 取模在 turns.length = 4 時會得到 B（order[4 % 3]），正確答案是 A。
    // 這個差異就是上面那條 bug 的全部。
    expect(order[(order.indexOf('C') + 1) % order.length]).toBe('A');
    expect(order[4 % order.length]).toBe('B');
  });
});
