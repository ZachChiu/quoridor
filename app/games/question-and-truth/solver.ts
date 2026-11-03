import { HAND_SIZE, consecutiveGroups, type Card, type Fact, type Hand, type Suit } from './engine';

/**
 * 推理：找出跟所有已知（問過的題目與回答、報錯過的真相）都對得上的手牌。電腦對手與「每日一手」的電腦示範都用這裡。
 *
 * 做法是逐位回溯＋剪枝：從第 1 張排到第 8 張，每放一個點數就檢查還有沒有可能。
 * - 點數先排、花色最後才配（真相只要點數；花色只在 ② ⑧ 和「同花色遞增」用得到）。
 * - 「排得出來」的條件：同一串點數能分成 ≤4 條嚴格遞增的子序列（四個花色），
 *   等於它的最長「不上升」子序列 ≤4（Dilworth 定理）；同點數最多 4 張也包含在裡面。
 * - ⑧ 問過的花色，那幾個位置的花色就定了，點數要遞增；② 問過、⑧ 也問過的花色，變成那幾個位置的和。
 *
 * 沒什麼已知的時候可能有上億種，所以每次搜尋都有節點上限（maxNodes），超過就回報「沒搜完」。
 * 電腦只拿得到自己問來的回答（engine.factsOf），碰不到對方的手牌。
 */

type Compiled = {
  ok: boolean;
  sums: { pos: number[]; target: number }[];
  letterSum: number | null;
  numberSum: number | null;
  letterCount: number | null;
  /** rankCount[r]：⑦ 問過的點數有幾張 */
  rankCount: (number | null)[];
  /** 每個位置可能的花色（4 位元的遮罩） */
  allowed: number[];
  fixedSuit: number[];
  /** ② 問過、但 ⑧ 沒問過的花色：最後配花色時檢查 */
  suitSum: (number | null)[];
  /** 要不要真的配一次花色才知道排不排得出來 */
  suitCheck: boolean;
  same: number[] | null;
  cons: number[] | null;
  consKey: string | null;
  maxIn: boolean[] | null;
  minIn: boolean[] | null;
  wrong: number[][];
};

const groupIds = (groups: number[][]) => {
  const id = new Array<number>(HAND_SIZE).fill(-1);
  groups.forEach((g, k) => g.forEach((p) => { id[p] = k; }));
  return id;
};
const groupsKey = (groups: number[][]) => groups.map((g) => g.join(',')).join('/');

