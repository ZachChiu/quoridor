import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OPTIONS, START_DICE, callExact, challenge, countMatching, isHigher, isLegalBid, minCountFor, newGame, nextAlive,
  nextRound, placeBid, seededRng, totalDice, type Face, type State,
} from '@/games/liars-dice/engine';

/** 擺一個固定的局面：dice 直接給，輪到 turn */
function table(dice: Face[][], turn = 0, options = DEFAULT_OPTIONS): State {
  return { ...newGame(dice.length, options, seededRng(1)), dice, turn };
}

describe('大話骰的規則', () => {
  it('開局每人 5 顆、同一個種子擲出同一盤', () => {
    const a = newGame(4, DEFAULT_OPTIONS, seededRng(42));
    const b = newGame(4, DEFAULT_OPTIONS, seededRng(42));
    expect(a.dice).toEqual(b.dice);
    expect(a.dice.every((d) => d.length === START_DICE)).toBe(true);
    expect(totalDice(a)).toBe(20);
    expect(() => newGame(1, DEFAULT_OPTIONS, seededRng(1))).toThrow();
    expect(() => newGame(7, DEFAULT_OPTIONS, seededRng(1))).toThrow();
  });

  it('喊得更大：個數更多，或個數一樣、點數更大；1 排最大', () => {
    expect(isHigher({ count: 3, face: 2 }, { count: 2, face: 6 })).toBe(true);
    expect(isHigher({ count: 2, face: 5 }, { count: 2, face: 4 })).toBe(true);
    expect(isHigher({ count: 2, face: 1 }, { count: 2, face: 6 })).toBe(true);
    expect(isHigher({ count: 2, face: 6 }, { count: 2, face: 1 })).toBe(false);
    expect(isHigher({ count: 2, face: 4 }, { count: 2, face: 4 })).toBe(false);
    expect(isHigher({ count: 1, face: 2 }, null)).toBe(true);
  });

  it('喊不能超過全桌的骰子數，也不能比場上小', () => {
    let s = table([[2, 2, 3, 4, 5], [6, 6, 1, 1, 3]]);
    expect(isLegalBid(s, { count: 11, face: 3 })).toBe(false);
    expect(isLegalBid(s, { count: 0, face: 3 })).toBe(false);
    s = placeBid(s, { count: 3, face: 4 });
    expect(isLegalBid(s, { count: 3, face: 3 })).toBe(false);
    expect(isLegalBid(s, { count: 3, face: 5 })).toBe(true);
    expect(minCountFor(s, 3)).toBe(4);
    expect(minCountFor(s, 6)).toBe(3);
    expect(() => placeBid(s, { count: 2, face: 6 })).toThrow();
  });

  it('1 點萬用：數 4 的時候 1 也算；有人喊 1 之後變齋', () => {
    expect(countMatching([1, 4, 4, 2, 1], 4, true)).toBe(4);
    expect(countMatching([1, 4, 4, 2, 1], 4, false)).toBe(2);
    expect(countMatching([1, 4, 4, 2, 1], 1, true)).toBe(2);
    let s = table([[1, 4, 4, 2, 6], [1, 3, 3, 5, 6]]);
    s = placeBid(s, { count: 2, face: 1 });
    expect(s.zhai).toBe(true);
    s = placeBid(s, { count: 3, face: 4 });
    // 齋了：1 不算 4，全桌只有兩個 4 → 喊 3 個 4 的人（第 1 位）輸
    const r = challenge(s);
    expect(r.last).toMatchObject({ actual: 2, wild: false, loser: 1, caller: 0, bidder: 1 });
  });

  it('1 不萬用的設定：喊 1 不會變齋，數的時候 1 只算 1', () => {
    let s = table([[1, 4, 4, 2, 6], [1, 3, 3, 5, 6]], 0, { wild: false, exact: false });
    s = placeBid(s, { count: 3, face: 4 });
    expect(s.zhai).toBe(false);
    expect(challenge(s).last).toMatchObject({ actual: 2, loser: 0 });
  });

  it('開：真的有那麼多，開的人少一顆；沒有，喊的人少一顆', () => {
    let s = table([[1, 4, 4, 2, 6], [1, 3, 3, 5, 6], [4, 2, 2, 2, 3]]);
    s = placeBid(s, { count: 5, face: 4 }); // 0 喊；全桌 4（含萬用 1）：0 有 3、1 有 1、2 有 1 → 5
    expect(s.turn).toBe(1);
    const r = challenge(s);
    expect(r.last).toMatchObject({ actual: 5, caller: 1, loser: 1 });
    expect(r.dice[1]).toHaveLength(4);
    expect(r.phase).toBe('reveal');
    const n = nextRound(r, seededRng(7));
    expect(n.turn).toBe(1);
    expect(n.round).toBe(2);
    expect(n.bid).toBeNull();
    expect(n.zhai).toBe(false);
    expect(n.dice.map((d) => d.length)).toEqual([5, 4, 5]);
  });

  it('剛好：剛好那麼多拿回一顆（最多 5 顆），不是就少一顆', () => {
    const base = table([[1, 4, 4, 2], [1, 3, 3, 5, 6]], 0, { wild: true, exact: true });
    let s = placeBid(base, { count: 4, face: 4 }); // 全桌 4：0 有 3、1 有 1 → 4
    let r = callExact(s);
    expect(r.last).toMatchObject({ kind: 'exact', gainer: 1, loser: null });
    expect(r.dice[1]).toHaveLength(5); // 已經 5 顆：不會變 6 顆
    s = placeBid({ ...base, turn: 1 }, { count: 4, face: 4 });
    r = callExact(s);
    expect(r.last).toMatchObject({ gainer: 0 });
    expect(r.dice[0]).toHaveLength(5);
    s = placeBid(base, { count: 3, face: 4 });
    r = callExact(s);
    expect(r.last).toMatchObject({ gainer: null, loser: 1 });
    expect(() => callExact(placeBid(table([[2], [3]]), { count: 1, face: 2 }))).toThrow();
  });

  it('出局的人被跳過，剩一個人就結束', () => {
    let s = table([[2], [3, 3], [4]]);
    expect(nextAlive({ ...s, dice: [[2], [], [4]] }, 0)).toBe(2);
    s = placeBid(s, { count: 2, face: 6 }); // 全桌沒有 6 → 0 輸、出局
    s = challenge(s);
    expect(s.dice[0]).toHaveLength(0);
    s = nextRound(s, seededRng(3));
    expect(s.turn).toBe(1); // 輸的人出局了：下一位開
    s = { ...s, dice: [[], [3, 3], [4]] };
    s = placeBid(s, { count: 3, face: 3 });
    expect(s.turn).toBe(2);
    s = challenge(s); // 只有 2 個 3 → 喊的 1 輸一顆
    expect(s.phase).toBe('reveal');
    s = { ...nextRound(s, seededRng(4)), dice: [[], [5], [4]], turn: 1 };
    s = challenge(placeBid(s, { count: 2, face: 5 }));
    expect(s.phase).toBe('over');
    expect(s.winner).toBe(2);
  });

  it('隨機打到底：骰子數只會一次少一顆、輪到的人一定還在、最後只剩一人', () => {
    const rng = seededRng(2026);
    for (let game = 0; game < 50; game++) {
      let s = newGame(2 + (game % 5), { wild: game % 2 === 0, exact: game % 3 === 0 }, rng);
      for (let step = 0; step < 2000 && s.phase !== 'over'; step++) {
        if (s.phase === 'reveal') { s = nextRound(s, rng); continue; }
        expect(s.dice[s.turn].length).toBeGreaterThan(0);
        const before = totalDice(s);
        const r = rng();
        if (s.bid && r < 0.3) {
          s = challenge(s);
          expect(Math.abs(totalDice(s) - before)).toBe(1);
        } else {
          const face = ([2, 3, 4, 5, 6, 1] as Face[])[Math.floor(rng() * 6)];
          const c = minCountFor(s, face);
          if (c === null) { s = challenge(s); continue; }
          s = placeBid(s, { count: c, face });
        }
      }
      expect(s.phase).toBe('over');
      expect(s.dice.filter((d) => d.length).length).toBe(1);
    }
  });
});
