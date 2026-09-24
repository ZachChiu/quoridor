import { describe, it, expect } from 'vitest';
import {
  applyTurn, breakOutTurns, canAct, canPlaceWallNow, createGame, isGameOver, legalTurns,
  legalWalls, placeWall, playableTurns, replay, selectPiece, selectablePieces,
  shouldSkipTurn, toWgf,
} from '@/game/engine';
import { fallbackMove } from '@/game/ai';
import { computeTerritories } from '@/game/territory';
import type { GameState } from '@/game/types';

/**
 * 被圍死的棋子：什麼時候還能動、什麼時候不能。
 *
 * 兩條規則在這裡交會 ——
 *   1. 零步移動（原地蓋牆）只在棋子「能離開再回來」時合法（節目原版）
 *   2. 三人局每人一次破牆，被圍死的棋子可以破牆脫困
 *
 * 先前 (1) 只寫在 legalTurns 裡，於是只約束到 AI；而「沒有合法手就跳過」
 * 又排在破牆檢查之前，被圍死、手上還有破牆的玩家會被永遠跳過 —— 正是
 * (2) 要救的局面。這裡把兩邊都釘住。
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

/**
 * A、B 各一顆被一起封在 {(0,0),(0,1)}，C 獨自封在右下角。
 * 牆全是 C 蓋的，所以 A 身邊有牆可破：(0,0) 下方那道隔著的 (1,0) 是空格。
 */
function sealedPair(aBreaks: number, playersNum: 2 | 3 = 3): GameState {
  const board = grid(); const h = grid(); const v = grid();
  board[0][0] = 'A'; board[0][1] = 'B';
  h[0][0] = 'C'; h[0][1] = 'C'; v[0][1] = 'C';
  const pieceIndex: GameState['pieceIndex'] = { A: [{ row: 0, col: 0 }], B: [{ row: 0, col: 1 }], C: [] };
  if (playersNum === 3) {
    board[6][6] = 'C';
    h[5][5] = 'A'; h[5][6] = 'A'; v[6][4] = 'A';
    pieceIndex.C = [{ row: 6, col: 6 }];
  }
  return boardState({
    playersNum, board, horizontalWalls: h, verticalWalls: v,
    breakWallCount: { A: aBreaks, B: 0, C: 0 }, pieceIndex,
  });
}

describe('被圍死但還有破牆：不能被跳過', () => {
  it('沒有一般的合法手，但能破牆脫困 —— 還有事可做', () => {
    const s = sealedPair(1);
    expect(legalTurns(s)).toHaveLength(0);
    expect(breakOutTurns(s).length).toBeGreaterThan(0);
    expect(canAct(s)).toBe(true);
    expect(shouldSkipTurn(s)).toBe(false);
  });

  it('那塊區域不算凍結，對局沒有結束', () => {
    const s = sealedPair(1);
    expect(computeTerritories(s).settled).toBe(false);
    expect(isGameOver(s)).toBe(false);
  });

  it('破牆次數用完就真的動不了：跳過、區域凍結、終局', () => {
    const s = sealedPair(0);
    expect(canAct(s)).toBe(false);
    expect(shouldSkipTurn(s)).toBe(true);
    expect(computeTerritories(s).settled).toBe(true);
    expect(isGameOver(s)).toBe(true);
  });

  it('兩人局沒有破牆規則，不受影響', () => {
    const s = sealedPair(1, 2);
    expect(canAct(s)).toBe(false);
    expect(breakOutTurns(s)).toHaveLength(0);
  });

  it('破牆脫困的一手套得上去、寫得進棋譜、重播得回來', () => {
    const s = sealedPair(1);
    const [turn] = playableTurns(s);
    expect(turn.break).toBeDefined();

    const next = applyTurn(s, turn);
    expect(next.breakWallCount.A).toBe(0);
    expect(next.turns.at(-1)?.[0].type).toBe('breakWall');
    expect(next.currentPlayer).not.toBe('A');

    // 棋譜格式沒變：破牆本來就是 WGF 的一種 action
    const replayed = replay(toWgf({ ...next, initPositions: [], openingPlacements: [] }));
    expect(replayed.breakWallCount.A).toBe(0);
  });
});

describe('原地蓋牆只在棋子能離開再回來時合法 —— 真人也一樣', () => {
  it('完全封死、也破不了牆的棋子不能被選', () => {
    const s = sealedPair(0);
    expect(selectPiece(s, 0, 0)).toBe(s);
    expect(selectablePieces(s)).toEqual([]);
  });

  it('封死但能破牆的棋子可以選 —— 要破牆得先選它', () => {
    const s = sealedPair(1);
    expect(selectPiece(s, 0, 0).selected).toEqual({ row: 0, col: 0 });
    expect(selectablePieces(s)).toEqual([{ row: 0, col: 0 }]);
  });

  it('就算硬是選到了，也不准原地蓋牆（UI 繞過 selectPiece 也擋得住）', () => {
    // 這正是先前的洞：兩家困在同一塊兩格區域，真人從中間切一刀，
    // 就從「誰都不算」變成兩塊各一格的領地，比分被改掉。
    const forced = { ...sealedPair(0), selected: { row: 0, col: 0 } };
    expect(canPlaceWallNow(forced)).toBe(false);
    expect(legalWalls(forced)).toEqual([]);
    expect(placeWall(forced, 0, 0, 'V')).toBe(forced);
  });

  it('走得動的棋子照樣可以選擇不走、原地蓋牆', () => {
    const s = createGame(2);
    const [piece] = s.pieceIndex.A;
    const selected = selectPiece(s, piece.row, piece.col);
    expect(canPlaceWallNow(selected)).toBe(true);
    const [wall] = legalWalls(selected);
    const next = placeWall(selected, wall.row, wall.col, wall.dir);
    expect(next.turns).toHaveLength(1);
  });
});

describe('AI 的保底一手', () => {
  it('開局階段給第一個空格', () => {
    const s = createGame(3);
    const move = fallbackMove(s);
    expect(move?.kind).toBe('opening');
  });

  it('對弈階段給一個能下的回合，被圍死時是破牆脫困', () => {
    const s = sealedPair(1);
    const move = fallbackMove(s);
    expect(move?.kind).toBe('turn');
    if (move?.kind === 'turn') {
      expect(move.turn.break).toBeDefined();
      expect(() => applyTurn(s, move.turn)).not.toThrow();
    }
  });

  it('同一個盤面永遠給同一手', () => {
    const s = sealedPair(1);
    expect(fallbackMove(s)).toEqual(fallbackMove(s));
  });
});
