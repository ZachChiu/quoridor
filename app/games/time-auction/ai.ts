import { capBid, maxRemaining, type BidderView } from './engine';

/**
 * Time Auction 的電腦出價者。純函式：同一個種子、同樣的公開資訊，就出同樣的價（測試才能重現）。
 *
 * 不需要搜尋，也不必放 Worker —— 每回合只決定一個數字。電腦只拿得到 BidderView
 * （自己的剩餘時間＋公開的得標者與秒數），跟玩家看得到的一樣，不偷看別人的出價。
 *
 * 四種個性（docs/games-deep-s2.md §1〈電腦對手〉）：
 * - 集中型：開局就挑好大約 4 回合，平均分配時間下重注，其餘回合放棄
 * - 後發型：前段虛晃（偶爾出一點點），後段砸大錢，最後一回合全押（像節目裡的저스틴민）
 * - 狙擊型：大部分回合出 0.1 秒到幾秒碰運氣，賭其他人都放棄；留一筆給後段的重注
 * - 算帳型：只用公開資訊推算 —— 每位對手最多還剩「預算 − 他公開得標過的秒數」；
 *   自己的時間比所有對手的上限都多時，出「最大上限＋0.1 秒」必定得標（節目第 19 回合 4:09.9 的思路）
 *
 * 難度（研究文件的建議）：
 * - easy（一級）：隨機。不規劃預算，常常前面就把時間燒光
 * - normal（二級）：照個性規劃預算，雜訊大；算帳型只在最後三回合算必勝出價
 * - hard（三級）：規劃＋依公開紀錄調整（得標行情、防狙擊、時間花不完就多搶），算帳型隨時算必勝出價
 */
export type Difficulty = 'easy' | 'normal' | 'hard';
export type Persona = 'concentrated' | 'lateBloomer' | 'sniper' | 'accountant';
export const PERSONAS: readonly Persona[] = ['concentrated', 'lateBloomer', 'sniper', 'accountant'];

/** mulberry32：很小的 32 位元亂數產生器。種子相同就得到相同的數列 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash32(x: number): number {
  let h = x >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * 從種子與幾個整數（座位、回合…）衍生出一條獨立的亂數數列。
 * 每一席每一回合各用一條，所以「第 5 回合電腦 2 出多少」不會因為別的電腦多抽了幾次亂數而改變。
 */
export function rngFor(...keys: number[]): () => number {
  let h = 0x9e3779b9;
  for (const k of keys) h = hash32(h ^ hash32(k));
  return mulberry32(h);
}

function shuffle<T>(xs: readonly T[], rng: () => number): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 依種子分配個性：前四席四種各一（打亂順序），第五席起隨機 */
export function assignPersonas(count: number, seed: number): Persona[] {
  const rng = rngFor(seed, 0x9e75);
  const pool = shuffle(PERSONAS, rng);
  return Array.from({ length: count }, (_, i) => (i < pool.length ? pool[i] : PERSONAS[Math.floor(rng() * PERSONAS.length)]));
}

/**
 * 節目數據：19 次得標秒數加總約 40.5 分鐘，佔全部時間（6 人 × 10 分鐘）的 2/3。
 * 由此得到「得標行情」的先驗：人數 × 每回合平均預算 × 2/3（節目 6 人時約 127 秒，實際中位數 129.5 秒）。
 */
const WIN_SHARE = 0.67;

export const priorPrice = (v: Pick<BidderView, 'seats' | 'budget' | 'rounds'>): number => (WIN_SHARE * v.seats * v.budget) / v.rounds;

/**
 * 從公開紀錄看行情：
 * - price：有人認真搶的回合（大螢幕停在先驗一半以上），得標秒數跟先驗加權平均
 * - low：最近 5 回合裡「沒人認真搶」的回合（低於行情一半）停下的最高秒數 ——
 *   有人在撿便宜（狙擊、每回合固定出一點），要出比它多才搶得到；沒有這種回合就是 0
 * - cheapWins：最近 5 回合裡被別人用這種小錢標走的次數。越多，電腦越常去搶
 */
