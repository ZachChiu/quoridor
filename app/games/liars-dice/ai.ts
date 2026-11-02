import {
  FACE_ORDER, countMatching, canExact, minCountFor, totalDice, wildAfter,
  type Bid, type Face, type Rng, type State,
} from './engine';

/**
 * 大話骰的電腦對手：機率型。只看得到自己的骰子，其他人的骰子當成隨機 ——
 * 一顆看不到的骰子「算這個點數」的機率是 1/6，1 萬用時是 1/3（1 本身只有 1/6）。
 * 一口「全桌至少 N 個 F」是真的機率＝ P(二項分布(看不到的顆數, p) ≥ N − 自己手上有的)。
 *
 * - 輪到自己、場上有一口：那一口是真的機率太低就開；不然從喊得上去的幾口裡挑最可能是真的那一口。
 * - 虛張：偶爾故意喊自己手上沒有的點數（別人會以為他有）。
 * - 困難多一層推測：別人喊過的點數，當成他手上多半有一顆。
 * - 剛好（有開這個選項時）：剛好那麼多的機率夠高才喊。
 */
export type Level = 'easy' | 'normal' | 'hard';
export const LEVELS: readonly Level[] = ['easy', 'normal', 'hard'];

export type Action = { type: 'bid'; bid: Bid } | { type: 'challenge' } | { type: 'exact' };

type Tune = {
  /** 那一口是真的機率低於這個就開 */
  doubt: number;
  /** 虛張的機率 */
  bluff: number;
  /** 機率估計加的雜訊（簡單的會看錯） */
  noise: number;
  /** 開局喊多大：期望個數乘上這個 */
  open: number;
  /** 別人喊過的點數算他手上有幾顆（困難才有） */
  read: number;
  /** 剛好那麼多的機率高於這個才喊剛好 */
  exact: number;
};
const TUNE: Record<Level, Tune> = {
  easy: { doubt: 0.35, bluff: 0.08, noise: 0.25, open: 0.55, read: 0, exact: 0.5 },
  normal: { doubt: 0.2, bluff: 0.15, noise: 0.08, open: 0.75, read: 0, exact: 0.36 },
  // 2026-11-03 掃過 doubt × margin × read（每組 400 局）：疑心低一點、把別人喊過的點數算進去最強。
  // 「場上這口是假的機率 > 自己最好那口是真的機率就開」的比法也試過，反而輸
  hard: { doubt: 0.1, bluff: 0.1, noise: 0, open: 0.85, read: 0.5, exact: 0.3 },
};

/** C(n, k)·p^k·(1−p)^(n−k) */
function binomPmf(n: number, k: number, p: number): number {
  if (k < 0 || k > n) return 0;
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return c * p ** k * (1 - p) ** (n - k);
}

/** P(二項分布(n, p) ≥ k) */
export function atLeast(n: number, k: number, p: number): number {
  if (k <= 0) return 1;
  if (k > n) return 0;
  let s = 0;
  for (let i = k; i <= n; i++) s += binomPmf(n, i, p);
  return Math.min(1, s);
}

export const exactly = (n: number, k: number, p: number) => binomPmf(n, k, p);

/** 一顆看不到的骰子算這個點數的機率 */
export const hitChance = (face: Face, wild: boolean) => (wild && face !== 1 ? 1 / 3 : 1 / 6);

/** 從 seat 看，這一口要再湊幾顆、看不到的有幾顆、一顆中的機率 */
function view(s: State, seat: number, bid: Bid, wild: boolean, read: number) {
  const mine = countMatching(s.dice[seat], bid.face, wild);
  // 困難：別人喊過這個點數（或萬用時喊 1 以外的、手上可能有 1）—— 當成他手上有 read 顆
  let guessed = 0;
  if (read > 0) {
    const others = new Set(s.calls.filter((c) => c.seat !== seat && c.bid.face === bid.face).map((c) => c.seat));
    guessed = others.size * read;
  }
  const unseen = totalDice(s) - s.dice[seat].length;
  return { need: bid.count - mine - guessed, unseen, p: hitChance(bid.face, wild) };
}

/** 從 seat 看，這一口是真的機率 */
export function bidChance(s: State, seat: number, bid: Bid, wild: boolean, read = 0): number {
  const { need, unseen, p } = view(s, seat, bid, wild, read);
  return atLeast(unseen, Math.ceil(need), p);
}

/** 喊得上去的那幾口：每個點數最小的那一口，再加一個 */
export function candidates(s: State): Bid[] {
  const out: Bid[] = [];
  for (const face of FACE_ORDER) {
    const c = minCountFor(s, face);
    if (c === null) continue;
    out.push({ count: c, face });
    if (c + 1 <= totalDice(s)) out.push({ count: c + 1, face });
  }
  return out;
}

function openingBid(s: State, seat: number, t: Tune, rng: Rng): Bid {
  const wild = s.options.wild;
  const unseen = totalDice(s) - s.dice[seat].length;
  // 開局不喊 1（一喊就齋），除非 1 根本不萬用
  const faces = FACE_ORDER.filter((f) => !(wild && f === 1));
  let face: Face;
  if (rng() < t.bluff) face = faces[Math.floor(rng() * faces.length)];
  else face = faces.reduce((best, f) => (countMatching(s.dice[seat], f, wild) >= countMatching(s.dice[seat], best, wild) ? f : best), faces[0]);
  const mine = countMatching(s.dice[seat], face, wild);
  const expect = mine + unseen * hitChance(face, wild);
  const count = Math.max(1, Math.min(totalDice(s), Math.floor(expect * t.open)));
  return { count, face };
}

export function decide(s: State, seat: number, level: Level, rng: Rng): Action {
  const t = TUNE[level];
  if (!s.bid) return { type: 'bid', bid: openingBid(s, seat, t, rng) };
  const jitter = (x: number) => Math.max(0, Math.min(1, x + (rng() * 2 - 1) * t.noise));
  const wildNow = s.options.wild && !s.zhai;
  const current = jitter(bidChance(s, seat, s.bid, wildNow, t.read));

  if (canExact(s)) {
    const { need, unseen, p } = view(s, seat, s.bid, wildNow, t.read);
    if (Number.isInteger(need) && jitter(exactly(unseen, need, p)) >= t.exact) return { type: 'exact' };
  }

  const scored = candidates(s).map((bid) => ({ bid, p: jitter(bidChance(s, seat, bid, wildAfter(s, bid.face), t.read)) }));
  if (!scored.length) return { type: 'challenge' };
  scored.sort((a, b) => b.p - a.p);
  const best = scored[0];

  if (current < t.doubt) return { type: 'challenge' };
  // 喊得上去的每一口都不太可能：開
  if (best.p < 0.3 && current < 0.6) return { type: 'challenge' };

  if (rng() < t.bluff) {
    const plausible = scored.filter((c) => c.p >= 0.3);
    if (plausible.length > 1) return { type: 'bid', bid: plausible[Math.floor(rng() * plausible.length)].bid };
  }
  return { type: 'bid', bid: best.bid };
}
