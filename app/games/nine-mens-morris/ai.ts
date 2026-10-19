import { legalMoves, play, MILLS, NEIGHBORS, cellOf, other, type Cell, type MorrisState, type Move, type Side } from './engine';

/**
 * 九子棋的電腦對手：alpha-beta 搜尋（negamax）＋疊代加深＋置換表，純函式。
 *
 * 一個「回合」是搜尋的一層：放（或走）一手，成三的話連同拿哪一顆一起算 —— 拿子不另佔一層，
 * 否則搜四層其實只看了兩個回合。根節點用 engine 列出合法的回合（同一套規則，含和局判定），
 * 底下的搜尋換成位元盤面自己跑：24 個點剛好塞進一個 32 位元整數，產生走法、判成三都只是幾個位元運算，
 * 困難級在主執行緒上 0.2 秒內就能搜到 8 個回合上下，不必像 Wall Go 那樣開 Web Worker。
 *
 * 搜尋裡不算「同一局面三次」與「50 手沒人被拿子」這兩條和局規則（要整條路徑的紀錄，太慢）；
 * 根節點的回合是用 engine 走的，所以「這一手會直接和局」還是看得到。
 *
 * 評分從輪到的那一方看（正＝對他有利）：
 * - 子數差最重要，一顆 100 分
 * - 現在就能成三（輪到自己）加分；對方有兩個以上擋不完的成三點扣分
 * - 已經連成的線、只差一顆的線、可走的步數、被堵死的子
 * - 「來回成三」（Zwickmühle）：線上的一顆子往旁邊一走就成另一條線，下一手走回來又成三，每兩手拿一顆
 * 九子棋雙方完美對弈是和局（Gasser 1996），所以難度靠搜尋深度、隨機擾動與「故意失誤」分級，跟 Bagh Chal 同一套。
 */
export type Difficulty = 'easy' | 'normal' | 'hard';

type Settings = {
  /** 最多搜幾個回合 */
  depth: number;
  /** 每個候選手的分數加上 ±noise/2 的隨機擾動，低難度才不會每次都下同一手 */
  noise: number;
  /** 這一手直接亂走的機率（能直接贏的時候不會失誤） */
  blunder: number;
  /** 時間上限（毫秒）。0 是不限，搜完 depth 為止；有上限時只採用完整跑完的那一層（CLAUDE.md 記過：殘缺的深搜比完整的淺搜還弱） */
  timeMs: number;
};

const SETTINGS: Record<Difficulty, Settings> = {
  easy: { depth: 1, noise: 80, blunder: 0.3, timeMs: 0 },
  normal: { depth: 3, noise: 12, blunder: 0.08, timeMs: 0 },
  // 實測（M 系列筆電）：平均 0.15 秒、搜到 8–10 個回合，最慢約 0.25 秒；手機上時間一樣、層數少一些
  hard: { depth: 16, noise: 0, blunder: 0, timeMs: 200 },
};

/** 測試用：覆寫深度與時間上限，結果才能重現 */
export type AiOptions = Partial<Pick<Settings, 'depth' | 'timeMs'>>;

/** 上一次搜尋完整跑完幾層、看了幾個節點（測試與調參用） */
const stats = { depth: 0, nodes: 0 };
export function lastSearchStats(): Readonly<typeof stats> {
  return stats;
}

// ── 位元盤面 ──────────────────────────────────────────────────────

const N = 24;
const FULL = (1 << N) - 1;
/** 走法編碼裡「沒有」的值：放子沒有起點、沒成三沒有拿子 */
const NONE = 31;
const LINE = MILLS.map((l) => l.reduce((m, p) => m | (1 << p), 0));
const ADJ = NEIGHBORS.map((ns) => ns.reduce((m, p) => m | (1 << p), 0));
const LINES_AT = Array.from({ length: N }, (_, p) => LINE.filter((m) => (m >> p) & 1));

