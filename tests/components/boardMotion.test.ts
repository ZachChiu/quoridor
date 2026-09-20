import { describe, it, expect } from 'vitest';
import { boardSignature, diffBoard, territoryWave, newWall, pathBetween } from '@/components/boardMotion';
import type { Player } from '@/types/chessboard';

const grid = (rows: string[]): Player[][] =>
  rows.map((r) => [...r].map((ch) => (ch === '.' ? null : (ch as Player))));

describe('diffBoard', () => {
  const size = 3;

  it('一來一往同色 → 判定為移動，並算出來源方向', () => {
    const a = boardSignature(grid(['A..', '...', '...']));
    const b = boardSignature(grid(['...', '...', '..A']));
    // 從 (0,0) 到 (2,2)：往右下走，所以動畫要從左上（負值）滑進來
    expect(diffBoard(a, b, size)).toEqual({ slide: { '2,2': { dx: -2, dy: -2 } }, drop: [] });
  });

  it('憑空多一顆 → 落子，不是移動', () => {
    const a = boardSignature(grid(['...', '...', '...']));
    const b = boardSignature(grid(['...', '.B.', '...']));
    expect(diffBoard(a, b, size)).toEqual({ slide: {}, drop: ['1,1'] });
  });

  it('異色的一來一往不算移動 —— 那是兩件事剛好同時發生', () => {
    const a = boardSignature(grid(['A..', '...', '...']));
    const b = boardSignature(grid(['...', '...', '..B']));
    expect(diffBoard(a, b, size)).toEqual({ slide: {}, drop: [] });
  });

  it('整盤重播（一次多顆）不播動畫 —— 寧可不播也不要播出沒發生的移動', () => {
    const a = boardSignature(grid(['...', '...', '...']));
    const b = boardSignature(grid(['A.B', '...', 'B.A']));
    expect(diffBoard(a, b, size)).toEqual({ slide: {}, drop: [] });
  });

  it('盤面沒變就沒有動畫', () => {
    const a = boardSignature(grid(['A..', '...', '..B']));
    expect(diffBoard(a, a, size)).toEqual({ slide: {}, drop: [] });
  });

  it('簽章長度對不上時安全退場（換盤面大小的瞬間）', () => {
    expect(diffBoard('AA', 'A'.repeat(9), 3)).toEqual({ slide: {}, drop: [] });
  });
});

describe('territoryWave', () => {
  const board = grid(['A..', '...', '..B']);

  it('延遲隨著離擁有者棋子的距離遞增', () => {
    const wave = territoryWave({}, { '0,0': 'A', '0,1': 'A', '0,2': 'A' }, board, 45);
    expect(wave['0,0']).toBe(0);
    expect(wave['0,1']).toBe(45);
    expect(wave['0,2']).toBe(90);
  });

  it('各自從自己的棋子算起，不是從盤面中心', () => {
    const wave = territoryWave({}, { '0,0': 'A', '2,2': 'B' }, board, 45);
    expect(wave['0,0']).toBe(0);
    expect(wave['2,2']).toBe(0); // B 的棋子就在 (2,2)
  });

  it('已經是自己的格子不重播', () => {
    const wave = territoryWave({ '0,1': 'A' }, { '0,1': 'A', '0,2': 'A' }, board, 45);
    expect(wave['0,1']).toBeUndefined();
    expect(wave['0,2']).toBe(90);
  });

  it('易主的格子要重播', () => {
    const wave = territoryWave({ '2,1': 'A' }, { '2,1': 'B' }, board, 45);
    expect(wave['2,1']).toBe(45); // B 在 (2,2)，距離 1
  });

  it('延遲有上限 —— 大片領地不能讓最後一格等到天荒地老', () => {
    const wide = grid(['A' + '.'.repeat(20)]);
    const next: Record<string, Player> = {};
    for (let c = 0; c < 21; c++) next[`0,${c}`] = 'A';
    const wave = territoryWave({}, next, wide, 45, 300);
    expect(Math.max(...Object.values(wave))).toBe(300);
  });
});

describe('newWall', () => {
  it('新增一道橫牆', () => {
    expect(newWall({ h: '...', v: '...' }, { h: '.A.', v: '...' })).toBe('h:1');
  });

  it('新增一道直牆', () => {
    expect(newWall({ h: '...', v: '...' }, { h: '...', v: '..B' })).toBe('v:2');
  });

  it('一次多出兩道 → 判定為重播，整組不播', () => {
    expect(newWall({ h: '...', v: '...' }, { h: 'A..', v: '..A' })).toBeNull();
  });

  it('破牆（少一道）不觸發生長動畫', () => {
    expect(newWall({ h: '.A.', v: '...' }, { h: '...', v: '...' })).toBeNull();
  });

  it('沒有變化時回傳 null', () => {
    expect(newWall({ h: '.A.', v: 'B..' }, { h: '.A.', v: 'B..' })).toBeNull();
  });
});

describe('pathBetween（棋子沿格子走的路徑）', () => {
  const noWalls = (n: number) => ({
    h: Array.from({ length: n }, () => Array<Player>(n).fill(null)),
    v: Array.from({ length: n }, () => Array<Player>(n).fill(null)),
  });

  it('一步就是兩格', () => {
    const board = grid(['...', '.A.', '...']);
    expect(pathBetween(board, noWalls(3), [1, 0], [1, 1])).toEqual([[1, 0], [1, 1]]);
  });

  it('直線兩步經過中間那格，不會抄近路', () => {
    const board = grid(['...', '..A', '...']);
    expect(pathBetween(board, noWalls(3), [1, 0], [1, 2])).toEqual([[1, 0], [1, 1], [1, 2]]);
  });

  it('L 形兩步一定有轉角 —— 不是斜線', () => {
    const board = grid(['...', '...', '..A']);
    const p = pathBetween(board, noWalls(3), [1, 1], [2, 2])!;
    expect(p).toHaveLength(3);
    expect(p[0]).toEqual([1, 1]);
    expect(p[2]).toEqual([2, 2]);
    // 轉角必須與起點共用一個座標軸（真的是沿著格子走）
    expect(p[1][0] === 1 || p[1][1] === 1).toBe(true);
  });

  it('慣用的那個轉角被牆擋住時，改走另一邊', () => {
    const board = grid(['...', '...', '..A']);
    const w = noWalls(3);
    w.v[1][1] = 'B';       // (1,1) 右邊有牆 → 不能先往右
    const p = pathBetween(board, w, [1, 1], [2, 2])!;
    expect(p).toEqual([[1, 1], [2, 1], [2, 2]]);
  });

  it('不穿過別人的棋子', () => {
    const board = grid(['...', '.BA', '...']);
    // (1,0) → (1,2) 的直線被 (1,1) 的 B 擋住，兩步內繞不過去
    expect(pathBetween(board, noWalls(3), [1, 0], [1, 2])).toBeNull();
  });

  it('兩步到不了就回傳 null，由呼叫端退回直線', () => {
    const board = grid(['...', '...', '..A']);
    expect(pathBetween(board, noWalls(3), [0, 0], [2, 2])).toBeNull();
  });
});
