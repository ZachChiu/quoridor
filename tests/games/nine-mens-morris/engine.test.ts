import { describe, it, expect } from 'vitest';
import {
  createGame, legalMoves, applyMove, replay, undoTurn, undoPoint, removable, lastMills, positionKey, phaseOf,
  encodeMoves, decodeMoves, encodeMove, NEIGHBORS, MILLS, POINT_NAMES, PIECES, QUIET_LIMIT,
  type MorrisState, type Move, type Rules,
} from '@/games/nine-mens-morris/engine';
import { chooseTurn } from '@/games/nine-mens-morris/ai';

const P = (name: string) => {
  const i = POINT_NAMES.indexOf(name as (typeof POINT_NAMES)[number]);
  if (i < 0) throw new Error(name);
  return i;
};
/** 用棋譜字串走（`a7 b6 d7 …`），順便驗證每一手都合法 */
const run = (text: string, rules: Partial<Rules> = {}) => replay(decodeMoves(text), rules);

/** 直接擺一個走子階段的盤面：B、W 是點的名字 */
function stateOf(pieces: { B?: string[]; W?: string[] }, over: Partial<MorrisState> = {}): MorrisState {
  const s = createGame(over.rules);
  const board = s.board.slice();
  for (const n of pieces.B ?? []) board[P(n)] = 'B';
  for (const n of pieces.W ?? []) board[P(n)] = 'W';
  return { ...s, board, inHand: { black: 0, white: 0 }, ...over };
}
const step = (s: MorrisState, text: string) => text.split(' ').reduce((g, tok) => applyMove(g, decodeMoves(tok)[0]), s);

describe('棋盤', () => {
  it('24 個點、16 條線、32 條邊，每個點剛好在兩條線上', () => {
    expect(POINT_NAMES).toHaveLength(24);
    expect(MILLS).toHaveLength(16);
    expect(NEIGHBORS.reduce((n, ns) => n + ns.length, 0) / 2).toBe(32);
    for (let p = 0; p < 24; p++) expect(MILLS.filter((l) => l.includes(p))).toHaveLength(2);
  });

  it('角只連兩點、外圈中點連三點、中圈中點連四點', () => {
    expect(NEIGHBORS[P('a7')].map((p) => POINT_NAMES[p]).sort()).toEqual(['a4', 'd7']);
    expect(NEIGHBORS[P('d7')].map((p) => POINT_NAMES[p]).sort()).toEqual(['a7', 'd6', 'g7']);
    expect(NEIGHBORS[P('d6')].map((p) => POINT_NAMES[p]).sort()).toEqual(['b6', 'd5', 'd7', 'f6']);
    expect(NEIGHBORS[P('c4')].map((p) => POINT_NAMES[p]).sort()).toEqual(['b4', 'c3', 'c5']);
  });
});

describe('放子', () => {
  it('黑先、雙方手上各 9 顆', () => {
    const s = createGame();
    expect(s.turn).toBe('black');
    expect(s.inHand).toEqual({ black: PIECES, white: PIECES });
    expect(legalMoves(s)).toHaveLength(24);
  });

  it('放完之前盤上的子不能動；雙方都放完才開始走', () => {
    // 雙方各放 9 顆，刻意不成三
    const text = 'a7 d7 g7 b6 d6 f6 c5 d5 e5 a4 b4 c4 e4 f4 g4 c3 d3 e3';
    const order = text.split(' ');
    let s = createGame();
    for (const tok of order) {
      expect(legalMoves(s).every((m) => m.kind === 'place')).toBe(true);
      s = applyMove(s, decodeMoves(tok)[0]);
    }
    expect(s.inHand).toEqual({ black: 0, white: 0 });
    expect(s.turn).toBe('black');
    expect(legalMoves(s).every((m) => m.kind === 'move')).toBe(true);
  });

  it('不改傳入的局面', () => {
    const s = createGame();
    const before = JSON.stringify(s);
    applyMove(s, { kind: 'place', to: 0 });
    expect(JSON.stringify(s)).toBe(before);
  });

  it('不合法的動作丟錯', () => {
    const s = applyMove(createGame(), { kind: 'place', to: 0 });
    expect(() => applyMove(s, { kind: 'place', to: 0 })).toThrow();
    expect(() => applyMove(s, { kind: 'move', from: 0, to: 1 })).toThrow();
    expect(() => applyMove(s, { kind: 'remove', at: 0 })).toThrow();
  });
});

