/**
 * 方程式金字塔（Equation Pyramid）的規則、出題與電腦對手。純函式、零 React、零副作用（同 app/game/ 與其他款的 engine）。
 *
 * 規則照《魔鬼的計謀》第 2 季第 6 天監獄賽的 RULE 卡（docs/equation-pyramid.md；原始整理在 docs/games-deep-s2.md §3）：
 * - 10 格金字塔（1-2-3-4 排，字母 A–J），每格是「+ − × ÷ 其中一個符號＋一個數字」，另外公布一個目標數
 * - 選 3 個不同的格子排成算式，等於目標數就對
 *   - 第一格的符號不算，直接用它的數字
 *   - 照一般四則運算：先乘除、後加減
 *   - 順序有差：ABC 和 ACB 是不同答案
 * - 答對 +1；答錯、或說出已經被答過的組合，−1
 * - 一回合 3 分鐘，或全部答案都被找到就結束；10 回合
 *
 * 解法照 docs/research/pyramid_solver.py 移植（tests/game/equation-pyramid.test.ts 用節目的十盤鎖住）：
 * 全部有序三格（10×9×8＝720 種）一個一個算，用分數算、不會有浮點誤差。
 *
 * 網頁版另外兩種玩法（自己的挑戰，見 docs）：
 * - 每日一題：全世界同一盤（當地日期當種子），不限時、找齊為止，記用時與答錯
 * - 大金字塔：15 格（1-2-3-4-5 排，A–O），一樣三格一組，找齊為止
 */

// ─── 盤面 ────────────────────────────────────────────────────────────────────

export type Op = '+' | '-' | '×' | '÷';
export type Block = { readonly op: Op; readonly n: number };
export type Size = 10 | 15;

export const LETTERS = 'ABCDEFGHIJKLMNO';
/** 每一排幾格（由上往下） */
export const rowsOf = (size: Size): number[] => (size === 10 ? [1, 2, 3, 4] : [1, 2, 3, 4, 5]);

/** 畫面上的符號（減號用真的負號 −，不是連字號） */
export const OP_GLYPH: Record<Op, string> = { '+': '+', '-': '−', '×': '×', '÷': '÷' };

/** '×7' 或 '−5'、'x7'、'*7' 這類寫法 → 一格。給測試與規則圖用 */
export function parseBlock(tok: string): Block {
  const op = ({ '+': '+', '-': '-', '−': '-', '×': '×', x: '×', '*': '×', '÷': '÷', '/': '÷' } as const)[tok[0] as '+'];
  const n = Number(tok.slice(1));
  if (!op || !Number.isInteger(n)) throw new Error(`看不懂的格子：${tok}`);
  return { op, n };
}
export const parseBoard = (s: string): Block[] => s.trim().split(/\s+/).map(parseBlock);

/** 三格（格子的編號）↔ 'ACH' 這種答案字串 */
export const keyOf = (cells: readonly number[]) => cells.map((i) => LETTERS[i]).join('');
export const cellsOf = (key: string) => [...key].map((ch) => LETTERS.indexOf(ch));

// ─── 計算（分數） ─────────────────────────────────────────────────────────────

/** 分數 p/q，q > 0、約到最簡 */
type Q = { p: number; q: number };
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const q = (p: number, d = 1): Q => {
  const s = d < 0 ? -1 : 1;
  const g = gcd(p, d) || 1;
  return { p: (s * p) / g, q: (s * d) / g };
};
const add = (a: Q, b: Q) => q(a.p * b.q + b.p * a.q, a.q * b.q);
const sub = (a: Q, b: Q) => q(a.p * b.q - b.p * a.q, a.q * b.q);
const mul = (a: Q, b: Q) => q(a.p * b.p, a.q * b.q);
const div = (a: Q, b: Q) => (b.p === 0 ? null : q(a.p * b.q, a.q * b.p));

/**
 * 算一組（任意格數，網頁版只用 3 格）：第一格的符號不算；先乘除、後加減，同級由左往右。
 * integerOnly：中途一出現除不盡就當作不成立（拿來找「用分數算和用整數算結果不同」的爭議題）。
 */
