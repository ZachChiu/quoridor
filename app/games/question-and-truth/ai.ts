import {
  HAND_SIZE, SUITS, answer, answerKey, factsOf, other, warning, type Fact, type Question, type Seat, type ShowState,
} from './engine';
import { knowledge, search, type Knowledge } from './solver';

/**
 * 電腦對手。三級，全部只用「自己問來的回答」推理（engine.factsOf），**看不到對方的手牌**：
 * 決定時只拿得到 AiView（自己的手牌、自己的代幣、公開的紀錄、對方的警示燈），測試鎖住這件事。
 *
 * - 選題：把目前所有可能（列得完就全列、列不完就抽樣）拿來試問每一題，挑「答案最分散」的那題（資訊熵最大）。
 * - 老手另外會「三張和」那招：只問 8 組循環相鄰三張的和（1+2+3、2+3+4 … 8+1+2），8 個式子就解得出全部
 *  （係數矩陣的行列式是 3，docs/games-deep-s2.md §5）。比熵最大的選法穩，節目播出後大家都知道。
 * - 真相：只剩一種可能就說；新手剩三種以內就賭一把，普通剩兩種、而且對方快猜出來了才賭。
 * - 出價：自己確定了、或對方快確定了（從對方問過的題目推：對方手上的資訊還剩幾種可能）就全押；對方連著得標就加碼搶回來
 *   （對方警示燈亮著時交 6 枚一定贏）；其他時候大致交 2 枚上下。
 */
export const LEVELS = ['easy', 'normal', 'hard'] as const;
export type Level = (typeof LEVELS)[number];

/** 電腦看得到的東西：沒有對方的手牌 */
export type AiView = {
  seat: Seat;
  myHand: ShowState['hands'][number];
  myTokens: number;
  oppWarning: boolean;
  marker: Seat;
  round: number;
  log: ShowState['log'];
};

export function viewOf(s: ShowState, seat: Seat): AiView {
  return { seat, myHand: s.hands[seat], myTokens: s.tokens[seat], oppWarning: warning(s.tokens[other(seat)]), marker: s.marker, round: s.round, log: s.log };
}

/** 所有可以問的題目（⑥ 跟 ⑤ 是同一件事，不列） */
export function allQuestions(): Question[] {
  const qs: Question[] = [];
  for (let a = 0; a < HAND_SIZE; a++) for (let b = a + 1; b < HAND_SIZE; b++) for (let c = b + 1; c < HAND_SIZE; c++) qs.push({ q: 1, pos: [a, b, c] });
  for (const suit of SUITS) qs.push({ q: 2, suit }, { q: 8, suit });
  qs.push({ q: 3 }, { q: 4 }, { q: 5 }, { q: 9 }, { q: 10 }, { q: 11, which: 'max' }, { q: 11, which: 'min' });
  for (let rank = 1; rank <= 13; rank++) qs.push({ q: 7, rank });
  return qs;
}
const ALL = allQuestions();

