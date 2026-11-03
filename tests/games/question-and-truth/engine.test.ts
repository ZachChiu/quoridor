import { describe, expect, it } from 'vitest';
import {
  HAND_SIZE, START_TOKENS, answer, ask, canPlace, consistent, consecutiveGroups, factsOf, isLegalHand, newShowGame,
  randomHand, ranksOf, rng, sameRankGroups, submitBid, tellTruth, warning, type Card, type Fact, type Hand, type Question, type Suit,
} from '@/games/question-and-truth/engine';
import { certainRanks, knowledge, search } from '@/games/question-and-truth/solver';
import { allQuestions, decideBid, think, trickQuestion, viewOf } from '@/games/question-and-truth/ai';
import {
  PRICES, SIX_ASKS, WRONG_PENALTY, canAsk, challengeAsk, challengeGuess, dailyHand, demoSteps, newChallenge, spent,
} from '@/games/question-and-truth/challenge';

const C = (rank: number, suit: Suit): Card => ({ rank, suit });
/** 測試用的一手：點數 2 4 6 8 K 5 10 8，花色 ♠ ♥ ♠ ♦ ♣ ♥ ♠ ♥（♠ 2→6→10、♥ 4→5→8 都遞增） */
const HAND: Hand = [C(2, 0), C(4, 1), C(6, 0), C(8, 2), C(13, 3), C(5, 1), C(10, 0), C(8, 1)];

describe('手牌', () => {
  it('同花色由左到右遞增才合法', () => {
    expect(isLegalHand(HAND)).toBe(true);
    const bad = [...HAND];
    bad[6] = C(1, 0); // ♠A 在 ♠6 右邊
    expect(isLegalHand(bad)).toBe(false);
    const dup = [...HAND];
    dup[7] = C(8, 2); // 同一張 ♦8 兩次
    expect(isLegalHand(dup)).toBe(false);
    expect(isLegalHand(HAND.slice(0, 7))).toBe(false);
  });

  it('canPlace 看左右兩邊的同花色', () => {
    const partial: (Card | null)[] = [C(3, 0), null, null, C(9, 0), null, null, null, null];
    expect(canPlace(partial, 1, C(5, 0))).toBe(true);
    expect(canPlace(partial, 1, C(10, 0))).toBe(false);
    expect(canPlace(partial, 5, C(10, 0))).toBe(true);
    expect(canPlace(partial, 5, C(2, 0))).toBe(false);
    expect(canPlace(partial, 5, C(2, 1))).toBe(true);
  });

  it('隨機排的一手一定合法', () => {
    const rand = rng(7);
    for (let i = 0; i < 500; i++) expect(isLegalHand(randomHand(rand))).toBe(true);
  });
});

describe('11 題的回答', () => {
  // HAND 的點數：2 4 6 8 K 5 10 8；花色：♠ ♥ ♠ ♦ ♣ ♥ ♠ ♥
  const a = (q: Question) => answer(HAND, q);
  it('和與張數', () => {
    expect(a({ q: 1, pos: [0, 1, 2] })).toBe(12);
    expect(a({ q: 1, pos: [7, 0, 4] })).toBe(23);
    expect(a({ q: 2, suit: 0 })).toBe(18);
    expect(a({ q: 2, suit: 1 })).toBe(17);
    expect(a({ q: 2, suit: 3 })).toBe(13);
    expect(a({ q: 3 })).toBe(13); // 只有 K
    expect(a({ q: 4 })).toBe(43);
    expect(a({ q: 5 })).toBe(1);
    expect(a({ q: 6 })).toBe(7);
    expect(a({ q: 7, rank: 8 })).toBe(2);
    expect(a({ q: 7, rank: 1 })).toBe(0);
  });
  it('位置題（0 起算）', () => {
    expect(a({ q: 8, suit: 0 })).toEqual([[0, 2, 6]]);
    expect(a({ q: 8, suit: 2 })).toEqual([[3]]);
    expect(a({ q: 9 })).toEqual([[3, 7]]);
    // 4、5、6 連成一串（位置 1、5、2），8 和 K 不連，10 單獨
    expect(a({ q: 10 })).toEqual([[1, 2, 5]]);
    expect(a({ q: 11, which: 'max' })).toEqual([[4]]);
    expect(a({ q: 11, which: 'min' })).toEqual([[0]]);
  });
  it('⑩ 的「連續」：差 1 就算、不管位置；A 和 K 不相連；同點數一定同一組', () => {
    expect(consecutiveGroups([1, 13, 5, 7, 9, 11, 3, 12])).toEqual([[1, 5, 7]]);
    expect(consecutiveGroups([5, 9, 6, 1, 6, 10, 3, 12])).toEqual([[0, 2, 4], [1, 5]]);
    expect(consecutiveGroups([1, 3, 5, 7, 9, 11, 13, 1])).toEqual([]);
    expect(sameRankGroups([5, 9, 5, 1, 9, 10, 5, 12])).toEqual([[0, 2, 6], [1, 4]]);
  });
  it('節目的例子：字母牌 3 張、和 25 → A、Q、Q', () => {
    const h: Hand = [C(1, 0), C(12, 0), C(12, 1), C(2, 2), C(3, 2), C(4, 2), C(5, 2), C(6, 2)];
    expect(answer(h, { q: 5 })).toBe(3);
    expect(answer(h, { q: 3 })).toBe(25);
  });
});