describe('成三與拿子', () => {
  it('成三之後同一個人要拿掉對方一顆，拿完才換人', () => {
    const s = run('a7 b6 d7 b4 g7');
    expect(s.removing).toBe(true);
    expect(s.turn).toBe('black');
    expect(legalMoves(s).every((m) => m.kind === 'remove')).toBe(true);
    expect(lastMills(s)).toEqual([[P('a7'), P('d7'), P('g7')]]);
    const after = applyMove(s, { kind: 'remove', at: P('b6') });
    expect(after.board[P('b6')]).toBeNull();
    expect(after.turn).toBe('white');
    expect(after.removing).toBe(false);
    expect(after.inHand).toEqual({ black: 6, white: 7 });
  });

  it('對方連成一線的子不能拿', () => {
    // 白 b6 d6 f6 連成一線＋a1 單獨；黑 g4 走到 g7 成三
    const s = stateOf({ B: ['a7', 'd7', 'g4', 'c3'], W: ['b6', 'd6', 'f6', 'a1'] });
    const after = applyMove(s, { kind: 'move', from: P('g4'), to: P('g7') });
    expect(after.removing).toBe(true);
    expect(removable(after)).toEqual([P('a1')]);
    expect(() => applyMove(after, { kind: 'remove', at: P('d6') })).toThrow();
  });

  it('對方的子全在線上：傳統規則可以拿線上的子', () => {
    const s = stateOf({ B: ['a7', 'd7', 'g4', 'c3'], W: ['b6', 'd6', 'f6'] });
    const after = applyMove(s, { kind: 'move', from: P('g4'), to: P('g7') });
    expect(after.removing).toBe(true);
    expect(removable(after).sort((a, b) => a - b)).toEqual([P('b6'), P('d6'), P('f6')]);
  });

  it('對方的子全在線上：節目規則不能拿，這一手直接換人', () => {
    const s = stateOf({ B: ['a7', 'd7', 'g4', 'c3'], W: ['b6', 'd6', 'f6'] }, { rules: { showRules: true } });
    const after = applyMove(s, { kind: 'move', from: P('g4'), to: P('g7') });
    expect(after.removing).toBe(false);
    expect(after.turn).toBe('white');
    expect(after.board.filter((c) => c === 'W')).toHaveLength(3);
    expect(lastMills(after)).toHaveLength(1);
  });

  it('同時成兩條線也只拿一顆', () => {
    // 黑 d6 補進去同時完成 b6-d6-f6 與 d7-d6-d5
    const s = stateOf({ B: ['b6', 'f6', 'd7', 'd5', 'c4'], W: ['a1', 'g1', 'd1', 'e3'] }, { inHand: { black: 1, white: 1 } });
    const after = applyMove(s, { kind: 'place', to: P('d6') });
    expect(lastMills(after)).toHaveLength(2);
    const done = applyMove(after, { kind: 'remove', at: P('e3') });
    expect(done.turn).toBe('white');
    expect(done.board.filter((c) => c === 'W')).toHaveLength(3);
  });

  it('把子移出線外再移回來，算再成三一次', () => {
    let s = stateOf({ B: ['a7', 'd7', 'g7', 'c3'], W: ['b6', 'f2', 'a1', 'e5'] });
    s = step(s, 'g7-g4 e5-e4');
    const back = applyMove(s, { kind: 'move', from: P('g4'), to: P('g7') });
    expect(back.removing).toBe(true);
  });
});

