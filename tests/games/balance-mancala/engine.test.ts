import { describe, it, expect } from 'vitest';
import {
  createGame, place, legalPlacements, setupOrderOf, sourcesOf, sow, applyMove, isLegalMove, colourOptions,
  finalScore, standings, winners, encodeMove, decodeMove, encodeGame, decodeGame, replay, seatOfLetter,
  CELLS, DEVIL, ANGEL, CELL_COLOUR, SETUP_CAP,
  type MancalaState, type Scores, type Move,
} from '@/games/balance-mancala/engine';
import { chooseMove, choosePlacement, suggestMove, suggestColour } from '@/games/balance-mancala/ai';

/** 可重現的亂數（mulberry32） */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 用字串畫盤面：14 格，每格是裡面子的主人（字母），例如 ['A', '', 'BC', …] */
function stateOf(cells: string[], opts: { scores?: Scores[]; turn?: number; seats?: number } = {}): MancalaState {
  const seats = opts.seats ?? 4;
  if (cells.length !== CELLS) throw new Error('need 14 cells');
  return {
    ...createGame({ seats }),
    board: cells.map((c) => [...c].map(seatOfLetter)),
    scores: opts.scores ?? Array.from({ length: seats }, () => [0, 0, 0] as Scores),
    phase: 'play',
    turn: opts.turn ?? 0,
  };
}
const empty = () => Array<string>(CELLS).fill('');

describe('棋盤', () => {
  it('惡魔在 0、天使在 7，其餘依序紅藍綠', () => {
    expect(CELL_COLOUR[DEVIL]).toBeNull();
    expect(CELL_COLOUR[ANGEL]).toBeNull();
    expect(CELL_COLOUR.slice(1, 7)).toEqual([0, 1, 2, 0, 1, 2]);
    expect(CELL_COLOUR.slice(8)).toEqual([0, 1, 2, 0, 1, 2]);
  });
});

describe('開局放子', () => {
  it('依座位 1→N 輪流；蛇形是來回', () => {
    expect(setupOrderOf({ seats: 4, pieces: 2, snake: false })).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
    expect(setupOrderOf({ seats: 4, pieces: 3, snake: true })).toEqual([0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3]);
  });

  it('4 席 × 4 子：放滿 16 顆就進入播種，由 A 先動', () => {
    let s = createGame();
    expect(s.phase).toBe('setup');
    for (let i = 0; i < 16; i++) {
      expect(s.turn).toBe(i % 4);
      s = place(s, legalPlacements(s)[0]);
    }
    expect(s.phase).toBe('play');
    expect(s.turn).toBe(0);
    expect(s.board.flat()).toHaveLength(16);
    expect(s.board.every((c) => c.length <= SETUP_CAP)).toBe(true);
    for (let seat = 0; seat < 4; seat++) expect(s.board.flat().filter((x) => x === seat)).toHaveLength(4);
    expect(() => place(s, 3)).toThrow();
  });

  it('7 席 × 4 子剛好把 14 格各填 2 顆', () => {
    let s = createGame({ seats: 7 });
    while (s.phase === 'setup') s = place(s, legalPlacements(s)[0]);
    expect(s.board.every((c) => c.length === 2)).toBe(true);
  });

  it('滿 2 顆的格不能再放；不改傳入的局面', () => {
    let s = createGame();
    s = place(place(s, 5), 5);
    expect(legalPlacements(s)).not.toContain(5);
    expect(() => place(s, 5)).toThrow();
    const before = JSON.stringify(s);
    place(s, 6);
    expect(JSON.stringify(s)).toBe(before);
  });

  it('席數與子數超出範圍丟錯', () => {
    expect(() => createGame({ seats: 3 })).toThrow();
    expect(() => createGame({ seats: 8 })).toThrow();
    expect(() => createGame({ seats: 4, pieces: 8 })).toThrow();
    expect(() => createGame({ seats: 4, pieces: 7 })).not.toThrow();
  });
});