describe('節目版的回合', () => {
  const hands: [Hand, Hand] = [HAND, randomHand(rng(3))];
  it('出價：交得多的得標，交完各拿 2 枚', () => {
    let s = newShowGame(hands, 0);
    s = submitBid(s, 0, 3);
    expect(s.phase).toBe('bid');
    s = submitBid(s, 1, 1);
    expect(s.phase).toBe('act');
    expect(s.actor).toBe(0);
    expect(s.tokens).toEqual([START_TOKENS - 3 + 2, START_TOKENS - 1 + 2]);
  });
  it('平手：拿優先標記的人得標，標記交給對方；交出的照樣收走', () => {
    let s = newShowGame(hands, 1);
    s = submitBid(submitBid(s, 0, 2), 1, 2);
    expect(s.actor).toBe(1);
    expect(s.marker).toBe(0);
    expect(s.bidResults.at(-1)).toEqual({ round: 1, winner: 1, tie: true });
    expect(s.tokens).toEqual([10, 10]);
  });
  it('不能交超過手上的', () => {
    const s = submitBid(submitBid(newShowGame(hands, 0), 0, 99), 1, 0);
    expect(s.tokens[0]).toBe(2);
    expect(warning(s.tokens[0])).toBe(true);
    expect(warning(6)).toBe(false);
  });
  it('提問照實回答、真相全對才贏', () => {
    let s = submitBid(submitBid(newShowGame(hands, 0), 0, 1), 1, 0);
    s = ask(s, { q: 5 });
    expect(s.log.at(-1)).toMatchObject({ seat: 0, kind: 'ask', a: answer(hands[1], { q: 5 }) });
    expect(s.phase).toBe('bid');
    s = submitBid(submitBid(s, 0, 0), 1, 1);
    const wrong = ranksOf(hands[0]).map((r) => (r === 13 ? 12 : r + 1));
    s = tellTruth(s, wrong);
    expect(s.phase).toBe('bid');
    expect(s.log.at(-1)).toMatchObject({ kind: 'truth', ok: false });
    s = submitBid(submitBid(s, 0, 0), 1, 3);
    s = tellTruth(s, ranksOf(hands[0]));
    expect(s.phase).toBe('over');
    expect(s.winner).toBe(1);
    // 一方知道的事：自己的問答＋自己報錯的
    expect(factsOf(s.log, 0)).toHaveLength(1);
    expect(factsOf(s.log, 1)).toEqual([{ kind: 'wrong', guess: wrong }]);
  });
});

describe('推理', () => {
  it('「三張和」那招：8 組循環相鄰三張的和就解得出全部', () => {
    const rand = rng(11);
    for (let n = 0; n < 40; n++) {
      const h = randomHand(rand);
      const facts: Fact[] = Array.from({ length: 8 }, (_, i) => {
        const q = trickQuestion(i);
        return { kind: 'ask', q, a: answer(h, q) };
      });
      expect(certainRanks(facts)).toEqual(ranksOf(h));
    }
  });

  it('列出來的每一手都對得上所有回答，真正那手一定在裡面', () => {
    const rand = rng(21);
    const qs = allQuestions();
    for (let n = 0; n < 25; n++) {
      const h = randomHand(rand);
      const facts: Fact[] = Array.from({ length: 6 }, () => {
        const q = qs[Math.floor(rand() * qs.length)];
        return { kind: 'ask', q, a: answer(h, q) };
      });
      const res = search(facts, { limit: 5000, maxNodes: 3_000_000 });
      for (const x of res.hands) expect(consistent(x, facts)).toBe(true);
      if (res.complete) expect(res.hands.map((x) => ranksOf(x).join(','))).toContain(ranksOf(h).join(','));
    }
  });

  it('抽樣出來的手牌合法、對得上', () => {
    const rand = rng(5);
    const h = randomHand(rand);
    const facts: Fact[] = ([{ q: 8, suit: 1 }, { q: 2, suit: 1 }, { q: 10 }, { q: 11, which: 'min' }] as Question[])
      .map((q) => ({ kind: 'ask', q, a: answer(h, q) }));
    const k = knowledge(facts, rand);
    expect(k.hands.length).toBeGreaterThan(0);
    for (const x of k.hands) {
      expect(isLegalHand(x)).toBe(true);
      expect(consistent(x, facts)).toBe(true);
    }
  });

  it('報錯過的那串會被排除', () => {
    const h = randomHand(rng(9));
    const facts: Fact[] = Array.from({ length: 8 }, (_, i) => ({ kind: 'ask', q: trickQuestion(i), a: answer(h, trickQuestion(i)) }));
    facts.push({ kind: 'wrong', guess: ranksOf(h) });
    expect(search(facts, { limit: 5, maxNodes: 1_000_000 }).hands).toHaveLength(0);
  });
});