function compile(facts: Fact[]): Compiled {
  const c: Compiled = {
    ok: true, sums: [], letterSum: null, numberSum: null, letterCount: null,
    rankCount: new Array(14).fill(null), allowed: new Array(HAND_SIZE).fill(15), fixedSuit: new Array(HAND_SIZE).fill(-1),
    suitSum: [null, null, null, null], suitCheck: false, same: null, cons: null, consKey: null, maxIn: null, minIn: null, wrong: [],
  };
  const suitPos: (number[] | null)[] = [null, null, null, null];
  const suitSumRaw: (number | null)[] = [null, null, null, null];
  const setOnce = <K extends 'letterSum' | 'numberSum' | 'letterCount'>(k: K, v: number) => {
    if (c[k] !== null && c[k] !== v) c.ok = false;
    c[k] = v;
  };
  for (const f of facts) {
    if (f.kind === 'wrong') { c.wrong.push(f.guess); continue; }
    const { q, a } = f;
    const n = typeof a === 'number' ? a : 0;
    const groups = typeof a === 'number' ? [] : a;
    switch (q.q) {
      case 1: c.sums.push({ pos: [...q.pos], target: n }); break;
      case 2: if (suitSumRaw[q.suit] !== null && suitSumRaw[q.suit] !== n) c.ok = false; suitSumRaw[q.suit] = n; break;
      case 3: setOnce('letterSum', n); break;
      case 4: setOnce('numberSum', n); break;
      case 5: setOnce('letterCount', n); break;
      case 6: setOnce('letterCount', HAND_SIZE - n); break;
      case 7: if (c.rankCount[q.rank] !== null && c.rankCount[q.rank] !== n) c.ok = false; c.rankCount[q.rank] = n; break;
      case 8: suitPos[q.suit] = groups[0] ?? []; break;
      case 9: {
        const key = groupsKey(groups);
        if (c.same && groupsKey(regroup(c.same)) !== key) c.ok = false;
        c.same = groupIds(groups);
        break;
      }
      case 10: {
        const key = groupsKey(groups);
        if (c.consKey !== null && c.consKey !== key) c.ok = false;
        c.cons = groupIds(groups);
        c.consKey = key;
        break;
      }
      case 11: {
        const inSet = new Array<boolean>(HAND_SIZE).fill(false);
        (groups[0] ?? []).forEach((p) => { inSet[p] = true; });
        if (!inSet.some(Boolean)) c.ok = false;
        if (q.which === 'max') c.maxIn = inSet; else c.minIn = inSet;
        break;
      }
    }
  }
  for (let s = 0; s < 4; s++) {
    const ps = suitPos[s];
    if (!ps) continue;
    for (let p = 0; p < HAND_SIZE; p++) c.allowed[p] &= ps.includes(p) ? 1 << s : ~(1 << s);
    if (suitSumRaw[s] !== null) c.sums.push({ pos: ps, target: suitSumRaw[s]! });
  }
  for (let s = 0; s < 4; s++) if (!suitPos[s] && suitSumRaw[s] !== null) c.suitSum[s] = suitSumRaw[s];
  for (let p = 0; p < HAND_SIZE; p++) {
    const m = c.allowed[p];
    if (m === 0) c.ok = false;
    if (m && (m & (m - 1)) === 0) c.fixedSuit[p] = Math.log2(m);
  }
  c.suitCheck = c.allowed.some((m) => m !== 15) || c.suitSum.some((v) => v !== null);
  if (c.letterCount !== null && (c.letterCount < 0 || c.letterCount > HAND_SIZE)) c.ok = false;
  return c;
}

function regroup(ids: number[]): number[][] {
  const m = new Map<number, number[]>();
  ids.forEach((g, p) => { if (g >= 0) { if (!m.has(g)) m.set(g, []); m.get(g)!.push(p); } });
  return [...m.values()].sort((a, b) => a[0] - b[0]);
}

const LETTER = (r: number) => r === 1 || r >= 11;

/**
 * 給定 8 個點數，配一組花色：每個位置在允許的花色裡挑，同花色嚴格遞增，② 的和對得上。
 * 有 rand 就隨機挑順序（抽樣用），沒有就照 ♠♥♦♣ 的順序。配不出來回傳 null。
 */
function assignSuits(ranks: number[], c: Compiled, rand?: () => number): Suit[] | null {
  const suits = new Array<Suit>(HAND_SIZE);
  const last = [0, 0, 0, 0];
  const sum = [0, 0, 0, 0];
  const order = [0, 1, 2, 3];
  // 剩下的點數加起來（② 的和還差多少、後面湊不湊得到）
  const rest = new Array<number>(HAND_SIZE + 1).fill(0);
  for (let p = HAND_SIZE - 1; p >= 0; p--) rest[p] = rest[p + 1] + ranks[p];
  const targets = [0, 1, 2, 3].filter((s) => c.suitSum[s] !== null);
  const go = (p: number): boolean => {
    if (targets.length) {
      let need = 0;
      for (const s of targets) {
        const gap = c.suitSum[s]! - sum[s];
        if (gap < 0) return false;
        need += gap;
      }
      if (need > rest[p]) return false;
    }
    if (p === HAND_SIZE) {
      for (let s = 0; s < 4; s++) if (c.suitSum[s] !== null && sum[s] !== c.suitSum[s]) return false;
      return true;
    }
    const tries = rand ? shuffled(order, rand) : order;
    for (const s of tries) {
      if (!(c.allowed[p] & (1 << s)) || last[s] >= ranks[p]) continue;
      const t = c.suitSum[s];
      if (t !== null && sum[s] + ranks[p] > t) continue;
      const keep = last[s];
      last[s] = ranks[p]; sum[s] += ranks[p]; suits[p] = s as Suit;
      if (go(p + 1)) return true;
      last[s] = keep; sum[s] -= ranks[p];
    }
    return false;
  };
  return go(0) ? suits : null;
}

