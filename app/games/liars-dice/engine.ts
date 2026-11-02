/**
 * 大話骰（Liar's Dice）的規則：純函式、零 React、零副作用。骰子由呼叫端給的 rng 擲（測試用固定種子，連線版之後換成公平骰子，見 docs/liars-dice.md）。
 *
 * 規則照 Dudo（南美的骰盅遊戲，大話骰的原型）加上華人圈的「齋」：
 * - 每人 5 顆骰子藏在骰盅裡，輪流喊「全桌至少有 N 個 F」；下一個人要嘛喊得更大、要嘛「開」。
 * - 喊得更大：個數變多（點數隨意），或個數一樣、點數更大。點數由小到大是 2 < 3 < 4 < 5 < 6 < 1 ——
 *   1 排最大：喊 1 之後 1 不再萬用（齋），同樣的個數要湊到是最難的。
 * - 1 點萬用（`wild`，預設開）：算點數時 1 也算進去；這一輪有人喊過 1，就變「齋」，1 只算 1。
 * - 開：全部掀開數。真的有那麼多 → 開的人輸一顆骰子；沒有 → 喊的人輸一顆。
 * - 剛好（`exact`，預設關）：輪到的人不開、改喊「剛好」。數出來剛好 N 個 → 他拿回一顆（最多 5 顆）；不是 → 他輸一顆。
 * - 輸的人開下一輪；他出局了就由下一位還在的人開。骰子輸光就出局，剩最後一個人就贏了。
 */
export type Face = 1 | 2 | 3 | 4 | 5 | 6;
export const FACES: readonly Face[] = [1, 2, 3, 4, 5, 6];
/** 喊的時候點數的大小順序（1 最大） */
export const FACE_ORDER: readonly Face[] = [2, 3, 4, 5, 6, 1];
export const START_DICE = 5;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

export type Bid = { count: number; face: Face };
export type Options = { wild: boolean; exact: boolean };
export const DEFAULT_OPTIONS: Options = { wild: true, exact: false };

/** 這一輪結束時掀開的結果 */
export type Reveal = {
  kind: 'challenge' | 'exact';
  /** 開（或喊剛好）的人 */
  caller: number;
  /** 被開的那一口是誰喊的 */
  bidder: number;
  bid: Bid;
  /** 掀開後真的有幾個（萬用、齋都算進去了） */
  actual: number;
  /** 這一輪算點數時 1 是不是萬用 */
  wild: boolean;
  /** 輸一顆的人；剛好喊中時沒有人輸 */
  loser: number | null;
  /** 剛好喊中、拿回一顆的人 */
  gainer: number | null;
  /** 掀開時每個人的骰子 */
  dice: Face[][];
};

export type State = {
  options: Options;
  /** 每個人手上的骰子；長度就是剩幾顆，0 是出局 */
  dice: Face[][];
  /** 第幾輪（從 1 起） */
  round: number;
  /** 輪到誰 */
  turn: number;
  /** 目前場上最大的那一口；這一輪還沒人喊是 null */
  bid: Bid | null;
  bidder: number | null;
  /** 這一輪有人喊過 1：1 不再萬用 */
  zhai: boolean;
  /** 這一輪喊過的每一口（電腦對手推測用） */
  calls: { seat: number; bid: Bid }[];
  phase: 'bidding' | 'reveal' | 'over';
  /** 上一輪掀開的結果（reveal、over 時有） */
  last: Reveal | null;
  winner: number | null;
};

export type Rng = () => number;

/** 可以重現的亂數（mulberry32）：測試與「同一個種子同一盤」用 */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rollDie = (rng: Rng): Face => (Math.floor(rng() * 6) + 1) as Face;
const rollN = (n: number, rng: Rng): Face[] => Array.from({ length: n }, () => rollDie(rng));

export function newGame(players: number, options: Options, rng: Rng, starter = 0): State {
  if (players < MIN_PLAYERS || players > MAX_PLAYERS) throw new Error(`players ${players}`);
  return {
    options,
    dice: Array.from({ length: players }, () => rollN(START_DICE, rng)),
    round: 1,
    turn: starter,
    bid: null,
    bidder: null,
    zhai: false,
    calls: [],
    phase: 'bidding',
    last: null,
    winner: null,
  };
}

export const alive = (s: State, seat: number) => s.dice[seat].length > 0;
export const totalDice = (s: State) => s.dice.reduce((n, d) => n + d.length, 0);
export const aliveSeats = (s: State) => s.dice.flatMap((d, i) => (d.length ? [i] : []));