describe('播種', () => {
  it('拿起整格、從下一格順時針放，順序由動子的人決定', () => {
    const cells = empty();
    cells[3] = 'ABC';
    cells[5] = 'D';
    const s = stateOf(cells);
    const r = sow(s, 3, [2, 0, 1]); // C、A、B
    expect(r.path).toEqual([4, 5, 6]);
    expect(r.board[3]).toEqual([]);
    expect(r.board[4]).toEqual([2]);
    expect(r.board[5]).toEqual([3, 0]);
    expect(r.board[6]).toEqual([1]);
    // 最後一顆是 B，落在 6（綠），格裡 1 顆 → B 綠 +1
    expect(r.owner).toBe(1);
    expect(r.points).toBe(1);
    expect(r.colour).toBe(2);
    expect(r.scores[1]).toEqual([0, 0, 1]);
  });

  it('最後一顆可以給別人得分：分數＝那格現在的子數、記那格的顏色', () => {
    // 節目紀錄的例子：從 12 號盤（格 13）播 2 顆，落在 01（紅），得紅分
    const cells = empty();
    cells[13] = 'AC';
    cells[1] = 'BBD';
    const s2 = stateOf(cells, { turn: 0 });
    const r = applyMove(s2, { from: 13, order: [0, 2] });
    expect(r.last!.path).toEqual([0, 1]);
    expect(r.last!.owner).toBe(2);
    expect(r.last!.points).toBe(4);
    expect(r.scores[2]).toEqual([4, 0, 0]);
    expect(r.scores[0]).toEqual([0, 0, 0]);
    expect(r.turn).toBe(1);
  });

  it('只能從有自己子的格出發；順序必須正好是那格的子', () => {
    const cells = empty();
    cells[2] = 'BC';
    cells[4] = 'AB';
    const s = stateOf(cells, { turn: 0 });
    expect(sourcesOf(s)).toEqual([4]);
    expect(isLegalMove(s, { from: 2, order: [1, 2] })).toBe(false);
    expect(isLegalMove(s, { from: 4, order: [0, 0] })).toBe(false);
    expect(isLegalMove(s, { from: 4, order: [0] })).toBe(false);
    expect(isLegalMove(s, { from: 4, order: [1, 0] })).toBe(true);
  });

  it('一次拿起 14 顆以上不跳過原格', () => {
    const cells = empty();
    cells[0] = 'AAAABBBBCCCCDDD'; // 15 顆
    const s = stateOf(cells);
    const order = s.board[0].slice();
    const r = sow(s, 0, order);
    expect(r.path[13]).toBe(0);
    expect(r.path[14]).toBe(1);
    expect(r.board[0]).toHaveLength(1);
    expect(r.board[1]).toHaveLength(2);
  });

  it('不改傳入的局面', () => {
    const cells = empty();
    cells[3] = 'ABC';
    const s = stateOf(cells);
    const before = JSON.stringify(s);
    applyMove(s, { from: 3, order: [1, 2, 0] });
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe('天使與惡魔', () => {
  it('天使格記到主人最低的顏色', () => {
    const cells = empty();
    cells[6] = 'A';
    cells[7] = 'B';
    const scores: Scores[] = [[5, 2, 9], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
    const r = applyMove(stateOf(cells, { scores }), { from: 6, order: [0] });
    expect(r.last!.cell).toBe(ANGEL);
    expect(r.scores[0]).toEqual([5, 4, 9]); // 藍最低，+2
    expect(r.moves[0]).toEqual({ from: 6, order: [0], colour: 1 });
  });

  it('惡魔格記到主人最高的顏色', () => {
    const cells = empty();
    cells[12] = 'BA'; // 播 2 顆：12→13、14→0（惡魔）
    cells[0] = 'CC';
    const scores: Scores[] = [[5, 2, 9], [3, 8, 1], [0, 0, 0], [0, 0, 0]];
    // A 動，讓 B 的子最後落進惡魔格：B 最高是藍 8，+3
    const r = applyMove(stateOf(cells, { scores }), { from: 12, order: [0, 1] });
    expect(r.last!.cell).toBe(DEVIL);
    expect(r.scores[1]).toEqual([3, 11, 1]);
  });

  it('同分時由動子的人選色，沒選就不合法', () => {
    expect(colourOptions([4, 4, 9], ANGEL)).toEqual([0, 1]);
    expect(colourOptions([4, 9, 9], DEVIL)).toEqual([1, 2]);
    expect(colourOptions([4, 9, 9], 5)).toEqual([CELL_COLOUR[5]]);
    const cells = empty();
    cells[6] = 'AB';
    const scores: Scores[] = [[0, 0, 0], [6, 6, 2], [0, 0, 0], [0, 0, 0]];
    const s = stateOf(cells, { scores });
    // 最後一顆 B 落在 8（紅盤）→ 不用選
    expect(isLegalMove(s, { from: 6, order: [0, 1] })).toBe(true);
    // 換個起點：從 5 播 2 顆，最後落在 7（天使），B 最低是綠 2 → 不用選
    const cells2 = empty();
    cells2[5] = 'AB';
    const s2 = stateOf(cells2, { scores: [[0, 0, 0], [6, 2, 2], [0, 0, 0], [0, 0, 0]] });
    expect(isLegalMove(s2, { from: 5, order: [0, 1] })).toBe(false); // 藍綠同為 2，要選
    expect(isLegalMove(s2, { from: 5, order: [0, 1], colour: 0 })).toBe(false); // 紅不是最低
    const r = applyMove(s2, { from: 5, order: [0, 1], colour: 2 });
    expect(r.scores[1]).toEqual([6, 2, 3]);
    expect(sow(s2, 5, [0, 1]).colour).toBeNull(); // 預覽：還沒選
  });
});

describe('結束與計分', () => {
  it('任一色到 30 遊戲立刻結束', () => {
    const cells = empty();
    cells[3] = 'B';
    cells[4] = 'CCD';
    const scores: Scores[] = [[0, 0, 0], [27, 26, 10], [0, 0, 0], [0, 0, 0]];
    const s = stateOf(cells, { scores, turn: 1 });
    const r = applyMove(s, { from: 3, order: [1] }); // 落在 4（紅），4 顆 → 31
    expect(r.scores[1][0]).toBe(31);
    expect(r.phase).toBe('over');
    expect(() => applyMove(r, { from: 4, order: r.board[4] })).toThrow();
  });

  it('最終分數＝2×最低−最高', () => {
    expect(finalScore([13, 11, 20])).toBe(2);
    expect(finalScore([12, 11, 17])).toBe(5);
    expect(finalScore([13, 10, 32])).toBe(-12);
    expect(finalScore([16, 16, 16])).toBe(16);
  });

  it('同分比最高色較低者，再同就並列', () => {
    // A：2×10−14＝6、最高 14；B：2×12−18＝6、最高 18；C：6、最高 14（同 A）；D：0
    const scores: Scores[] = [[10, 12, 14], [12, 18, 15], [14, 10, 13], [0, 0, 0]];
    const st = standings({ scores });
    expect(st.map((r) => r.seat)).toEqual([0, 2, 1, 3]);
    expect(st.map((r) => r.rank)).toEqual([1, 1, 3, 4]);
    expect(winners({ scores })).toEqual([0, 2]);
  });
});

describe('棋譜', () => {
  it('一手的字串往返', () => {
    const m: Move = { from: 12, order: [2, 0, 4] };
    expect(encodeMove(m)).toBe('12:C,A,E');
    expect(decodeMove('12:C,A,E')).toEqual(m);
    expect(decodeMove('6:B,A/G')).toEqual({ from: 6, order: [1, 0], colour: 2 });
    expect(() => decodeMove('14:A')).toThrow();
    expect(() => decodeMove('3:A,H')).toThrow();
  });

  it('整局往返：重播得到同一個局面', () => {
    const random = rng(7);
    let s = createGame({ seats: 5, snake: true });
    while (s.phase === 'setup') s = place(s, choosePlacement(s, 'normal', random)!);
    for (let i = 0; i < 40 && s.phase === 'play'; i++) s = applyMove(s, chooseMove(s, 'easy', { random })!);
    const text = encodeGame(s);
    expect(text.startsWith('5x4s|')).toBe(true);
    const back = replay(text);
    expect(back.board).toEqual(s.board);
    expect(back.scores).toEqual(s.scores);
    expect(back.turn).toBe(s.turn);
    expect(back.phase).toBe(s.phase);
    expect(encodeGame(back)).toBe(text);
    expect(decodeGame(text).moves).toEqual(s.moves);
    // 只播到第 10 手
    expect(replay(text, 10).moves).toHaveLength(10);
  });

  it('被竄改的棋譜丟錯', () => {
    expect(() => replay('4x4|0,0,0|')).toThrow(); // 第三顆放進已滿的格
    expect(() => decodeGame('4x4|1,2')).toThrow();
    expect(() => replay('9x4||')).toThrow();
  });
});

describe('電腦對手', () => {
  it('每個難度都只走合法的手，開局也只放合法的格', () => {
    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      const random = rng(difficulty.length * 31);
      let s = createGame({ seats: 4 });
      while (s.phase === 'setup') {
        const cell = choosePlacement(s, difficulty, random)!;
        expect(legalPlacements(s)).toContain(cell);
        s = place(s, cell);
      }
      for (let i = 0; i < 30 && s.phase === 'play'; i++) {
        const m = chooseMove(s, difficulty, { random })!;
        expect(isLegalMove(s, m), `${difficulty} #${i} ${encodeMove(m)}`).toBe(true);
        s = applyMove(s, m);
      }
    }
  });

  it('整局打得完，而且一手只要幾毫秒', () => {
    const random = rng(42);
    let s = createGame({ seats: 7 });
    while (s.phase === 'setup') s = place(s, choosePlacement(s, 'hard', random)!);
    let worst = 0;
    let n = 0;
    while (s.phase === 'play' && n < 800) {
      const t0 = performance.now();
      const m = chooseMove(s, 'hard', { random })!;
      worst = Math.max(worst, performance.now() - t0);
      s = applyMove(s, m);
      n++;
    }
    expect(s.phase).toBe('over');
    expect(worst).toBeLessThan(400);
  });

  it('能讓自己贏的 30 分終局會觸發；會輸就不觸發', () => {
    // A 領先，可以把自己的子落在紅盤 4（3 顆）讓紅到 30 —— A 的最終分數仍是第一
    const cells = empty();
    cells[3] = 'A';
    cells[4] = 'BB';
    cells[9] = 'A';
    const winning: Scores[] = [[27, 22, 22], [10, 2, 25], [5, 5, 20], [3, 9, 21]];
    const s = stateOf(cells, { scores: winning });
    const m = chooseMove(s, 'hard', { random: rng(1) })!;
    expect(applyMove(s, m).phase).toBe('over');
    // 同一個局面但 A 落後：不會把自己推過 30
    const losing: Scores[] = [[27, 5, 9], [18, 17, 19], [16, 15, 17], [3, 9, 21]];
    const s2 = stateOf(cells, { scores: losing });
    const m2 = chooseMove(s2, 'hard', { random: rng(1) })!;
    expect(applyMove(s2, m2).phase).toBe('play');
  });

  it('建議排法與建議顏色都合法', () => {
    const cells = empty();
    cells[5] = 'ABCA';
    cells[2] = 'D';
    const s = stateOf(cells, { scores: [[3, 3, 1], [4, 0, 0], [0, 2, 0], [1, 1, 1]] });
    const m = suggestMove(s, 5, undefined, rng(3))!;
    expect(m.from).toBe(5);
    expect(isLegalMove(s, m)).toBe(true);
    const lastB = suggestMove(s, 5, 1, rng(3))!;
    expect(lastB.order[lastB.order.length - 1]).toBe(1);
    // 從 5 播 2 顆落在天使格、A 紅藍同為 3：建議的顏色要在選項裡
    const cells2 = empty();
    cells2[5] = 'AA';
    const s2 = stateOf(cells2, { scores: [[3, 3, 5], [0, 0, 0], [0, 0, 0], [0, 0, 0]] });
    expect([0, 1]).toContain(suggestColour(s2, 5, [0, 0]));
  });
});
