import { describe, it, expect } from 'vitest';
import {
  createGame, legalMoves, applyMove, replay, undo, NEIGHBORS, landing, hasDiagonals,
  GOATS, type BaghState, type Cell, type Move,
} from '@/games/bagh-chal/engine';
import { chooseMove } from '@/games/bagh-chal/ai';

/** 用字串畫盤面：T 老虎、G 羊、. 空點，五列 */
function boardOf(rows: string[]): Cell[] {
  return rows.join('').split('').map((ch) => (ch === 'T' ? 'T' : ch === 'G' ? 'G' : null));
}
function stateOf(rows: string[], over: Partial<BaghState> = {}): BaghState {
  return { ...createGame(), board: boardOf(rows), goatsInHand: 0, ...over };
}

describe('棋盤', () => {
  it('斜線只經過列＋行為偶數的點', () => {
    expect(hasDiagonals(0)).toBe(true);   // 角
    expect(hasDiagonals(12)).toBe(true);  // 中心
    expect(hasDiagonals(1)).toBe(false);
    expect(NEIGHBORS[0].sort((a, b) => a - b)).toEqual([1, 5, 6]);
    expect(NEIGHBORS[1].sort((a, b) => a - b)).toEqual([0, 2, 6]);
    expect(NEIGHBORS[12]).toHaveLength(8);
  });

  it('跳吃的落點要沿同一條線', () => {
    expect(landing(0, 6)).toBe(12);   // 斜線
    expect(landing(0, 1)).toBe(2);    // 橫線
    expect(landing(1, 7)).toBeNull(); // 1 沒有斜線，1→7 不沿線
  });
});

describe('開局與放子', () => {
  it('四隻老虎在角、羊先走、20 隻在手上', () => {
    const s = createGame();
    expect(s.board.filter((c) => c === 'T')).toHaveLength(4);
    expect([0, 4, 20, 24].every((p) => s.board[p] === 'T')).toBe(true);
    expect(s.turn).toBe('goat');
    expect(s.goatsInHand).toBe(GOATS);
  });

  it('放子階段羊只能放、不能移動盤上的羊', () => {
    const s = applyMove(applyMove(createGame(), { kind: 'place', to: 12 }), { kind: 'move', from: 0, to: 1 });
    expect(s.turn).toBe('goat');
    expect(legalMoves(s).every((m) => m.kind === 'place')).toBe(true);
  });

  it('不改傳入的局面', () => {
    const s = createGame();
    const before = JSON.stringify(s);
    applyMove(s, { kind: 'place', to: 12 });
    expect(JSON.stringify(s)).toBe(before);
  });

  it('不合法的走法丟錯', () => {
    expect(() => applyMove(createGame(), { kind: 'place', to: 0 })).toThrow();
  });
});

describe('老虎吃羊', () => {
  it('沿線跳過一隻羊、落在空點，羊被移除', () => {
    let s = applyMove(createGame(), { kind: 'place', to: 6 });
    const jump = legalMoves(s).find((m): m is Extract<Move, { kind: 'jump' }> => m.kind === 'jump' && m.from === 0);
    expect(jump).toMatchObject({ over: 6, to: 12 });
    s = applyMove(s, jump!);
    expect(s.board[6]).toBeNull();
    expect(s.board[12]).toBe('T');
    expect(s.captured).toBe(1);
  });

  it('落點被佔就不能跳；不能跳過老虎', () => {
    const s = stateOf(['TGG..', '.....', '.....', '.....', 'T...T'], { turn: 'tiger' });
    expect(legalMoves(s).some((m) => m.kind === 'jump' && m.from === 0 && m.over === 1)).toBe(false);
  });

  it('吃滿 5 隻老虎贏', () => {
    const s = stateOf(['TG...', '.....', '.....', '.....', 'T...T'], { turn: 'tiger', captured: 4 });
    expect(applyMove(s, { kind: 'jump', from: 0, over: 1, to: 2 }).winner).toBe('tiger');
  });
});

describe('羊困住老虎', () => {
  it('老虎全部走不動就是羊贏', () => {
    // 角落的老虎：鄰點 1、5、6 都是羊，跳過去的落點 2、10、12 也被羊佔住。
    // 羊走一步無關的（24 → 23），輪到老虎時沒有任何走法
    const s = stateOf(['TGG..', 'GG...', 'G.G..', '.....', '....G'], { turn: 'goat' });
    const after = applyMove(s, { kind: 'move', from: 24, to: 23 });
    expect(after.winner).toBe('goat');
  });
});

describe('禁止重複局面', () => {
  it('羊放完之後，走回出現過的局面不合法', () => {
    let s = stateOf(['T...T', '.....', '..G..', '.....', 'T...T'], { turn: 'goat' });
    s = applyMove(s, { kind: 'move', from: 12, to: 7 });  // 局面 A（羊在 7、輪到老虎）記下來
    s = applyMove(s, { kind: 'move', from: 0, to: 1 });
    s = applyMove(s, { kind: 'move', from: 7, to: 12 });
    s = applyMove(s, { kind: 'move', from: 1, to: 0 });
    // 羊再走 12 → 7 就會重現局面 A
    expect(legalMoves(s).some((m) => m.kind === 'move' && m.from === 12 && m.to === 7)).toBe(false);
    expect(legalMoves(s).length).toBeGreaterThan(0);
  });
});

describe('悔棋與回放', () => {
  it('replay 重走得到同一個局面，undo 退回上一手', () => {
    let s = createGame();
    for (const m of [{ kind: 'place', to: 12 }, { kind: 'move', from: 0, to: 1 }, { kind: 'place', to: 7 }] as Move[]) s = applyMove(s, m);
    expect(replay(s.history).board).toEqual(s.board);
    expect(undo(s).history).toHaveLength(2);
  });
});

describe('電腦對手', () => {
  it('能吃就吃（老虎）', () => {
    const s = applyMove(createGame(), { kind: 'place', to: 6 });
    expect(chooseMove(s, 'normal', () => 0.5)?.kind).toBe('jump');
  });

  it('羊不會把羊送進老虎嘴裡（有安全的放法時）', () => {
    const s = createGame();
    const m = chooseMove(s, 'normal', () => 0.5)!;
    const after = applyMove(s, m);
    expect(legalMoves(after).some((x) => x.kind === 'jump')).toBe(false);
  });

  it('電腦對電腦下完一整局不會出錯，而且一定分出結果或和局', () => {
    let s = createGame();
    let guard = 0;
    while (!s.winner && guard++ < 400) s = applyMove(s, chooseMove(s, 'easy', () => 0.3)!);
    expect(s.winner).not.toBeNull();
  });

  it('困難每手在 2 秒內', () => {
    let s = createGame();
    for (const to of [12, 7, 17]) { s = applyMove(s, { kind: 'place', to }); s = applyMove(s, chooseMove(s, 'easy', () => 0.5)!); }
    const t0 = performance.now();
    chooseMove(s, 'hard');
    expect(performance.now() - t0).toBeLessThan(2000);
  });
});
