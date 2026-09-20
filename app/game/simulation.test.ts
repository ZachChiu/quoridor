import { describe, expect, it } from 'vitest';
import {
  createGame, legalMoves, legalWalls, legalBreaks, placeOpeningPiece,
  selectPiece, movePiece, placeWall, breakWall, advancePlayer,
  skipUnplayable, isPlacingPhase, isBreakWallAvailable, toWgf, replay,
  computeTerritories, BOARD_SIZE,
} from './engine';
import { evaluate } from './score';
import type { GameState } from './types';

/**
 * 隨機對局模擬。
 *
 * 單元測試驗的是個別規則，這裡驗的是「整局跑得完」——
 * 終局條件算不出來、自動跳過陷入死迴圈、WGF 序列化漏掉某種動作，
 * 這些都只有在完整打完一局時才會現形，而那正是重構最容易弄壞的地方。
 */

/** 決定性亂數，讓失敗可以重現 */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}
const pick = <T,>(arr: T[], r: () => number) => arr[Math.floor(r() * arr.length)];

/** 打完整一局，回傳終局狀態與統計 */
function playFullGame(playersNum: 2 | 3, seed: number) {
  const r = rng(seed);
  let s: GameState = createGame(playersNum);
  let guard = 0;
  let breaks = 0;

  // 開局擺放
  while (isPlacingPhase(s) && guard++ < 200) {
    const empty: [number, number][] = [];
    for (let row = 0; row < BOARD_SIZE; row++)
      for (let col = 0; col < BOARD_SIZE; col++)
        if (!s.board[row][col]) empty.push([row, col]);
    const [row, col] = pick(empty, r);
    s = placeOpeningPiece(s, row, col);
  }

  // 對局：選子 → 移動 → 築牆（三人局偶爾破牆）
  let turns = 0;
  while (evaluate(s).outcome.length === 0 && guard++ < 3000) {
    const mine: [number, number][] = [];
    for (let row = 0; row < BOARD_SIZE; row++)
      for (let col = 0; col < BOARD_SIZE; col++)
        if (s.board[row][col] === s.currentPlayer) mine.push([row, col]);

    let acted = false;
    for (const [row, col] of mine.sort(() => r() - 0.5)) {
      let t = selectPiece(s, row, col);
      if (!t.selected) continue;

      if (isBreakWallAvailable(t) && r() < 0.15) {
        const brks = legalBreaks(t);
        if (brks.length) { t = breakWall(t, brks[0].row, brks[0].col, brks[0].dir); breaks++; }
      }

      const moves = legalMoves(t);
      if (moves.length) {
        const m = pick(moves, r);
        t = movePiece(t, m.row, m.col);
      }
      const walls = legalWalls(t);
      if (!walls.length) continue;
      const w = pick(walls, r);
      s = placeWall(t, w.row, w.col, w.dir);
      acted = true; turns++;
      break;
    }
    if (!acted) s = skipUnplayable(advancePlayer(s));
    else s = skipUnplayable(s);
  }
  return { state: s, turns, breaks, guard };
}

describe('完整對局模擬', () => {
  it('2 人局：10 個種子都能正常打完並產生勝負', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { state, turns } = playFullGame(2, seed);
      const res = evaluate(state);
      expect(res.outcome.length > 0, `seed ${seed} 沒有結束`).toBe(true);
      expect(turns, `seed ${seed} 回合數異常`).toBeGreaterThan(3);
      expect(res.outcome.length, `seed ${seed} 沒有勝負`).toBeGreaterThan(0);
      const t = computeTerritories(state);
      const owned = t.owned.A.length + t.owned.B.length;
      expect(owned + t.neutral.length).toBeLessThanOrEqual(BOARD_SIZE * BOARD_SIZE);
    }
  });

  it('3 人局：10 個種子都能正常打完，破牆至少觸發過一次', () => {
    let totalBreaks = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const { state, breaks } = playFullGame(3, seed);
      totalBreaks += breaks;
      expect(evaluate(state).outcome.length > 0, `seed ${seed} 沒有結束`).toBe(true);
      // 每人最多破一次牆
      for (const k of ['A', 'B', 'C'] as const) {
        expect(state.breakWallCount[k]).toBeGreaterThanOrEqual(0);
        expect(state.breakWallCount[k]).toBeLessThanOrEqual(1);
      }
    }
    expect(totalBreaks, '十局都沒觸發破牆，機制可能沒接上').toBeGreaterThan(0);
  });

  it('WGF 往返：終局盤面重播後完全一致', () => {
    for (const [n, seed] of [[2, 7], [3, 11]] as const) {
      const { state } = playFullGame(n as 2 | 3, seed);
      const wgf = toWgf(state);
      const back = replay(wgf);
      expect(back.board, `${n} 人局盤面對不上`).toEqual(state.board);
      expect(back.horizontalWalls).toEqual(state.horizontalWalls);
      expect(back.verticalWalls).toEqual(state.verticalWalls);
      expect(back.breakWallCount).toEqual(state.breakWallCount);
      expect(evaluate(back).outcome).toEqual(evaluate(state).outcome);
    }
  });

  it('悔棋：replay(wgf, n-1) 等於少走一回合的盤面', () => {
    const { state } = playFullGame(2, 3);
    const wgf = toWgf(state);
    const full = replay(wgf);
    const undone = replay(wgf, full.turns.length - 1);
    expect(undone.turns.length).toBe(full.turns.length - 1);
    expect(undone.board).not.toEqual(full.board);
  });
});