export function evaluate(blocks: readonly Block[], cells: readonly number[], integerOnly = false): Q | null {
  let sum: Q = q(0);
  let term: Q = q(blocks[cells[0]].n);
  let sign: 1 | -1 = 1;
  for (let k = 1; k < cells.length; k++) {
    const { op, n } = blocks[cells[k]];
    const v = q(n);
    if (op === '×' || op === '÷') {
      const t = op === '×' ? mul(term, v) : div(term, v);
      if (!t || (integerOnly && t.q !== 1)) return null;
      term = t;
    } else {
      sum = sign > 0 ? add(sum, term) : sub(sum, term);
      term = v;
      sign = op === '+' ? 1 : -1;
    }
  }
  return sign > 0 ? add(sum, term) : sub(sum, term);
}

/** 不管先乘除、一律由左往右算（只用來判斷「這組要靠先乘除才成立」） */
function leftToRight(blocks: readonly Block[], cells: readonly number[]): Q | null {
  let v: Q | null = q(blocks[cells[0]].n);
  for (let k = 1; k < cells.length && v; k++) {
    const { op, n } = blocks[cells[k]];
    v = op === '+' ? add(v, q(n)) : op === '-' ? sub(v, q(n)) : op === '×' ? mul(v, q(n)) : div(v, q(n));
  }
  return v;
}

const equals = (v: Q | null, target: number) => v !== null && v.q === 1 && v.p === target;

/** 這組要靠「先乘除」才等於目標數（由左往右算會不一樣） */
export const needsPrecedence = (blocks: readonly Block[], cells: readonly number[], target: number) =>
  equals(evaluate(blocks, cells), target) && !equals(leftToRight(blocks, cells), target);

/** 第一格是 ÷ 的陷阱（符號不算，÷8 放第一位就是 8） */
export const divideFirst = (blocks: readonly Block[], cells: readonly number[]) => blocks[cells[0]].op === '÷';

/** 全部有序三格 */
export function permutations(size: number, k = 3): number[][] {
  const out: number[][] = [];
  const walk = (acc: number[]) => {
    if (acc.length === k) { out.push(acc); return; }
    for (let i = 0; i < size; i++) if (!acc.includes(i)) walk([...acc, i]);
  };
  walk([]);
  return out;
}
const PERMS: Record<Size, number[][]> = { 10: permutations(10), 15: permutations(15) };

/** 這一盤、這個目標數的所有答案（'ACH' 這種字串，照 A→J 排序） */
export function solutions(blocks: readonly Block[], target: number, integerOnly = false): string[] {
  return PERMS[blocks.length as Size]
    .filter((c) => equals(evaluate(blocks, c, integerOnly), target))
    .map(keyOf)
    .sort();
}

/** 算式的樣子（給畫面與分享圖）：第一格只寫數字，後面每格寫符號＋數字，例如「7 + 9 ÷ 3」 */
export function expression(blocks: readonly Block[], cells: readonly number[]): string {
  return cells.map((i, k) => (k ? `${OP_GLYPH[blocks[i].op]} ${blocks[i].n}` : String(blocks[i].n))).join(' ');
}

// ─── 出題 ────────────────────────────────────────────────────────────────────

/** 字串 → 32 位元種子（FNV-1a；同六角數字盤） */
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

/** 節目十盤 100 格的符號比例：× 31、÷ 30、− 24、+ 15 */
const OP_WEIGHTS: [Op, number][] = [['×', 31], ['÷', 30], ['-', 24], ['+', 15]];
/** 節目的數字：1–10 佔 88 格、11–16 佔 12 格 */
const BIG_NUMBER = 0.12;

function pickOp(r: number): Op {
  let x = r * 100;
  for (const [op, w] of OP_WEIGHTS) { if (x < w) return op; x -= w; }
  return '+';
}

export type Round = { blocks: Block[]; target: number; answers: string[] };

/** 一種題目的規格：幾格、答案數的範圍 */
export type Spec = { size: Size; min: number; max: number };

