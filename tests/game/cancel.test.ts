import { describe, it, expect } from 'vitest';
import {
  createGame, isPlacingPhase, placeOpeningPiece, selectPiece, movePiece,
  legalMoves, cancelTurn, toWgf,
} from '@/game/engine';

/**
 * 取消進行中的回合。
 *
 * 手機的方向盤有一顆「重來」—— 走錯一步不該整個回合就這樣交出去。
 * 這裡確認取消之後回到的是**回合開始時**的盤面，而不是某個中間狀態。
 */
function opened() {
  let s = createGame(2);
  let guard = 0;
  while (isPlacingPhase(s) && guard++ < 50) {
    outer: for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
      if (!s.board[r][c]) { s = placeOpeningPiece(s, r, c); break outer; }
    }
  }
  return s;
}

describe('cancelTurn', () => {
  it('移動之後取消，棋子回到原位、步數回復', () => {
    const start = opened();
    const me = start.pieceIndex[start.currentPlayer][0];
    const selected = selectPiece(start, me.row, me.col);
    const target = legalMoves(selected)[0];
    const moved = movePiece(selected, target.row, target.col);

    expect(moved.board[target.row][target.col]).toBe(start.currentPlayer);
    expect(moved.remainSteps).toBeLessThan(2);

    const back = cancelTurn(moved);
    expect(back.board).toEqual(start.board);
    expect(back.remainSteps).toBe(2);
    expect(back.selected).toBeNull();
    expect(back.currentPlayer).toBe(start.currentPlayer);
    expect(back.currentTurnActions).toEqual([]);
  });

  it('棋譜不變 —— 連線模式的同步 effect 因此不會被觸發', () => {
    const start = opened();
    const me = start.pieceIndex[start.currentPlayer][0];
    const moved = movePiece(selectPiece(start, me.row, me.col), legalMoves(selectPiece(start, me.row, me.col))[0].row, legalMoves(selectPiece(start, me.row, me.col))[0].col);
    expect(toWgf(cancelTurn(moved))).toBe(toWgf(start));
  });

  it('什麼都還沒做時取消是無操作，不會白白重建一次盤面', () => {
    const start = opened();
    expect(cancelTurn(start)).toBe(start);
  });

  it('只選取還沒移動，取消會清掉選取', () => {
    const start = opened();
    const me = start.pieceIndex[start.currentPlayer][0];
    const sel = selectPiece(start, me.row, me.col);
    expect(sel.selected).not.toBeNull();
    expect(cancelTurn(sel).selected).toBeNull();
  });

  it('走兩步之後取消，一樣回到起點（不是只退一步）', () => {
    const start = opened();
    const me = start.pieceIndex[start.currentPlayer][0];
    let s = selectPiece(start, me.row, me.col);
    const first = legalMoves(s)[0];
    s = movePiece(s, first.row, first.col);
    const second = legalMoves(s)[0];
    if (second) s = movePiece(s, second.row, second.col);
    expect(cancelTurn(s).board).toEqual(start.board);
  });
});