export function market(v: BidderView): { price: number; low: number; cheapWins: number } {
  const prior = priorPrice(v);
  let sum = 0;
  let n = 0;
  for (const r of v.history) if (r.top >= prior * 0.5) { sum += r.top; n++; }
  const weight = 3;
  const price = (prior * weight + sum) / (weight + n);
  let low = 0;
  let cheapWins = 0;
  for (const r of v.history.slice(-5)) {
    if (!(r.top > 0 && r.top < price * 0.5)) continue;
    low = Math.max(low, r.top);
    if (r.winner !== null && r.winner !== v.seat) cheapWins++;
  }
  return { price, low, cheapWins };
}

/**
 * 必勝出價：比每位對手「最多還剩多少」都多 0.1 秒。
 * 對手的上限只扣他公開得標過的秒數（輸掉的出價看不到），所以這個出價一定贏。付不起就是 null。
 */
export function guaranteedBid(v: BidderView): number | null {
  let max = 0;
  for (let seat = 0; seat < v.seats; seat++) {
    if (seat !== v.seat) max = Math.max(max, maxRemaining(v.budget, v.history, seat));
  }
  return max + 1 <= v.remaining ? max + 1 : null;
}

/** 狙擊的金額：0.1 秒到大約預算的 1/60（節目 10 秒、快速局 2 秒），偏小 */
const snipeCap = (v: BidderView) => Math.max(2, Math.round(v.budget / 60));

/**
 * 開局就決定好的「要認真搶的回合」（1 起算、由小到大、不重複）。
 * 只依座位的種子與局的設定（人數、回合數），所以每回合重算都得到同一份計畫。
 */
export function planTargets(persona: Persona, v: Pick<BidderView, 'seats' | 'rounds'>, rng: () => number): number[] {
  const R = v.rounds;
  const fair = R / v.seats; // 每人平均分到幾回合（6 席約 3.2）
  const pick = (from: number, to: number, k: number) => shuffle(Array.from({ length: to - from + 1 }, (_, i) => from + i), rng).slice(0, k);
  switch (persona) {
    case 'concentrated': {
      // 平均分散在整局：切成 k 段，每段挑一回合
      const k = Math.max(2, Math.round(fair + rng() - 0.3));
      return Array.from({ length: k }, (_, i) => {
        const lo = Math.floor((i * R) / k) + 1;
        const hi = Math.floor(((i + 1) * R) / k);
        return lo + Math.floor(rng() * (hi - lo + 1));
      });
    }
    case 'lateBloomer': {
      // 後半段挑幾回合，最後一回合一定在內
      const k = Math.max(2, Math.round(fair + rng() * 0.8));
      return [...pick(Math.ceil(R / 2), R - 1, k - 1), R].sort((a, b) => a - b);
    }
    case 'sniper': {
      // 後半段的重注，加上最後一回合
      const k = Math.max(2, Math.round(fair) - 1);
      return [...pick(Math.ceil(R / 2), R - 1, k - 1), R].sort((a, b) => a - b);
    }
    default:
      return [];
  }
}

/**
 * 決定這一席這回合出多少（0.1 秒）。保證是 0 到自己剩餘時間之間的整數。
 * seed 是這一局的種子；同一局裡每一席每一回合各自衍生亂數。
 */
export function decideBid(v: BidderView, persona: Persona, difficulty: Difficulty, seed: number): number {
  if (v.remaining <= 0 || v.round > v.rounds) return 0;
  const rng = rngFor(seed, v.seat, v.round);
  const raw = difficulty === 'easy'
    ? easyBid(v, persona, rng)
    : smartBid(v, persona, difficulty === 'hard', planTargets(persona, v, rngFor(seed, v.seat, 0)), rng);
  return capBid(raw, v.remaining);
}

/**
 * 一級：隨便出個價，不看行情、不留預算。前半段比較衝動，通常撐不到最後 ——
 * 玩家留著時間到後段，就撿得到便宜（這也是這個遊戲的第一課）。狙擊型偶爾出一點點
 */
function easyBid(v: BidderView, persona: Persona, rng: () => number): number {
  if (persona === 'sniper' && rng() < 0.35) return 1 + Math.floor(rng() * rng() * snipeCap(v));
  if (rng() >= (v.round <= v.rounds / 2 ? 0.4 : 0.25)) return 0;
  return priorPrice(v) * (0.3 + rng() * 1.7);
}

