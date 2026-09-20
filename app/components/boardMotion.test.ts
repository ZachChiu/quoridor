import { describe, it, expect } from 'vitest';
import { boardSignature, diffBoard, territoryWave, newWall } from './boardMotion';
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
