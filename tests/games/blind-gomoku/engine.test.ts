import { describe, it, expect } from 'vitest';
import {
  createGame, applyMove, replay, undo, lastColor, lineThrough, isLegal,
  encodeMoves, decodeMoves, pointName, parsePoint, pointAt, sideOfPly,
  SIZE, POINTS, CENTER, COLORS, SHAPE_OF,
  type GomokuState, type Move, type Point, type Side, type Stone, type StoneColor,
} from '@/games/blind-gomoku/engine';
import { chooseMove, findVcf, type Level } from '@/games/blind-gomoku/ai';

/**
 * 用字串畫局面：X 黑、O 白、. 空點。只畫左上角的幾列就好，其餘補空。
 * 輪到誰由 turn 指定（測試只在意盤面，不在意這盤是怎麼下出來的）。
 */
function stateOf(rows: string[], turn: Side = 'white', color: StoneColor = 'red'): GomokuState {
  const board: (Stone | null)[] = Array(POINTS).fill(null);
  const moves: Move[] = [];
  rows.forEach((row, r) => row.split('').forEach((ch, c) => {
    if (ch === 'X' || ch === 'O') {
      board[pointAt(r, c)] = { side: ch === 'X' ? 'black' : 'white', color };
      moves.push({ at: pointAt(r, c), color });
    }
  }));
  return { ...createGame(), board, turn, moves };
}

const p = (r: number, c: number): Point => pointAt(r, c);
/** 固定的亂數，AI 的結果才能重現 */
const fixed = () => 0.5;
const hardOpts = { random: fixed, budgetMs: 10_000, maxDepth: 2 };

/** 照順序下一串點，顏色依序輪替（黑先） */
function playAll(points: Point[], colors: StoneColor[] = ['red']): GomokuState {
  return points.reduce((s, at, i) => applyMove(s, { at, color: colors[i % colors.length] }), createGame());
}

describe('開局與落子', () => {
  it('15×15、黑先、空盤', () => {
    const s = createGame();
    expect(SIZE).toBe(15);
    expect(s.board).toHaveLength(225);
    expect(s.board.every((x) => x === null)).toBe(true);
    expect(s.turn).toBe('black');
    expect(CENTER).toBe(p(7, 7));
    expect(pointName(CENTER)).toBe('h8');
  });

  it('黑白輪流，每顆子記得真正的一方與顯示的顏色', () => {
    let s = applyMove(createGame(), { at: CENTER, color: 'yellow' });
    expect(s.board[CENTER]).toEqual({ side: 'black', color: 'yellow' });
    expect(s.turn).toBe('white');
    s = applyMove(s, { at: p(6, 6), color: 'yellow' });
    expect(s.board[p(6, 6)]).toEqual({ side: 'white', color: 'yellow' });
    expect(s.turn).toBe('black');
    expect(sideOfPly(0)).toBe('black');
    expect(sideOfPly(1)).toBe('white');
  });

  it('不改傳入的局面', () => {
    const s = createGame();
    const before = JSON.stringify(s);
    applyMove(s, { at: CENTER, color: 'red' });
    expect(JSON.stringify(s)).toBe(before);
  });

  it('不能下在有子的點、盤外、或不存在的顏色', () => {
    const s = applyMove(createGame(), { at: CENTER, color: 'red' });
    expect(isLegal(s, CENTER)).toBe(false);
    expect(() => applyMove(s, { at: CENTER, color: 'red' })).toThrow();
    expect(() => applyMove(s, { at: -1, color: 'red' })).toThrow();
    expect(() => applyMove(s, { at: 225, color: 'red' })).toThrow();
    expect(() => applyMove(s, { at: 0, color: 'black' as StoneColor })).toThrow();
  });
});