/** 一題在目前這些可能上，答案分得多散（以 bit 計） */
export function entropy(k: Knowledge, q: Question): number {
  const count = new Map<string, number>();
  for (const h of k.hands) {
    const key = answerKey(answer(h, q));
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  const n = k.hands.length;
  let e = 0;
  for (const c of count.values()) e -= (c / n) * Math.log2(c / n);
  return e;
}

/** 循環相鄰三張和：第 i 次問 i、i+1、i+2（超過 8 繞回來） */
export const trickPositions = (i: number) => [i % 8, (i + 1) % 8, (i + 2) % 8].sort((a, b) => a - b);
export const trickQuestion = (i: number): Question => ({ q: 1, pos: trickPositions(i) });

export type Think = { kind: 'ask'; q: Question } | { kind: 'truth'; guess: number[] };

const SETTINGS: Record<Level, { samples: number; topRandom: number; guessAt: number; trick: boolean }> = {
  easy: { samples: 40, topRandom: 10, guessAt: 4, trick: false },
  normal: { samples: 100, topRandom: 2, guessAt: 2, trick: false },
  hard: { samples: 150, topRandom: 1, guessAt: 1, trick: true },
};

/**
 * 輪到自己（得標了）：說真相還是提問、問哪一題。cost 是每日一手的價目（沒有就每題 1）。
 * danger：對方快猜出來了（出價時算的），這一手寧可賭一把。
 */
export function think(facts: Fact[], level: Level, rand: () => number, o: { danger?: boolean; cost?: (q: Question) => number } = {}): Think {
  const set = SETTINGS[level];
  const k = knowledge(facts, rand, { samples: set.samples });
  if (k.exact && k.hands.length === 1) return { kind: 'truth', guess: k.hands[0].map((c) => c.rank) };
  const guessAt = o.danger ? Math.max(set.guessAt, 3) : set.guessAt;
  if (k.exact && k.hands.length > 0 && k.hands.length <= guessAt) {
    return { kind: 'truth', guess: k.hands[Math.floor(rand() * k.hands.length)].map((c) => c.rank) };
  }
  if (set.trick && !o.cost) {
    const asked = new Set(facts.flatMap((f) => (f.kind === 'ask' && f.q.q === 1 ? [f.q.pos.join(',')] : [])));
    for (let i = 0; i < HAND_SIZE; i++) {
      const pos = trickPositions(i);
      if (!asked.has(pos.join(','))) return { kind: 'ask', q: { q: 1, pos } };
    }
  }
  return { kind: 'ask', q: bestQuestion(k, rand, set.topRandom, o.cost) };
}

export function bestQuestion(k: Knowledge, rand: () => number, top = 1, cost?: (q: Question) => number): Question {
  const scored = ALL.map((q) => ({ q, v: entropy(k, q) / (cost ? cost(q) : 1) + rand() * 1e-6 })).sort((a, b) => b.v - a.v);
  const pool = scored.slice(0, Math.max(1, top)).filter((x) => x.v > 1e-3);
  return (pool[Math.floor(rand() * pool.length)] ?? scored[0]).q;
}

/**
 * 從公開的紀錄推：seat 這一方的牌，對方現在還剩幾種可能（最多數到 limit）。
 * 這不是作弊：對方問了什麼、得到什麼回答，兩邊都看得到；拿自己的牌去對，只是知道「對方離答案多近」。
 */
export function oppRemaining(view: AiView, limit = 12): number {
  const facts = factsOf(view.log, other(view.seat));
  if (facts.length < 3) return Infinity;
  const res = search(facts, { limit, maxNodes: 150_000 });
  return res.complete ? res.hands.length : Infinity;
}

/** 秘密出價 */
export function decideBid(view: AiView, level: Level, rand: () => number): number {
  const mine = factsOf(view.log, view.seat);
  const k = knowledge(mine, rand, { samples: 30, limit: 40 });
  const myLeft = k.exact ? k.hands.length : Infinity;
  const theirLeft = oppRemaining(view);
  const t = view.myTokens;
  const all = t;
  const noise = () => (rand() < 0.5 ? 0 : 1);

  if (level === 'easy') {
    if (myLeft <= 2) return Math.min(all, 3 + noise() * 2);
    return Math.min(all, Math.floor(rand() * 4));
  }
  // 自己確定了、或對方確定了：全押（對方的警示燈亮著就知道他最多 5 枚，押 6 就夠）
  if (myLeft === 1 || theirLeft === 1) return view.oppWarning && all > 6 ? 6 + (level === 'hard' ? 0 : noise()) : all;
  if (theirLeft <= 3) return Math.min(all, Math.max(4, Math.ceil(all * 0.7)));
  if (myLeft <= 3) return Math.min(all, Math.max(3, Math.ceil(all * 0.5)));
  // 對方連著得標（紀錄最後連續幾筆都是對方的）：問題全被拿走了，要搶回來。
  // 對方警示燈亮著（最多 5 枚）時交 6 枚一定得標
  let streak = 0;
  for (let i = view.log.length - 1; i >= 0 && view.log[i].seat !== view.seat; i--) streak++;
  if (streak >= 2 && view.oppWarning && all >= 6) return 6;
  // 平常：交 2 枚上下（每回合本來就會拿回 2 枚）；錢多就多交一點，對方警示燈亮著就少交一點
  let bid = 2 + noise() + (t >= 14 ? 1 : 0) - (view.oppWarning ? 1 : 0) + Math.min(3, Math.max(0, streak - 1));
  if (level === 'hard' && view.marker === view.seat && streak < 2) bid -= 1; // 平手是自己得標，可以少交一點
  return Math.max(0, Math.min(all, bid));
}