/** 節目：10 格、每回合 1～8 組（節目十回合是 6、2、3、4、3、2、8、4、1、6） */
export const SHOW_SPEC: Spec = { size: 10, min: 1, max: 8 };
/** 每日一題：10 格、找齊為止，所以多一點（5～8 組） */
export const DAILY_SPEC: Spec = { size: 10, min: 5, max: 8 };
/** 大金字塔：15 格、找齊為止（8～14 組） */
export const BIG_SPEC: Spec = { size: 15, min: 8, max: 14 };

/** 目標數的範圍（節目是 1～19） */
export const TARGET_MIN = 1;
export const TARGET_MAX = 20;

/**
 * 出一盤：照節目的比例亂數填格子，算出每個目標數（1～20）各有幾組答案，從合格的目標數裡挑一個。合格是：
 * - 答案數落在規格的範圍
 * - 至少一組要靠先乘除才成立（節目 39 組有 23 組是這樣）
 * - 沒有「用分數算成立、用整數算不成立」的爭議組（中途變小數；節目的題目沒有）
 * - 沒有「第 2、3 格交換也成立」的兩組（節目的題目沒有，見 docs/games-deep-s2.md〈規則缺口〉）
 * 挑不到就重填（有上限；一盤 720 組，算一次不到 1 毫秒）。
 */
export function makeRound(seed: string, spec: Spec): Round {
  const next = rng(hashSeed(seed));
  const perms = PERMS[spec.size];
  for (let tries = 0; ; tries++) {
    const blocks: Block[] = Array.from({ length: spec.size }, () => {
      const op = pickOp(next());
      const n = next() < BIG_NUMBER ? 11 + Math.floor(next() * 6) : 1 + Math.floor(next() * 10);
      return { op, n };
    });
    const by = new Map<number, number[][]>();
    const disputed = new Set<number>();
    for (const c of perms) {
      const v = evaluate(blocks, c);
      if (!v || v.q !== 1 || v.p < TARGET_MIN || v.p > TARGET_MAX) continue;
      if (!evaluate(blocks, c, true)) disputed.add(v.p);
      (by.get(v.p) ?? by.set(v.p, []).get(v.p)!).push(c);
    }
    const good = [...by.entries()].filter(([t, list]) => {
      if (disputed.has(t) || list.length < spec.min || list.length > spec.max) return false;
      const keys = new Set(list.map(keyOf));
      if (list.some((c) => keys.has(keyOf([c[0], c[2], c[1]])))) return false;
      return list.some((c) => needsPrecedence(blocks, c, t));
    }).sort((a, b) => a[0] - b[0]);
    if (good.length || tries > 2000) {
      // 只有一組的目標數少挑一點：節目十回合只有一回合是一組，亂挑會有兩成
      const weights = good.map(([, list]) => (list.length === 1 ? 0.4 : 1));
      let x = next() * weights.reduce((a, b) => a + b, 0);
      const pick = good.find((_, k) => (x -= weights[k]) < 0) ?? good[good.length - 1];
      const target = pick ? pick[0] : [...by.keys()][0];
      return { blocks, target, answers: solutions(blocks, target) };
    }
  }
}

// ─── 模式 ────────────────────────────────────────────────────────────────────

export type CpuLevel = 'easy' | 'normal' | 'hard';
export type ModeId = 'show' | 'daily' | 'big';

export type Config = {
  mode: ModeId;
  /** 節目規則的對手；null 是一個人計分。每日一題、大金字塔沒有對手 */
  cpu: CpuLevel | null;
  /** 幾回合 */
  rounds: number;
  /** 一回合幾秒；0 是不限時（找齊為止） */
  seconds: number;
  spec: Spec;
  /** 出題的種子（每回合再接上題號） */
  seed: string;
};

export const SHOW_ROUNDS = 10;
export const ROUND_SECONDS = 180;

export function showConfig(cpu: CpuLevel | null, seed: string): Config {
  return { mode: 'show', cpu, rounds: SHOW_ROUNDS, seconds: ROUND_SECONDS, spec: SHOW_SPEC, seed: `show:${seed}` };
}
export function dailyConfig(date: string): Config {
  return { mode: 'daily', cpu: null, rounds: 1, seconds: 0, spec: DAILY_SPEC, seed: `daily:${date}` };
}
export function bigConfig(seed: string): Config {
  return { mode: 'big', cpu: null, rounds: 1, seconds: 0, spec: BIG_SPEC, seed: `big:${seed}` };
}