function pop(x: number): number {
  x -= (x >>> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return Math.imul((x + (x >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24;
}

/** 最低的那個位元是第幾個點 */
const low = (x: number) => 31 - Math.clz32(x & -x);

const enc = (from: number, to: number, rem: number) => from | (to << 5) | (rem << 10);

// ── 一次搜尋的狀態（每次 chooseTurn 重設）──────────────────────────

/** 節目規則：對方的子全在線上時不能拿 */
let show = false;
let deadline = Infinity;
let nodes = 0;
let aborted = false;

const MAX_PLY = 48;
const MAX_MOVES = 640;
const MOVES = Array.from({ length: MAX_PLY }, () => new Int32Array(MAX_MOVES));
const ORDER = Array.from({ length: MAX_PLY }, () => new Int32Array(MAX_MOVES));
/** 歷史啟發：哪些走法常造成剪枝，排前面。[from * 32 + to] 與 [拿哪一點] */
const HIST = new Int32Array(32 * 32);
const HIST_R = new Int32Array(32);

const WIN = 100_000;
/** 分數超過這個就是「幾手內必勝／必敗」，存進置換表要換算成離這個節點的距離 */
const MATE = WIN - 1000;

const TT_BITS = 18;
const TT_SIZE = 1 << TT_BITS;
const TT_MASK = TT_SIZE - 1;
const ttMe = new Int32Array(TT_SIZE);
const ttOp = new Int32Array(TT_SIZE);
/** meHand * 16 + opHand + 1；0 代表空格 */
const ttHands = new Int16Array(TT_SIZE);
const ttDepth = new Int8Array(TT_SIZE);
const ttFlag = new Uint8Array(TT_SIZE);
const ttScore = new Int32Array(TT_SIZE);
const ttBest = new Int32Array(TT_SIZE);
const EXACT = 0;
const LOWER = 1;
const UPPER = 2;

function ttIndex(me: number, op: number, hands: number): number {
  let h = Math.imul(me ^ 0x5bd1e995, 0x9e3779b1);
  h ^= Math.imul(op + 0x7f4a7c15, 0x85ebca6b);
  h ^= Math.imul(hands, 0xc2b2ae35);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 13;
  return h & TT_MASK;
}

/** 成三之後能拿的子：不在線上的；全在線上時傳統規則全部都能拿、節目規則一顆都不能 */
function removableMask(op: number): number {
  let locked = 0;
  for (let i = 0; i < LINE.length; i++) if ((op & LINE[i]) === LINE[i]) locked |= LINE[i];
  const free = op & ~locked;
  return free !== 0 ? free : show ? 0 : op;
}

function closes(me: number, to: number): boolean {
  const ls = LINES_AT[to];
  for (let i = 0; i < ls.length; i++) if ((me & ls[i]) === ls[i]) return true;
  return false;
}

/** 列出輪到 me 的所有回合（放／走，成三的話展開成「拿哪一顆」），寫進 out，回傳個數 */
function generate(me: number, op: number, meHand: number, out: Int32Array): number {
  const empty = FULL & ~(me | op);
  let n = 0;
  let rem = -1;
  if (meHand > 0) {
    for (let e = empty; e; e &= e - 1) {
      const to = low(e);
      if (closes(me | (1 << to), to)) {
        if (rem < 0) rem = removableMask(op);
        if (rem === 0) out[n++] = enc(NONE, to, NONE);
        else for (let r = rem; r; r &= r - 1) out[n++] = enc(NONE, to, low(r));
      } else out[n++] = enc(NONE, to, NONE);
    }
    return n;
  }
  const fly = pop(me) === 3;
  for (let f = me; f; f &= f - 1) {
    const from = low(f);
    const base = me & ~(1 << from);
    for (let t = fly ? empty : ADJ[from] & empty; t; t &= t - 1) {
      const to = low(t);
      if (closes(base | (1 << to), to)) {
        if (rem < 0) rem = removableMask(op);
        if (rem === 0) out[n++] = enc(from, to, NONE);
        else for (let r = rem; r; r &= r - 1) out[n++] = enc(from, to, low(r));
      } else out[n++] = enc(from, to, NONE);
    }
  }
  return n;
}

/** 只差一顆就成三、而且下一手真的補得進去的點（放子階段、會飛的一方任何空點都補得進去） */
function threatPoints(me: number, op: number, meHand: number, fly: boolean): number {
  const empty = FULL & ~(me | op);
  let pts = 0;
  for (let i = 0; i < LINE.length; i++) {
    const m = LINE[i];
    const mine = me & m;
    if ((op & m) !== 0 || pop(mine) !== 2) continue;
    const e = m & empty;
    if (meHand > 0 || fly || (ADJ[low(e)] & me & ~m) !== 0) pts |= e;
  }
  return pts;
}

/** 線上的子往旁邊走一步就成另一條線（來回成三）的個數 */
function zwicks(me: number, empty: number): number {
  let locked = 0;
  for (let i = 0; i < LINE.length; i++) if ((me & LINE[i]) === LINE[i]) locked |= LINE[i];
  let n = 0;
  for (let f = locked; f; f &= f - 1) {
    const from = low(f);
    const base = me & ~(1 << from);
    for (let t = ADJ[from] & empty; t; t &= t - 1) {
      const to = low(t);
      if (closes(base | (1 << to), to)) { n++; break; }
    }
  }
  return n;
}

/** 從輪到的那一方（me）看的局面分數 */
function evaluate(me: number, op: number, meHand: number, opHand: number, ply: number): number {
  const empty = FULL & ~(me | op);
  const meN = pop(me);
  const opN = pop(op);
  const placing = meHand + opHand > 0;
  const meFly = meHand === 0 && meN === 3;
  const opFly = opHand === 0 && opN === 3;

  let meMob = 0, meBlk = 0, opMob = 0, opBlk = 0;
  for (let f = me; f; f &= f - 1) { const k = pop(ADJ[low(f)] & empty); meMob += k; if (k === 0) meBlk++; }
  for (let f = op; f; f &= f - 1) { const k = pop(ADJ[low(f)] & empty); opMob += k; if (k === 0) opBlk++; }
  // 輪到我、子都被堵死又不能飛：輸了
  if (meHand === 0 && !meFly && meMob === 0) return -WIN + ply;

  let meMills = 0, opMills = 0, meOnes = 0, opOnes = 0;
  for (let i = 0; i < LINE.length; i++) {
    const m = LINE[i];
    const a = me & m;
    const b = op & m;
    if (a === m) meMills++;
    else if (b === m) opMills++;
    else if (b === 0 && pop(a) === 1) meOnes++;
    else if (a === 0 && pop(b) === 1) opOnes++;
  }

  let s = 100 * (meN + meHand - opN - opHand) + 14 * (meMills - opMills) + 3 * (meOnes - opOnes);

  // 輪到我、而且現在就能成三：等於多拿一顆。對方只剩 3 顆的話，這一手就贏了
  if (threatPoints(me, op, meHand, meFly) !== 0) s += opN + opHand === 3 && removableMask(op) !== 0 ? 2000 : 90;
  const opThreats = pop(threatPoints(op, me, opHand, opFly));
  if (opThreats >= 2) s -= 75;
  else if (opThreats === 1) s -= 22;

  if (placing) {
    s += 2 * (meMob - opMob) + 7 * (opBlk - meBlk);
  } else {
    if (!meFly) s += 3 * meMob - 9 * meBlk + 45 * zwicks(me, empty);
    if (!opFly) s += 9 * opBlk - 3 * opMob - 45 * zwicks(op, empty) + (opMob === 0 ? 60 : 0);
  }
  return s;
}

function negamax(me: number, op: number, meHand: number, opHand: number, depth: number, alpha: number, beta: number, ply: number): number {
  if (pop(me) + meHand < 3) return -WIN + ply;
  if ((++nodes & 2047) === 0 && performance.now() > deadline) aborted = true;
  if (aborted) return 0;
  if (depth <= 0 || ply >= MAX_PLY - 1) return evaluate(me, op, meHand, opHand, ply);

  const hands = meHand * 16 + opHand + 1;
  const idx = ttIndex(me, op, hands);
  let ttMove = -1;
  if (ttHands[idx] === hands && ttMe[idx] === me && ttOp[idx] === op) {
    ttMove = ttBest[idx];
    if (ttDepth[idx] >= depth) {
      let v = ttScore[idx];
      if (v > MATE) v -= ply;
      else if (v < -MATE) v += ply;
      const flag = ttFlag[idx];
      if (flag === EXACT || (flag === LOWER && v >= beta) || (flag === UPPER && v <= alpha)) return v;
    }
  }

  const moves = MOVES[ply];
  const order = ORDER[ply];
  const n = generate(me, op, meHand, moves);
  if (n === 0) return -WIN + ply;

  // 排序：置換表的那一手 → 成三拿子 → 擋住對方成三的點 → 歷史啟發
  const block = threatPoints(op, me, opHand, opHand === 0 && pop(op) === 3);
  for (let i = 0; i < n; i++) {
    const m = moves[i];
    const to = (m >> 5) & 31;
    const rem = (m >> 10) & 31;
    let key: number;
    if (m === ttMove) key = 1 << 29;
    else if (rem !== NONE) key = (1 << 27) + Math.min(HIST_R[rem], 1 << 20);
    else key = ((block >> to) & 1 ? 1 << 26 : 0) + Math.min(HIST[(m & 31) * 32 + to], 1 << 25);
    // 插入排序（由大到小），n 通常不到 30
    let j = i;
    while (j > 0 && order[j - 1] < key) { order[j] = order[j - 1]; moves[j] = moves[j - 1]; j--; }
    order[j] = key;
    moves[j] = m;
  }

  const alpha0 = alpha;
  let best = -Infinity;
  let bestMove = moves[0];
  for (let i = 0; i < n; i++) {
    const m = moves[i];
    const from = m & 31;
    const to = (m >> 5) & 31;
    const rem = (m >> 10) & 31;
    let nm = me | (1 << to);
    if (from !== NONE) nm &= ~(1 << from);
    const no = rem !== NONE ? op & ~(1 << rem) : op;
    const v = -negamax(no, nm, opHand, from === NONE ? meHand - 1 : meHand, depth - 1, -beta, -alpha, ply + 1);
    if (aborted) return 0;
    if (v > best) { best = v; bestMove = m; }
    if (v > alpha) alpha = v;
    if (alpha >= beta) {
      if (rem !== NONE) HIST_R[rem] += depth * depth;
      else HIST[from * 32 + to] += depth * depth;
      break;
    }
  }

  ttHands[idx] = hands;
  ttMe[idx] = me;
  ttOp[idx] = op;
  ttDepth[idx] = depth;
  ttBest[idx] = bestMove;
  ttScore[idx] = best > MATE ? best + ply : best < -MATE ? best - ply : best;
  ttFlag[idx] = best <= alpha0 ? UPPER : best >= beta ? LOWER : EXACT;
  return best;
}

function bits(board: Cell[], c: Exclude<Cell, null>): number {
  let m = 0;
  for (let p = 0; p < N; p++) if (board[p] === c) m |= 1 << p;
  return m;
}

/** 一個完整的回合：一手（放／走），成三的話再加一手拿子；next 是走完之後的局面 */
type RootTurn = { moves: Move[]; next: MorrisState };

function rootTurns(s: MorrisState): RootTurn[] {
  const out: RootTurn[] = [];
  for (const m of legalMoves(s)) {
    const after = play(s, m);
    if (after.removing) for (const r of legalMoves(after)) out.push({ moves: [m, r], next: play(after, r) });
    else out.push({ moves: [m], next: after });
  }
  return out;
}

/** 從根節點的某個回合往下搜，回傳從走這一手的人看的分數 */
function scoreTurn(t: RootTurn, me: Side, depth: number, alpha: number, beta: number): number {
  const w = t.next.winner;
  if (w === 'draw') return 0;
  if (w) return w === me ? WIN : -WIN;
  const side = t.next.turn;
  const opp = other(side);
  return -negamax(bits(t.next.board, cellOf(side)), bits(t.next.board, cellOf(opp)), t.next.inHand[side], t.next.inHand[opp], depth - 1, -beta, -alpha, 1);
}

/**
 * 電腦這一回合要做的事：一個動作（放／走），成三的話再加一個拿子。
 * 局面正好停在「該拿子」時（例如接回對局），回傳的就只有拿子那一個動作。已經結束或沒有走法回傳空陣列。
 * random 可注入，測試才能重現。
 */
export function chooseTurn(s: MorrisState, difficulty: Difficulty = 'normal', random: () => number = Math.random, opts: AiOptions = {}): Move[] {
  if (s.winner) return [];
  const turns = rootTurns(s);
  if (turns.length === 0) return [];
  // 能直接贏還是會贏 —— 失誤只發生在「不是決勝手」的時候
  const winning = turns.find((t) => t.next.winner === s.turn);
  if (winning) return winning.moves;
  const cfg = { ...SETTINGS[difficulty], ...opts };
  if (cfg.blunder > 0 && random() < cfg.blunder) return turns[Math.floor(random() * turns.length)].moves;
  if (turns.length === 1) return turns[0].moves;

  show = s.rules.showRules;
  nodes = 0;
  aborted = false;
  stats.depth = 0;
  deadline = cfg.timeMs > 0 ? performance.now() + cfg.timeMs : Infinity;
  ttHands.fill(0);
  HIST.fill(0);
  HIST_R.fill(0);

  // 有擾動時每一手都要精確的分數（全視窗）；沒有擾動就用 alpha 剪掉不可能更好的手
  const exact = cfg.noise > 0;
  let order = turns.map((_, i) => i);
  let scores: number[] = turns.map(() => 0);
  let done = false;
  for (let depth = 1; depth <= cfg.depth; depth++) {
    const cur: number[] = turns.map(() => -Infinity);
    let alpha = -Infinity;
    for (const i of order) {
      const v = scoreTurn(turns[i], s.turn, depth, exact ? -Infinity : alpha, Infinity);
      if (aborted) break;
      cur[i] = v;
      if (v > alpha) alpha = v;
    }
    if (aborted) break;
    scores = cur;
    done = true;
    stats.depth = depth;
    order = order.slice().sort((a, b) => scores[b] - scores[a]);
    // 找到必勝就不必再往下搜
    if (scores[order[0]] >= MATE || performance.now() > deadline) break;
  }
  stats.nodes = nodes;
  if (!done) return turns[order[0]].moves;

  if (!exact) return turns[order[0]].moves;
  let best = order[0];
  let bestScore = -Infinity;
  for (const i of order) {
    const v = scores[i] + (random() - 0.5) * cfg.noise;
    if (v > bestScore) { bestScore = v; best = i; }
  }
  return turns[best].moves;
}