/** 下一位還在的人（不含自己） */
export function nextAlive(s: State, seat: number): number {
  const n = s.dice.length;
  for (let k = 1; k <= n; k++) {
    const i = (seat + k) % n;
    if (s.dice[i].length) return i;
  }
  return seat;
}

const rank = (f: Face) => FACE_ORDER.indexOf(f);

/** a 是不是比 b 大（b 是 null：這一輪的第一口，什麼都比它大） */
export function isHigher(a: Bid, b: Bid | null): boolean {
  if (!b) return true;
  return a.count > b.count || (a.count === b.count && rank(a.face) > rank(b.face));
}

export function isLegalBid(s: State, bid: Bid): boolean {
  return s.phase === 'bidding'
    && Number.isInteger(bid.count) && bid.count >= 1 && bid.count <= totalDice(s)
    && FACES.includes(bid.face)
    && isHigher(bid, s.bid);
}

/** 喊了這一口之後，1 還算不算萬用 */
export const wildAfter = (s: State, face: Face) => s.options.wild && !s.zhai && face !== 1;

/** 一組骰子裡有幾個「算這個點數」的（萬用時 1 也算） */
export function countMatching(dice: readonly Face[], face: Face, wild: boolean): number {
  let n = 0;
  for (const d of dice) if (d === face || (wild && d === 1 && face !== 1)) n++;
  return n;
}

/** 某個點數最小要喊幾個才喊得上去（喊不上去就是 null：已經喊到全桌那麼多） */
export function minCountFor(s: State, face: Face): number | null {
  const c = !s.bid ? 1 : rank(face) > rank(s.bid.face) ? s.bid.count : s.bid.count + 1;
  return c <= totalDice(s) ? c : null;
}

export function placeBid(s: State, bid: Bid): State {
  if (!isLegalBid(s, bid)) throw new Error(`illegal bid ${bid.count}×${bid.face}`);
  return {
    ...s,
    bid,
    bidder: s.turn,
    zhai: s.zhai || (s.options.wild && bid.face === 1),
    calls: [...s.calls, { seat: s.turn, bid }],
    turn: nextAlive(s, s.turn),
  };
}

export const canChallenge = (s: State) => s.phase === 'bidding' && s.bid !== null;
export const canExact = (s: State) => canChallenge(s) && s.options.exact;

function settle(s: State, kind: Reveal['kind']): State {
  if (!s.bid || s.bidder === null) throw new Error('nothing to challenge');
  const wild = s.options.wild && !s.zhai;
  const actual = s.dice.reduce((n, d) => n + countMatching(d, s.bid!.face, wild), 0);
  const caller = s.turn;
  let loser: number | null = null;
  let gainer: number | null = null;
  if (kind === 'challenge') loser = actual >= s.bid.count ? caller : s.bidder;
  else if (actual === s.bid.count) gainer = caller;
  else loser = caller;

  const dice = s.dice.map((d, i) => {
    if (i === loser) return d.slice(0, -1);
    if (i === gainer && d.length < START_DICE) return [...d, d[0]];
    return d;
  });
  const last: Reveal = { kind, caller, bidder: s.bidder, bid: s.bid, actual, wild, loser, gainer, dice: s.dice };
  const left = dice.flatMap((d, i) => (d.length ? [i] : []));
  return {
    ...s,
    dice,
    last,
    phase: left.length === 1 ? 'over' : 'reveal',
    winner: left.length === 1 ? left[0] : null,
  };
}

/** 輪到的人開上一口 */
export function challenge(s: State): State {
  if (!canChallenge(s)) throw new Error('cannot challenge');
  return settle(s, 'challenge');
}

/** 輪到的人喊「剛好」 */
export function callExact(s: State): State {
  if (!canExact(s)) throw new Error('cannot call exact');
  return settle(s, 'exact');
}

/** 掀開看完，開下一輪：大家重擲，由輸的人先喊（他出局了就是下一位） */
export function nextRound(s: State, rng: Rng): State {
  if (s.phase !== 'reveal' || !s.last) throw new Error('not revealing');
  const who = s.last.loser ?? s.last.gainer ?? s.last.caller;
  const starter = s.dice[who].length ? who : nextAlive(s, who);
  return {
    ...s,
    dice: s.dice.map((d) => rollN(d.length, rng)),
    round: s.round + 1,
    turn: starter,
    bid: null,
    bidder: null,
    zhai: false,
    calls: [],
    phase: 'bidding',
  };
}
