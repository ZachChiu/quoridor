import { describe, it, expect } from 'vitest';
import { resignOutcome, type Scores } from '@/game/score';

/**
 * 投降就是輸。
 *
 * 先前的語意是「就此收手、照現況算分」—— 投降的人地比較多時，
 * 按下投降反而會贏，等於一顆「領先就結束」的按鈕。
 */
const sizes = (a: number[], b: number[], c: number[] = []) => ({ A: a, B: b, C: c });

describe('resignOutcome', () => {
  it('兩人局：投降的人輸，就算他的地比較多', () => {
    const scores: Scores = { A: 30, B: 2, C: 0 };
    expect(resignOutcome(scores, 2, 'A', sizes([30], [2]))).toEqual(['B']);
    expect(resignOutcome(scores, 2, 'B', sizes([30], [2]))).toEqual(['A']);
  });

  it('兩人局：0 比 0 投降也不是平手', () => {
    expect(resignOutcome({ A: 0, B: 0, C: 0 }, 2, 'A', sizes([], []))).toEqual(['B']);
  });

  it('三人局：剩下兩人照現況比，投降的人再多地也不算', () => {
    const scores: Scores = { A: 40, B: 5, C: 3 };
    expect(resignOutcome(scores, 3, 'A', sizes([40], [5], [3]))).toEqual(['B']);
  });

  it('三人局：剩下兩人同分比最大的一塊', () => {
    const scores: Scores = { A: 0, B: 6, C: 6 };
    expect(resignOutcome(scores, 3, 'A', sizes([], [3, 3], [6]))).toEqual(['C']);
  });

  it('三人局：剩下兩人完全相同就並列勝方，不是 draw', () => {
    const scores: Scores = { A: 9, B: 4, C: 4 };
    const out = resignOutcome(scores, 3, 'A', sizes([9], [4], [4]));
    expect(out).toEqual(['B', 'C']);
    expect(out).not.toContain('draw');
    expect(out).not.toContain('A');
  });
});