describe('連五判定（自由五子棋）', () => {
  // 黑在第 r 列連下，白在遠處陪下
  const filler = [p(14, 0), p(14, 2), p(14, 4), p(14, 6), p(14, 8), p(14, 10)];
  function blackLine(cells: Point[]): GomokuState {
    const seq: Point[] = [];
    cells.forEach((c, i) => { seq.push(c); if (i < cells.length - 1) seq.push(filler[i]); });
    return playAll(seq);
  }

  it('橫、直、兩條斜線都算', () => {
    const lines: Point[][] = [
      [p(3, 3), p(3, 4), p(3, 5), p(3, 6), p(3, 7)],
      [p(2, 9), p(3, 9), p(4, 9), p(5, 9), p(6, 9)],
      [p(1, 1), p(2, 2), p(3, 3), p(4, 4), p(5, 5)],
      [p(1, 12), p(2, 11), p(3, 10), p(4, 9), p(5, 8)],
    ];
    for (const line of lines) {
      const s = blackLine(line);
      expect(s.winner).toBe('black');
      expect([...s.line!].sort((a, b) => a - b)).toEqual([...line].sort((a, b) => a - b));
    }
  });

  it('四顆還沒贏', () => {
    const s = blackLine([p(3, 3), p(3, 4), p(3, 5), p(3, 6)]);
    expect(s.winner).toBeNull();
  });

  it('連成 6 顆以上也算贏（長連不禁手）', () => {
    // 黑先下 3,3–3,5 與 3,7–3,8，最後補 3,6 變成六連
    const s = blackLine([p(3, 3), p(3, 4), p(3, 5), p(3, 7), p(3, 8), p(3, 6)]);
    expect(s.winner).toBe('black');
    expect(s.line).toHaveLength(6);
  });

  it('沒有三三、四四禁手：黑可以下雙活三、雙四', () => {
    // 雙活三：下在 (5,7)，橫的 (5,5)(5,6) 與直的 (3,7)(4,7) 同時成活三
    const s33 = stateOf([
      '...............',
      '...............',
      '...............',
      '.......X.......',
      '.......X.......',
      '.....XX........',
    ], 'black');
    expect(isLegal(s33, p(5, 7))).toBe(true);
    expect(applyMove(s33, { at: p(5, 7), color: 'red' }).winner).toBeNull();

    // 雙四：下在 (0,3)，橫的與直的同時成衝四
    const s44 = stateOf([
      'XXX............',
      '...X...........',
      '...X...........',
      '...X...........',
    ], 'black');
    const after = applyMove(s44, { at: p(0, 3), color: 'red' });
    expect(after.winner).toBeNull();
    expect(lineThrough(after.board, p(0, 3))).toBeNull();
    // 下一手兩邊都能連五
    expect(applyMove({ ...after, turn: 'black' }, { at: p(0, 4), color: 'red' }).winner).toBe('black');
    expect(applyMove({ ...after, turn: 'black' }, { at: p(4, 3), color: 'red' }).winner).toBe('black');
  });

  it('白也會贏', () => {
    const s = stateOf(['OOOO...........'], 'white');
    const after = applyMove(s, { at: p(0, 4), color: 'blue' });
    expect(after.winner).toBe('white');
  });

  it('連成之後不能再下', () => {
    const s = blackLine([p(3, 3), p(3, 4), p(3, 5), p(3, 6), p(3, 7)]);
    expect(isLegal(s, p(10, 10))).toBe(false);
  });

  it('下滿 225 格沒人連五是和局', () => {
    // 「黑黑白白」的條紋，每列錯開兩格：橫、直、兩條斜線最長都只有 2 顆同色
    const sideAt = (r: number, c: number): Side => ((c + 2 * r) % 4 < 2 ? 'black' : 'white');
    const blacks: Point[] = [];
    const whites: Point[] = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) (sideAt(r, c) === 'black' ? blacks : whites).push(p(r, c));
    expect(blacks.length).toBe(113);
    expect(whites.length).toBe(112);
    const seq: Point[] = [];
    for (let i = 0; i < 113; i++) { seq.push(blacks[i]); if (i < 112) seq.push(whites[i]); }
    const s = playAll(seq);
    expect(s.moves).toHaveLength(225);
    expect(s.winner).toBe('draw');
    expect(s.line).toBeNull();
  });
});