/** 第 i 回合（0 起算）的題目：只看種子與題號，所以重新整理、換裝置都是同一題 */
export const roundOf = (config: Config, i: number): Round => makeRound(`${config.seed}#${i}`, config.spec);

/** 本地日期 YYYY-MM-DD（每日一題的題號） */
export function localDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ─── 一局的狀態 ───────────────────────────────────────────────────────────────

/** me：這台裝置上的人；cpu：電腦 */
export type Side = 'me' | 'cpu';
/** wrongValue：算出來不是目標數；repeat：這組答過了；invalid：不是三個不同的格子 */
export type Miss = 'wrongValue' | 'repeat' | 'invalid';

export type Claim = { key: string; by: Side };
export type RoundResult = { target: number; answers: number; me: number; cpu: number; wrongMe: number; wrongCpu: number; ms: number };

/** play：作答中；reveal：這回合結束、看答案；over：整局結束 */
export type Phase = 'play' | 'reveal' | 'over';

export type GameState = {
  readonly config: Config;
  readonly index: number;
  readonly round: Round;
  readonly phase: Phase;
  /** 這回合答對的組合，依答對的順序 */
  readonly claims: readonly Claim[];
  readonly score: Readonly<Record<Side, number>>;
  /** 這回合答錯幾次 */
  readonly wrong: Readonly<Record<Side, number>>;
  readonly history: readonly RoundResult[];
  /** 最後一次送出的結果（畫面上閃一下用） */
  readonly last: { by: Side; ok: true; key: string } | { by: Side; ok: false; miss: Miss; key: string } | null;
};

const ZERO = { me: 0, cpu: 0 } as const;

export function startGame(config: Config): GameState {
  return { config, index: 0, round: roundOf(config, 0), phase: 'play', claims: [], score: ZERO, wrong: ZERO, history: [], last: null };
}

/** 判斷一組對不對（不改狀態） */
export function judge(s: GameState, cells: readonly number[]): { ok: true; key: string } | { ok: false; miss: Miss; key: string } {
  const key = keyOf(cells);
  if (cells.length !== 3 || new Set(cells).size !== 3 || cells.some((i) => i < 0 || i >= s.round.blocks.length)) return { ok: false, miss: 'invalid', key };
  if (!equals(evaluate(s.round.blocks, cells), s.round.target)) return { ok: false, miss: 'wrongValue', key };
  if (s.claims.some((c) => c.key === key)) return { ok: false, miss: 'repeat', key };
  return { ok: true, key };
}

/** 送出一組。答對 +1、答錯 −1；全部被找到就結束這回合（ms：這回合用了多久，結束時記進 history） */
export function submit(s: GameState, by: Side, cells: readonly number[], ms = 0): GameState {
  if (s.phase !== 'play') return s;
  const j = judge(s, cells);
  const bump = (r: Readonly<Record<Side, number>>, d: number) => ({ ...r, [by]: r[by] + d });
  if (!j.ok) return { ...s, score: bump(s.score, -1), wrong: bump(s.wrong, 1), last: { by, ok: false, miss: j.miss, key: j.key } };
  const next: GameState = { ...s, claims: [...s.claims, { key: j.key, by }], score: bump(s.score, 1), last: { by, ok: true, key: j.key } };
  return next.claims.length === s.round.answers.length ? endRound(next, ms) : next;
}

/** 這回合結束（全部找到、時間到、自己按「看答案」） */
export function endRound(s: GameState, ms = 0): GameState {
  if (s.phase !== 'play') return s;
  const count = (by: Side) => s.claims.filter((c) => c.by === by).length;
  const result: RoundResult = {
    target: s.round.target, answers: s.round.answers.length, me: count('me'), cpu: count('cpu'),
    wrongMe: s.wrong.me, wrongCpu: s.wrong.cpu, ms,
  };
  return { ...s, phase: 'reveal', history: [...s.history, result] };
}