describe('走子與飛子', () => {
  it('四顆以上只能沿線走到相鄰的空點', () => {
    const s = stateOf({ B: ['a7', 'c5', 'e3', 'g1'], W: ['g7', 'e5', 'c3', 'a1'] });
    expect(phaseOf(s)).toBe('move');
    const from = legalMoves(s).filter((m) => m.kind === 'move' && m.from === P('a7')).map((m) => (m as { to: number }).to).sort((a, b) => a - b);
    expect(from).toEqual([P('d7'), P('a4')].sort((a, b) => a - b));
  });

  it('只剩 3 顆可以飛到任何空點', () => {
    const s = stateOf({ B: ['a7', 'c5', 'g1'], W: ['g7', 'e5', 'c3', 'a1'] });
    expect(phaseOf(s)).toBe('fly');
    const fromA7 = legalMoves(s).filter((m) => m.kind === 'move' && m.from === P('a7'));
    expect(fromA7).toHaveLength(24 - 7);
    expect(fromA7.some((m) => m.kind === 'move' && m.to === P('e4'))).toBe(true);
    // 對方還有 4 顆，不能飛
    const w = applyMove(s, { kind: 'move', from: P('a7'), to: P('e4') });
    expect(phaseOf(w)).toBe('move');
    expect(legalMoves(w).some((m) => m.kind === 'move' && m.from === P('a1') && m.to === P('f6'))).toBe(false);
  });
});

describe('勝負', () => {
  it('對方被拿到只剩 2 顆就贏', () => {
    const s = stateOf({ B: ['a7', 'd7', 'g4', 'c3'], W: ['b6', 'a1', 'e5'] });
    const after = step(s, 'g4-g7 xa1');
    expect(after.winner).toBe('black');
    expect(after.reason).toBe('pieces');
    expect(legalMoves(after)).toEqual([]);
  });

  it('輪到對方時他沒有任何走法就贏', () => {
    // 白子在外圈四個角，四個中點都被黑佔住；黑走一步無關的
    const s = stateOf({ B: ['d7', 'a4', 'g4', 'd1', 'c3'], W: ['a7', 'g7', 'a1', 'g1'] });
    const after = applyMove(s, { kind: 'move', from: P('c3'), to: P('d3') });
    expect(after.winner).toBe('black');
    expect(after.reason).toBe('blocked');
  });

  it('走子階段同一局面第 3 次出現是和局', () => {
    const base = stateOf({ B: ['a7', 'c5', 'e3', 'g1'], W: ['g7', 'e5', 'c3', 'a1'] });
    // 開局那個局面算出現過一次（正常對局是放完最後一顆時記下來的）
    let s: MorrisState = { ...base, seen: { [positionKey(base.board, 'black')]: 1 } };
    s = step(s, 'a7-d7 g7-g4 d7-a7 g4-g7');
    expect(s.winner).toBeNull();
    s = step(s, 'a7-d7 g7-g4 d7-a7');
    expect(s.winner).toBeNull();
    s = applyMove(s, decodeMoves('g4-g7')[0]);
    expect(s.winner).toBe('draw');
    expect(s.reason).toBe('repetition');
  });

  it(`連續 ${QUIET_LIMIT} 手沒有人被拿子是和局；拿子會重新計算`, () => {
    const s = stateOf({ B: ['a7', 'c5', 'e3', 'g1'], W: ['g7', 'e5', 'c3', 'a1'] }, { quiet: QUIET_LIMIT - 1 });
    const after = applyMove(s, decodeMoves('a7-d7')[0]);
    expect(after.winner).toBe('draw');
    expect(after.reason).toBe('quiet');

    const capture = step(stateOf({ B: ['a7', 'd7', 'g4', 'c3'], W: ['b6', 'a1', 'e5', 'f2'] }, { quiet: 30 }), 'g4-g7 xa1');
    expect(capture.quiet).toBe(0);
    expect(capture.winner).toBeNull();
  });

  it('節目規則：有人剩 3 顆後僵持 10 回合，子少的一方輸；一樣多是和局', () => {
    const rules = { showRules: true };
    const fewer = stateOf({ B: ['a7', 'g1', 'd5'], W: ['g7', 'a1', 'c3', 'e3', 'b4'] }, { rules, quiet: 19 });
    const a = applyMove(fewer, decodeMoves('d5-e4')[0]);
    expect(a.winner).toBe('white');
    expect(a.reason).toBe('standoff');

    const equal = stateOf({ B: ['a7', 'g1', 'd5'], W: ['g7', 'a1', 'c3'] }, { rules, quiet: 19 });
    const b = applyMove(equal, decodeMoves('d5-e4')[0]);
    expect(b.winner).toBe('draw');
    expect(b.reason).toBe('standoff');

    // 傳統規則沒有這一條
    const classic = applyMove({ ...fewer, rules: { showRules: false } }, decodeMoves('d5-e4')[0]);
    expect(classic.winner).toBeNull();
  });

  it('節目規則的僵持期間不判同一局面三次（子少的一方不能靠重複局面換和局）', () => {
    const rules = { showRules: true };
    const base = stateOf({ B: ['a7', 'g1', 'd5'], W: ['g7', 'a1', 'c3', 'e3', 'b4'] }, { rules });
    let s: MorrisState = { ...base, seen: { [positionKey(base.board, 'black')]: 2 } };
    s = step(s, 'd5-e4 b4-b2 e4-d5 b2-b4');
    expect(s.winner).toBeNull();
  });
});

