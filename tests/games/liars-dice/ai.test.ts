import { describe, expect, it } from 'vitest';
import { atLeast, bidChance, candidates, decide, exactly, hitChance, LEVELS, type Level } from '@/games/liars-dice/ai';
import {
  DEFAULT_OPTIONS, callExact, challenge, isLegalBid, newGame, nextRound, placeBid, seededRng, type Face, type State,
} from '@/games/liars-dice/engine';

function table(dice: Face[][], turn = 0): State {
  return { ...newGame(dice.length, DEFAULT_OPTIONS, seededRng(1)), dice, turn };
}

describe('大話骰的電腦對手', () => {
  it('二項分布：邊界與加總', () => {
    expect(atLeast(10, 0, 1 / 6)).toBe(1);
    expect(atLeast(3, 4, 0.5)).toBe(0);
    expect(atLeast(2, 1, 0.5)).toBeCloseTo(0.75);
    let sum = 0;
    for (let k = 0; k <= 8; k++) sum += exactly(8, k, 1 / 3);
    expect(sum).toBeCloseTo(1);
    expect(hitChance(4, true)).toBeCloseTo(1 / 3);
    expect(hitChance(1, true)).toBeCloseTo(1 / 6);
    expect(hitChance(4, false)).toBeCloseTo(1 / 6);
  });

  it('自己手上就湊得到的那一口一定是真的', () => {
    const s = table([[4, 4, 1, 2, 3], [2, 2, 2, 2, 2]]);
    expect(bidChance(s, 0, { count: 3, face: 4 }, true)).toBe(1);
    expect(bidChance(s, 0, { count: 3, face: 4 }, false)).toBeLessThan(1);
  });

  it('場上那一口不可能是真的就開', () => {
    // 全桌 4 顆，自己沒有 6 → 4 個 6 只有對方 2 顆全是 6 或 1 也不夠
    const s = placeBid(table([[2, 3], [5, 5]], 1), { count: 4, face: 6 });
    for (const lv of LEVELS) expect(decide(s, 0, lv, seededRng(9))).toEqual({ type: 'challenge' });
  });

  it('喊出來的一定合法；候選的每一口都比場上大', () => {
    const rng = seededRng(11);
    for (let i = 0; i < 300; i++) {
      let s = newGame(2 + (i % 5), DEFAULT_OPTIONS, rng);
      if (i % 2) s = placeBid(s, candidates(s)[Math.floor(rng() * 4)]);
      for (const c of candidates(s)) expect(isLegalBid(s, c)).toBe(true);
      const a = decide(s, s.turn, LEVELS[i % 3], rng);
      if (a.type === 'bid') expect(isLegalBid(s, a.bid)).toBe(true);
      else expect(s.bid).not.toBeNull();
    }
  });

  it('電腦對打到底一定會結束，老手對新手贏得比較多', () => {
    const rng = seededRng(77);
    const wins: Record<Level, number> = { easy: 0, normal: 0, hard: 0 };
    for (let game = 0; game < 120; game++) {
      // 兩邊輪流當先手：第 0 位是老手、第 1 位是新手，第 2 位以後不放
      const levels: Level[] = game % 2 ? ['hard', 'easy'] : ['easy', 'hard'];
      let s = newGame(2, { wild: true, exact: game % 4 === 0 }, rng, game % 2);
      for (let step = 0; step < 3000 && s.phase !== 'over'; step++) {
        if (s.phase === 'reveal') { s = nextRound(s, rng); continue; }
        const a = decide(s, s.turn, levels[s.turn], rng);
        s = a.type === 'bid' ? placeBid(s, a.bid) : a.type === 'exact' ? callExact(s) : challenge(s);
      }
      expect(s.phase).toBe('over');
      wins[levels[s.winner!]]++;
    }
    expect(wins.hard).toBeGreaterThan(wins.easy);
  });
});
