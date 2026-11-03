import { HAND_SIZE, answer, hashSeed, randomHand, ranksOf, rng, type Fact, type Hand, type Question, type QuestionId } from './engine';
import { think } from './ai';

/**
 * 自己的挑戰（單人推理，節目播出後人人都知道的「三張和」那招在這裡破不了）：
 *
 * 1. 每日一手：全世界同一手藏牌（當地日期當種子）。每一題有價錢，說錯真相罰 3 枚，用最少的枚數說出真相。
 *    ① 最貴（3 枚）—— 「三張和」那招要 8 題、24 枚；電腦用「每一枚換到最多資訊」的問法平均 12 枚上下
 *    （docs/question-and-truth.md〈挑戰版的數字〉）。結算寫枚數與問過的題號，可以分享（像 Wordle）。
 * 2. 六問一猜：隨機一手，只能問 6 題，然後報一次真相，對幾張算幾張（8 張全對＝全中）。
 *    「三張和」要 8 題才解得出來，6 題之內要自己挑最有用的問法；電腦同樣問 6 題平均對 5 張上下。
 */

/** 每日一手的價目：資訊越多越貴。①（任三張的和）最貴，位置題最便宜 */
export const PRICES: Record<QuestionId, number> = { 1: 3, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1 };
export const WRONG_PENALTY = 3;
export const priceOf = (q: Question) => PRICES[q.q];

export const SIX_ASKS = 6;

/** 當地日期 YYYY-MM-DD（每日一手換題的時間點是各地的午夜，同 Wordle） */
export function localDate(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function dailyHand(date: string): Hand {
  return randomHand(rng(hashSeed(`question-and-truth:daily:${date}`)));
}

export type ChallengeKind = 'daily' | 'six';

/** 挑戰的一局：藏著的那手、問過的（含回答）、報過的真相 */
export type ChallengeState = {
  kind: ChallengeKind;
  hand: Hand;
  /** 每日一手的日期（六問一猜沒有） */
  date: string | null;
  asks: { q: Question; a: ReturnType<typeof answer> }[];
  /** 報過的真相；after 是報的時候已經問了幾題（紀錄與分享圖照順序插回去） */
  guesses: { guess: number[]; correct: number; after: number }[];
  over: boolean;
};

export function newChallenge(kind: ChallengeKind, o: { date?: string; rand?: () => number } = {}): ChallengeState {
  const date = kind === 'daily' ? (o.date ?? localDate()) : null;
  const hand = date ? dailyHand(date) : randomHand(o.rand ?? Math.random);
  return { kind, hand, date, asks: [], guesses: [], over: false };
}

export const canAsk = (s: ChallengeState) => !s.over && (s.kind === 'daily' || s.asks.length < SIX_ASKS);

export function challengeAsk(s: ChallengeState, q: Question): ChallengeState {
  if (!canAsk(s)) return s;
  return { ...s, asks: [...s.asks, { q, a: answer(s.hand, q) }] };
}

/** 報真相：每日一手要全對才結束（錯了罰 3 枚、繼續問）；六問一猜只報一次，對幾張算幾張 */
export function challengeGuess(s: ChallengeState, guess: number[]): ChallengeState {
  if (s.over || guess.length !== HAND_SIZE) return s;
  const target = ranksOf(s.hand);
  const correct = guess.filter((r, i) => r === target[i]).length;
  const over = s.kind === 'six' || correct === HAND_SIZE;
  return { ...s, guesses: [...s.guesses, { guess: [...guess], correct, after: s.asks.length }], over };
}

/** 每日一手花了幾枚 */
export function spent(s: ChallengeState): number {
  const wrong = s.guesses.filter((g) => g.correct < HAND_SIZE).length;
  return s.asks.reduce((a, x) => a + priceOf(x.q), 0) + wrong * WRONG_PENALTY;
}

export const solved = (s: ChallengeState) => s.guesses.some((g) => g.correct === HAND_SIZE);

/** 照發生的順序：每一步是題號 1–11，或 0＝說錯的真相、-1＝說中（分享圖那排小牌） */
export function stepsOf(s: ChallengeState): number[] {
  const out: number[] = [];
  let g = 0;
  for (let i = 0; i <= s.asks.length; i++) {
    while (g < s.guesses.length && s.guesses[g].after === i) { out.push(s.guesses[g].correct === HAND_SIZE ? -1 : 0); g++; }
    if (i < s.asks.length) out.push(s.asks[i].q.q);
  }
  return out;
}

export function factsOfChallenge(s: ChallengeState): Fact[] {
  return [
    ...s.asks.map((x): Fact => ({ kind: 'ask', q: x.q, a: x.a })),
    ...s.guesses.filter((g) => g.correct < HAND_SIZE).map((g): Fact => ({ kind: 'wrong', guess: g.guess })),
  ];
}

/**
 * 電腦示範（每日一手）：用「每一枚換到最多資訊」的問法解同一手，回傳它問的題目與花了幾枚。
 * 種子是日期，每台裝置算出來一樣。一步一步算（step），畫面可以邊算邊畫、不卡住。
 */
export function* demoSteps(date: string): Generator<{ q: Question | null; guess: number[] | null; spent: number; done: boolean }> {
  const hand = dailyHand(date);
  const rand = rng(hashSeed(`question-and-truth:demo:${date}`));
  const facts: Fact[] = [];
  let total = 0;
  for (let i = 0; i < 40; i++) {
    const d = think(facts, 'normal', rand, { cost: priceOf });
    if (d.kind === 'truth') {
      const ok = d.guess.every((r, k) => r === hand[k].rank);
      if (ok) { yield { q: null, guess: d.guess, spent: total, done: true }; return; }
      total += WRONG_PENALTY;
      facts.push({ kind: 'wrong', guess: d.guess });
      yield { q: null, guess: d.guess, spent: total, done: false };
    } else {
      total += priceOf(d.q);
      facts.push({ kind: 'ask', q: d.q, a: answer(hand, d.q) });
      yield { q: d.q, guess: null, spent: total, done: false };
    }
  }
}
