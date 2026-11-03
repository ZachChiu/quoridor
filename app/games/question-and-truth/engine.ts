/**
 * 提問與真相（《魔鬼的計謀2》決賽第 3 戰 Question and Truth）的規則。純函式、零 React、零副作用。
 *
 * - 牌：一副 52 張撲克（不含鬼牌），rank 1–13（A=1、J=11、Q=12、K=13），suit 0–3（♠♥♦♣）。
 * - 手牌：從自己那副牌選 8 張排成一列；**同花色的牌由左到右遞增**（不必相鄰），不同花色之間不限。
 * - 提問：固定的 11 題（answer()），對方的程式照實回答，不可能說謊。
 * - 真相：由左到右說出對方 8 張的點數（不用說花色），全對就贏。
 * - 出價（節目版）：每回合兩人秘密交出代幣，交完各再拿 2 枚；出得多的人提問或說真相。
 *   平手用「優先標記」：持有的人得標，標記交給對方（docs/question-and-truth.md〈規則缺口〉）。
 *
 * 位置在程式裡是 0–7，畫面上寫 1–8。
 */

export const HAND_SIZE = 8;
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
export type Suit = 0 | 1 | 2 | 3;
export const SUITS: readonly Suit[] = [0, 1, 2, 3];
export type Card = { rank: number; suit: Suit };
export type Hand = Card[];

/** 字母牌：A、J、Q、K（節目裡 A 算字母牌，docs/games-deep-s2.md §5） */
export const isLetter = (rank: number) => rank === 1 || rank >= 11;

export function rankLabel(rank: number): string {
  return rank === 1 ? 'A' : rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : String(rank);
}
export const SUIT_SYMBOL = ['♠', '♥', '♦', '♣'] as const;
export const isRedSuit = (s: Suit) => s === 1 || s === 2;

export const cardId = (c: Card) => c.suit * 13 + c.rank - 1;

/**
 * 這張牌放在 pos 合不合法：同花色左邊的都要比它小、右邊的都要比它大，而且同一張牌不能出現兩次。
 * hand 可以有空位（null），選牌介面一格一格放的時候用。
 */
export function canPlace(hand: (Card | null)[], pos: number, card: Card): boolean {
  for (let i = 0; i < hand.length; i++) {
    const c = hand[i];
    if (!c || i === pos) continue;
    if (c.suit === card.suit && c.rank === card.rank) return false;
    if (c.suit !== card.suit) continue;
    if (i < pos && c.rank >= card.rank) return false;
    if (i > pos && c.rank <= card.rank) return false;
  }
  return true;
}

export function isLegalHand(hand: (Card | null)[]): hand is Hand {
  if (hand.length !== HAND_SIZE) return false;
  for (let i = 0; i < hand.length; i++) {
    const c = hand[i];
    if (!c || !Number.isInteger(c.rank) || c.rank < 1 || c.rank > 13 || !SUITS.includes(c.suit)) return false;
    if (!canPlace(hand, i, c)) return false;
  }
  return true;
}

/** 隨機排一手：抽 8 張，隨便排，再把每個花色在自己佔的位置上由小到大排好（一定合法） */
export function randomHand(rand: () => number): Hand {
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const cards: Card[] = deck.slice(0, HAND_SIZE).map((id) => ({ suit: Math.floor(id / 13) as Suit, rank: (id % 13) + 1 }));
  for (const s of SUITS) {
    const at = cards.map((c, i) => (c.suit === s ? i : -1)).filter((i) => i >= 0);
    const ranks = at.map((i) => cards[i].rank).sort((a, b) => a - b);
    at.forEach((i, k) => { cards[i] = { suit: s, rank: ranks[k] }; });
  }
  return cards;
}

export const ranksOf = (hand: Hand) => hand.map((c) => c.rank);

// ───────────────────────────── 11 題 ─────────────────────────────

/**
 * 節目 RULE 卡上的 11 題：
 *   和　① 指定 3 個位置的點數和　② 指定花色的點數和　③ 字母牌（A、J、Q、K）的和　④ 數字牌（2–10）的和
 *   張數　⑤ 字母牌有幾張　⑥ 數字牌有幾張　⑦ 指定點數有幾張
 *   位置　⑧ 指定花色在哪些位置　⑨ 同點數的牌在哪些位置　⑩ 點數連續的牌在哪些位置　⑪ 最大或最小的牌在哪個位置
 */