function shuffled<T>(xs: readonly T[], rand: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ALL_RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export type SearchOptions = {
  /** 找到幾手就停 */
  limit: number;
  /** 最多看幾個節點（超過就算沒搜完） */
  maxNodes: number;
  /** 有的話點數與花色都隨機排順序（抽樣用） */
  rand?: () => number;
  /** 一定要配出花色（抽樣要拿去回答 ②⑧ 時）；沒有的話只在已知牽涉花色時才配 */
  withSuits?: boolean;
};
export type SearchResult = {
  /** 找到的手牌（點數不重複；花色是配得出來的其中一組，沒配時一律 ♠） */
  hands: Hand[];
  /** 整個搜完了：hands 就是全部的可能 */
  complete: boolean;
  nodes: number;
};

export function search(facts: Fact[], opt: SearchOptions): SearchResult {
  const c = compile(facts);
  const out: Hand[] = [];
  if (!c.ok) return { hands: out, complete: true, nodes: 0 };
  const r = new Array<number>(HAND_SIZE).fill(0);
  const dp = new Array<number>(HAND_SIZE).fill(0);
  const cnt = new Array<number>(14).fill(0);
  const lastFixed = [0, 0, 0, 0];
  const partial = c.sums.map(() => 0);
  const remain = c.sums.map((s) => s.pos.length);
  const sumsAt: number[][] = Array.from({ length: HAND_SIZE }, () => []);
  c.sums.forEach((s, i) => s.pos.forEach((p) => sumsAt[p].push(i)));
  const knownCounts = ALL_RANKS.filter((v) => c.rankCount[v] !== null);
  let letters = 0, letterSum = 0, numberSum = 0;
  let maxRank = 0, maxNon = 0, minRank = 99, minNon = 99;
  let nodes = 0;
  let aborted = false;

  const okValue = (k: number, v: number): boolean => {
    if (cnt[v] >= 4) return false;
    const rc = c.rankCount[v];
    if (rc !== null && cnt[v] + 1 > rc) return false;
    const fs = c.fixedSuit[k];
    if (fs >= 0 && v <= lastFixed[fs]) return false;
    let d = 1;
    for (let j = 0; j < k; j++) {
      const rj = r[j];
      if (rj >= v && dp[j] + 1 > d) d = dp[j] + 1;
      if (c.same) {
        const eq = rj === v;
        const grp = c.same[k] >= 0 && c.same[j] === c.same[k];
        if (eq !== grp) return false;
      }
      if (c.cons) {
        const diff = rj - v;
        if ((diff === 1 || diff === -1) && (c.cons[k] < 0 || c.cons[j] !== c.cons[k])) return false;
        if (diff === 0 && c.cons[j] !== c.cons[k]) return false;
      }
    }
    if (d > 4) return false;
    dp[k] = d;
    if (c.maxIn) {
      if (c.maxIn[k]) { if (maxRank ? v !== maxRank : v <= maxNon) return false; }
      else if (maxRank && v >= maxRank) return false;
    }
    if (c.minIn) {
      if (c.minIn[k]) { if (minRank < 99 ? v !== minRank : v >= minNon) return false; }
      else if (minRank < 99 && v <= minRank) return false;
    }
    for (const i of sumsAt[k]) {
      const p = partial[i] + v, rem = remain[i] - 1, t = c.sums[i].target;
      if (p + rem > t || p + rem * 13 < t) return false;
    }
    return true;
  };

  /** 放完第 k 張之後，剩下的位置還來不來得及湊滿各種張數與和 */
  const okBounds = (k: number): boolean => {
    const m = HAND_SIZE - k - 1;
    if (c.letterCount !== null) {
      const needL = c.letterCount - letters;
      const needN = HAND_SIZE - c.letterCount - (k + 1 - letters);
      if (needL < 0 || needN < 0) return false;
      if (c.letterSum !== null && (letterSum + needL > c.letterSum || letterSum + needL * 13 < c.letterSum)) return false;
      if (c.numberSum !== null && (numberSum + needN * 2 > c.numberSum || numberSum + needN * 10 < c.numberSum)) return false;
    } else {
      if (c.letterSum !== null && (letterSum > c.letterSum || letterSum + m * 13 < c.letterSum)) return false;
      if (c.numberSum !== null && (numberSum > c.numberSum || numberSum + m * 10 < c.numberSum)) return false;
    }
    if (knownCounts.length) {
      let need = 0;
      for (const v of knownCounts) need += c.rankCount[v]! - cnt[v];
      if (need > m) return false;
    }
    return true;
  };

  const leaf = () => {
    if (c.consKey !== null && groupsKey(consecutiveGroups(r)) !== c.consKey) return;
    for (const g of c.wrong) if (g.every((v, i) => v === r[i])) return;
    let suits: Suit[] | null = null;
    if (c.suitCheck || opt.withSuits) {
      suits = assignSuits(r, c, opt.rand);
      if (!suits) return;
    }
    out.push(r.map((rank, i): Card => ({ rank, suit: suits ? suits[i] : 0 })));
  };

  const go = (k: number) => {
    if (aborted || out.length >= opt.limit) return;
    if (k === HAND_SIZE) { leaf(); return; }
    const values = opt.rand ? shuffled(ALL_RANKS, opt.rand) : ALL_RANKS;
    for (const v of values) {
      if (++nodes > opt.maxNodes) { aborted = true; return; }
      if (!okValue(k, v)) continue;
      // 放下去
      r[k] = v; cnt[v]++;
      const fs = c.fixedSuit[k];
      const keepFixed = fs >= 0 ? lastFixed[fs] : 0;
      if (fs >= 0) lastFixed[fs] = v;
      for (const i of sumsAt[k]) { partial[i] += v; remain[i]--; }
      const isL = LETTER(v);
      if (isL) { letters++; letterSum += v; } else numberSum += v;
      const keep = [maxRank, maxNon, minRank, minNon];
      if (c.maxIn) { if (c.maxIn[k]) maxRank = v; else maxNon = Math.max(maxNon, v); }
      if (c.minIn) { if (c.minIn[k]) minRank = v; else minNon = Math.min(minNon, v); }

      if (okBounds(k)) go(k + 1);

      // 收回來
      [maxRank, maxNon, minRank, minNon] = keep;
      if (isL) { letters--; letterSum -= v; } else numberSum -= v;
      for (const i of sumsAt[k]) { partial[i] -= v; remain[i]++; }
      if (fs >= 0) lastFixed[fs] = keepFixed;
      cnt[v]--; r[k] = 0;
      if (aborted || out.length >= opt.limit) return;
    }
  };
  go(0);
  return { hands: out, complete: !aborted && out.length < opt.limit, nodes };
}

/**
 * 目前還有哪些可能：先試著全部列出來（列得完就是精確的），列不完就隨機抽幾手當樣本。
 * exact 為 true 時 hands 是全部的可能（點數不重複）。
 */
export type Knowledge = { hands: Hand[]; exact: boolean };

export function knowledge(facts: Fact[], rand: () => number, o: { limit?: number; maxNodes?: number; samples?: number; sampleNodes?: number } = {}): Knowledge {
  const { limit = 300, maxNodes = 120_000, samples = 120, sampleNodes = 6_000 } = o;
  const full = search(facts, { limit: limit + 1, maxNodes, withSuits: true, rand });
  if (full.complete) return { hands: full.hands, exact: true };
  const hands: Hand[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < samples; i++) {
    const one = search(facts, { limit: 1, maxNodes: sampleNodes, rand, withSuits: true });
    const h = one.hands[0];
    if (!h) continue;
    const key = h.map((x) => x.rank).join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    hands.push(h);
  }
  // 抽不到樣本（條件很緊、隨機走常常撞牆）就拿完整搜尋時找到的那些
  if (hands.length < 10) for (const h of full.hands) { const k = h.map((x) => x.rank).join(','); if (!seen.has(k)) { seen.add(k); hands.push(h); } }
  return { hands, exact: false };
}

/** 點數是不是已經只剩一種（真相可以說了）：回傳那一串，不確定就是 null */
export function certainRanks(facts: Fact[], maxNodes = 400_000): number[] | null {
  const res = search(facts, { limit: 2, maxNodes });
  return res.complete && res.hands.length === 1 ? res.hands[0].map((c) => c.rank) : null;
}