/** 計畫外去撿便宜回合的機率（三級；二級打對折）。集中型很少分心、後發型前半段幾乎不動；狙擊型有自己的低價出法 */
function opportunism(persona: Persona, v: BidderView): number {
  switch (persona) {
    case 'concentrated': return 0.12;
    case 'lateBloomer': return v.round <= v.rounds / 2 ? 0.05 : 0.2;
    case 'accountant': return 0.2;
    default: return 0;
  }
}

function smartBid(v: BidderView, persona: Persona, hard: boolean, plan: number[], rng: () => number): number {
  const left = v.rounds - v.round + 1;
  const last = left === 1;
  const { price, low, cheapWins } = market(v);
  const jitter = (x: number) => x * (1 + (rng() * 2 - 1) * (hard ? 0.12 : 0.3));
  const mine = v.tokens[v.seat];
  const best = Math.max(...v.tokens.filter((_, i) => i !== v.seat));

  // 最後一回合已經領先兩枚以上：名次不會再變，不必再花
  if (last && mine >= best + 2) return 0;

  // 必勝出價。算帳型一直在算（二級只在最後三回合）；三級的其他個性只在最後一回合用
  const g = guaranteedBid(v);
  if (g !== null) {
    const worth = last || g <= price * (hard ? 1.8 : 1.3);
    if (persona === 'accountant' ? worth && (hard || left <= 3) : hard && last) return g;
  }

  // 有人在撿便宜時，認真出價至少要壓過最近的便宜成交價（三級才會注意到）
  const beatLow = (bid: number) => (hard && bid > 0 && bid <= low ? low + 1 + Math.floor(rng() * 3) : bid);
  const ahead = plan.filter((r) => r >= v.round);
  const isTarget = ahead[0] === v.round;

  // 計畫外撿便宜：出比最近的便宜成交價多一截。要留夠計畫內回合的時間（reserveRounds 回合的行情）
  // —— 不這樣做的話，一半的回合沒有電腦認真搶，玩家每回合固定出「剩餘 ÷ 剩下回合」就能包下來
  const opportunistic = (reserveRounds: number) => {
    // 別人最近一直用小錢標走，就更常去搶
    if (!(rng() < opportunism(persona, v) * (hard ? 1 : 0.75) * (1 + 0.5 * cheapWins))) return 0;
    const bid = Math.max(low, snipeCap(v) * 1.5) * (1.15 + rng() * 0.45);
    return v.remaining - bid >= reserveRounds * price * 0.9 ? bid : 0;
  };

  switch (persona) {
    case 'concentrated': {
      if (!isTarget) return opportunistic(ahead.length);
      if (ahead.length === 1) return v.remaining;
      const share = v.remaining / ahead.length;
      // 三級：時間很多時不必每次都出滿，省下來的留給計畫外的回合
      return beatLow(jitter(hard ? Math.min(share, Math.max(price * 1.3, share * 0.7)) : share));
    }
    case 'lateBloomer': {
      if (!isTarget) {
        // 前段虛晃：偶爾出一點點，看起來像在按
        if (v.round < plan[0] && rng() < 0.15) return price * (0.1 + rng() * 0.2);
        return opportunistic(ahead.length);
      }
      if (ahead.length === 1) return v.remaining;
      return beatLow(jitter(v.remaining / ahead.length));
    }
    case 'sniper': {
      if (isTarget) return ahead.length === 1 ? v.remaining : beatLow(jitter(v.remaining * 0.5));
      if (rng() >= 0.7) return 0;
      const cap = snipeCap(v);
      const base = 1 + Math.floor(rng() * rng() * cap);
      // 看到有人用更高的小錢撿走，就出得比他多一點（low 本身低於行情一半，不會追成重注）。二級只有一半的時候會注意到
      return low > 0 && (hard || rng() < 0.5) ? Math.max(base, low + 1 + Math.floor(rng() * cap * 0.5)) : base;
    }
    case 'accountant': {
      // 最後一回合：剩下的時間只在標記同數時有用，標記更值錢
      if (last) return v.remaining;
      // 想拿到「平均份數＋1」枚；照這個步調決定要不要認真搶這一回合
      const want = Math.max(1, Math.round(v.rounds / v.seats) + 1 - mine);
      if (rng() < Math.min(1, (want / left) * 1.2)) {
        const perWin = v.remaining / Math.min(want, left);
        return beatLow(Math.min(perWin * 1.2, jitter(price * 1.15)));
      }
      return opportunistic(want);
    }
  }
}