export type Question =
  | { q: 1; pos: number[] }
  | { q: 2; suit: Suit }
  | { q: 3 } | { q: 4 } | { q: 5 } | { q: 6 }
  | { q: 7; rank: number }
  | { q: 8; suit: Suit }
  | { q: 9 } | { q: 10 }
  | { q: 11; which: 'max' | 'min' };
export type QuestionId = Question['q'];
export const QUESTION_IDS: QuestionId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** 和、張數是一個數字；位置題是幾組位置（⑧⑪ 只有一組，可能是空的） */
export type Answer = number | number[][];

export function isValidQuestion(q: Question): boolean {
  switch (q.q) {
    case 1: return q.pos.length === 3 && new Set(q.pos).size === 3 && q.pos.every((p) => Number.isInteger(p) && p >= 0 && p < HAND_SIZE);
    case 2: case 8: return SUITS.includes(q.suit);
    case 7: return Number.isInteger(q.rank) && q.rank >= 1 && q.rank <= 13;
    case 11: return q.which === 'max' || q.which === 'min';
    default: return QUESTION_IDS.includes(q.q);
  }
}

/** 同一題、同一組參數算同一個 key（⑦ 問 5 和問 6 是兩題；① 的位置不分順序） */
export function questionKey(q: Question): string {
  switch (q.q) {
    case 1: return `1:${[...q.pos].sort((a, b) => a - b).join(',')}`;
    case 2: case 8: return `${q.q}:${q.suit}`;
    case 7: return `7:${q.rank}`;
    case 11: return `11:${q.which}`;
    default: return String(q.q);
  }
}

/**
 * ⑩「連續」：點數差 1 的牌連起來（不管位置相不相鄰；A 和 K 不相連），連得到別張的才列出來，同一串分成一組。
 * 同點數的兩張會連到同一批牌，所以一定在同一組。
 */
export function consecutiveGroups(ranks: number[]): number[][] {
  const n = ranks.length;
  const parent = ranks.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const linked = new Array<boolean>(n).fill(false);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(ranks[i] - ranks[j]) === 1) {
        linked[i] = linked[j] = true;
        parent[find(i)] = find(j);
      }
    }
  }
  return groupBy(n, (i) => (linked[i] ? find(i) : -1));
}

/** ⑨ 同點數：兩張以上同點數的分成一組 */
export function sameRankGroups(ranks: number[]): number[][] {
  const count = new Map<number, number>();
  for (const r of ranks) count.set(r, (count.get(r) ?? 0) + 1);
  return groupBy(ranks.length, (i) => (count.get(ranks[i])! > 1 ? ranks[i] : -1));
}

/** 依 key 分組（-1 不列），每組由小到大、組與組依第一個位置排 */
function groupBy(n: number, key: (i: number) => number): number[][] {
  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const k = key(i);
    if (k < 0) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(i);
  }
  return [...groups.values()].sort((a, b) => a[0] - b[0]);
}

export function answer(hand: Hand, q: Question): Answer {
  const ranks = ranksOf(hand);
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  switch (q.q) {
    case 1: return sum(q.pos.map((p) => ranks[p]));
    case 2: return sum(hand.filter((c) => c.suit === q.suit).map((c) => c.rank));
    case 3: return sum(ranks.filter(isLetter));
    case 4: return sum(ranks.filter((r) => !isLetter(r)));
    case 5: return ranks.filter(isLetter).length;
    case 6: return ranks.filter((r) => !isLetter(r)).length;
    case 7: return ranks.filter((r) => r === q.rank).length;
    case 8: return [hand.flatMap((c, i) => (c.suit === q.suit ? [i] : []))];
    case 9: return sameRankGroups(ranks);
    case 10: return consecutiveGroups(ranks);
    case 11: {
      const target = q.which === 'max' ? Math.max(...ranks) : Math.min(...ranks);
      return [ranks.flatMap((r, i) => (r === target ? [i] : []))];
    }
  }
}

export function answerKey(a: Answer): string {
  return typeof a === 'number' ? String(a) : a.map((g) => g.join(',')).join('/');
}

// ───────────────────────────── 推理用的「已知」 ─────────────────────────────

/** 一方知道的事：自己問過的每一題與回答，加上自己報錯過的真相（一定不是那一串） */
export type Fact = { kind: 'ask'; q: Question; a: Answer } | { kind: 'wrong'; guess: number[] };

/** 一手牌跟所有已知對不對得上（測試與除錯用；推理本身在 solver.ts，會剪枝） */
export function consistent(hand: Hand, facts: Fact[]): boolean {
  return facts.every((f) => (f.kind === 'ask'
    ? answerKey(answer(hand, f.q)) === answerKey(f.a)
    : f.guess.some((r, i) => r !== hand[i].rank)));
}