describe('電腦對手', () => {
  it('不偷看：對方手牌換掉、公開紀錄一樣，電腦的決定就一樣', () => {
    const mine = randomHand(rng(1));
    let s1 = newShowGame([randomHand(rng(2)), mine], 0);
    let s2 = { ...s1, hands: [randomHand(rng(99)), mine] as [Hand, Hand] };
    // 兩局的公開紀錄做成一樣（只放電腦自己的問答，回答照 s1 的對方手牌算 —— 電腦只看紀錄）
    s1 = submitBid(submitBid(s1, 0, 0), 1, 2);
    s1 = ask(s1, { q: 8, suit: 0 });
    s2 = { ...s2, log: s1.log, tokens: s1.tokens, round: s1.round, phase: s1.phase, marker: s1.marker };
    for (const level of ['easy', 'normal', 'hard'] as const) {
      expect(decideBid(viewOf(s1, 1), level, rng(4))).toBe(decideBid(viewOf(s2, 1), level, rng(4)));
      expect(think(factsOf(s1.log, 1), level, rng(4))).toEqual(think(factsOf(s2.log, 1), level, rng(4)));
    }
    expect(Object.keys(viewOf(s1, 1))).not.toContain('hands');
  });

  it('老手用「三張和」，最多 8 題就說出真相、而且是對的', () => {
    const rand = rng(31);
    for (let n = 0; n < 10; n++) {
      const h = randomHand(rand);
      const facts: Fact[] = [];
      let truth: number[] | null = null;
      for (let i = 0; i < 9 && !truth; i++) {
        const d = think(facts, 'hard', rand);
        if (d.kind === 'truth') truth = d.guess;
        else {
          expect(d.q.q).toBe(1);
          facts.push({ kind: 'ask', q: d.q, a: answer(h, d.q) });
        }
      }
      expect(facts.length).toBeLessThanOrEqual(8);
      expect(truth).toEqual(ranksOf(h));
    }
  });

  it('出價不超過手上的，確定了就全押', () => {
    const h0 = randomHand(rng(41)), h1 = randomHand(rng(42));
    let s = newShowGame([h0, h1], 0);
    for (let i = 0; i < 8; i++) {
      s = submitBid(submitBid(s, 0, 0), 1, 1);
      s = ask(s, trickQuestion(i));
    }
    // 第 0 方問完 8 題三張和，確定了
    const bid = decideBid(viewOf(s, 0), 'normal', rng(1));
    expect(bid).toBeGreaterThanOrEqual(6);
    expect(bid).toBeLessThanOrEqual(s.tokens[0]);
    for (let seed = 0; seed < 20; seed++) {
      const b = decideBid(viewOf(s, 1), 'easy', rng(seed));
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(s.tokens[1]);
    }
  });
});

describe('挑戰', () => {
  it('每日一手：同一天同一手，換一天就換', () => {
    expect(dailyHand('2026-11-03')).toEqual(dailyHand('2026-11-03'));
    expect(dailyHand('2026-11-03')).not.toEqual(dailyHand('2026-11-04'));
    expect(isLegalHand(dailyHand('2026-11-03'))).toBe(true);
  });
  it('每日一手：照價目算枚數，說錯罰 3 枚', () => {
    let s = newChallenge('daily', { date: '2026-11-03' });
    s = challengeAsk(s, { q: 1, pos: [0, 1, 2] });
    s = challengeAsk(s, { q: 8, suit: 2 });
    expect(spent(s)).toBe(PRICES[1] + PRICES[8]);
    s = challengeGuess(s, new Array(HAND_SIZE).fill(0));
    expect(s.over).toBe(false);
    expect(spent(s)).toBe(PRICES[1] + PRICES[8] + WRONG_PENALTY);
    s = challengeGuess(s, ranksOf(s.hand));
    expect(s.over).toBe(true);
  });
  it('六問一猜：問滿 6 題就不能再問，報一次就結束、對幾張算幾張', () => {
    let s = newChallenge('six', { rand: rng(3) });
    for (let i = 0; i < 8; i++) s = challengeAsk(s, { q: 5 });
    expect(s.asks).toHaveLength(SIX_ASKS);
    expect(canAsk(s)).toBe(false);
    const guess = ranksOf(s.hand).map((r, i) => (i < 5 ? r : 0));
    s = challengeGuess(s, guess);
    expect(s.over).toBe(true);
    expect(s.guesses[0].correct).toBe(5);
  });
  it('電腦示範：同一天算出來一樣，而且比「三張和」的 24 枚便宜', () => {
    const run = () => [...demoSteps('2026-11-03')];
    const a = run();
    expect(a.at(-1)?.done).toBe(true);
    expect(run().map((x) => x.spent)).toEqual(a.map((x) => x.spent));
    expect(a.at(-1)!.spent).toBeLessThan(8 * PRICES[1]);
  }, 30_000);
});