/** 看完答案，下一回合；最後一回合之後是 over */
export function nextRound(s: GameState): GameState {
  if (s.phase !== 'reveal') return s;
  if (s.index + 1 >= s.config.rounds) return { ...s, phase: 'over', last: null };
  const index = s.index + 1;
  return { ...s, index, round: roundOf(s.config, index), phase: 'play', claims: [], wrong: ZERO, last: null };
}

/** 整局的統計 */
export function totals(history: readonly RoundResult[]) {
  return history.reduce((t, r) => ({
    answers: t.answers + r.answers, me: t.me + r.me, cpu: t.cpu + r.cpu, wrongMe: t.wrongMe + r.wrongMe, wrongCpu: t.wrongCpu + r.wrongCpu, ms: t.ms + r.ms,
  }), { answers: 0, me: 0, cpu: 0, wrongMe: 0, wrongCpu: 0, ms: 0 });
}

// ─── 電腦對手 ────────────────────────────────────────────────────────────────

/**
 * 電腦一開始就知道全部答案，難的是「多久想到」：每組答案各抽一個想到的時間，有些這回合想不到；偶爾會按錯鈴。
 * - mean：想到一組平均要幾秒（指數分布，前面墊 lead 秒 —— 目標數出來要先看一下）
 * - find：這回合想得到某一組的機率
 * - slow：要靠先乘除、或把 ÷ 格放第一位的組合，想得比較慢（乘上這個倍數），比較像人
 * - wrong：一回合按錯鈴的機率
 * - gap：兩次按鈴至少隔幾秒（一個人一次只說得出一組）
 */
export const CPU: Record<CpuLevel, { mean: number; lead: number; find: number; slow: number; wrong: number; gap: number }> = {
  easy: { mean: 75, lead: 14, find: 0.5, slow: 1.4, wrong: 0.45, gap: 9 },
  normal: { mean: 45, lead: 10, find: 0.7, slow: 1.3, wrong: 0.3, gap: 6 },
  hard: { mean: 24, lead: 7, find: 0.88, slow: 1.2, wrong: 0.15, gap: 4 },
};

/** 電腦這回合的打算：第幾毫秒按鈴、說哪一組（ok＝說對的那組；不 ok＝按錯鈴、說的那組不對） */
export type CpuMove = { at: number; key: string; ok: boolean };

export function cpuPlan(s: Pick<GameState, 'config' | 'index' | 'round'>, level: CpuLevel): CpuMove[] {
  const p = CPU[level];
  const next = rng(hashSeed(`${s.config.seed}#${s.index}:cpu:${level}`));
  const limit = s.config.seconds * 1000;
  const { blocks, target, answers } = s.round;
  const moves: CpuMove[] = [];
  for (const key of answers) {
    const u = next(), keep = next();
    if (keep > p.find) continue;
    const cells = cellsOf(key);
    const hard = needsPrecedence(blocks, cells, target) || divideFirst(blocks, cells) ? p.slow : 1;
    moves.push({ at: (p.lead + -Math.log(1 - u) * p.mean * hard) * 1000, key, ok: true });
  }
  if (next() < p.wrong) {
    const wrongs = PERMS[blocks.length as Size].filter((c) => !answers.includes(keyOf(c)));
    moves.push({ at: (p.lead + next() * (s.config.seconds - p.lead - 5)) * 1000, key: keyOf(wrongs[Math.floor(next() * wrongs.length)]), ok: false });
  }
  moves.sort((a, b) => a.at - b.at);
  // 兩次按鈴至少隔 gap 秒；排到時間外的就是這回合來不及
  for (let k = 1; k < moves.length; k++) moves[k] = { ...moves[k], at: Math.max(moves[k].at, moves[k - 1].at + p.gap * 1000) };
  return moves.filter((m) => !limit || m.at < limit);
}

/** 電腦按鈴：說對的那組要是已經被答走了，它就不說（它聽得到）；按錯鈴照扣 */
export function cpuAct(s: GameState, move: CpuMove, ms = 0): GameState {
  if (s.phase !== 'play') return s;
  if (move.ok && s.claims.some((c) => c.key === move.key)) return s;
  return submit(s, 'cpu', cellsOf(move.key), ms);
}