describe('顏色與形狀', () => {
  it('7 種顏色各配一個不同的形狀', () => {
    expect(COLORS).toHaveLength(7);
    const shapes = COLORS.map((c) => SHAPE_OF[c]);
    expect(new Set(shapes).size).toBe(7);
  });

  it('lastColor 是最後一顆子的顏色，空盤用預設', () => {
    expect(lastColor(createGame())).toBe('red');
    expect(lastColor(createGame(), 'green')).toBe('green');
    const s = playAll([CENTER, p(6, 6), p(8, 8)], ['blue', 'blue', 'pink']);
    expect(lastColor(s)).toBe('pink');
    expect(s.moves.map((m) => m.color)).toEqual(['blue', 'blue', 'pink']);
    expect(s.board[p(8, 8)]).toEqual({ side: 'black', color: 'pink' });
  });
});

describe('棋譜', () => {
  it('點的名字照連珠棋譜：a–o、下到上 1–15', () => {
    expect(pointName(p(14, 0))).toBe('a1');
    expect(pointName(p(0, 14))).toBe('o15');
    expect(parsePoint('h8')).toBe(CENTER);
    expect(parsePoint('p1')).toBeNull();
    expect(parsePoint('a16')).toBeNull();
  });

  it('編碼與解碼來回一致，重走得到同一個局面', () => {
    const s = playAll([CENTER, p(6, 6), p(8, 8), p(6, 8)], ['red', 'red', 'yellow', 'yellow']);
    const text = encodeMoves(s.moves);
    expect(text).toBe('h8r g9r i7y i9y');
    expect(decodeMoves(text)).toEqual(s.moves);
    expect(replay(decodeMoves(text))).toEqual(s);
    expect(decodeMoves('')).toEqual([]);
  });

  it('壞掉或不合法的棋譜會丟錯', () => {
    expect(() => decodeMoves('h8x')).toThrow();
    expect(() => decodeMoves('z9r')).toThrow();
    expect(() => replay(decodeMoves('h8r h8r'))).toThrow();
  });

  it('悔棋退回 n 手', () => {
    const s = playAll([CENTER, p(6, 6), p(8, 8)]);
    expect(undo(s, 2).moves).toHaveLength(1);
    expect(undo(s, 2).turn).toBe('white');
  });
});