// ───────────────────────────── 節目版：出價與回合 ─────────────────────────────

export type Seat = 0 | 1;
export const other = (s: Seat): Seat => (s === 0 ? 1 : 0);
export const START_TOKENS = 10;
export const TOKENS_PER_ROUND = 2;
/** 代幣 ≤5 枚時警示燈亮（對手看得到） */
export const WARNING_AT = 5;
export const warning = (tokens: number) => tokens <= WARNING_AT;

export type LogEntry =
  | { round: number; seat: Seat; kind: 'ask'; q: Question; a: Answer }
  | { round: number; seat: Seat; kind: 'truth'; guess: number[]; ok: boolean };

export type BidResult = { round: number; winner: Seat; tie: boolean };

export type ShowState = {
  hands: [Hand, Hand];
  tokens: [number, number];
  /** 優先標記在誰手上（平手時他得標，標記交給對方） */
  marker: Seat;
  round: number;
  phase: 'bid' | 'act' | 'over';
  /** 這一回合兩人秘密交出的數目（還沒交是 null）；結算後清掉 */
  bids: [number | null, number | null];
  /** 這一回合誰得標（act 階段） */
  actor: Seat | null;
  /** 每一回合出價的結果（公開：誰得標、是不是平手；交了幾枚不公開） */
  bidResults: BidResult[];
  log: LogEntry[];
  winner: Seat | null;
};

export function newShowGame(hands: [Hand, Hand], marker: Seat): ShowState {
  return {
    hands, tokens: [START_TOKENS, START_TOKENS], marker, round: 1, phase: 'bid', bids: [null, null],
    actor: null, bidResults: [], log: [], winner: null,
  };
}

/** 一方秘密交出 n 枚（0 到手上全部）；兩人都交了就開標 */
export function submitBid(s: ShowState, seat: Seat, n: number): ShowState {
  if (s.phase !== 'bid' || s.bids[seat] !== null) return s;
  const amount = Math.max(0, Math.min(s.tokens[seat], Math.floor(n)));
  const bids: [number | null, number | null] = [...s.bids];
  bids[seat] = amount;
  if (bids[0] === null || bids[1] === null) return { ...s, bids };
  const [a, b] = bids as [number, number];
  const tie = a === b;
  const winner: Seat = tie ? s.marker : a > b ? 0 : 1;
  return {
    ...s,
    tokens: [s.tokens[0] - a + TOKENS_PER_ROUND, s.tokens[1] - b + TOKENS_PER_ROUND],
    marker: tie ? other(s.marker) : s.marker,
    phase: 'act',
    bids: [null, null],
    actor: winner,
    bidResults: [...s.bidResults, { round: s.round, winner, tie }],
  };
}

/** 得標的人提問：對方的程式照實回答，問答公開 */
export function ask(s: ShowState, q: Question): ShowState {
  if (s.phase !== 'act' || s.actor === null || !isValidQuestion(q)) return s;
  const a = answer(s.hands[other(s.actor)], q);
  return {
    ...s, phase: 'bid', actor: null, round: s.round + 1,
    log: [...s.log, { round: s.round, seat: s.actor, kind: 'ask', q, a }],
  };
}

/** 得標的人說真相：8 張點數全對就贏，錯一張就算錯、進下一回合 */
export function tellTruth(s: ShowState, guess: number[]): ShowState {
  if (s.phase !== 'act' || s.actor === null || guess.length !== HAND_SIZE) return s;
  const target = ranksOf(s.hands[other(s.actor)]);
  const ok = guess.every((r, i) => r === target[i]);
  const entry: LogEntry = { round: s.round, seat: s.actor, kind: 'truth', guess: [...guess], ok };
  if (ok) return { ...s, phase: 'over', winner: s.actor, log: [...s.log, entry] };
  return { ...s, phase: 'bid', actor: null, round: s.round + 1, log: [...s.log, entry] };
}

/** seat 這一方知道的事（自己問的、自己報錯的）—— 只看公開的紀錄，不碰對方的手牌 */
export function factsOf(log: LogEntry[], seat: Seat): Fact[] {
  return log.filter((e) => e.seat === seat).flatMap((e): Fact[] => (
    e.kind === 'ask' ? [{ kind: 'ask', q: e.q, a: e.a }] : e.ok ? [] : [{ kind: 'wrong', guess: e.guess }]
  ));
}

// ───────────────────────────── 亂數 ─────────────────────────────

/** FNV-1a：字串 → 32 位元種子 */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32：回傳 [0, 1) 的亂數產生器 */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
