import { describe, expect, it } from 'vitest';
import { isKnightMove } from '@/games/knights-tour/engine';
import { EULER_TOUR } from '@/games/knights-tour/euler';

describe('歐拉的騎士巡邏（首頁 Fig. 1）', () => {
  it('64 格各走一次', () => {
    expect([...EULER_TOUR].sort((a, b) => a - b)).toEqual(Array.from({ length: 64 }, (_, i) => i));
  });
  it('每一步都是馬步', () => {
    for (let i = 1; i < EULER_TOUR.length; i++) expect(isKnightMove(8, EULER_TOUR[i - 1], EULER_TOUR[i])).toBe(true);
  });
});