describe('電腦對手', () => {
  const levels: Level[] = ['show', 'normal', 'hard'];

  it('跟玩家上一手同色', () => {
    for (const level of levels) {
      const s = playAll([CENTER], ['purple']);
      const m = chooseMove(s, level, hardOpts)!;
      expect(m.color).toBe('purple');
      expect(isLegal(s, m.at)).toBe(true);
    }
    // 玩家換色，電腦也跟著換
    const s2 = playAll([CENTER, p(6, 6), p(8, 8)], ['purple', 'purple', 'green']);
    expect(chooseMove(s2, 'normal', { random: fixed })!.color).toBe('green');
  });

  it('能連五就連五（不去擋）', () => {
    // 白有 4 連可以收，黑也有衝四
    const s = stateOf([
      '.OOOO..........',
      '...............',
      '..XXXX.........',
    ], 'white');
    for (const level of levels) {
      const m = chooseMove(s, level, hardOpts)!;
      expect([p(0, 0), p(0, 5)]).toContain(m.at);
    }
  });

  it('對手衝四一定擋', () => {
    const s = stateOf([
      'OXXXX..........',
      '...............',
      '......O........',
    ], 'white');
    for (const level of levels) expect(chooseMove(s, level, hardOpts)!.at).toBe(p(0, 5));
  });

  it('對手活四：擋其中一頭', () => {
    const s = stateOf([
      '...............',
      '..XXXX.........',
      '.......O.......',
      '........O......',
    ], 'white');
    for (const level of ['normal', 'hard'] as Level[]) {
      expect([p(1, 1), p(1, 6)]).toContain(chooseMove(s, level, hardOpts)!.at);
    }
  });

  it('普通與困難會擋活三（連著的與跳三都會）', () => {
    const open = stateOf([
      '...............',
      '...............',
      '...............',
      '....XXX........',
      '...............',
      '...........O...',
    ], 'white');
    const split = stateOf([
      '...............',
      '...............',
      '...............',
      '....X.XX.......',
      '...............',
      '...........O...',
    ], 'white');
    for (const level of ['normal', 'hard'] as Level[]) {
      expect([p(3, 3), p(3, 7), p(3, 2), p(3, 8)]).toContain(chooseMove(open, level, hardOpts)!.at);
      expect([p(3, 3), p(3, 5), p(3, 8)]).toContain(chooseMove(split, level, hardOpts)!.at);
    }
  });

  it('節目級看不出跳三：自顧自地進攻', () => {
    // 黑有一個斜向的跳三（河錫辰的下法），白在遠處有自己的活二可以長
    const s = stateOf([
      '...............',
      '..X............',
      '...............',
      '....X..........',
      '.....X.........',
      '...............',
      '...............',
      '...............',
      '...............',
      '...............',
      '.........OO....',
    ], 'white');
    const blocks = [p(2, 3), p(0, 1), p(5, 6), p(6, 7)];
    for (let i = 0; i < 20; i++) {
      const r = (i + 0.5) / 20;
      expect(blocks).not.toContain(chooseMove(s, 'show', { random: () => r })!.at);
    }
    // 普通級就會擋（跳三的空格或兩端）
    expect(blocks).toContain(chooseMove(s, 'normal', { random: fixed })!.at);
  });

  it('節目級看得出連著的三，沒有更好的攻擊時會擋', () => {
    const s = stateOf([
      '...............',
      '...............',
      '...............',
      '....XXX........',
      '...............',
      '...............',
      '.............O.',
    ], 'white');
    expect([p(3, 3), p(3, 7)]).toContain(chooseMove(s, 'show', { random: fixed })!.at);
  });

  it('困難級找得到連續衝四的必勝', () => {
    // 白：橫的眠三（左邊被擋）＋斜的兩顆。衝四 (2,5) 逼黑擋 (2,6)，(2,5) 又讓斜線變成三，再衝就是活四
    const s = stateOf([
      '...............',
      '...............',
      '.XOOO..........',
      '....O..........',
      '...O...........',
    ], 'white');
    expect(findVcf(s)).toBe(p(2, 5));
    expect(chooseMove(s, 'hard', hardOpts)!.at).toBe(p(2, 5));
    // 沒有衝四可衝的局面就沒有 VCF
    expect(findVcf(stateOf(['...............', '.....O.X.......'], 'white'))).toBeNull();
  });

  it('局面結束就不再下', () => {
    const s = stateOf(['XXXXX..........'], 'white');
    expect(chooseMove({ ...s, winner: 'black' }, 'normal')).toBeNull();
  });

  it('困難級一手在時間內回應', () => {
    // 中盤局面：讓普通級自己對下 16 手
    let s = playAll([CENTER]);
    while (s.moves.length < 16) s = applyMove(s, chooseMove(s, 'normal', { random: fixed })!);
    expect(s.winner).toBeNull();
    const t0 = performance.now();
    const m = chooseMove(s, 'hard', { random: fixed, budgetMs: 300 });
    const elapsed = performance.now() - t0;
    expect(m).not.toBeNull();
    // 預算 300ms，加上 VCF 檢查與機器差異，留一些餘裕
    expect(elapsed).toBeLessThan(1_500);
  });
});