describe('悔棋', () => {
  it('拿子中悔棋退回成三之前；拿完之後悔棋退掉整個回合', () => {
    const removing = run('a7 b6 d7 b4 g7');
    expect(undoTurn(removing).history).toHaveLength(4);
    const done = applyMove(removing, { kind: 'remove', at: P('b6') });
    const back = undoTurn(done);
    expect(back.history).toHaveLength(4);
    expect(back.turn).toBe('black');
  });

  it('跟電腦下：退到又輪到你；電腦先手、你還沒下過就不能退', () => {
    const s = run('a7 b6');
    expect(undoPoint(s, 'black')).toBe(0);
    expect(undoTurn(s, 'black').history).toHaveLength(0);
    expect(undoPoint(run('a7'), 'white')).toBe(-1);
  });

  it('悔棋保留規則設定', () => {
    const s = run('a7 b6 d7', { showRules: true });
    expect(undoTurn(s).rules.showRules).toBe(true);
  });
});

/** 可重現的亂數 */
function rng(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

describe('棋譜字串', () => {
  it('一整局寫成字串再讀回來重走，是同一個局面', () => {
    const random = rng(7);
    let s = createGame();
    while (!s.winner && s.history.length < 400) {
      const moves = legalMoves(s);
      // 有得拿就拿（三種動作都要涵蓋到），其餘隨機
      s = applyMove(s, moves[Math.floor(random() * moves.length)]);
    }
    expect(new Set(s.history.map((m) => m.kind))).toEqual(new Set(['place', 'move', 'remove']));
    const text = encodeMoves(s.history);
    expect(decodeMoves(text)).toEqual(s.history);
    const again = replay(decodeMoves(text));
    expect(again.board).toEqual(s.board);
    expect(again.winner).toEqual(s.winner);
  });

  it('格式：放子 d2、走子 a1-a4、拿子 xd7', () => {
    expect(encodeMove({ kind: 'place', to: P('d2') })).toBe('d2');
    expect(encodeMove({ kind: 'move', from: P('a1'), to: P('a4') })).toBe('a1-a4');
    expect(encodeMove({ kind: 'remove', at: P('d7') })).toBe('xd7');
    expect(decodeMoves(' d2  a1-a4 xd7 ')).toEqual([
      { kind: 'place', to: P('d2') }, { kind: 'move', from: P('a1'), to: P('a4') }, { kind: 'remove', at: P('d7') },
    ] satisfies Move[]);
  });

  it('空字串是還沒開始；亂寫的字串丟錯；格式對但不合法由 replay 擋下', () => {
    expect(decodeMoves('')).toEqual([]);
    expect(() => decodeMoves('b1')).toThrow(); // 不是盤上的點
    expect(() => decodeMoves('a7 zz')).toThrow();
    expect(() => run('xd7')).toThrow();
    expect(() => run('a7 a7')).toThrow();
  });
});

describe('電腦對手', () => {
  it('開局回傳一個合法的動作', () => {
    for (const level of ['easy', 'normal', 'hard'] as const) {
      const turn = chooseTurn(createGame(), level, rng(1), { timeMs: 0, depth: level === 'hard' ? 3 : undefined });
      expect(turn).toHaveLength(1);
      expect(() => applyMove(createGame(), turn[0])).not.toThrow();
    }
  });

  it('能成三拿掉對方第 7 顆就一定拿（連簡單級的失誤也不會錯過決勝手）', () => {
    const s = stateOf({ B: ['a7', 'd7', 'g4', 'c3'], W: ['b6', 'a1', 'e5'] });
    const turn = chooseTurn(s, 'easy', () => 0);
    const after = turn.reduce(applyMove, s);
    expect(after.winner).toBe('black');
  });

  it('擋住對方下一手的成三', () => {
    // 白 b6、d6 只差 f6；黑沒有自己的成三可以搶先
    const s = run('a7 b6 g1 d6');
    const turn = chooseTurn(s, 'normal', () => 0.5);
    expect(turn).toEqual([{ kind: 'place', to: P('f6') }]);
  });

  it('停在該拿子的局面時，只回傳拿哪一顆', () => {
    const s = run('a7 b6 d7 b4 g7');
    const turn = chooseTurn(s, 'normal', () => 0.5);
    expect(turn).toHaveLength(1);
    expect(turn[0].kind).toBe('remove');
    expect(() => applyMove(s, turn[0])).not.toThrow();
  });

  it('電腦對電腦下完一整局不會出錯，而且一定分出結果或和局', () => {
    let s = createGame();
    const random = rng(3);
    while (!s.winner && s.history.length < 1000) {
      const level = s.turn === 'black' ? 'easy' : 'normal';
      const turn = chooseTurn(s, level, random);
      expect(turn.length).toBeGreaterThan(0);
      s = turn.reduce(applyMove, s);
    }
    expect(s.winner).not.toBeNull();
  });

  it('困難級每手在時間上限內（主執行緒上要不卡畫面）', () => {
    // 放子剛結束的中盤：照固定順序挑「不會成三」的點放滿 18 顆
    const order = ['d6', 'b4', 'f4', 'd2', 'd7', 'a4', 'g4', 'd1', 'd5', 'c4', 'e4', 'd3', 'b6', 'f6', 'b2', 'f2', 'a7', 'g7', 'a1', 'g1', 'c5', 'e5', 'c3', 'e3'].map(P);
    let s = createGame();
    while (s.inHand.black + s.inHand.white > 0) {
      const g = s;
      const to = order.find((p) => g.board[p] === null && !applyMove(g, { kind: 'place', to: p }).removing);
      s = applyMove(s, { kind: 'place', to: to! });
    }
    expect(s.inHand).toEqual({ black: 0, white: 0 });
    expect(s.board.filter(Boolean)).toHaveLength(18);
    const t0 = performance.now();
    const turn = chooseTurn(s, 'hard');
    expect(performance.now() - t0).toBeLessThan(600);
    expect(() => turn.reduce(applyMove, s)).not.toThrow();
  });
});
